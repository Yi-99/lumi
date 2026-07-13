# lumi — Lookup for LLMs

Highlight any text on any page and get instant answers from multiple LLMs — Claude, GPT-4o, and Gemini — in a macOS Lookup-style card, streamed side by side.

<p align="center">
  <img src="docs/card-single.png" width="560" alt="Lookup card showing a streamed answer for the highlighted word, with Claude / GPT-4o / Gemini tabs" />
</p>

## How it works

1. **Highlight** a word or phrase on any webpage (or press <kbd>⌘⇧L</kbd> / <kbd>Ctrl+Shift+L</kbd> on a selection).
2. A card pops up under your selection and **queries every enabled model in parallel**, streaming tokens live.
3. The **fastest model wins the default tab** — switch models with the pills in the header.

The extension sends your selection *plus its surrounding paragraph* to each model, so answers are disambiguated in context ("explain it *in this passage*"), not generic dictionary definitions.

## Features

### Compare models side by side

Click **Compare all** to see every model's answer in one view:

<p align="center">
  <img src="docs/card-compare.png" width="560" alt="Compare view with Claude, GPT-4o, and Gemini answers in three columns" />
</p>

### Follow up, copy, dismiss

- **Follow up** — ask a question about the selection; all models re-answer.
- **Copy** — copies the active answer (or all answers in compare view).
- <kbd>Esc</kbd>, scrolling, or clicking outside dismisses the card.

### Dark mode

The card follows your system theme automatically:

<p align="center">
  <img src="docs/card-dark.png" width="560" alt="Lookup card in dark mode" />
</p>

## Installation

Not yet on the Chrome Web Store — load it unpacked:

1. Clone this repo:
   ```sh
   git clone https://github.com/Yi-99/lumi.git
   ```
2. Open `chrome://extensions` in Chrome (or any Chromium browser).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the cloned `lumi` folder.

## Setup — bring your own API keys

Click the extension icon (or open its options page) and paste a key for at least one provider:

<p align="center">
  <img src="docs/options.png" width="380" alt="Settings popup with API key fields for Claude, GPT-4o, and Gemini" />
</p>

| Provider | Key looks like | Get a key |
|---|---|---|
| Claude (`claude-sonnet-4-6`) | `sk-ant-…` | [console.anthropic.com](https://console.anthropic.com/) |
| GPT-4o (`gpt-4o-mini`) | `sk-…` | [platform.openai.com](https://platform.openai.com/api-keys) |
| Gemini (`gemini-2.0-flash`) | `AIza…` | [aistudio.google.com](https://aistudio.google.com/apikey) |

Untick a provider's checkbox to disable it without deleting the key. Keys are stored in `chrome.storage.sync` (your browser profile) and are sent **only** to each provider's official API endpoint — there is no middleman server.

## Usage tips

- Selections of **2–120 characters** trigger the card on mouse-release; longer selections (up to 400 chars) only trigger via the keyboard shortcut, so drag-selecting paragraphs while reading doesn't spam popups.
- Change the shortcut at `chrome://extensions/shortcuts`.

## Development

No build step — plain JavaScript, Manifest V3.

| File | Role |
|---|---|
| [content.js](content.js) | Selection detection + the card UI (rendered in a shadow DOM so page CSS can't touch it) |
| [background.js](background.js) | MV3 service worker: fans out to providers in parallel, parses each SSE stream, relays chunks over a `Port` |
| [options.html](options.html) / [options.js](options.js) | Settings popup (keys + per-provider toggles) |
| [preview.html](preview.html) | UI preview harness — open it directly in a browser; `chrome.*` is stubbed and responses are fake streams, so you can iterate on the card without loading the extension or spending tokens |

To try the UI without any API keys: open [preview.html](preview.html) in a browser and highlight any word on the page.

With [Task](https://taskfile.dev) installed, one command serves the harness on localhost and opens it in a Playwright-controlled browser:

```sh
task preview
```

The first run downloads Playwright's Chromium build (`task setup` runs automatically). Close the browser window to stop the server.

## License

[MIT](LICENSE)
