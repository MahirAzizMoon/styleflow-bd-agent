#!/bin/sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
tool_directory="$project_root/.tools"
cloudflared="$tool_directory/cloudflared"

if command -v cloudflared >/dev/null 2>&1; then
  exec cloudflared tunnel --url http://localhost:${PORT:-3000} --no-autoupdate
fi

if [ ! -x "$cloudflared" ]; then
  mkdir -p "$tool_directory"
  system=$(uname -s)
  architecture=$(uname -m)

  case "$system-$architecture" in
    Darwin-arm64)
      archive="$tool_directory/cloudflared.tgz"
      url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz"
      echo "Downloading Cloudflare Tunnel for macOS Apple Silicon..."
      curl -L --fail --output "$archive" "$url"
      tar -xzf "$archive" -C "$tool_directory"
      rm -f "$archive"
      ;;
    Darwin-x86_64)
      archive="$tool_directory/cloudflared.tgz"
      url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz"
      echo "Downloading Cloudflare Tunnel for macOS Intel..."
      curl -L --fail --output "$archive" "$url"
      tar -xzf "$archive" -C "$tool_directory"
      rm -f "$archive"
      ;;
    Linux-x86_64)
      echo "Downloading Cloudflare Tunnel for Linux..."
      curl -L --fail --output "$cloudflared" \
        "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
      ;;
    Linux-aarch64|Linux-arm64)
      echo "Downloading Cloudflare Tunnel for Linux ARM64..."
      curl -L --fail --output "$cloudflared" \
        "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
      ;;
    *)
      echo "Unsupported platform: $system $architecture" >&2
      echo "Install cloudflared manually from https://developers.cloudflare.com/tunnel/downloads/" >&2
      exit 1
      ;;
  esac

  chmod +x "$cloudflared"
fi

echo "Starting a temporary public tunnel to http://localhost:${PORT:-3000}"
exec "$cloudflared" tunnel --url "http://localhost:${PORT:-3000}" --no-autoupdate
