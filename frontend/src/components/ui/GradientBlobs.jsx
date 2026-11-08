/*
  GradientBlobs — fixed decorative background blobs that sit behind all content.
  Light mode: soft pastel blobs on off-white. Dark mode: glowing blobs on navy.
  pointer-events-none means they never block clicks or keyboard focus.
*/
function GradientBlobs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Top-right blob: indigo/violet */}
      <div
        className="
          absolute -top-40 -right-40
          h-[600px] w-[600px] rounded-full
          bg-gradient-to-br from-brand-indigo/20 to-brand-violet/20
          blur-3xl
          dark:from-brand-indigo/15 dark:to-brand-violet/15
        "
      />

      {/* Bottom-left blob: violet/purple */}
      <div
        className="
          absolute -bottom-40 -left-40
          h-[500px] w-[500px] rounded-full
          bg-gradient-to-tr from-brand-violet/15 to-brand-indigo/10
          blur-3xl
          dark:from-brand-violet/20 dark:to-brand-indigo/10
        "
      />

      {/* Centre blob: amber accent, very subtle */}
      <div
        className="
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          h-[400px] w-[400px] rounded-full
          bg-gradient-to-br from-brand-amber/8 to-transparent
          blur-3xl
          dark:from-brand-amber/5
        "
      />
    </div>
  )
}

export default GradientBlobs
