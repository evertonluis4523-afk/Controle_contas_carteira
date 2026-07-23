import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

/** Cartão padrão com animação de entrada. */
export default function Card({ children, className = '', delay = 0, onClick }: Props) {
  return (
    <motion.div
      className={'card ' + className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: 'easeOut' }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
