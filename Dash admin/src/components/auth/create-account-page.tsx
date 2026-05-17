"use client"

import * as React from "react"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Coffee,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldQuestion,
  Sparkles,
  Upload,
  User,
  UserCheck,
  X,
} from "lucide-react"
import { AnimatedInput } from "./animated-input"
import { BrandHeader } from "./brand-header"
import { ProgressIndicator } from "./progress-indicator"
import { PasswordStrength, evaluatePassword } from "./password-strength"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

type Role = "admin" | "staff"
type Shift = "morning" | "afternoon" | "evening"
type Lang = "en" | "fr" | "ar"

type FormData = {
  role: Role | null
  fullName: string
  email: string
  phone: string
  dob: string
  password: string
  confirmPassword: string
  securityQuestion: string
  securityAnswer: string
  workDays: Record<string, Shift | null>
  language: Lang
  avatar: string | null
  employeeId: string
}

const DEFAULT_AVATARS = ["☕", "🫖", "🥐", "🍪", "🧋", "🍰"]
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const SHIFT_COLORS: Record<Shift, string> = {
  morning: "#F4D8D8",
  afternoon: "#C09891",
  evening: "#775144",
}

const SECURITY_QUESTIONS = [
  "Your favorite coffee blend?",
  "First coffee shop you worked at?",
  "Your barista nickname?",
  "City where you learned to make coffee?",
]

function generateEmployeeId() {
  const part1 = Math.floor(1000 + Math.random() * 9000)
  const part2 = new Date().getFullYear()
  return `CT-${part1}-${part2}`
}

export function CreateAccountPage({
  onBackToLogin,
  onSuccess,
}: {
  onBackToLogin: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [data, setData] = React.useState<FormData>({
    role: 'staff',
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirmPassword: "",
    securityQuestion: SECURITY_QUESTIONS[0],
    securityAnswer: "",
    workDays: {},
    language: "en",
    avatar: null,
    employeeId: generateEmployeeId(),
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [showPw, setShowPw] = React.useState(false)
  const [showPw2, setShowPw2] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [shake, setShake] = React.useState(false)

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((d) => ({ ...d, [key]: value }))
    setErrors((e) => {
      if (!e[key as string]) return e
      const next = { ...e }
      delete next[key as string]
      return next
    })
  }

  function calcAge(dob: string) {
    if (!dob) return 0
    const d = new Date(dob)
    if (Number.isNaN(d.getTime())) return 0
    const diff = Date.now() - d.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  function validateStep(s: 1 | 2 | 3): boolean {
    const next: Record<string, string> = {}
    if (s === 1) {
      if (data.fullName.trim().length < 3)
        next.fullName = "Name must be at least 3 characters"
      if (!/^\S+@\S+\.\S+$/.test(data.email))
        next.email = "Please enter a valid email address"
      if (!/^\+\d{1,3}\s?\d{6,12}$/.test(data.phone.replace(/\s+/g, " ").trim()))
        next.phone = "Please enter a valid phone number"
      if (!data.dob) next.dob = "Date of birth is required"
      else if (calcAge(data.dob) < 18)
        next.dob = "You must be 18 or older to register"
    }
    if (s === 2) {
      const { score } = evaluatePassword(data.password)
      if (score < 71) next.password = "Please choose a stronger password"
      if (data.password !== data.confirmPassword)
        next.confirmPassword = "Passwords don't match"
      if (data.securityAnswer.trim().length < 3)
        next.securityAnswer = "Answer must be at least 3 characters"
    }
    if (s === 3) {
      if (Object.keys(data.workDays).length === 0)
        next.workDays = "Please select at least one work day"
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return false
    }
    return true
  }

  function next() {
    if (!validateStep(step)) return
    if (step < 3) setStep((step + 1) as 1 | 2 | 3)
  }
  function back() {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3)
  }

  async function submit() {
    if (!validateStep(3)) return;
    setSubmitting(true);
    
    try {
      await api.post('/auth/register', {
        full_name: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
        avatar: data.avatar,
        security_question: data.securityQuestion,
        security_answer: data.securityAnswer
      });
      
      setSubmitting(false);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setSubmitting(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      
      // Use toast for feedback
      import('react-hot-toast').then(({ toast }) => {
        toast.error(error.message || 'Registration failed');
      });
    }
  }

  return (
    <section
      aria-label="Create account"
      className={cn(
        "glass-card animate-scale-in relative w-full max-w-[920px] rounded-3xl p-6 sm:p-9",
        shake && "animate-shake",
      )}
    >
      {submitting && <BrewingOverlay />}
      {submitted && (
        <SuccessOverlay
          employeeId={data.employeeId}
          onGoToLogin={onSuccess}
        />
      )}

      {/* Top bar */}
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={onBackToLogin}
          className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-cream/80 transition hover:border-white/30 hover:bg-white/10 hover:text-cream"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to login
        </button>
        <span className="text-[11px] uppercase tracking-[0.3em] text-rosewood">
          Step {step} of 3
        </span>
      </div>

      <div className="mt-3 flex flex-col items-center text-center">
        <BrandHeader
          title="Join Our Team"
          subtitle="Create your barista account"
        />
      </div>

      <div className="mt-6">
        <ProgressIndicator current={step} total={3} />
      </div>

      <div key={step} className="mt-7 animate-fade-up">
        {step === 1 && (
          <Step2Info
            data={data}
            errors={errors}
            update={update}
          />
        )}
        {step === 2 && (
          <Step3Security
            data={data}
            errors={errors}
            update={update}
            showPw={showPw}
            setShowPw={setShowPw}
            showPw2={showPw2}
            setShowPw2={setShowPw2}
          />
        )}
        {step === 3 && (
          <Step4Details data={data} errors={errors} update={update} />
        )}
      </div>

      {/* Nav buttons */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm text-cream transition hover:border-white/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            className="btn-gradient inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            Next Step
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn-gradient inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Brewing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" strokeWidth={3} />
                Create Account
              </>
            )}
          </button>
        )}
      </div>
    </section>
  )
}

