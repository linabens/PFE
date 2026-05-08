"use client"

import * as React from "react"
import {
  Mail,
  Key,
  ArrowLeft,
  Loader2,
  Check,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { AnimatedInput } from "./animated-input"
import { BrandHeader } from "./brand-header"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

type Step = "email" | "verify" | "reset" | "success"
type Status = "idle" | "loading" | "error"

export function ForgotPassword({
  onBackToLogin,
}: {
  onBackToLogin: () => void
}) {
  const [step, setStep] = React.useState<Step>("email")
  const [status, setStatus] = React.useState<Status>("idle")
  const [email, setEmail] = React.useState("")
  const [code, setCode] = React.useState("")
  const [resetToken, setResetToken] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [question, setQuestion] = React.useState("")

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      setError("Email is required")
      return
    }

    setStatus("loading")
    try {
      const response = await api.post<{ question: string }>("/auth/forgot-password", { email })
      setQuestion(response.question)
      setStep("verify")
      setStatus("idle")
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to send code")
      setStatus("idle")
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!code) {
      setError("Code is required")
      return
    }

    setStatus("loading")
    try {
      const response = await api.post<{ resetToken: string }>("/auth/verify-code", { email, code })
      setResetToken(response.resetToken)
      setStep("reset")
      setStatus("idle")
      setError(null)
    } catch (err: any) {
      setError(err.message || "Invalid or expired code")
      setStatus("idle")
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      setError("All fields are required")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setStatus("loading")
    try {
      await api.post("/auth/reset-password", { resetToken, newPassword })
      setStep("success")
      setStatus("idle")
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to reset password")
      setStatus("idle")
    }
  }

  return (
    <section
      aria-label="Forgot password"
      className="glass-card animate-scale-in relative w-full max-w-[480px] rounded-3xl p-7 sm:p-9"
    >
      {step !== "success" && (
        <button
          type="button"
          onClick={onBackToLogin}
          className="group absolute left-6 top-6 flex items-center gap-2 text-xs text-cream/50 transition hover:text-cream"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Login
        </button>
      )}

      <div className="mt-8">
        <BrandHeader
          title={step === "success" ? "All Set!" : step === "reset" ? "New Password" : "Reset Password"}
          subtitle={
            step === "email" ? "Enter your email to retrieve your security question" :
              step === "verify" ? "Please answer your security question" :
                step === "reset" ? "Enter your new credentials" :
                  "Your password has been reset"
          }
        />
      </div>

      <div className="mt-8 stagger">
        {step === "email" && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="animate-fade-up">
              <AnimatedInput
                label="Registered email"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                error={error || undefined}
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-gradient flex w-full animate-fade-up items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold tracking-wide"
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send Verification Code"
              )}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="animate-fade-up">
              <p className="mb-3 text-xs text-latte italic font-medium bg-white/5 p-3 rounded-xl border border-white/10">
                {error && error.includes('Incorrect') ? 'Hint: Check your spelling' : `Question: ${question}`}
              </p>
              <AnimatedInput
                label="Security Answer"
                type="text"
                icon={<ShieldCheck className="h-4 w-4" />}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setError(null)
                }}
                error={error || undefined}
                placeholder="Enter your answer"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-gradient flex w-full animate-fade-up items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold tracking-wide"
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify Answer"
              )}
            </button>
            <p className="animate-fade-up text-center text-xs text-cream/40">
              Didn't get the code?{" "}
              <button
                type="button"
                onClick={handleRequestCode}
                className="text-rosewood transition hover:text-latte"
              >
                Resend
              </button>
            </p>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="animate-fade-up">
              <AnimatedInput
                label="New Password"
                type={showPassword ? "text" : "password"}
                icon={<Lock className="h-4 w-4" />}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setError(null)
                }}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="rounded-md p-1.5 text-cream/70 transition hover:bg-white/10 hover:text-cream"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>
            <div className="animate-fade-up">
              <AnimatedInput
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                icon={<Lock className="h-4 w-4" />}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError(null)
                }}
                error={error || undefined}
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-gradient flex w-full animate-fade-up items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold tracking-wide"
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-4 text-center stagger">
            <div className="flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-gradient-to-br from-mocha to-rosewood shadow-lg">
              <Check className="h-8 w-8 text-cream" />
            </div>
            <div className="mt-6 space-y-2 animate-fade-up">
              <p className="text-sm text-rosewood/90 font-medium">
                Success!
              </p>
              <p className="text-xs text-rosewood/70">
                Your password has been successfully updated. You can now log in with your new credentials.
              </p>
            </div>
            <button
              onClick={onBackToLogin}
              className="btn-gradient mt-8 flex w-full animate-fade-up items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold tracking-wide"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
