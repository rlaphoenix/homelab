# escape=`

FROM mcr.microsoft.com/windows/servercore:ltsc2025

ARG BESZEL_VERSION
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
WORKDIR /app

RUN $url = \"https://github.com/henrygd/beszel/releases/download/v$env:BESZEL_VERSION/beszel_windows_amd64.zip\"; `
Write-Host "Downloading: $url"; `
Invoke-WebRequest -Uri $url -OutFile "beszel.zip"

RUN Expand-Archive -Path "beszel.zip" -DestinationPath "."; `
    Remove-Item -Path "beszel.zip"

EXPOSE 8090

ENTRYPOINT ["beszel.exe"]
CMD ["serve", "--http", "0.0.0.0:8090", "--dir", "./config"]
