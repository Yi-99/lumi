import LegalPage from '../components/LegalPage.jsx'

function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="July 14, 2026">
      <section>
        <p>
          lumi is a browser extension that runs entirely on your device. It has no cloud
          service, no accounts, no analytics, and no telemetry. This policy describes what
          the extension processes, where that data goes, and what stays on your machine.
        </p>
      </section>

      <section>
        <h2>The short version</h2>
        <ul>
          <li>We operate no servers and receive no data from you — ever.</li>
          <li>
            Text you highlight is sent directly to the AI providers you enable (Anthropic,
            OpenAI, Google), and to no one else.
          </li>
          <li>Your API keys are encrypted and stored only on your device.</li>
          <li>
            The optional proxy server and its history database run on your own hardware.
          </li>
        </ul>
      </section>

      <section>
        <h2>What lumi processes</h2>
        <p>
          When you highlight text (or press the keyboard shortcut), lumi sends your
          selection <em>plus its surrounding paragraph</em> to each AI provider you have
          enabled, so the answer can be grounded in context. If you ask a follow-up
          question, that question and the thread context are sent the same way. Nothing is
          sent anywhere until you make a selection or ask a question.
        </p>
      </section>

      <section>
        <h2>Your API keys</h2>
        <p>
          lumi works with API keys you supply. Keys are encrypted at rest with AES-GCM-256
          behind a non-extractable WebCrypto master key, stored in the extension&rsquo;s
          local storage on this device only. They are never synced between browsers, and
          they are transmitted only to the corresponding provider&rsquo;s official API
          endpoint — or, if you configure one, to your own local proxy server. You can
          delete a key at any time from the settings page.
        </p>
      </section>

      <section>
        <h2>Token usage statistics</h2>
        <p>
          The settings page shows per-provider token counts and lookup totals. These numbers
          are parsed from each provider&rsquo;s own streaming responses and stored locally.
          They never leave your device, and you can reset them at any time.
        </p>
      </section>

      <section>
        <h2>The optional local proxy</h2>
        <p>
          You can run an optional proxy server (included in the repository) that handles the
          provider fan-out. It runs on your own machine; there is no hosted version.
          If you use it:
        </p>
        <ul>
          <li>
            Prompts you look up (the highlighted selection and any follow-up questions —
            not the answers) are saved to a SQLite database on your machine, to power the
            card&rsquo;s History view. Clear it any time with{' '}
            <code>DELETE /v1/prompts</code>.
          </li>
          <li>
            You may optionally store API keys in that same local database instead of sending
            them with each request. Stored keys never appear in API responses or error
            messages, and can be removed with <code>DELETE /v1/keys/&lt;provider&gt;</code>.
          </li>
        </ul>
      </section>

      <section>
        <h2>Third-party providers</h2>
        <p>
          Text sent to a provider is handled under that provider&rsquo;s own terms and
          privacy policy:{' '}
          <a href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer">
            Anthropic
          </a>
          ,{' '}
          <a href="https://openai.com/privacy" target="_blank" rel="noreferrer">
            OpenAI
          </a>
          , and{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            Google
          </a>
          . lumi only contacts the providers you have enabled in settings.
        </p>
      </section>

      <section>
        <h2>What we don&rsquo;t do</h2>
        <ul>
          <li>No lumi-operated servers, accounts, or sign-ins.</li>
          <li>No analytics, tracking pixels, or crash reporting.</li>
          <li>No selling, sharing, or aggregating of any data — we never have it.</li>
          <li>No reading of pages you visit; lumi only acts on text you select.</li>
        </ul>
      </section>

      <section>
        <h2>Removing your data</h2>
        <p>
          Delete keys and reset usage stats from the settings page. If you used the local
          proxy, clear its history database or delete its Docker volume. Uninstalling the
          extension removes everything it stored in the browser.
        </p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p>
          If this policy changes, the update will appear on this page with a new date.
          Questions or concerns? Open an issue on{' '}
          <a href="https://github.com/Yi-99/lumi/issues" target="_blank" rel="noreferrer">
            GitHub
          </a>
          .
        </p>
      </section>
    </LegalPage>
  )
}

export default Privacy
