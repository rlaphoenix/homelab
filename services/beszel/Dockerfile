# escape=`

FROM mcr.microsoft.com/windows/servercore:ltsc2025

ARG BESZEL_VERSION
ENV CI=true
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
WORKDIR /app

# Download app
RUN $version = ''; `
if ($BESZEL_VERSION) { `
    $version = $BESZEL_VERSION.TrimStart('v'); `
} else { `
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/henrygd/beszel/releases/latest"; `
    if ($release.prerelease) { throw "Latest release is marked as prerelease, aborting" }; `
    $version = $release.tag_name.TrimStart('v'); `
}; `
Write-Host "App version: $version"; `
$url = \"https://github.com/henrygd/beszel/releases/download/v$version/beszel_windows_amd64.zip\"; `
Write-Host "Downloading app from $url"; `
Invoke-WebRequest -Uri $url -OutFile "beszel.zip"

# Extract app
RUN Expand-Archive -Path "beszel.zip" -DestinationPath "C:/app"; `
    Remove-Item -Path "beszel.zip"

EXPOSE 8090

ENTRYPOINT ["C:\\app\\beszel.exe"]
CMD ["serve", "--http", "0.0.0.0:8090", "--dir", "C:/app/config"]
