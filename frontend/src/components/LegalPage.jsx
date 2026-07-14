// Shared shell for the legal pages, in the site's brutalist voice:
// a white bordered sheet on bone, mono metadata, hairline rules.
function LegalPage({ title, updated, children }) {
  return (
    <section className="px-5 pt-32 pb-24 sm:px-10">
      <div className="mx-auto max-w-[880px]">
        <article className="border border-black bg-white px-6 py-10 sm:px-12 sm:py-14">
          <header className="mb-10 border-b border-black pb-8">
            <p className="m-0 mb-4 font-mono text-xs tracking-[0.28em] uppercase">
              § Legal
            </p>
            <h1 className="font-display m-0 text-[clamp(34px,5vw,56px)] leading-[0.94] tracking-[-0.03em] uppercase">
              {title}
            </h1>
            <p className="mt-4 mb-0 font-mono text-[13px] text-[#555]">
              Last updated: {updated}
            </p>
          </header>
          <div
            className="space-y-8 text-[17px] leading-[1.6] text-ink/90
              [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-opacity [&_a]:hover:opacity-60
              [&_code]:bg-black/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]
              [&_h2]:mt-0 [&_h2]:border-t [&_h2]:border-black [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:tracking-[-0.01em]
              [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-['—__'] [&_ul]:pl-6"
          >
            {children}
          </div>
        </article>
      </div>
    </section>
  )
}

export default LegalPage
