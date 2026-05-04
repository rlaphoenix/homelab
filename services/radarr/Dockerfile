# escape=`

FROM mcr.microsoft.com/dotnet/runtime:8.0-windowsservercore-ltsc2025

ARG RADARR_VERSION
ENV RADARR_BRANCH="master"

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

WORKDIR /app

RUN $changesUrl = \"https://radarr.servarr.com/v1/update/$($env:RADARR_BRANCH)/changes?version=6&runtime=netcore&os=windows&arch=x64\"; `
    $response = Invoke-RestMethod -Uri $changesUrl; `
    $release = $response | Where-Object { $_.version -eq $env:RADARR_VERSION } | Select-Object -First 1; `
    if (-not $release) { throw "Version $env:RADARR_VERSION not found" }; `
    Write-Host "Downloading: $release.url"; `
    Invoke-WebRequest -Uri $release.url -OutFile "radarr.zip"

RUN Expand-Archive -Path "radarr.zip" -DestinationPath "."
RUN Remove-Item -Path "radarr.zip"
RUN Move-Item -Path "./Radarr/*" -Destination ." -Force
RUN Remove-Item -Path "./Radarr" -Recurse -Force

EXPOSE 7878

ENTRYPOINT ["Radarr.Console.exe"]
CMD ["-nobrowser"]
