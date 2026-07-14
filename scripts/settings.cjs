// settings.cjs — open the extension's real settings page for interactive use.
//
// Launches Playwright's Chromium with the unpacked extension from extension/
// loaded, then navigates straight to its options page. Unlike preview.html
// (which stubs chrome.*), this is the real thing: keys save into the real
// encrypted vault, provider toggles hit real chrome.storage.sync, and the
// proxy URL field talks to a real background service worker.
//
// The browser profile persists in .lumi-profile/ (gitignored), so anything
// you save is still there on the next `task settings` run.
//
// Run via `task settings` — it wires up NODE_PATH so require("playwright")
// resolves from the npx cache without a root package.json.

const crypto = require("crypto");
const path = require("path");
const { chromium } = require("playwright");

const EXT = path.resolve(__dirname, "..", "extension");
const PROFILE = path.resolve(__dirname, "..", ".lumi-profile");

// Chrome derives an unpacked extension's ID from the sha256 of its absolute
// path, mapping the first 32 hex chars onto a-p. Computing it here avoids
// having to wake the MV3 service worker just to read its URL.
const hex = crypto.createHash("sha256").update(EXT).digest("hex").slice(0, 32);
const EXT_ID = [...hex]
  .map((c) => String.fromCharCode(97 + parseInt(c, 16)))
  .join("");

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: false,
    viewport: null,
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
    ],
  });

  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto(`chrome-extension://${EXT_ID}/options.html`);

  console.log(`Settings page open (extension ${EXT_ID}).`);
  console.log("Close the browser window when you're done — settings persist in .lumi-profile/.");

  await new Promise((resolve) => ctx.on("close", resolve));
})().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
