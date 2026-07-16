#!/usr/bin/env bash
# build.sh — package the extension into store-ready zips.
#
# Produces:
#   dist/chrome/               unpacked Chrome build (load-unpacked friendly)
#   dist/firefox/              unpacked Firefox build (web-ext friendly)
#   dist/lumi-chrome-vX.zip    Chrome Web Store / Edge Add-ons upload
#   dist/lumi-firefox-vX.zip   AMO upload
#
# The Chrome manifest (extension/manifest.json) is the single source of
# truth; the Firefox manifest is derived from it here (event page instead
# of service worker, plus the mandatory gecko id).
#
# Deps: jq, zip, rsync (all present on macOS and ubuntu CI runners).

set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(jq -r .version extension/manifest.json)

rm -rf dist
mkdir -p dist/chrome dist/firefox

# preview.html is a dev-only harness and lumi.svg is the icon source
# (manifests reference the pre-rendered PNGs); never ship either.
rsync -a --exclude preview.html --exclude 'icons/lumi.svg' --exclude '.DS_Store' extension/ dist/chrome/
rsync -a --exclude preview.html --exclude 'icons/lumi.svg' --exclude '.DS_Store' extension/ dist/firefox/

# Firefox MV3: background event page (not service worker) + required gecko id.
jq '
  del(.background.service_worker)
  | .background.scripts = ["vault.js", "background.js"]
  | .browser_specific_settings = {
      gecko: { id: "lumi@heal.engineering", strict_min_version: "128.0" }
    }
' extension/manifest.json > dist/firefox/manifest.json

# Stores require manifest.json at the zip root.
(cd dist/chrome && zip -qr "../lumi-chrome-v$VERSION.zip" .)
(cd dist/firefox && zip -qr "../lumi-firefox-v$VERSION.zip" .)

echo "Built v$VERSION:"
ls -1 dist/*.zip
