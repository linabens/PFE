import { useState } from 'react';
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const AVATARS = ['☕', '🧋', '🍵', '🫖', '🎯', '⭐', '🌟', '🔥', '💎', '🏆'];

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
    <div className="p-8 max-w-3xl mx-auto space-y-8">

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl shrink-0">
          {form.avatar ? (
            form.avatar.startsWith('data:') ? (
              <img src={form.avatar} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{form.avatar}</span>
            )
          ) : (
            <User className="w-10 h-10 text-primary" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-display text-foreground">{user?.full_name}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Info form */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Informations personnelles</h3>

        {/* Avatar picker */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Avatar</label>
          <div className="flex gap-2 flex-wrap items-center">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setForm(f => ({ ...f, avatar: emoji }))}
                className={`w-10 h-10 rounded-xl text-xl transition-all border-2 ${
                  form.avatar === emoji
                    ? 'border-primary bg-primary/10 scale-110'
                    : 'border-transparent bg-secondary/40 hover:bg-secondary/70'
                }`}
              >
                {emoji}
              </button>
            ))}
            
            <div className="w-px h-6 bg-border mx-1" />

            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            
            <label
              htmlFor="avatar-upload"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 cursor-pointer ${
                form.avatar?.startsWith('data:')
                  ? 'border-primary bg-primary/10 scale-110'
                  : 'border-transparent bg-secondary/40 hover:bg-secondary/70'
              }`}
              title="Télécharger une photo"
            >
              {form.avatar?.startsWith('data:') ? (
                <img src={form.avatar} alt="Selected" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </label>

            {form.avatar?.startsWith('data:') && (
              <button
                onClick={() => setForm(f => ({ ...f, avatar: '' }))}
                className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center transition-all"
                title="Supprimer la photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            Choisissez un emoji ou téléchargez votre propre photo (PNG, JPG, max 2Mo).
          </p>
        </div>

        {/* Full name */}
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Nom complet</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Votre nom complet"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Email <span className="text-xs opacity-60">(non modifiable)</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-secondary/30 text-muted-foreground text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="+216 XX XXX XXX"
            />
          </div>
        </div>

        <button
          onClick={handleInfoSave}
          disabled={savingInfo}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {savingInfo ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Password form */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Changer le mot de passe</h3>

        {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => {
          const labels = {
            currentPassword: 'Mot de passe actuel',
            newPassword: 'Nouveau mot de passe',
            confirmPassword: 'Confirmer le nouveau mot de passe',
          };
          const showKey = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';
          return (
            <div key={field} className="space-y-1.5">
              <label className="text-sm text-muted-foreground">{labels[field]}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPasswords[showKey as keyof typeof showPasswords] ? 'text' : 'password'}
                  value={passwords[field]}
                  onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(s => ({ ...s, [showKey]: !s[showKey as keyof typeof s] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords[showKey as keyof typeof showPasswords] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={handlePasswordSave}
          disabled={savingPassword}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
        >
          <Lock className="w-4 h-4" />
          {savingPassword ? 'Modification...' : 'Changer le mot de passe'}
        </button>
      </div>

    </div>
  );
}
