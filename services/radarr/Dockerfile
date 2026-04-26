FROM mcr.microsoft.com/dotnet/runtime:8.0-windowsservercore-ltsc2025

ARG RADARR_VERSION
ENV RADARR_BRANCH="master"

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

WORKDIR C:/app

# Resolve latest version if not provided
RUN ["powershell", "-Command", "if (-not $env:RADARR_VERSION) { $changesUrl = \"https://radarr.servarr.com/v1/update/$($env:RADARR_BRANCH)/changes?runtime=netcore&os=windows&arch=x64\"; $response = Invoke-RestMethod -Uri $changesUrl; $latest = $response[0].version; Write-Host \"Determined latest version: $latest\"; [Environment]::SetEnvironmentVariable(\"RADARR_VERSION\", $latest, \"Machine\"); }"]

# Get download URL
RUN ["powershell", "-Command", "$changesUrl = \"https://radarr.servarr.com/v1/update/$($env:RADARR_BRANCH)/changes?runtime=netcore&os=windows&arch=x64\"; $response = Invoke-RestMethod -Uri $changesUrl; $release = $response | Where-Object { $_.version -eq $env:RADARR_VERSION } | Select-Object -First 1; if (-not $release) { throw \"Version $env:RADARR_VERSION not found\" }; Write-Host \"Determined download URL: $($release.url)\"; [Environment]::SetEnvironmentVariable(\"RADARR_DOWNLOAD_URL\", $release.url, \"Machine\")"]

# Download
RUN ["powershell", "-Command", "Write-Host \"Downloading from $env:RADARR_DOWNLOAD_URL\"; Invoke-WebRequest -Uri $env:RADARR_DOWNLOAD_URL -OutFile \"radarr.zip\""]

# Extract
RUN Expand-Archive -Path "radarr.zip" -DestinationPath "C:/app"
RUN Remove-Item -Path "radarr.zip"
RUN Move-Item -Path "C:/app/Radarr/*" -Destination "C:/app" -Force
RUN Remove-Item -Path "C:/app/Radarr" -Recurse -Force

EXPOSE 7878

ENTRYPOINT ["C:\\app\\Radarr.Console.exe"]
CMD ["-nobrowser", "-data=C:\\app\\config"]
