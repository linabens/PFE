import { Coffee } from "lucide-react"

export function BrandHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative animate-pulse-soft">
        <div
          className="absolute inset-0 rounded-full blur-xl"
          style={{
            background:
              "radial-gradient(circle, rgba(192,152,145,0.55), transparent 70%)",
          }}
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-deep-roast to-caramel shadow-lg">
          <Coffee className="h-7 w-7 text-cream" strokeWidth={2} />
        </div>
      </div>

      <p
        className="mt-4 text-[11px] uppercase tracking-[0.35em] text-caramel animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        Coffee Time
      </p>
      <h1
        className="mt-1 font-serif text-3xl font-semibold text-cream animate-fade-up"
        style={{
          fontFamily: "var(--font-playfair)",
          animationDelay: "120ms",
        }}
      >
        {title}
      </h1>
      <p
        className="mt-1 text-sm text-cream/70 animate-fade-up"
        style={{ animationDelay: "180ms" }}
      >
        {subtitle}
      </p>
    </div>
  )
}
