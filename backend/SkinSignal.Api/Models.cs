using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace SkinSignal.Api;

public class AppUser : IdentityUser { public string Name { get; set; } = ""; }
public class Session {
    public string TokenHash { get; set; } = "";
    public string UserId { get; set; } = "";
    public AppUser User { get; set; } = null!;
    public DateTimeOffset ExpiresAt { get; set; }
}
public class Routine {
    public string UserId { get; set; } = "";
    public AppUser User { get; set; } = null!;
    public string Moment { get; set; } = "";
    public string Time { get; set; } = "";
    public string Goal { get; set; } = "";
    public Guid Revision { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
public class Completion {
    public Guid Id { get; set; }
    public string UserId { get; set; } = "";
    public AppUser User { get; set; } = null!;
    public DateOnly Date { get; set; }
    public string Period { get; set; } = "";
    public Guid RoutineRevision { get; set; }
    public string Moment { get; set; } = "";
    public string Time { get; set; } = "";
    public string Goal { get; set; } = "";
    public int[] Checked { get; set; } = [];
    public DateTimeOffset UpdatedAt { get; set; }
}
public class AppDb(DbContextOptions<AppDb> options) : IdentityDbContext<AppUser>(options) {
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Routine> Routines => Set<Routine>();
    public DbSet<Completion> Completions => Set<Completion>();
    protected override void OnModelCreating(ModelBuilder b) {
        base.OnModelCreating(b);
        b.Entity<AppUser>().Property(x => x.Name).HasMaxLength(100);
        b.Entity<Session>().HasKey(x => x.TokenHash);
        b.Entity<Session>().Property(x => x.TokenHash).HasMaxLength(64);
        b.Entity<Session>().HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Session>().HasIndex(x => x.ExpiresAt);
        b.Entity<Routine>().HasKey(x => x.UserId);
        b.Entity<Routine>().HasOne(x => x.User).WithOne().HasForeignKey<Routine>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Completion>().HasKey(x => x.Id);
        b.Entity<Completion>().HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Completion>().HasIndex(x => new {x.UserId, x.Date, x.Period}).IsUnique();
        foreach (var entity in new[] {typeof(Routine), typeof(Completion)}) {
            b.Entity(entity).Property<string>("Moment").HasMaxLength(12);
            b.Entity(entity).Property<string>("Time").HasMaxLength(12);
            b.Entity(entity).Property<string>("Goal").HasMaxLength(12);
        }
        b.Entity<Completion>().Property(x => x.Period).HasMaxLength(12);
    }
}

public record RegisterRequest(string Name, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record RoutineRequest(string Moment, string Time, string Goal, Guid? ExpectedRevision);
public record CompletionRequest(DateOnly Date, string Period, Guid RoutineRevision, int[] Checked);
public static class RoutineRules {
    public static bool Valid(string? moment, string? time, string? goal) =>
        new[] {"morning", "evening", "both"}.Contains(moment) && new[] {"short", "medium", "long"}.Contains(time) && new[] {"remember", "organize", "track"}.Contains(goal);
    public static int Count(string time) => time == "long" ? 5 : time == "medium" ? 4 : 3;
}
