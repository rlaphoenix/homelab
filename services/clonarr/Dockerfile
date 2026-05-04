# escape=`

FROM servercore-with-chocolatey:latest AS base

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]

# git is required for building and running
RUN choco install -y git

FROM base AS builder

ARG CLONARR_VERSION
WORKDIR /src

RUN choco install -y golang
RUN git clone --branch v$env:CLONARR_VERSION https://github.com/ProphetSe7en/clonarr.git .
RUN go mod download
RUN go build -buildvcs=false -ldflags \"-s -w -X main.Version=$env:CLONARR_VERSION\" -o clonarr.exe .

FROM base AS runtime

WORKDIR /app

COPY --from=builder /src/clonarr.exe .
RUN git config --global --add safe.directory C:/config/data/trash-guides

EXPOSE 6060

ENTRYPOINT ["clonarr.exe"]
