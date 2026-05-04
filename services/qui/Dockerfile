# escape=`

FROM mcr.microsoft.com/windows/servercore:ltsc2025 AS downloader

ARG QUI_VERSION

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

WORKDIR /src

RUN $url = \"https://github.com/autobrr/qui/releases/download/v$($env:QUI_VERSION)/qui_$($env:QUI_VERSION)_windows_x86_64.zip\"; `
    Invoke-WebRequest -Uri $url -OutFile "qui.zip"; `
    Expand-Archive -Path "qui.zip" -DestinationPath "."; `
    Remove-Item -Path "qui.zip"

FROM mcr.microsoft.com/windows/nanoserver:ltsc2025

WORKDIR /app

COPY --from=downloader /src/qui.exe .

ENV QUI__HOST=0.0.0.0
ENV QUI__PORT=7476

EXPOSE 7476

ENTRYPOINT ["qui.exe"]
CMD ["serve", "--config-dir", "config"]
