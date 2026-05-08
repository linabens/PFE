"use client"

import * as React from "react"
import {
  Coffee,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  Shield,
  UserPlus,
  Check,
  Loader2,
} from "lucide-react"
import { AnimatedInput } from "./animated-input"
import { BrandHeader } from "./brand-header"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/appStore"

type Role = "admin" | "staff"
type Status = "idle" | "loading" | "success" | "error"

export function LoginPage({
  onCreateAccount,
  onForgotPassword,
}: {
  onCreateAccount: () => void
  onForgotPassword: () => void
}) {
  const [role, setRole] = React.useState<Role>("admin")
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

  function validate() {
    const next: typeof errors = {}
    if (!email) next.email = "Email is required"
    else if (!/^\S+@\S+\.\S+$/.test(email))
      next.email = "Please enter a valid email address"
    if (!password) next.password = "Password is required"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setStatus("loading");

    try {
      const response = await api.post<{ user: any; token: string }>('/auth/login', {
        email,
        password
      });

      // Strict RBAC Check: Ensure the user's role matches the selected portal
      if (response.user.role !== role) {
        const portalName = role === 'admin' ? 'Administrateur' : 'Staff';
        throw new Error(`Accès refusé : Ce compte n'a pas les droits pour le portail ${portalName}.`);
      }

      // Store token and user data
      localStorage.setItem('coffee_admin_token', response.token);
      localStorage.setItem('coffee_admin_user', JSON.stringify(response.user));
      
      const { setUser } = useAppStore.getState();
      setUser(response.user);

      setStatus("success");

      // Short delay for the "success" animation
      setTimeout(() => {
        navigate('/');
      }, 800);
    } catch (error: any) {
      console.error('Login failed:', error);
      setStatus("idle");
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // Show error in a toast or set error state
      import('react-hot-toast').then(({ toast }) => {
        toast.error(error.message || 'Authentication failed');
      });
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

      {/* Role toggle */}
      <div
        className="mt-6 flex animate-fade-up rounded-full border border-white/15 bg-white/5 p-1"
        style={{ animationDelay: "240ms" }}
        role="tablist"
        aria-label="Select role"
      >
        <RoleTab
          active={role === "admin"}
          onClick={() => setRole("admin")}
          icon={<Shield className="h-4 w-4" />}
          label="Administrator"
        />
        <RoleTab
          active={role === "staff"}
          onClick={() => setRole("staff")}
          icon={<Coffee className="h-4 w-4" />}
          label="Staff"
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 stagger" noValidate>
        <div className="animate-fade-up">
          <AnimatedInput
            label={role === "admin" ? "Admin email" : "Staff email or username"}
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

        <div
          className="mt-4 flex items-center justify-between animate-fade-up text-xs"
        >
          <label className="group flex cursor-pointer items-center gap-2 text-cream/80">
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-md border border-white/30 transition-all",
                remember
                  ? "border-rosewood bg-gradient-to-br from-mocha to-rosewood"
                  : "bg-white/5",
              )}
            >
              {remember && (
                <Check className="h-3 w-3 text-cream animate-scale-in" strokeWidth={3} />
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
            className="group relative text-cream/75 transition hover:text-cream"
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

        <button
          type="button"
          onClick={onCreateAccount}
          className="mt-3 flex w-full animate-fade-up items-center justify-center gap-2 rounded-2xl border-2 border-white/25 bg-white/5 px-5 py-3 text-sm font-medium text-cream transition hover:border-white/40 hover:bg-white/10"
        >
          <UserPlus className="h-4 w-4" />
          New here? Create an account
        </button>
      </form>

      <div
        className="mt-6 flex animate-fade-up items-center justify-center gap-5 text-[11px] text-cream/55"
      >
        <button className="flex items-center gap-1 transition hover:text-cream/80">
          <HelpCircle className="h-3 w-3" />
          Need help?
        </button>
        <span aria-hidden="true">•</span>
        <button className="transition hover:text-cream/80">Terms</button>
        <span aria-hidden="true">•</span>
        <button className="transition hover:text-cream/80">Privacy</button>
      </div>
    </section>
  )
}

function RoleTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors",
        active ? "text-cream" : "text-cream/60 hover:text-cream/85",
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-gradient-to-r from-mocha to-rosewood shadow-md"
          style={{ transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
      )}
      <span className="relative flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  )
}
