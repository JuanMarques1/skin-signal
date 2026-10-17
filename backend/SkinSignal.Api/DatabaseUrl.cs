using Npgsql;
namespace SkinSignal.Api;
public static class DatabaseUrl {
    public static string Convert(string value) {
        if (!value.StartsWith("postgres://") && !value.StartsWith("postgresql://")) return value;
        var uri = new Uri(value);
        var credentials = uri.UserInfo.Split(':', 2);
        var b = new NpgsqlConnectionStringBuilder {
            Host = uri.Host, Port = uri.Port > 0 ? uri.Port : 5432,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(credentials[0]),
            Password = credentials.Length > 1 ? Uri.UnescapeDataString(credentials[1]) : "",
            Pooling = true, MaxPoolSize = 20
        };
        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
        if (Enum.TryParse<SslMode>(query["sslmode"], true, out var ssl)) b.SslMode = ssl;
        return b.ConnectionString;
    }
}
