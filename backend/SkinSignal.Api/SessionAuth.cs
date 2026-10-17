using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace SkinSignal.Api;

public class SessionAuth(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, AppDb db)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder) {
    public static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync() {
        var header = Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return AuthenticateResult.NoResult();
        var token = header[7..];
        if (token.Length != 64 || token.Any(c => !Uri.IsHexDigit(c))) return AuthenticateResult.Fail("Sessão inválida.");
        var hash = Hash(token);
        var session = await db.Sessions.AsNoTracking().Include(x => x.User).SingleOrDefaultAsync(x => x.TokenHash == hash && x.ExpiresAt > DateTimeOffset.UtcNow);
        if (session is null) return AuthenticateResult.Fail("Sessão expirada ou inválida.");
        var identity = new ClaimsIdentity([new(ClaimTypes.NameIdentifier, session.UserId), new(ClaimTypes.Name, session.User.Name), new("session", hash)], Scheme.Name);
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name));
    }
}