/* -------------------- Step 1: Role -------------------- */

function Step1Role({
  value,
  onChange,
  error,
}: {
  value: Role | null
  onChange: (r: Role) => void
  error?: string
}) {
  return (
    <div>
      <h2 className="text-center font-serif text-xl text-cream" style={{ fontFamily: "var(--font-playfair)" }}>
        Choose your path
      </h2>
      <p className="mt-1 text-center text-xs text-cream/60">
        This determines what you'll see and do at Coffee Time.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <RoleCard
          selected={value === "admin"}
          faded={value !== null && value !== "admin"}
          onClick={() => onChange("admin")}
          icon={<Shield className="h-7 w-7" />}
          title="Administrator"
          description="Full system access and management"
          features={[
            "Manage staff accounts",
            "Access analytics",
            "System configuration",
          ]}
        />
        <RoleCard
          selected={value === "staff"}
          faded={value !== null && value !== "staff"}
          onClick={() => onChange("staff")}
          icon={<Coffee className="h-7 w-7" />}
          title="Staff Member"
          description="Order management and customer service"
          features={[
            "Process orders",
            "Manage inventory",
            "Customer interaction",
          ]}
        />
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 text-center text-xs text-[color:var(--error)] animate-fade-up"
        >
          {error}
        </p>
      )}
    </div>
  )
}

function RoleCard({
  selected,
  faded,
  onClick,
  icon,
  title,
  description,
  features,
}: {
  selected: boolean
  faded?: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
        selected
          ? "border-rosewood bg-gradient-to-br from-mocha/40 to-rosewood/20 shadow-lg ring-2 ring-rosewood/40"
          : "border-white/15 bg-white/5 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10",
        faded && "opacity-40 grayscale-[0.5] scale-[0.98]",
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-mocha to-rosewood text-cream shadow-md animate-scale-in">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      )}
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl border transition",
          selected
            ? "border-rosewood/60 bg-gradient-to-br from-mocha to-rosewood text-cream"
            : "border-white/20 bg-white/5 text-rosewood group-hover:scale-110",
        )}
      >
        {icon}
      </div>
      <h3 className="mt-4 font-serif text-lg text-cream" style={{ fontFamily: "var(--font-playfair)" }}>
        {title}
      </h3>
      <p className="mt-1 text-xs text-cream/65">{description}</p>
      <ul className="mt-4 space-y-1.5">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-center gap-2 text-xs text-cream/75"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rosewood/20">
              <Check className="h-2.5 w-2.5 text-rosewood" strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </button>
  )
}

/* -------------------- Step 2: Info -------------------- */

