"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type PasswordChecks = {
  length: boolean
  upper: boolean
  lower: boolean
  number: boolean
  special: boolean
}

export function evaluatePassword(pw: string): {
  checks: PasswordChecks
  score: number
  label: "Weak" | "Medium" | "Strong"
  color: string
} {
  const checks: PasswordChecks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.round((passed / 5) * 100)
  let label: "Weak" | "Medium" | "Strong" = "Weak"
  let color = "#f44336"
  if (score >= 71) {
    label = "Strong"
    color = "#4CAF50"
  } else if (score >= 41) {
    label = "Medium"
    color = "#FF9800"
  }
  return { checks, score, label, color }
}

const ITEMS: { key: keyof PasswordChecks; label: string }[] = [
  { key: "length", label: "At least 8 characters" },
  { key: "upper", label: "One uppercase letter" },
  { key: "lower", label: "One lowercase letter" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special character" },
]

export function PasswordStrength({ password }: { password: string }) {
  const { checks, score, label, color } = evaluatePassword(password)
  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-cream/65">Password strength</span>
        <span style={{ color }} className="font-semibold">
          {password ? label : "—"}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {ITEMS.map(({ key, label }) => {
          const ok = checks[key]
          return (
            <li
              key={key}
              className={cn(
                "flex items-center gap-2 text-[11px] transition",
                ok ? "text-[color:var(--success)]" : "text-cream/55",
              )}
            >
              <span
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center rounded-full border",
                  ok ? "border-[color:var(--success)] bg-[color:var(--success)]/20" : "border-white/25",
                )}
              >
                {ok ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                ) : (
                  <X className="h-2.5 w-2.5 text-cream/40" strokeWidth={3} />
                )}
              </span>
              {label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
