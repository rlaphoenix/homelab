# escape=`

FROM servercore-with-chocolatey:latest

ARG COPYPARTY_VERSION
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
WORKDIR /app

# Install required dependencies
RUN choco install -y python ffmpeg
RUN python -m pip install --upgrade pip
RUN pip install Pillow pillow-heif argon2-cffi pyftpdlib pyopenssl mutagen pyvips[binary]

# Install app
RUN pip install copyparty==$env:COPYPARTY_VERSION

EXPOSE 3923

CMD ["powershell", "-Command", "copyparty", "-c", "C:\\app\\config\\copyparty.conf"]
