// Contexto global: configurações persistidas + bloqueio de sessão.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import localforage from 'localforage';
import type { Settings } from '../models/types';
import { setCurrency } from '../utils/format';

const STORE_KEY = 'orange-settings';

const DEFAULTS: Settings = {
  currency: 'BRL',
  monthlyGoal: 0,
  firstDayOfMonth: 1,
  fontScale: 1,
  highContrast: false,
  notifications: false,
  rememberUser: true
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface AppCtxValue {
  settings: Settings;
  ready: boolean;
  locked: boolean;
  save(patch: Partial<Settings>): Promise<void>;
  setPin(pin: string): Promise<void>;
  verifyPin(pin: string): Promise<boolean>;
  unlock(): void;
  lock(): void;
}

const AppCtx = createContext<AppCtxValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    localforage.getItem<Settings>(STORE_KEY).then((stored) => {
      const merged = { ...DEFAULTS, ...(stored ?? {}) };
      setSettings(merged);
      setCurrency(merged.currency);
      if (!merged.pinHash) setLocked(false); // sem PIN definido, entra direto
      setReady(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(settings.fontScale));
    document.documentElement.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    setCurrency(settings.currency);
  }, [settings]);

  async function save(patch: Partial<Settings>): Promise<void> {
    const next = { ...settings, ...patch };
    setSettings(next);
    await localforage.setItem(STORE_KEY, next);
  }

  async function setPin(pin: string): Promise<void> {
    await save({ pinHash: await sha256(pin) });
  }

  async function verifyPin(pin: string): Promise<boolean> {
    if (!settings.pinHash) return true;
    return (await sha256(pin)) === settings.pinHash;
  }

  return (
    <AppCtx.Provider
      value={{
        settings,
        ready,
        locked,
        save,
        setPin,
        verifyPin,
        unlock: () => setLocked(false),
        lock: () => setLocked(true)
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): AppCtxValue {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
