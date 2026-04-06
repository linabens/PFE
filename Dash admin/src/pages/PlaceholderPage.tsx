import { motion } from 'framer-motion';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <span className="text-2xl">☕</span>
      </div>
      <h2 className="font-display text-xl text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">This section is coming soon</p>
    </motion.div>
  );
}
