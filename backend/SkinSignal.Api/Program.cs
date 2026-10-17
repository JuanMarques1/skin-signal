using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SkinSignal.Api;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 16 * 1024);
var connection = builder.Configuration["DATABASE_URL"] ?? builder.Configuration.GetConnectionString("Database")
    ?? throw new InvalidOperationException("Configure DATABASE_URL ou ConnectionStrings__Database.");
builder.Services.AddDbContext<AppDb>(o => o.UseNpgsql(DatabaseUrl.Convert(connection)));
builder.Services.AddIdentityCore<AppUser>(o => {
    o.User.RequireUniqueEmail = true;
    o.Password.RequiredLength = 12;
    o.Password.RequireDigit = false; o.Password.RequireLowercase = false;
    o.Password.RequireUppercase = false; o.Password.RequireNonAlphanumeric = false;
    o.Lockout.MaxFailedAccessAttempts = 5;
    o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
}).AddEntityFrameworkStores<AppDb>().AddSignInManager();
builder.Services.AddAuthentication("Session").AddScheme<AuthenticationSchemeOptions, SessionAuth>("Session", _ => {});
builder.Services.AddAuthorization();
var origins = (builder.Configuration["ALLOWED_ORIGINS"] ?? "http://localhost:5173").Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(origins).WithMethods("GET", "POST", "PUT", "DELETE").WithHeaders("Authorization", "Content-Type")));
builder.Services.AddRateLimiter(o => {
    o.RejectionStatusCode = 429;
    o.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions {PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0}));
});
builder.Services.AddProblemDetails();
var app = builder.Build();
app.UseExceptionHandler();
app.Use(async (context, next) => {
    context.Response.Headers.CacheControl = "no-store";
    context.Response.Headers.XContentTypeOptions = "nosniff";
    await next();
});
app.UseCors(); app.UseRateLimiter(); app.UseAuthentication(); app.UseAuthorization();
// Apply versioned migrations only when explicitly enabled. Never recreate the database.
if (builder.Configuration.GetValue<bool>("INITIALIZE_DATABASE")) {
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<AppDb>().Database.MigrateAsync();
}
app.MapGet("/health", async Task<IResult> (AppDb db) => {
    return await db.Database.CanConnectAsync() ? Results.Ok(new {status = "ok"}) : Results.StatusCode(503);
});

