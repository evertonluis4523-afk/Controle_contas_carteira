import { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './contexts/AppContext';
import { seedIfEmpty } from './database/db';
import Layout from './components/Layout';
import Splash from './pages/Splash';
import Login from './pages/Login';

// Páginas carregadas sob demanda (code splitting): mantém o bundle inicial
// leve para o app abrir rápido e não travar em celulares mais fracos.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const TransactionForm = lazy(() => import('./pages/TransactionForm'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Categories = lazy(() => import('./pages/Categories'));
const Goals = lazy(() => import('./pages/Goals'));
const Reports = lazy(() => import('./pages/Reports'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Insights = lazy(() => import('./pages/Insights'));
const Settings = lazy(() => import('./pages/Settings'));
const More = lazy(() => import('./pages/More'));

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
      <Suspense fallback={<div className="route-loading" />}>
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
      </Suspense>
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
