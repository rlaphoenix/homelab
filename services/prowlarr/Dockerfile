# escape=`

FROM mcr.microsoft.com/dotnet/runtime:8.0-windowsservercore-ltsc2025

ARG PROWLARR_VERSION
ENV PROWLARR_BRANCH="master"

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

WORKDIR /app

RUN $changesUrl = \"https://prowlarr.servarr.com/v1/update/$($env:PROWLARR_BRANCH)/changes?version=2&runtime=netcore&os=windows&arch=x64\"; `
    $response = Invoke-RestMethod -Uri $changesUrl; `
    $release = $response | Where-Object { $_.version -eq $env:PROWLARR_VERSION } | Select-Object -First 1; `
    if (-not $release) { throw "Version $env:PROWLARR_VERSION not found" }; `
    Write-Host "Downloading: $release.url"; `
    Invoke-WebRequest -Uri $release.url -OutFile "prowlarr.zip"

RUN Expand-Archive -Path "prowlarr.zip" -DestinationPath "."
RUN Remove-Item -Path "prowlarr.zip"
RUN Move-Item -Path "./Prowlarr/*" -Destination "." -Force
RUN Remove-Item -Path "./Prowlarr" -Recurse -Force

EXPOSE 8989

ENTRYPOINT ["Prowlarr.Console.exe"]
CMD ["-nobrowser"]
