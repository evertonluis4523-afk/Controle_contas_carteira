import { motion } from 'framer-motion';

interface Props {
  value: number; // 0..1
  color?: string;
}

export default function ProgressBar({ value, color }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="progress-track">
      <motion.div
        className="progress-fill"
        style={color ? { background: color } : undefined}
        initial={{ width: 0 }}
        animate={{ width: pct + '%' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}
