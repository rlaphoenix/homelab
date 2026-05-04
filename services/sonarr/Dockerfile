# escape=`

FROM mcr.microsoft.com/dotnet/runtime:8.0-windowsservercore-ltsc2025

ARG SONARR_VERSION
ENV SONARR_BRANCH="main"

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

WORKDIR /app

RUN $changesUrl = \"https://services.sonarr.tv/v1/update/$($env:SONARR_BRANCH)/changes?version=4&runtime=netcore&os=windows&arch=x64\"; `
    $response = Invoke-RestMethod -Uri $changesUrl; `
    $release = $response | Where-Object { $_.version -eq $env:SONARR_VERSION } | Select-Object -First 1; `
    if (-not $release) { throw "Version $env:SONARR_VERSION not found" }; `
    Write-Host "Downloading: $release.url"; `
    Invoke-WebRequest -Uri $release.url -OutFile "sonarr.zip"

RUN Expand-Archive -Path "sonarr.zip" -DestinationPath "."
RUN Remove-Item -Path "sonarr.zip"
RUN Move-Item -Path "./Sonarr/*" -Destination "." -Force
RUN Remove-Item -Path "./Sonarr" -Recurse -Force

EXPOSE 8989

ENTRYPOINT ["Sonarr.Console.exe"]
CMD ["-nobrowser"]
