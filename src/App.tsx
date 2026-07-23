import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './contexts/AppContext';
import { seedIfEmpty } from './database/db';
import Layout from './components/Layout';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionForm from './pages/TransactionForm';
import Wallet from './pages/Wallet';
import Categories from './pages/Categories';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import CalendarPage from './pages/CalendarPage';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import More from './pages/More';

function Shell() {
  const { ready, locked } = useApp();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    seedIfEmpty();
  }, []);

  if (!splashDone || !ready) return <Splash onDone={() => setSplashDone(true)} />;
  if (locked) return <Login />;

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="extrato" element={<Transactions />} />
          <Route path="nova" element={<TransactionForm />} />
          <Route path="carteira" element={<Wallet />} />
          <Route path="categorias" element={<Categories />} />
          <Route path="metas" element={<Goals />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="insights" element={<Insights />} />
          <Route path="config" element={<Settings />} />
          <Route path="mais" element={<More />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppProvider>
  );
}
