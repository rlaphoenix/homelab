# escape=`

FROM mcr.microsoft.com/windows/servercore:ltsc2025

ARG HOMEPAGE_VERSION
ENV CI=true
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
WORKDIR /app

# Install required dependencies using Chocolatey
RUN [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
RUN choco install -y git nodejs-lts
RUN npm install -g pnpm
RUN pnpm setup

# Download app
RUN $version = ''; `
if ($HOMEPAGE_VERSION) { `
    $version = $HOMEPAGE_VERSION.TrimStart('v'); `
} else { `
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/gethomepage/homepage/releases/latest"; `
    if ($release.prerelease) { throw "Latest release is marked as prerelease, aborting" }; `
    $version = $release.tag_name.TrimStart('v'); `
}; `
Write-Host "Cloning: v$version"; `
git clone --branch "v$version" https://github.com/gethomepage/homepage.git .

# Install app dependencies
RUN pnpm install --node-linker=hoisted

# Build app
RUN pnpm build

EXPOSE 3000

CMD ["powershell", "-Command", "pnpm start"]
