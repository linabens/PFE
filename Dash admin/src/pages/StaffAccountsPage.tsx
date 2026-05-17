import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Shield, Edit, Trash2, Loader2, Search, X, Eye, EyeOff, Check, UserCircle, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'staff' | 'client';
  created_at: string;
}

interface UserForm {
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
}

const EMPTY_FORM: UserForm = { full_name: '', email: '', password: '', role: 'staff' };

export default function StaffAccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get<User[]>('/admin/users');
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditTarget(user);
    setForm({ full_name: user.full_name, email: user.email, password: '', role: user.role as 'admin' | 'staff' });
    setShowPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    if (!editTarget && !form.password) { toast.error('Password is required for new accounts'); return; }

    setSaving(true);
    try {
      if (editTarget) {
        const payload: any = {};
        if (form.full_name !== editTarget.full_name) payload.full_name = form.full_name;
        if (form.email !== editTarget.email) payload.email = form.email;
        if (form.role !== editTarget.role) payload.role = form.role;
        if (form.password.trim().length >= 6) payload.password = form.password;
        await api.patch(`/admin/users/${editTarget.id}`, payload);
        toast.success(`${form.full_name} mis à jour`);
      } else {
        await api.post('/admin/users', form);
        toast.success(`${form.full_name} ajouté à l'équipe`);
      }
      await fetchUsers();
      closeModal();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast.success(`${deleteTarget.full_name} supprimé`);
      await fetchUsers();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter(u =>
    (u.role === 'admin' || u.role === 'staff') &&
    (u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const admins = filtered.filter(u => u.role === 'admin').length;
  const staff = filtered.filter(u => u.role === 'staff').length;

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-md px-6 py-5 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
            Gestion de l'Équipe
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-11">Comptes d'accès au dashboard et autorisations</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Chercher un membre..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={openAdd}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all whitespace-nowrap w-full sm:w-auto">
                <UserPlus className="w-4 h-4" /> Ajouter
            </motion.button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Comptes', value: filtered.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Administrateurs', value: admins, icon: Shield, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Staff (Cuisine)', value: staff, icon: UserCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 bg-card border border-border rounded-3xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={cn('p-3 rounded-2xl', bg)}><Icon className={cn('w-6 h-6', color)} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={cn('text-3xl font-black font-display leading-none mt-1', color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Chargement de l'équipe...</p>
        </div>
      ) : filtered.length === 0 ? (
          <div className="h-64 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-card/30 backdrop-blur-sm">
            <Users className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-display font-black text-xl text-foreground">Aucun membre trouvé</p>
            <p className="text-sm mt-1 text-center max-w-sm">Vous n'avez pas encore ajouté de membres d'équipe, ou votre recherche ne correspond à aucun profil.</p>
          </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((user) => (
              <motion.div key={user.id} layout
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                className={cn("group relative bg-card border rounded-3xl p-6 shadow-sm transition-all hover:shadow-xl flex flex-col",
                    user.role === 'admin' ? "border-primary/20" : "border-border")}>
                
                {/* Actions (Top Right) */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(user)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(user)} className="p-1.5 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-6 pt-2">
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-sm mb-3 font-display font-black text-3xl",
                      user.role === 'admin' ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary border-background text-muted-foreground")}>
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-display font-black text-xl text-foreground leading-tight">{user.full_name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{user.email}</p>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-end space-y-3">
                    <div className={cn("flex items-center justify-between p-3 rounded-2xl border",
                        user.role === 'admin' ? "bg-primary/5 border-primary/20" : "bg-secondary/30 border-border/50")}>
                        <div className="flex items-center gap-2">
                            <Shield className={cn("w-4 h-4", user.role === 'admin' ? "text-primary" : "text-muted-foreground")} />
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Rôle</span>
                        </div>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                            user.role === 'admin' ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground")}>
                            {user.role}
                        </span>
                    </div>

                    <div className="flex items-center justify-between px-2 pt-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Accès</span>
                        <span className="text-xs font-medium text-foreground">
                            {user.role === 'admin' ? 'Total (Comptabilité, Staff)' : 'Partiel (Cuisine, Tables)'}
                        </span>
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add / Edit Drawer ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[450px] max-w-full bg-card shadow-2xl z-[70] flex flex-col border-l border-border">
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0 bg-secondary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10"><UserPlus className="w-5 h-5 text-primary" /></div>
                  <div>
                      <h2 className="font-display font-black text-xl">{editTarget ? 'Modifier Membre' : 'Nouveau Membre'}</h2>
                      <p className="text-xs text-muted-foreground">Création de compte d'accès</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-secondary/60 transition-all">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nom Complet</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="ex: Ahmed Benali"
                    className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Adresse Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ex: ahmed@coffeetime.dz"
                    className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      Mot de passe {editTarget && <span className="text-[10px] lowercase font-normal italic">(Laisser vide pour ne pas changer)</span>}
                  </label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editTarget ? '••••••••' : 'Min. 6 caractères'} minLength={editTarget ? undefined : 6}
                      className="w-full px-4 py-3.5 pr-12 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Rôle & Permissions</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setForm({ ...form, role: 'staff' })}
                        className={cn('flex flex-col items-center text-center gap-2 p-4 rounded-2xl border transition-all',
                            form.role === 'staff' ? 'bg-primary/10 border-primary text-primary shadow-inner' : 'bg-background border-border text-muted-foreground hover:border-primary/50')}>
                        <UserCircle className="w-6 h-6" />
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider block">Staff</span>
                            <span className="text-[10px] opacity-80">Commandes & Tables</span>
                        </div>
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, role: 'admin' })}
                        className={cn('flex flex-col items-center text-center gap-2 p-4 rounded-2xl border transition-all',
                            form.role === 'admin' ? 'bg-primary/10 border-primary text-primary shadow-inner' : 'bg-background border-border text-muted-foreground hover:border-primary/50')}>
                        <Shield className="w-6 h-6" />
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider block">Admin</span>
                            <span className="text-[10px] opacity-80">Accès Total Complet</span>
                        </div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-border shrink-0 bg-background">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave} disabled={saving || !form.full_name || !form.email}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 transition-all text-base">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editTarget ? 'Enregistrer les modifications' : 'Créer le compte'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Dialog ── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[80]" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] bg-card border border-border rounded-3xl p-8 w-[360px] max-w-[90vw] text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display font-black text-xl mb-2">Supprimer l'accès ?</h3>
              <p className="text-sm font-medium text-foreground mb-2">"{deleteTarget.full_name}"</p>
              <p className="text-xs text-muted-foreground mb-8">Ce membre ne pourra plus se connecter au tableau de bord administrateur ou staff.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-secondary/60 text-foreground text-sm font-bold hover:bg-secondary transition-all">Annuler</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-3.5 rounded-2xl bg-destructive text-white text-sm font-bold hover:brightness-110 shadow-lg shadow-destructive/20 transition-all flex items-center justify-center gap-2">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