var auth = app.MapGroup("/api/auth").RequireRateLimiting("auth");
auth.MapPost("/register", async Task<IResult> (RegisterRequest input, UserManager<AppUser> users, AppDb db) => {
    var name = input.Name?.Trim() ?? ""; var email = input.Email?.Trim() ?? "";
    if (name.Length < 2 || name.Length > 100 || email.Length > 254 || !new EmailAddressAttribute().IsValid(email) || string.IsNullOrWhiteSpace(input.Password) || input.Password.Length < 12 || input.Password.Length > 128)
        return Results.BadRequest(new {message = "Informe nome (2–100 caracteres), e-mail válido e senha de 12–128 caracteres."});
    var user = new AppUser {Name = name, UserName = email, Email = email};
    var created = await users.CreateAsync(user, input.Password);
    if (!created.Succeeded) return Results.BadRequest(new {message = "Não foi possível criar a conta com estes dados. Verifique o e-mail ou entre em uma conta existente."});
    return await IssueSession(user, db);
});
auth.MapPost("/login", async Task<IResult> (LoginRequest input, UserManager<AppUser> users, SignInManager<AppUser> signIn, AppDb db) => {
    var email = input.Email?.Trim() ?? "";
    if (email.Length > 254 || input.Password is null || input.Password.Length > 128) return Results.Unauthorized();
    var user = await users.FindByEmailAsync(email);
    if (user is null) {
        new PasswordHasher<AppUser>().VerifyHashedPassword(new AppUser(), DummyPassword.Hash, input.Password);
        return Results.Unauthorized();
    }
    var result = await signIn.CheckPasswordSignInAsync(user, input.Password, lockoutOnFailure: true);
    return result.Succeeded ? await IssueSession(user, db) : Results.Unauthorized();
});
app.MapPost("/api/auth/logout", async Task<IResult> (ClaimsPrincipal principal, AppDb db) => {
    var hash = principal.FindFirstValue("session");
    await db.Sessions.Where(x => x.TokenHash == hash).ExecuteDeleteAsync();
    return Results.NoContent();
}).RequireAuthorization();
app.MapGet("/api/me", async Task<IResult> (ClaimsPrincipal principal, UserManager<AppUser> users) => {
    var user = await users.FindByIdAsync(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
    return user is null ? Results.Unauthorized() : Results.Ok(new {user.Id, user.Name, user.Email});
}).RequireAuthorization();
app.MapDelete("/api/me", async Task<IResult> (ClaimsPrincipal principal, UserManager<AppUser> users) => {
    var user = await users.FindByIdAsync(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
    if (user is null) return Results.Unauthorized();
    var deleted = await users.DeleteAsync(user);
    return deleted.Succeeded ? Results.NoContent() : Results.Problem("Não foi possível excluir a conta.");
}).RequireAuthorization();

var routines = app.MapGroup("/api/routine").RequireAuthorization();
routines.MapGet("/", async Task<IResult> (ClaimsPrincipal principal, AppDb db) => {
    var id = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var routine = await db.Routines.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == id);
    return routine is null ? Results.NotFound() : Results.Ok(RoutineView(routine));
});
routines.MapPut("/", async Task<IResult> (RoutineRequest input, ClaimsPrincipal principal, AppDb db) => {
    if (!RoutineRules.Valid(input.Moment, input.Time, input.Goal)) return Results.BadRequest(new {message = "Escolhas de rotina inválidas."});
    var id = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
    var routine = await db.Routines.SingleOrDefaultAsync(x => x.UserId == id);
    if ((routine is null && input.ExpectedRevision is not null) || (routine is not null && input.ExpectedRevision != routine.Revision))
        return Results.Conflict(new {message = "Sua rotina mudou em outro dispositivo. Carregue a versão da conta antes de salvar."});
    if (routine is null) {routine = new Routine {UserId = id}; db.Routines.Add(routine);}
    var changed = routine.Moment != input.Moment || routine.Time != input.Time || routine.Goal != input.Goal;
    routine.Moment = input.Moment; routine.Time = input.Time; routine.Goal = input.Goal;
    if (changed) routine.Revision = Guid.NewGuid();
    routine.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(); await transaction.CommitAsync();
    return Results.Ok(RoutineView(routine));
});
routines.MapDelete("/", async Task<IResult> (ClaimsPrincipal principal, AppDb db) => {
    var id = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    await db.Routines.Where(x => x.UserId == id).ExecuteDeleteAsync();
    return Results.NoContent();
});
app.MapGet("/api/history", async (ClaimsPrincipal principal, AppDb db) => {
    var id = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var records = await db.Completions.AsNoTracking().Where(x => x.UserId == id).OrderByDescending(x => x.Date).ThenBy(x => x.Period).Take(120).ToListAsync();
    return records.Select(HistoryView);
}).RequireAuthorization();
app.MapPut("/api/history", async Task<IResult> (CompletionRequest input, ClaimsPrincipal principal, AppDb db) => {
    var id = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var routine = await db.Routines.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == id);
    if (routine is null || routine.Revision != input.RoutineRevision) return Results.Conflict(new {message = "Salve ou carregue a rotina atual antes de registrar o histórico."});
    var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "America/Sao_Paulo"));
    if (input.Date > today || input.Date < today.AddDays(-365) || input.Checked is null || input.Checked.Length > 5 || input.Checked.Distinct().Count() != input.Checked.Length || input.Checked.Any(n => n < 0 || n >= RoutineRules.Count(routine.Time)))
        return Results.BadRequest(new {message = "Data ou etapas inválidas."});
    if (!new[] {"morning", "evening"}.Contains(input.Period) || (routine.Moment != "both" && routine.Moment != input.Period)) return Results.BadRequest(new {message = "Período incompatível com a rotina."});
    await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
    var record = await db.Completions.SingleOrDefaultAsync(x => x.UserId == id && x.Date == input.Date && x.Period == input.Period);
    if (record is null) {record = new Completion {Id = Guid.NewGuid(), UserId = id, Date = input.Date, Period = input.Period}; db.Completions.Add(record);}
    record.RoutineRevision = routine.Revision; record.Moment = routine.Moment; record.Time = routine.Time; record.Goal = routine.Goal;
    record.Checked = input.Checked.Order().ToArray(); record.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(); await transaction.CommitAsync();
    return Results.Ok(HistoryView(record));
}).RequireAuthorization();
app.MapDelete("/api/history/{recordId:guid}", async Task<IResult> (Guid recordId, ClaimsPrincipal principal, AppDb db) => {
    var id = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var count = await db.Completions.Where(x => x.Id == recordId && x.UserId == id).ExecuteDeleteAsync();
    return count == 0 ? Results.NotFound() : Results.NoContent();
}).RequireAuthorization();
app.Run();

static object RoutineView(Routine r) => new {r.Moment, r.Time, r.Goal, r.Revision, r.UpdatedAt};
static object HistoryView(Completion r) => new {r.Id, r.Date, r.Period, r.Moment, r.Time, r.Goal, r.Checked, totalSteps = RoutineRules.Count(r.Time), r.UpdatedAt};
static async Task<IResult> IssueSession(AppUser user, AppDb db) {
    var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    var expiresAt = DateTimeOffset.UtcNow.AddHours(8);
    await db.Sessions.Where(x => x.ExpiresAt < DateTimeOffset.UtcNow).ExecuteDeleteAsync();
    db.Sessions.Add(new Session {TokenHash = SessionAuth.Hash(token), UserId = user.Id, ExpiresAt = expiresAt});
    await db.SaveChangesAsync();
    return Results.Ok(new {accessToken = token, expiresAt, user = new {user.Id, user.Name, user.Email}});
}
public static class DummyPassword { public static readonly string Hash = new PasswordHasher<AppUser>().HashPassword(new AppUser(), "not-a-real-user-password"); }
public partial class Program { }
