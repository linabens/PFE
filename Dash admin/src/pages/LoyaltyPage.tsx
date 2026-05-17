import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { useAppStore, LoyaltyMember } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Loader2, Search, Edit, Trash2, X, Users, Award, Gift, Activity, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoyaltyPage() {
  const { loyaltyMembers, loading, fetchLoyalty, addLoyalty, updateLoyalty, deleteLoyalty } = useAppStore();
  const [search, setSearch] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [editTarget, setEditTarget] = useState<LoyaltyMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '', phone_number: '', customer_id_number: '', points: '0'
  });

  useEffect(() => { fetchLoyalty(); }, [fetchLoyalty]);

  const filtered = loyaltyMembers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  const totalPoints = loyaltyMembers.reduce((s, m) => s + m.points, 0);
  const totalEarned = loyaltyMembers.reduce((s, m) => s + m.totalEarned, 0);

  // Dynamic "Active This Week"
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const activeThisWeek = loyaltyMembers.filter(m => new Date(m.lastActivity) > oneWeekAgo).length;

  const openAdd = () => {
    setEditTarget(null);
    setFormData({ customer_name: '', phone_number: '', customer_id_number: '', points: '0' });
    setShowPanel(true);
  };

  const openEdit = (member: LoyaltyMember) => {
    setEditTarget(member);
    setFormData({
      customer_name: member.name,
      phone_number: member.phone === 'N/A' ? '' : member.phone,
      customer_id_number: '',
      points: member.points.toString()
    });
    setShowPanel(true);
  };

  const handleSave = async () => {
    if (!formData.customer_name) { toast.error('Le nom du client est requis'); return; }
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await updateLoyalty(editTarget.id, {
          customer_name: formData.customer_name, phone_number: formData.phone_number, customer_id_number: formData.customer_id_number, points: parseInt(formData.points)
        });
        toast.success('Compte mis à jour');
      } else {
        await addLoyalty({
          customer_name: formData.customer_name, phone_number: formData.phone_number, customer_id_number: formData.customer_id_number
        });
        toast.success('Compte créé avec succès');
      }
      setShowPanel(false);
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteLoyalty(confirmDelete.id);
      toast.success('Compte supprimé');
      setConfirmDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Échec de la suppression');
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-md px-6 py-5 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Award className="w-5 h-5 text-primary" /></div>
            Programme de Fidélité
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-11">Récompensez vos clients les plus fidèles</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Chercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all whitespace-nowrap w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Nouveau Membre
          </motion.button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Membres', value: loyaltyMembers.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Points Distribués', value: totalEarned, icon: Gift, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Points Dépensés', value: totalEarned - totalPoints, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Actifs (7 jours)', value: activeThisWeek, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 bg-card border border-border rounded-3xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={cn('p-3 rounded-2xl', bg)}><Icon className={cn('w-5 h-5', color)} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={cn('text-2xl font-black font-display leading-none mt-1', color)}>
                <CountUp end={value} duration={1} separator="," />
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Chargement des membres...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
          <Users className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-medium">Aucun membre trouvé</p>
          <p className="text-xs mt-1">Créez votre premier compte de fidélité.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map(member => (
              <motion.div key={member.id} layout
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                className="group relative bg-card border border-border rounded-3xl p-6 shadow-sm transition-all hover:shadow-xl flex flex-col">

                {/* Actions (Top Right) */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(member)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmDelete({ id: member.id, name: member.name })} className="p-1.5 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shrink-0 uppercase font-black text-xl text-primary">
                    {member.name.charAt(0)}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-display font-black text-xl text-foreground leading-tight">{member.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{member.phone}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Solde Points</span>
                      <span className={cn("text-2xl font-black font-display leading-none mt-1", member.points > 0 ? "text-primary" : "text-muted-foreground")}>
                        {member.points}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Award className={cn("w-5 h-5", member.points >= 1000 ? "text-amber-500" : member.points >= 500 ? "text-slate-400" : "text-primary/50")} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 px-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-medium">Niveau d'adhésion</span>
                      <span className="text-xs font-bold text-foreground">
                        {member.points >= 1000 ? 'Gold' : member.points >= 500 ? 'Silver' : 'Bronze'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-muted-foreground font-medium">Dernière visite</span>
                      <span className="text-xs font-bold text-foreground">
                        {new Date(member.lastActivity).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add/Edit Panel ── */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[450px] max-w-full bg-card shadow-2xl z-[70] flex flex-col border-l border-border">
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0 bg-secondary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h2 className="font-display font-black text-xl">{editTarget ? 'Modifier le compte' : 'Nouveau Membre'}</h2>
                    <p className="text-xs text-muted-foreground">Programme de Fidélité</p>
                  </div>
                </div>
                <button onClick={() => setShowPanel(false)} className="p-2 rounded-xl hover:bg-secondary/60 transition-all">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nom Complet *</label>
                  <input value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="ex: Ali Ben Salah"
                    className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Numéro de Téléphone</label>
                  <input value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="ex: +216 20 123 456"
                    className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CIN / Carte ID (Optionnel)</label>
                  <input value={formData.customer_id_number} onChange={(e) => setFormData({ ...formData, customer_id_number: e.target.value })}
                    placeholder="Numéro de carte d'identité"
                    className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" />
                </div>

                {editTarget && (
                  <div className="space-y-1.5 pt-4 border-t border-border/50">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ajuster les Points Manuellement</label>
                    <input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono font-black text-primary" />
                    <p className="text-[10px] text-muted-foreground italic mt-1">Attention: Modifier directement les points affectera le solde du client.</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border shrink-0 bg-background">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave} disabled={isSubmitting || !formData.customer_name}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 transition-all text-base">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editTarget ? 'Enregistrer les modifications' : 'Créer le compte'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Dialog ── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[80]" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] bg-card border border-border rounded-3xl p-8 w-[360px] max-w-[90vw] text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display font-black text-xl mb-2">Supprimer le membre ?</h3>
              <p className="text-sm font-medium text-foreground mb-2">"{confirmDelete.name}"</p>
              <p className="text-xs text-muted-foreground mb-8">Cette action est irréversible. Le client perdra tous ses points accumulés.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-secondary/60 text-foreground text-sm font-bold hover:bg-secondary transition-all">Annuler</button>
                <button onClick={handleDelete}
                  className="flex-1 py-3.5 rounded-2xl bg-destructive text-white text-sm font-bold hover:brightness-110 shadow-lg shadow-destructive/20 transition-all">Supprimer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
