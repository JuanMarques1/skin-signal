FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/SkinSignal.Api/SkinSignal.Api.csproj backend/SkinSignal.Api/
RUN dotnet restore backend/SkinSignal.Api/SkinSignal.Api.csproj
COPY backend/SkinSignal.Api/ backend/SkinSignal.Api/
RUN dotnet publish backend/SkinSignal.Api/SkinSignal.Api.csproj -c Release -o /out --no-restore
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out .
USER $APP_UID
ENV ASPNETCORE_HTTP_PORTS=10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "SkinSignal.Api.dll"]
