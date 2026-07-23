import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon';

const tabs: { to: string; icon: string; label: string; end?: boolean; fab?: boolean }[] = [
  { to: '/app', icon: 'home', label: 'Início', end: true },
  { to: '/app/extrato', icon: 'receipt_long', label: 'Extrato' },
  { to: '/app/nova', icon: 'add', label: '', fab: true },
  { to: '/app/carteira', icon: 'account_balance_wallet', label: 'Carteira' },
  { to: '/app/mais', icon: 'apps', label: 'Mais' }
];

/** Casca do app: conteúdo com transição + tab bar fixa. */
export default function Layout() {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <nav className="tabbar" aria-label="Navegação principal">
        {tabs.map((t) =>
          t.fab ? (
            <NavLink key={t.to} to={t.to} className="tab-fab" aria-label="Novo lançamento">
              <Icon name="add" size={28} />
            </NavLink>
          ) : (
            <NavLink key={t.to} to={t.to} end={t.end}>
              <Icon name={t.icon} size={24} />
              <span>{t.label}</span>
            </NavLink>
          )
        )}
      </nav>
    </>
  );
}
