FROM mcr.microsoft.com/windows/servercore:ltsc2025 AS downloader

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

WORKDIR C:/out

RUN Invoke-WebRequest -Uri "https://github.com/autobrr/qui/releases/download/v1.17.0/qui_1.17.0_windows_x86_64.zip" -OutFile "qui.zip"
RUN Expand-Archive -Path "qui.zip" -DestinationPath "C:/out"
RUN Remove-Item -Path "qui.zip"

FROM mcr.microsoft.com/windows/nanoserver:ltsc2025

WORKDIR /app

COPY --from=downloader C:/out/qui.exe .

ENV QUI__HOST=0.0.0.0
ENV QUI__PORT=7476

EXPOSE 7476

ENTRYPOINT ["C:\\app\\qui.exe"]
CMD ["serve", "--config-dir", "C:\\app\\config"]