function Step2Info({
  data,
  errors,
  update,
}: {
  data: FormData
  errors: Record<string, string>
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void
}) {
  // simulate availability check
  const [checking, setChecking] = React.useState(false)
  const [available, setAvailable] = React.useState<null | boolean>(null)
  React.useEffect(() => {
    if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      setAvailable(null)
      return
    }
    setChecking(true)
    const t = setTimeout(() => {
      setChecking(false)
      // pretend "taken@coffee.com" is taken
      setAvailable(data.email.toLowerCase() !== "taken@coffee.com")
    }, 600)
    return () => clearTimeout(t)
  }, [data.email])

  return (
    <div>
      <h2 className="text-center font-serif text-xl text-cream" style={{ fontFamily: "var(--font-playfair)" }}>
        Tell us about yourself
      </h2>
      <p className="mt-1 text-center text-xs text-cream/60">
        We&apos;ll use this to set up your barista profile.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 stagger md:grid-cols-2">
        <div className="animate-fade-up md:col-span-2">
          <AnimatedInput
            label="Full name"
            icon={<User className="h-4 w-4" />}
            value={data.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Enter your full name"
            error={errors.fullName}
            autoComplete="off"
          />
        </div>

        <div className="animate-fade-up md:col-span-2">
          <AnimatedInput
            label="Email address"
            type="email"
            autoComplete="off"
            icon={<Mail className="h-4 w-4" />}
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
            trailing={
              checking ? (
                <Loader2 className="h-4 w-4 animate-spin text-cream/60" />
              ) : available === true ? (
                <span className="flex items-center gap-1 text-[10px] text-[color:var(--success)]">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} /> Available
                </span>
              ) : available === false ? (
                <span className="flex items-center gap-1 text-[10px] text-[color:var(--error)]">
                  <X className="h-3.5 w-3.5" strokeWidth={3} /> Taken
                </span>
              ) : null
            }
          />
        </div>

        <div className="animate-fade-up">
          <AnimatedInput
            label="Phone number"
            icon={<Phone className="h-4 w-4" />}
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+216 XX XXX XXX"
            error={errors.phone}
            autoComplete="tel"
          />
        </div>

        <div className="animate-fade-up">
          <AnimatedInput
            label="Date of birth"
            type="date"
            icon={<Calendar className="h-4 w-4" />}
            value={data.dob}
            onChange={(e) => update("dob", e.target.value)}
            error={errors.dob}
            hint="You must be 18 or older"
          />
        </div>
      </div>
    </div>
  )
}

/* -------------------- Step 3: Security -------------------- */

