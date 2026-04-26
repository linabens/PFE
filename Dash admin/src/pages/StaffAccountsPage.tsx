import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Shield, Edit, Trash2, Loader2, Search, X, Eye, EyeOff, Check } from 'lucide-react';
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

  useEffect(() => {
    fetchUsers();
  }, []);

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
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!editTarget && !form.password) {
      toast.error('Password is required for new accounts');
      return;
    }

    setSaving(true);
    try {
      if (editTarget) {
        // Update — only send changed fields
        const payload: any = {};
        if (form.full_name !== editTarget.full_name) payload.full_name = form.full_name;
        if (form.email !== editTarget.email) payload.email = form.email;
        if (form.role !== editTarget.role) payload.role = form.role;
        if (form.password.trim().length >= 6) payload.password = form.password;

        await api.patch(`/admin/users/${editTarget.id}`, payload);
        toast.success(`${form.full_name} updated successfully`);
      } else {
        await api.post('/admin/users', form);
        toast.success(`${form.full_name} added to the team`);
      }
      await fetchUsers();
      closeModal();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast.success(`${deleteTarget.full_name} removed from the team`);
      await fetchUsers();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter(u =>
    (u.role === 'admin' || u.role === 'staff') &&
    (u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const badgeColors: Record<string, string> = {
    admin: 'bg-primary/10 text-primary border border-primary/20',
    staff: 'bg-secondary text-muted-foreground border border-border',
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} active account{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team..."
              className="h-10 pl-10 pr-4 w-56 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <motion.button
            onClick={openAdd}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add Member
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading team directory...</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden border border-espresso/5 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Team Member</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Access Level</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-display text-primary font-bold text-sm">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', badgeColors[user.role] || 'bg-secondary text-muted-foreground')}>
                      <Shield className="w-3 h-3" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-foreground/80">
                      {user.role === 'admin' ? 'Full System Access' : 'Orders & Menu Management'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p className="text-sm">{search ? 'No team members match your search' : 'No staff accounts yet — add one!'}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-md"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="font-display text-lg text-foreground">
                    {editTarget ? 'Edit Team Member' : 'Add Team Member'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editTarget ? `Editing ${editTarget.full_name}` : 'Create a new staff account'}
                  </p>
                </div>
                <button onClick={closeModal} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="e.g. Ahmed Benali"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="e.g. ahmed@coffeetime.dz"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Password {editTarget && <span className="font-normal normal-case">(leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={editTarget ? '••••••••' : 'Min. 6 characters'}
                      minLength={editTarget ? undefined : 6}
                      required={!editTarget}
                      className="w-full h-10 pl-3 pr-10 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Role</label>
                  <div className="flex gap-3">
                    {(['staff', 'admin'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: r }))}
                        className={cn(
                          'flex-1 h-10 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all',
                          form.role === r
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary text-muted-foreground border-border hover:border-primary/40'
                        )}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                        {form.role === r && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {form.role === 'admin' ? 'Full system access including user management.' : 'Access to orders, menu, tables, and assistance.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editTarget ? 'Save Changes' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ─────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-sm p-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="font-display text-lg text-foreground mb-1">Remove Team Member?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                <span className="font-semibold text-foreground">{deleteTarget.full_name}</span> will permanently lose access to the dashboard.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-10 rounded-xl bg-destructive text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/80 transition-all disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
