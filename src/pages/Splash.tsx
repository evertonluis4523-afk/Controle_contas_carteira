import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface Props {
  onDone: () => void;
}

/** Tela de abertura com logo, nome e barra de carregamento. */
export default function Splash({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18
      }}
    >
      <motion.img
        src="/icons/icon.svg"
        alt="Orange Finance"
        width={110}
        height={110}
        initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 14 }}
      />
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ fontSize: '1.6rem' }}
      >
        Orange <span style={{ color: 'var(--primary)' }}>Finance</span>
      </motion.h1>
      <div style={{ width: 160, height: 5, borderRadius: 3, background: 'var(--card-2)', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary-2), var(--primary))' }}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
