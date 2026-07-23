import { useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { exportJSON, importJSON } from '../services/backup';
import { registerBiometrics, biometricsAvailable } from '../services/biometrics';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Sheet from '../components/Sheet';

/** Configurações: moeda, meta, PIN, biometria, backup, acessibilidade. */
export default function Settings() {
  const { settings, save, setPin, lock } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pinSheet, setPinSheet] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [msg, setMsg] = useState('');

  async function savePin() {
    if (newPin.length === 4) {
      await setPin(newPin);
      setPinSheet(false);
      setNewPin('');
      setMsg('PIN atualizado com sucesso.');
    }
  }

  async function enableBiometrics() {
    const id = await registerBiometrics();
    if (id) {
      await save({ biometricsId: id });
      setMsg('Biometria ativada.');
    } else {
      setMsg('Não foi possível ativar a biometria neste dispositivo.');
    }
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const ok = await importJSON(file);
      setMsg(ok ? 'Backup restaurado com sucesso.' : 'Arquivo de backup inválido.');
    }
  }

  async function askNotifications() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    await save({ notifications: perm === 'granted' });
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 14 }}>Configurações</h1>
      {msg && <p style={{ color: 'var(--primary-2)', marginBottom: 12 }}>{msg}</p>}

      <Card>
        <h2 style={{ marginBottom: 10 }}>Preferências</h2>
        <div className="field">
          <label>Moeda</label>
          <select value={settings.currency} onChange={(e) => save({ currency: e.target.value })}>
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar (US$)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Meta de economia mensal</label>
            <input
              type="number" step="0.01" defaultValue={settings.monthlyGoal || ''}
              onBlur={(e) => save({ monthlyGoal: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="field">
            <label>Primeiro dia do mês</label>
            <input
              type="number" min={1} max={28} defaultValue={settings.firstDayOfMonth}
              onBlur={(e) => save({ firstDayOfMonth: Number(e.target.value) || 1 })}
            />
          </div>
        </div>
      </Card>

      <Card delay={0.05}>
        <h2 style={{ marginBottom: 10 }}>Segurança</h2>
        <button className="btn btn-block" onClick={() => setPinSheet(true)}>
          <Icon name="pin" size={18} /> {settings.pinHash ? 'Alterar PIN' : 'Criar PIN'}
        </button>
        <button
          className="btn btn-block" style={{ marginTop: 10 }}
          onClick={enableBiometrics} disabled={!biometricsAvailable()}
        >
          <Icon name="fingerprint" size={18} /> Ativar biometria / Face ID
        </button>
        {settings.pinHash && (
          <button className="btn btn-block" style={{ marginTop: 10 }} onClick={lock}>
            <Icon name="lock" size={18} /> Bloquear agora
          </button>
        )}
      </Card>

      <Card delay={0.1}>
        <h2 style={{ marginBottom: 10 }}>Backup</h2>
        <div className="grid-2">
          <button className="btn" onClick={exportJSON}>
            <Icon name="download" size={18} /> Exportar JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> Importar JSON
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        <p className="muted" style={{ marginTop: 10 }}>
          A estrutura de sincronização em nuvem está preparada — basta conectar um provedor no futuro.
        </p>
      </Card>

      <Card delay={0.15}>
        <h2 style={{ marginBottom: 10 }}>Acessibilidade e notificações</h2>
        <div className="field">
          <label>Tamanho da fonte</label>
          <select value={String(settings.fontScale)} onChange={(e) => save({ fontScale: Number(e.target.value) })}>
            <option value="0.9">Pequena</option>
            <option value="1">Normal</option>
            <option value="1.15">Grande</option>
            <option value="1.3">Extra grande</option>
          </select>
        </div>
        <label className="between" style={{ padding: '6px 0', cursor: 'pointer' }}>
          <span>Alto contraste</span>
          <input
            type="checkbox" checked={settings.highContrast}
            onChange={(e) => save({ highContrast: e.target.checked })}
          />
        </label>
        <label className="between" style={{ padding: '6px 0', cursor: 'pointer' }}>
          <span>Notificações</span>
          <input type="checkbox" checked={settings.notifications} onChange={askNotifications} />
        </label>
      </Card>

      <Sheet open={pinSheet} onClose={() => setPinSheet(false)}>
        <h2 style={{ marginBottom: 12 }}>Definir PIN de 4 dígitos</h2>
        <div className="field">
          <input
            type="password" inputMode="numeric" maxLength={4} autoFocus
            value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: 12 }}
          />
        </div>
        <button className="btn btn-primary btn-block" onClick={savePin} disabled={newPin.length !== 4}>
          Salvar PIN
        </button>
      </Sheet>
    </div>
  );
}
