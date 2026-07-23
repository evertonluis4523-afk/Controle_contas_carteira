import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '../database/db';
import { todayISO } from '../utils/format';
import Card from '../components/Card';
import Icon from '../components/Icon';
import TransactionItem from '../components/TransactionItem';

/** Calendário financeiro: entradas, saídas, contas futuras e vencidas. */
export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const txs = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }),
    [month]
  );
  const today = todayISO();
  const firstWeekday = startOfMonth(month).getDay();

  function dayInfo(iso: string) {
    const list = txs.filter((t) => t.date === iso);
    return {
      hasIncome: list.some((t) => t.type === 'receita'),
      hasExpense: list.some((t) => t.type === 'despesa' && t.status === 'pago'),
      hasPending: list.some((t) => t.status === 'pendente'),
      overdue: list.some((t) => t.status === 'pendente' && iso < today)
    };
  }

  const selectedTxs = selected ? txs.filter((t) => t.date === selected) : [];

  return (
    <div className="page">
      <h1 style={{ marginBottom: 14 }}>Calendário</h1>
      <Card>
        <div className="between" style={{ marginBottom: 12 }}>
          <button className="btn btn-icon" onClick={() => setMonth(subMonths(month, 1))} aria-label="Mês anterior">
            <Icon name="chevron_left" />
          </button>
          <h2 style={{ textTransform: 'capitalize' }}>{format(month, 'MMMM yyyy', { locale: ptBR })}</h2>
          <button className="btn btn-icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="Próximo mês">
            <Icon name="chevron_right" />
          </button>
        </div>
        <div className="calendar-grid" style={{ marginBottom: 6 }}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <span key={i} className="muted">{d}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {Array.from({ length: firstWeekday }).map((_, i) => <span key={'e' + i} />)}
          {days.map((d) => {
            const iso = format(d, 'yyyy-MM-dd');
            const info = dayInfo(iso);
            return (
              <button
                key={iso}
                className={'calendar-day' + (iso === today ? ' today' : '')}
                style={selected === iso ? { background: 'rgba(255,138,0,0.2)' } : undefined}
                onClick={() => setSelected(iso)}
              >
                {d.getDate()}
                <span className="dots">
                  {info.hasIncome && <span className="dot" style={{ background: 'var(--income)' }} />}
                  {info.hasExpense && <span className="dot" style={{ background: 'var(--expense)' }} />}
                  {info.hasPending && (
                    <span className="dot" style={{ background: info.overdue ? 'var(--expense)' : 'var(--primary)' }} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
      {selected && (
        <Card>
          <h2 style={{ marginBottom: 4 }}>{format(new Date(selected + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}</h2>
          {selectedTxs.length === 0 ? (
            <p className="muted" style={{ padding: '12px 0' }}>Nenhum evento financeiro neste dia.</p>
          ) : (
            selectedTxs.map((t) => (
              <TransactionItem key={t.id} tx={t} categories={categories} accounts={accounts} />
            ))
          )}
        </Card>
      )}
    </div>
  );
}
