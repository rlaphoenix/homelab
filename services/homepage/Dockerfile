# escape=`

FROM servercore-with-chocolatey:latest

ARG HOMEPAGE_VERSION
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
WORKDIR /app

# Install required dependencies
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
