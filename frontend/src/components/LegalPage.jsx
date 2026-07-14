// Shared shell for the legal pages: a paper document floating in the night,
// set in the serif "page you're reading" voice.
function LegalPage({ title, updated, children }) {
  return (
    <section className="px-4 pt-36 pb-24">
      <div className="mx-auto max-w-3xl">
        <article className="rounded-2xl border border-white/10 bg-paper px-6 py-10 shadow-2xl shadow-night-950/60 sm:px-12 sm:py-14">
          <header className="mb-10 border-b border-ink/10 pb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 font-sans text-sm text-neutral-500">Last updated: {updated}</p>
          </header>
          <div
            className="space-y-8 font-serif text-lg leading-relaxed text-ink/85
              [&_a]:text-amber-700 [&_a]:underline [&_a]:underline-offset-2
              [&_code]:rounded [&_code]:bg-ink/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8em]
              [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-ink
              [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6"
          >
            {children}
          </div>
        </article>
      </div>
    </section>
  )
}

export default LegalPage
