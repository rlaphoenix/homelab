# escape=`

FROM mcr.microsoft.com/dotnet/runtime:8.0-windowsservercore-ltsc2025

ARG SABNZBD_VERSION

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

WORKDIR C:/app

# Download app
RUN $version = ''; `
if ($SABNZBD_VERSION) { `
    $version = $SABNZBD_VERSION.TrimStart('v'); `
} else { `
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/sabnzbd/sabnzbd/releases/latest"; `
    if ($release.prerelease) { throw "Latest release is marked as prerelease, aborting" }; `
    $version = $release.tag_name.TrimStart('v'); `
}; `
Write-Host "App version: $version"; `
$url = \"https://github.com/sabnzbd/sabnzbd/releases/download/$version/SABnzbd-$version-win64-bin.zip\"; `
Write-Host "Downloading app from $url"; `
Invoke-WebRequest -Uri $url -OutFile "sabnzbd.zip"

# Extract app
RUN Expand-Archive -Path "sabnzbd.zip" -DestinationPath "C:/app"; `
    Remove-Item -Path "sabnzbd.zip"; `
    Move-Item -Path "C:/app/SABnzbd/*" -Destination "C:/app" -Force; `
    Remove-Item -Path "C:/app/SABnzbd" -Recurse -Force

EXPOSE 8080

CMD ["C:\\app\\SABnzbd.exe", "--server", "0.0.0.0:8080", "--browser", "0", "--config-file", "C:\\app\\config\\sabnzbd.ini"]
