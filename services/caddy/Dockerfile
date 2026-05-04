# escape=`

FROM servercore-with-chocolatey:latest as builder

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
WORKDIR /out

# Install required dependencies
RUN choco install -y git golang

# Build caddy with modules
RUN go install "github.com/caddyserver/xcaddy/cmd/xcaddy@latest"
RUN xcaddy build `
    --with github.com/caddy-dns/cloudflare `
    --with github.com/caddy-dns/duckdns `
    --with github.com/mholt/caddy-l4 `
    --with github.com/fuomag9/caddy-blocker-plugin `
    --with github.com/corazawaf/coraza-caddy/v2 `
    --output "caddy.exe"

FROM mcr.microsoft.com/windows/nanoserver:ltsc2025

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
WORKDIR /app

COPY --from=builder C:\out\caddy.exe C:\app\caddy.exe

EXPOSE 80 443 2019

CMD ["C:\\app\\caddy.exe", "run", "--config", "C:\\app\\config\\Caddyfile", "--adapter", "caddyfile", "--watch"]
