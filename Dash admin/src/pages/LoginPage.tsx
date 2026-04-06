import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Lock, Mail, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering 
      ? { full_name: fullName, email, password, role: 'staff' } 
      : { email, password };

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        if (isRegistering) {
          toast.success('Account created! You can now log in.');
          setIsRegistering(false);
        } else {
          localStorage.setItem('coffee_admin_token', result.data.token);
          localStorage.setItem('coffee_admin_user', JSON.stringify(result.data.user));
          toast.success(`Welcome back, ${result.data.user.full_name}!`);
          navigate('/');
        }
      } else {
        toast.error(result.error || 'Authentication failed');
      }
    } catch (error) {
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-espresso noise-overlay relative overflow-hidden font-body">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsla(18,35%,40%,0.08),transparent_70%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-20"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-6 group"
          >
            <Coffee className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-500" />
          </motion.div>
          <h1 className="text-4xl font-display font-medium text-cream tracking-tight">Coffee Time</h1>
          <p className="text-latte/40 mt-3 text-sm uppercase tracking-[0.2em] font-bold">
            {isRegistering ? 'Join the Team' : 'Admin Portal'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="glass-card rounded-3xl p-10 space-y-8 shadow-2xl border border-white/5 backdrop-blur-xl">
          <div className="space-y-4">
            {isRegistering && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="text-xs font-medium text-muted-foreground ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cafe.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>

          <div className="text-center pt-2 space-y-4">
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Create one'}
            </button>
            {!isRegistering && (
              <p className="text-[10px] text-muted-foreground/40 leading-relaxed uppercase tracking-wider">
                Demo access: admin@cafe.com / admin123
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
