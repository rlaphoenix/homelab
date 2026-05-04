# escape=`

FROM mcr.microsoft.com/dotnet/runtime:8.0-windowsservercore-ltsc2025

ARG SABNZBD_VERSION
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
WORKDIR /app

RUN $url = \"https://github.com/sabnzbd/sabnzbd/releases/download/$env:SABNZBD_VERSION/SABnzbd-$env:SABNZBD_VERSION-win64-bin.zip\"; `
Write-Host "Downloading: $url"; `
Invoke-WebRequest -Uri $url -OutFile "sabnzbd.zip"

RUN Expand-Archive -Path "sabnzbd.zip" -DestinationPath "."; `
    Remove-Item -Path "sabnzbd.zip"; `
    Move-Item -Path "./SABnzbd/*" -Destination "." -Force; `
    Remove-Item -Path "./SABnzbd" -Recurse -Force

EXPOSE 8080

ENTRYPOINT ["SABnzbd.exe"]
CMD ["--server", "0.0.0.0:8080", "--browser", "0", "--config-file", "config/sabnzbd.ini"]
