import { useState } from 'react';
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, Camera, Upload, Trash2, ShieldCheck, BadgeCheck, Check, X } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const AVATARS = ['☕', '🧋', '🍵', '🫖', '🎯', '⭐', '🌟', '🔥', '💎', '🏆'];

const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } }
};

export default function ProfilePage() {
  const { user, updateUser } = useAppStore();

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image est trop lourde (max 2Mo)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleInfoSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    setSavingInfo(true);
    try {
      const updated = await api.patch<any>('/auth/profile', {
        full_name: form.full_name,
        phone: form.phone,
        avatar: form.avatar,
      });
      updateUser(updated);
      toast.success('Profil mis à jour avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch('/auth/profile/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Mot de passe modifié avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="max-w-6xl mx-auto space-y-8 p-4 lg:p-8"
    >
      {/* Premium Header Banner */}
      <motion.div
        variants={itemVariants}
        className="relative h-60 rounded-3xl overflow-hidden bg-gradient-to-br from-espresso via-deep-roast to-caramel shadow-2xl"
      >
        <div className="absolute inset-0 noise-overlay opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(227,201,173,0.15),transparent)]" />

        {/* Bottom Bar for info */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        <div className="absolute bottom-6 left-8 flex items-end gap-6 w-full pr-16">
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-3xl bg-card border-4 border-background shadow-2xl flex items-center justify-center text-5xl overflow-hidden">
              {form.avatar ? (
                form.avatar.startsWith('data:') ? (
                  <img src={form.avatar} alt="avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <span className="transition-transform group-hover:scale-110">{form.avatar}</span>
                )
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>
            <label
              htmlFor="avatar-upload-main"
              className="absolute -right-2 -bottom-2 w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10 border-4 border-background"
            >
              <Camera className="w-5 h-5" />
              <input type="file" id="avatar-upload-main" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-display font-bold text-white drop-shadow-lg tracking-tight">{user?.full_name}</h1>
              <div className="px-2.5 py-1 rounded-full bg-latte/20 backdrop-blur-md border border-latte/30 flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-latte" />
                <span className="text-[10px] font-bold text-latte uppercase tracking-widest">{user?.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 text-latte/80">
              <Mail className="w-4 h-4 opacity-70" />
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
        {/* Left Column: Personal Info */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="glass-card !bg-card border border-border rounded-3xl p-8 shadow-sm space-y-8 relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground">Informations du Profil</h2>
            </div>

            {/* Custom Avatar Picker */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Choisir un Style</label>
              <div className="flex flex-wrap gap-3">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setForm(f => ({ ...f, avatar: emoji }))}
                    className={cn(
                      "w-12 h-12 rounded-2xl text-2xl transition-all border-2 flex items-center justify-center",
                      form.avatar === emoji
                        ? "border-primary bg-primary/10 scale-110 shadow-lg shadow-primary/10"
                        : "border-transparent bg-secondary/20 hover:bg-secondary/40 hover:scale-105"
                    )}
                  >
                    {emoji}
                  </button>
                ))}

                <div className="w-px h-8 bg-border mx-2" />

                <button
                  onClick={() => setForm(f => ({ ...f, avatar: '' }))}
                  className="w-12 h-12 rounded-2xl border-2 border-transparent bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
                  title="Réinitialiser"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Nom Complet</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Téléphone</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-secondary/10 text-muted-foreground/60 text-sm cursor-not-allowed italic"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/40 ml-1">L'adresse email est gérée par l'administrateur système.</p>
              </div>
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInfoSave}
                disabled={savingInfo}
                className="flex items-center justify-center gap-2 w-full md:w-auto min-w-[200px] px-8 py-4 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
              >
                {savingInfo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Enregistrer les Modifications
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Security/Password */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="glass-card !bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-success" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground">Sécurité</h2>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Maintenez votre compte en sécurité en utilisant un mot de passe robuste et unique.
              </p>

              <PasswordStrengthMeter password={passwords.newPassword} />
            </div>

            <div className="space-y-5">
              {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => {
                const labels = {
                  currentPassword: 'Mot de passe actuel',
                  newPassword: 'Nouveau mot de passe',
                  confirmPassword: 'Confirmer le nouveau mot de passe',
                };
                const autoCompleteValues = {
                  currentPassword: 'one-time-code',
                  newPassword: 'new-password',
                  confirmPassword: 'new-password',
                };
                const showKey = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';

                return (
                  <div key={field} className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">
                      {labels[field]}
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type={showPasswords[showKey as keyof typeof showPasswords] ? 'text' : 'password'}
                        value={passwords[field]}
                        autoComplete={autoCompleteValues[field]}
                        onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                        className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(s => ({ ...s, [showKey]: !s[showKey as keyof typeof s] }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPasswords[showKey as keyof typeof showPasswords] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePasswordSave}
              disabled={savingPassword || calculateStrength(passwords.newPassword).score < 5}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-secondary text-secondary-foreground text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
              Mettre à jour le mot de passe
            </motion.button>
          </div>

          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Protection du Compte
            </h4>
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground/70">Email :</span> Votre adresse email est utilisée pour les notifications critiques et la récupération de compte. Pour la modifier, contactez l'administrateur système.
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground/70">Session :</span> Ne partagez jamais vos identifiants. Déconnectez-vous toujours après utilisation sur un ordinateur public.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const { score, label, color, criteria } = calculateStrength(password);

  const criteriaList = [
    { label: 'Minimum 8 caractères', met: criteria.length },
    { label: 'Une majuscule', met: criteria.upper },
    { label: 'Une minuscule', met: criteria.lower },
    { label: 'Un chiffre', met: criteria.number },
    { label: 'Un caractère spécial (@, #, $, ...)', met: criteria.special },
  ];

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-secondary/5 border border-secondary/10">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Force du mot de passe</span>
        <span className={cn("text-[10px] font-bold uppercase", color)}>{label}</span>
      </div>

      <div className="h-1.5 w-full bg-secondary/20 rounded-full overflow-hidden flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={cn(
              "h-full flex-1 transition-all duration-500 rounded-full",
              score >= step ? (score <= 2 ? 'bg-destructive' : score <= 4 ? 'bg-warning' : 'bg-success') : 'bg-transparent'
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2">
        {criteriaList.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            {c.met ? (
              <Check className="w-3 h-3 text-success" />
            ) : (
              <X className="w-3 h-3 text-destructive/50" />
            )}
            <span className={cn(
              "text-[10px] transition-colors",
              c.met ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const calculateStrength = (pass: string) => {
  const criteria = {
    length: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
  };

  const score = Object.values(criteria).filter(Boolean).length;

  let label = "Très Faible";
  let color = "text-destructive";

  if (score === 5) {
    label = "Mot de passe fort - Tous les critères respectés ✓";
    color = "text-success";
  } else if (score >= 3) {
    label = "Mot de passe moyen - Presque sécurisé";
    color = "text-warning";
  } else if (score > 0) {
    label = "Mot de passe faible - Ajoutez majuscules, chiffres et symboles";
    color = "text-destructive";
  } else {
    label = "Entrez un mot de passe";
    color = "text-muted-foreground";
  }

  return { score, label, color, criteria };
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Sparkles = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