function Step3Security({
  data,
  errors,
  update,
  showPw,
  setShowPw,
  showPw2,
  setShowPw2,
}: {
  data: FormData
  errors: Record<string, string>
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  showPw: boolean
  setShowPw: (v: boolean) => void
  showPw2: boolean
  setShowPw2: (v: boolean) => void
}) {
  const matchOk = data.confirmPassword.length > 0 && data.password === data.confirmPassword

  return (
    <div>
      <h2 className="text-center font-serif text-xl text-cream" style={{ fontFamily: "var(--font-playfair)" }}>
        Secure your account
      </h2>
      <p className="mt-1 text-center text-xs text-cream/60">
        Pick a strong password — you&apos;ll thank yourself later.
      </p>

      <div className="mt-6 stagger space-y-4">
        <div className="animate-fade-up">
          <AnimatedInput
            label="Create password"
            type={showPw ? "text" : "password"}
            icon={<Lock className="h-4 w-4" />}
            value={data.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            trailing={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="rounded-md p-1.5 text-cream/70 transition hover:bg-white/10 hover:text-cream"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />
          <PasswordStrength password={data.password} />
        </div>

        <div className="animate-fade-up">
          <AnimatedInput
            label="Confirm password"
            type={showPw2 ? "text" : "password"}
            icon={<Lock className="h-4 w-4" />}
            value={data.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            error={errors.confirmPassword || (data.confirmPassword.length > 0 && !matchOk ? "Passwords don't match" : null)}
            autoComplete="new-password"
            trailing={
              <span className="flex items-center gap-1.5">
                {data.confirmPassword.length > 0 && (
                  matchOk ? (
                    <Check
                      className="h-4 w-4 text-[color:var(--success)] animate-scale-in"
                      strokeWidth={3}
                    />
                  ) : (
                    <X
                      className="h-4 w-4 text-[color:var(--error)] animate-shake"
                      strokeWidth={3}
                    />
                  )
                )}
                <button
                  type="button"
                  onClick={() => setShowPw2(!showPw2)}
                  className="rounded-md p-1.5 text-cream/70 transition hover:bg-white/10 hover:text-cream"
                  aria-label={showPw2 ? "Hide password" : "Show password"}
                >
                  {showPw2 ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </span>
            }
          />
        </div>

        <div className="animate-fade-up">
          <label className="glass-input flex items-center rounded-2xl px-4 py-3">
            <ShieldQuestion className="mr-3 h-4 w-4 text-cream/70" />
            <select
              className="w-full bg-transparent text-sm text-cream outline-none"
              value={data.securityQuestion || SECURITY_QUESTIONS[0]}
              onChange={(e) => update("securityQuestion", e.target.value)}
            >
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q} className="bg-espresso text-cream">
                  {q}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="animate-fade-up">
          <AnimatedInput
            label="Your answer"
            icon={<Sparkles className="h-4 w-4" />}
            value={data.securityAnswer}
            onChange={(e) => update("securityAnswer", e.target.value)}
            error={errors.securityAnswer}
          />
        </div>
      </div>
    </div>
  )
}

/* -------------------- Step 4: Details -------------------- */

function Step4Details({
  data,
  errors,
  update,
}: {
  data: FormData
  errors: Record<string, string>
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void
}) {
  const [copied, setCopied] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  function copyId() {
    navigator.clipboard.writeText(data.employeeId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function toggleDay(day: string) {
    const current = data.workDays[day]
    const order: (Shift | null)[] = [null, "morning", "afternoon", "evening"]
    const idx = order.indexOf(current ?? null)
    const nextShift = order[(idx + 1) % order.length]
    const next = { ...data.workDays }
    if (nextShift === null) delete next[day]
    else next[day] = nextShift
    update("workDays", next)
  }

  function handleFile(file: File | null) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return
    if (!/^image\/(png|jpeg)$/.test(file.type)) return
    const reader = new FileReader()
    reader.onload = () => {
      update("avatar", reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Left column */}
      <div className="space-y-4 stagger">
        <div className="animate-fade-up rounded-2xl border border-white/15 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-rosewood">
            Employee ID
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-lg font-semibold tracking-wide text-cream">
              {data.employeeId}
            </span>
            <button
              type="button"
              onClick={copyId}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-cream/85 transition hover:border-white/30 hover:bg-white/10"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" strokeWidth={3} /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="animate-fade-up">
          <p className="mb-2 text-xs font-medium text-cream/75">
            Work schedule
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((day) => {
              const shift = data.workDays[day]
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "flex h-9 min-w-[44px] items-center justify-center gap-1 rounded-full border px-3 text-xs font-medium transition",
                    shift
                      ? "border-transparent text-espresso"
                      : "border-white/20 bg-white/5 text-cream/75 hover:border-white/35 hover:bg-white/10",
                  )}
                  style={
                    shift
                      ? { background: SHIFT_COLORS[shift], color: "#2A0800" }
                      : undefined
                  }
                  aria-label={`${day} ${shift ?? "not selected"}`}
                >
                  {shift && <span className="text-[10px]">🫘</span>}
                  {day}
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-cream/60">
            <ShiftLegend color={SHIFT_COLORS.morning} label="Morning" />
            <ShiftLegend color={SHIFT_COLORS.afternoon} label="Afternoon" />
            <ShiftLegend color={SHIFT_COLORS.evening} label="Evening" />
            <span className="opacity-70">Tap to cycle shifts</span>
          </div>
          {errors.workDays && (
            <p
              role="alert"
              className="mt-1 text-xs text-[color:var(--error)] animate-fade-up"
            >
              {errors.workDays}
            </p>
          )}
        </div>

        <div className="animate-fade-up">
          <p className="mb-2 text-xs font-medium text-cream/75">
            Preferred language
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { code: "en", flag: "🇬🇧", label: "English" },
                { code: "fr", flag: "🇫🇷", label: "Français" },
                { code: "ar", flag: "🇹🇳", label: "العربية" },
              ] as const
            ).map((l) => {
              const active = data.language === l.code
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => update("language", l.code)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs transition",
                    active
                      ? "border-rosewood bg-gradient-to-br from-mocha/40 to-rosewood/20 text-cream"
                      : "border-white/15 bg-white/5 text-cream/75 hover:border-white/30 hover:bg-white/10",
                  )}
                >
                  <span className="text-lg">{l.flag}</span>
                  {l.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right column - avatar */}
      <div className="space-y-3 animate-fade-up">
        <p className="text-xs font-medium text-cream/75">Profile avatar</p>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFile(e.dataTransfer.files?.[0] ?? null)
          }}
          className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/25 bg-white/5 p-6 text-center transition hover:border-rosewood/50 hover:bg-white/10"
        >
          <div className="relative h-[120px] w-[120px]">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-mocha/40 to-rosewood/20 blur-md" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-white/25 bg-white/10">
              {data.avatar ? (
                data.avatar.startsWith("data:") ? (
                  // user uploaded
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.avatar}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">{data.avatar}</span>
                )
              ) : (
                <Upload className="h-8 w-8 text-cream/60 transition group-hover:scale-110 group-hover:text-rosewood" />
              )}
            </div>
          </div>
          <div className="text-xs text-cream/70">
            <p className="font-medium text-cream">
              Drop your photo here or click to browse
            </p>
            <p className="mt-0.5 text-[10px] text-cream/55">
              JPG or PNG, max 5MB
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-cream/55">
            Or pick a default
          </p>
          <div className="grid grid-cols-6 gap-2">
            {DEFAULT_AVATARS.map((a) => {
              const active = data.avatar === a
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => update("avatar", a)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-full border text-2xl transition",
                    active
                      ? "border-rosewood bg-gradient-to-br from-mocha/40 to-rosewood/20 scale-110"
                      : "border-white/15 bg-white/5 hover:scale-105 hover:border-white/30 hover:bg-white/10",
                  )}
                  aria-label={`Default avatar ${a}`}
                  aria-pressed={active}
                >
                  {a}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function ShiftLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  )
}

/* -------------------- Overlays -------------------- */

function BrewingOverlay() {
  const [pct, setPct] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => {
      setPct((p) => Math.min(100, p + Math.random() * 14))
    }, 180)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-espresso/70 backdrop-blur-md animate-scale-in">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div className="relative h-20 w-20">
          <div
            className="absolute inset-0 rounded-full border-4 border-white/10 border-t-rosewood"
            style={{ animation: "spin-slow 1.4s linear infinite" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            ☕
          </div>
        </div>
        <p className="font-serif text-xl text-cream" style={{ fontFamily: "var(--font-playfair)" }}>
          Brewing your account...
        </p>
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mocha to-rosewood transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-cream/65">
          {Math.round(pct)}% — getting the beans ready
        </p>
      </div>
    </div>
  )
}

function SuccessOverlay({
  employeeId,
  onGoToLogin,
}: {
  employeeId: string
  onGoToLogin: () => void
}) {
  const [count, setCount] = React.useState(5)
  React.useEffect(() => {
    if (count <= 0) {
      onGoToLogin()
      return
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, onGoToLogin])

  // confetti pieces
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1,
        duration: 2 + Math.random() * 2,
        size: 12 + Math.random() * 14,
        glyph: ["☕", "🫘", "🍂"][Math.floor(Math.random() * 3)],
      })),
    [],
  )

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden rounded-3xl bg-espresso/80 backdrop-blur-md animate-scale-in">
      {pieces.map((p) => (
        <span
          key={p.id}
          aria-hidden="true"
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        >
          {p.glyph}
        </span>
      ))}
      <div className="relative max-w-sm rounded-3xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur-xl animate-fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mocha to-rosewood shadow-lg animate-scale-in">
          <UserCheck className="h-8 w-8 text-cream" strokeWidth={2.5} />
        </div>
        <h3
          className="mt-4 font-serif text-2xl text-cream"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Welcome aboard!
        </h3>
        <p className="mt-1 text-xs text-cream/70">
          Your account has been created successfully.
        </p>
        <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-rosewood">
            Employee ID
          </p>
          <p className="mt-1 font-mono text-base font-semibold text-cream">
            {employeeId}
          </p>
        </div>
        <p className="mt-4 text-[11px] text-cream/55">
          A verification email is on its way ✉️
        </p>
        <button
          type="button"
          onClick={onGoToLogin}
          className="btn-gradient mt-5 w-full rounded-2xl px-5 py-2.5 text-sm font-semibold"
        >
          Go to login
        </button>
        <p className="mt-2 text-[10px] text-cream/55">
          Auto-redirecting in {count}s...
        </p>
      </div>
    </div>
  )
}
