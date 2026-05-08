"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AnimatedInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: React.ReactNode
  trailing?: React.ReactNode
  error?: string | null
  success?: boolean
  hint?: string
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  function AnimatedInput(
    { label, icon, trailing, error, success, hint, className, id, ...props },
    ref,
  ) {
    const inputId = id ?? React.useId()
    const [focused, setFocused] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(
      props.defaultValue ?? "",
    )
    const value = props.value !== undefined ? props.value : internalValue
    const hasValue = value !== "" && value !== undefined && value !== null
    const floating = focused || hasValue

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className={cn(
            "glass-input relative flex items-center rounded-2xl px-4 transition-all",
            error && "has-error",
          )}
        >
          {icon ? (
            <span
              className={cn(
                "mr-3 flex h-5 w-5 shrink-0 items-center justify-center text-cream/70 transition-colors",
                focused && "text-rosewood",
                error && "text-[color:var(--error)]",
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
          ) : null}

          <div className="relative flex-1 pt-5 pb-2">
            <span
              className={cn(
                "pointer-events-none absolute left-0 origin-left text-cream/60 transition-all duration-200",
                floating
                  ? "top-0 text-[11px] tracking-wide text-cream/70"
                  : "top-1/2 -translate-y-1/2 text-sm",
              )}
            >
              {label}
            </span>
            <input
              ref={ref}
              id={inputId}
              {...props}
              onFocus={(e) => {
                setFocused(true)
                props.onFocus?.(e)
              }}
              onBlur={(e) => {
                setFocused(false)
                props.onBlur?.(e)
              }}
              onChange={(e) => {
                if (props.value === undefined) setInternalValue(e.target.value)
                props.onChange?.(e)
              }}
              className={cn(
                "w-full bg-transparent text-sm text-cream outline-none placeholder:text-transparent",
                className,
              )}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined
              }
            />
          </div>

          {trailing ? (
            <span className="ml-2 flex shrink-0 items-center">{trailing}</span>
          ) : null}
        </label>

        {error ? (
          <p
            id={`${inputId}-err`}
            role="alert"
            className="mt-1.5 pl-2 text-xs text-[color:var(--error)] animate-fade-up"
          >
            {error}
          </p>
        ) : success ? (
          <p className="mt-1.5 pl-2 text-xs text-[color:var(--success)] animate-fade-up">
            Looks good
          </p>
        ) : hint ? (
          <p
            id={`${inputId}-hint`}
            className="mt-1.5 pl-2 text-xs text-cream/55"
          >
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)
