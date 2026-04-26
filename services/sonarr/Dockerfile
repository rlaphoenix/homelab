FROM mcr.microsoft.com/dotnet/runtime:8.0-windowsservercore-ltsc2025

ARG SONARR_VERSION
ENV SONARR_BRANCH="main"

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

WORKDIR C:/app

# Resolve latest version if not provided
RUN ["powershell", "-Command", "if (-not $env:SONARR_VERSION) { $changesUrl = \"https://services.sonarr.tv/v1/update/$($env:SONARR_BRANCH)/changes?version=4&runtime=netcore&os=windows&arch=x64\"; $response = Invoke-RestMethod -Uri $changesUrl; $latest = $response[0].version; Write-Host \"Determined latest version: $latest\"; [Environment]::SetEnvironmentVariable(\"SONARR_VERSION\", $latest, \"Machine\"); }"]

# Get download URL
RUN ["powershell", "-Command", "$changesUrl = \"https://services.sonarr.tv/v1/update/$($env:SONARR_BRANCH)/changes?version=4&runtime=netcore&os=windows&arch=x64\"; $response = Invoke-RestMethod -Uri $changesUrl; $release = $response | Where-Object { $_.version -eq $env:SONARR_VERSION } | Select-Object -First 1; if (-not $release) { throw \"Version $env:SONARR_VERSION not found\" }; Write-Host \"Determined download URL: $($release.url)\"; [Environment]::SetEnvironmentVariable(\"SONARR_DOWNLOAD_URL\", $release.url, \"Machine\")"]

# Download
RUN ["powershell", "-Command", "Write-Host \"Downloading from $env:SONARR_DOWNLOAD_URL\"; Invoke-WebRequest -Uri $env:SONARR_DOWNLOAD_URL -OutFile \"sonarr.zip\""]

# Extract
RUN Expand-Archive -Path "sonarr.zip" -DestinationPath "C:/app"
RUN Remove-Item -Path "sonarr.zip"
RUN Move-Item -Path "C:/app/Sonarr/*" -Destination "C:/app" -Force
RUN Remove-Item -Path "C:/app/Sonarr" -Recurse -Force

EXPOSE 8989

ENTRYPOINT ["C:\\app\\Sonarr.Console.exe"]
CMD ["-nobrowser", "-data=C:\\app\\config"]
