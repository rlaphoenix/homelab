# escape=`

FROM servercore-with-chocolatey:latest

ARG LTOB_VERSION
ARG GITHUB_TOKEN
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
WORKDIR /app

ENV BASE_PATH=/ltob

RUN choco install -y nodejs-lts

RUN $headers = @{ `
  Authorization = \"Bearer $env:GITHUB_TOKEN\"; `
  Accept        = \"application/vnd.github.v3+json\"; `
}; `
$url = \"https://api.github.com/repos/rlaphoenix/ltob/zipball/$env:LTOB_VERSION\"; `
Write-Host "Downloading: $url"; `
Invoke-WebRequest -Uri $url -Headers $headers -OutFile "ltob.zip"

# Extract app
RUN Expand-Archive -Path "ltob.zip" -DestinationPath "."; `
    Remove-Item -Path "ltob.zip"; `
    Move-Item -Path "./*-ltob-*/*" -Destination "." -Force; `
    Remove-Item -Path "./*-ltob-*" -Recurse -Force

# Install app dependencies
RUN npm install

# Build app
RUN npm run build

EXPOSE 3000

CMD ["powershell", "-Command", "npm run start"]
