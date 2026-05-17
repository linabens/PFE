"use client"

import * as React from "react"
import {
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  Check,
  Loader2,
} from "lucide-react"
import { AnimatedInput } from "./animated-input"
import { BrandHeader } from "./brand-header"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/appStore"

type Status = "idle" | "loading" | "success" | "error"

export function LoginPage({
  onForgotPassword,
}: {
  onForgotPassword: () => void
}) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [status, setStatus] = React.useState<Status>("idle")
  const [errors, setErrors] = React.useState<{
    email?: string
    password?: string
  }>({})
  const [shake, setShake] = React.useState(false)

  const navigate = useNavigate()

  function validate() {
    const next: typeof errors = {}
    if (!email) next.email = "Email is required"
    else if (!/^\S+@\S+\.\S+$/.test(email))
      next.email = "Please enter a valid email address"
    if (!password) next.password = "Password is required"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setStatus("loading")

    try {
      const response = await api.post<{ user: any; token: string }>('/auth/login', {
        email,
        password,
      })

      if (response.user.role !== 'admin' && response.user.role !== 'staff') {
        throw new Error("Accès refusé : ce compte n'a pas accès au tableau de bord.")
      }

      localStorage.setItem('coffee_admin_token', response.token)
      localStorage.setItem('coffee_admin_user', JSON.stringify(response.user))

      const { setUser } = useAppStore.getState()
      setUser(response.user)

      setStatus("success")
      setTimeout(() => {
        window.location.href = '/'
      }, 800)
    } catch (error: any) {
      console.error('Login failed:', error)
      setStatus("idle")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      import('react-hot-toast').then(({ toast }) => {
        toast.error(error.message || 'Authentication failed')
      })
    }
  }

  return (
    <section
      aria-label="Sign in"
      className={cn(
        "glass-card animate-scale-in relative w-full max-w-[480px] rounded-3xl p-7 sm:p-9",
        shake && "animate-shake",
      )}
    >
      <BrandHeader title="Admin Portal" subtitle="Welcome back" />

      <form onSubmit={handleSubmit} className="mt-6 stagger" noValidate>
        <div className="animate-fade-up">
          <AnimatedInput
            label="Email address"
            type="email"
            autoComplete="off"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
            }}
            error={errors.email}
          />
        </div>

        <div className="mt-3 animate-fade-up">
          <AnimatedInput
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password)
                setErrors((p) => ({ ...p, password: undefined }))
            }}
            error={errors.password}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="rounded-md p-1.5 text-cream/70 transition hover:bg-white/10 hover:text-cream"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />
        </div>

        <div className="mt-4 flex items-center justify-between animate-fade-up text-xs">
          <label className="group flex cursor-pointer items-center gap-2 text-white/90 font-medium">
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-md border border-white/30 transition-all",
                remember
                  ? "border-rosewood bg-gradient-to-br from-mocha to-rosewood"
                  : "bg-white/5",
              )}
            >
              {remember && (
                <Check className="h-3 w-3 text-white animate-scale-in" strokeWidth={3} />
              )}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Keep me signed in
          </label>

          <button
            type="button"
            onClick={onForgotPassword}
            className="group relative text-white/90 font-medium transition hover:text-white"
          >
            Forgot password?
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-rosewood transition-all group-hover:w-full" />
          </button>
        </div>

        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="btn-gradient mt-6 flex w-full animate-fade-up items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold tracking-wide"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : status === "success" ? (
            <>
              <Check className="h-4 w-4" strokeWidth={3} />
              Signed in
            </>
          ) : (
            <>Sign In</>
          )}
        </button>
      </form>

      <div className="mt-6 flex animate-fade-up items-center justify-center gap-5 text-[11px] text-white/60">
        <button className="flex items-center gap-1 transition hover:text-white/90">
          <HelpCircle className="h-3 w-3" />
          Need help?
        </button>
        <span aria-hidden="true">•</span>
        <button className="transition hover:text-white/90">Terms</button>
        <span aria-hidden="true">•</span>
        <button className="transition hover:text-white/90">Privacy</button>
      </div>
    </section>
  )
}
