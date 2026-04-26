FROM mcr.microsoft.com/dotnet/runtime:8.0-windowsservercore-ltsc2025

ARG PROWLARR_VERSION
ENV PROWLARR_BRANCH="master"

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

WORKDIR C:/app

# Resolve latest version if not provided
RUN ["powershell", "-Command", "if (-not $env:PROWLARR_VERSION) { $changesUrl = \"https://prowlarr.servarr.com/v1/update/$($env:PROWLARR_BRANCH)/changes?runtime=netcore&os=windows&arch=x64\"; $response = Invoke-RestMethod -Uri $changesUrl; $latest = $response[0].version; Write-Host \"Determined latest version: $latest\"; [Environment]::SetEnvironmentVariable(\"PROWLARR_VERSION\", $latest, \"Machine\"); }"]

# Get download URL
RUN ["powershell", "-Command", "$changesUrl = \"https://prowlarr.servarr.com/v1/update/$($env:PROWLARR_BRANCH)/changes?runtime=netcore&os=windows&arch=x64\"; $response = Invoke-RestMethod -Uri $changesUrl; $release = $response | Where-Object { $_.version -eq $env:PROWLARR_VERSION } | Select-Object -First 1; if (-not $release) { throw \"Version $env:PROWLARR_VERSION not found\" }; Write-Host \"Determined download URL: $($release.url)\"; [Environment]::SetEnvironmentVariable(\"PROWLARR_DOWNLOAD_URL\", $release.url, \"Machine\")"]

# Download
RUN ["powershell", "-Command", "Write-Host \"Downloading from $env:PROWLARR_DOWNLOAD_URL\"; Invoke-WebRequest -Uri $env:PROWLARR_DOWNLOAD_URL -OutFile \"prowlarr.zip\""]

# Extract
RUN Expand-Archive -Path "prowlarr.zip" -DestinationPath "C:/app"
RUN Remove-Item -Path "prowlarr.zip"
RUN Move-Item -Path "C:/app/Prowlarr/*" -Destination "C:/app" -Force
RUN Remove-Item -Path "C:/app/Prowlarr" -Recurse -Force

EXPOSE 8989

ENTRYPOINT ["C:\\app\\Prowlarr.Console.exe"]
CMD ["-nobrowser", "-data=C:\\app\\config"]
