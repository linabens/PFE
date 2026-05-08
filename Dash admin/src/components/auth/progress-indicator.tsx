"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = ["Role", "Info", "Security", "Details"] as const

export function ProgressIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="w-full">
      <ol
        className="flex items-center justify-between gap-2"
        aria-label="Registration progress"
      >
        {STEPS.map((label, i) => {
          const step = (i + 1) as 1 | 2 | 3 | 4
          const isDone = step < current
          const isActive = step === current
          return (
            <li
              key={label}
              className="flex flex-1 items-center gap-2 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-500",
                    isDone &&
                      "border-rosewood bg-gradient-to-br from-mocha to-rosewood text-cream shadow-md",
                    isActive &&
                      "border-rosewood bg-white/10 text-cream ring-4 ring-rosewood/25",
                    !isDone && !isActive && "border-white/20 bg-white/5 text-cream/55",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    step
                  )}
                </span>
                <span
                  className={cn(
                    "hidden text-[10px] uppercase tracking-wider transition sm:block",
                    isActive ? "text-cream" : "text-cream/55",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="relative mx-1 h-px flex-1 overflow-hidden bg-white/15 sm:mt-[-18px]">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-mocha to-rosewood transition-all duration-700"
                    style={{ width: isDone ? "100%" : "0%" }}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
