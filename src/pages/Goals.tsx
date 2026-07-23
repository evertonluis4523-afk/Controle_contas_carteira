import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addMonths, format } from 'date-fns';
import { db, logHistory } from '../database/db';
import type { Goal } from '../models/types';
import { formatCurrency, formatDate } from '../utils/format';
import Card from '../components/Card';
import Icon from '../components/Icon';
import ProgressBar from '../components/ProgressBar';
import Sheet from '../components/Sheet';
import EmptyState from '../components/EmptyState';

const PRESETS = [
  { name: 'Viagem', icon: 'flight' },
  { name: 'Casa', icon: 'home' },
  { name: 'Carro', icon: 'directions_car' },
  { name: 'Notebook', icon: 'laptop_mac' },
  { name: 'Reserva', icon: 'savings' }
];

/** Metas financeiras com previsão de conclusão. */
export default function Goals() {
  const goals = useLiveQuery(() => db.goals.toArray(), []) ?? [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Goal>({ name: '', icon: 'savings', target: 0, current: 0 });
  const [deposit, setDeposit] = useState<{ id: number; value: string } | null>(null);

  async function save() {
    if (!form.name || form.target <= 0) return;
    await db.goals.add({ ...form, target: Number(form.target), current: Number(form.current) || 0 });
    await logHistory('inclusao', 'Meta criada: ' + form.name);
    setOpen(false);
    setForm({ name: '', icon: 'savings', target: 0, current: 0 });
  }

  async function addDeposit() {
    if (!deposit) return;
    const g = await db.goals.get(deposit.id);
    if (g) {
      await db.goals.update(deposit.id, { current: g.current + Number(deposit.value || 0) });
      await logHistory('edicao', 'Aporte na meta ' + g.name);
    }
    setDeposit(null);
  }

  function forecast(g: Goal): string {
    if (g.current >= g.target) return 'Concluída! 🎉';
    if (g.current <= 0) return 'Faça o primeiro aporte';
    // estimativa simples: mantém o ritmo médio de 1 aporte/mês do valor atual
    const monthsLeft = Math.ceil((g.target - g.current) / Math.max(1, g.current));
    return 'Previsão: ' + formatDate(format(addMonths(new Date(), monthsLeft), 'yyyy-MM-dd'), 'MMM yyyy');
  }

  return (
    <div className="page">
      <div className="between" style={{ marginBottom: 14 }}>
        <h1>Metas</h1>
        <button className="btn btn-icon" onClick={() => setOpen(true)} aria-label="Nova meta">
          <Icon name="add" color="var(--primary)" />
        </button>
      </div>
      {goals.length === 0 && (
        <EmptyState icon="flag" title="Nenhuma meta ainda" text="Crie metas para viagem, casa, carro ou o que quiser." />
      )}
      {goals.map((g, i) => {
        const pct = g.target > 0 ? g.current / g.target : 0;
        return (
          <Card key={g.id} delay={i * 0.05}>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="row">
                <div className="icon-badge" style={{ background: 'rgba(255,138,0,0.15)' }}>
                  <Icon name={g.icon} color="var(--primary)" />
                </div>
                <div>
                  <strong>{g.name}</strong>
                  <p className="muted">{forecast(g)}</p>
                </div>
              </div>
              <button className="btn btn-icon" onClick={() => setDeposit({ id: g.id as number, value: '' })} aria-label="Aportar">
                <Icon name="add_circle" color="var(--income)" />
              </button>
            </div>
            <ProgressBar value={pct} color={pct >= 1 ? 'var(--income)' : undefined} />
            <div className="between" style={{ marginTop: 8 }}>
              <span className="muted">{formatCurrency(g.current)} de {formatCurrency(g.target)}</span>
              <strong style={{ color: 'var(--primary-2)' }}>{Math.round(pct * 100)}%</strong>
            </div>
          </Card>
        );
      })}

      <Sheet open={open} onClose={() => setOpen(false)}>
        <h2 style={{ marginBottom: 12 }}>Nova meta</h2>
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.name} className={'chip' + (form.name === p.name ? ' active' : '')} onClick={() => setForm({ ...form, name: p.name, icon: p.icon })}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="field">
          <label>Nome da meta</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Viagem ao Japão" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Valor desejado</label>
            <input type="number" step="0.01" onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Valor atual</label>
            <input type="number" step="0.01" onChange={(e) => setForm({ ...form, current: Number(e.target.value) })} />
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={save}>Criar meta</button>
      </Sheet>

      <Sheet open={!!deposit} onClose={() => setDeposit(null)}>
        <h2 style={{ marginBottom: 12 }}>Novo aporte</h2>
        <div className="field">
          <label>Valor</label>
          <input
            type="number" step="0.01" autoFocus
            value={deposit?.value ?? ''}
            onChange={(e) => deposit && setDeposit({ ...deposit, value: e.target.value })}
          />
        </div>
        <button className="btn btn-primary btn-block" onClick={addDeposit}>Confirmar aporte</button>
      </Sheet>
    </div>
  );
}
