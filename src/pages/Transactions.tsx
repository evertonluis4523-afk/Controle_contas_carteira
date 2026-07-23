import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../database/db';
import { todayISO } from '../utils/format';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import Card from '../components/Card';

type Period = 'hoje' | 'semana' | 'mes' | 'ano' | 'tudo';
const periods: { id: Period; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mês' },
  { id: 'ano', label: 'Ano' },
  { id: 'tudo', label: 'Tudo' }
];

/** Extrato com pesquisa e filtros combinados. */
export default function Transactions() {
  const navigate = useNavigate();
  const all = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];

  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<Period>('mes');
  const [catId, setCatId] = useState<number | 0>(0);

  const filtered = useMemo(() => {
    const today = todayISO();
    const now = new Date();
    return all.filter((t) => {
      if (period === 'hoje' && t.date !== today) return false;
      if (period === 'semana') {
        const d = new Date(t.date + 'T12:00:00');
        if ((now.getTime() - d.getTime()) / 86400000 > 7) return false;
      }
      if (period === 'mes' && t.date.slice(0, 7) !== today.slice(0, 7)) return false;
      if (period === 'ano' && t.date.slice(0, 4) !== today.slice(0, 4)) return false;
      if (catId && t.categoryId !== catId) return false;
      if (query) {
        const q = query.toLowerCase();
        const cat = categories.find((c) => c.id === t.categoryId)?.name.toLowerCase() ?? '';
        const acc = accounts.find((a) => a.id === t.accountId)?.name.toLowerCase() ?? '';
        const hay =
          t.description.toLowerCase() + ' ' + cat + ' ' + acc + ' ' +
          String(t.amount) + ' ' + (t.note ?? '').toLowerCase() + ' ' + (t.paymentMethod ?? '');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, period, catId, query, categories, accounts]);

  return (
    <div className="page">
      <h1 style={{ marginBottom: 14 }}>Extrato</h1>
      <div className="field">
        <input
          placeholder="Pesquisar por valor, descrição, categoria..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="chips">
        {periods.map((p) => (
          <button key={p.id} className={'chip' + (period === p.id ? ' active' : '')} onClick={() => setPeriod(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="chips">
        <button className={'chip' + (catId === 0 ? ' active' : '')} onClick={() => setCatId(0)}>
          Todas categorias
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={'chip' + (catId === c.id ? ' active' : '')}
            onClick={() => setCatId(c.id === catId ? 0 : (c.id as number))}
          >
            {c.name}
          </button>
        ))}
      </div>
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="search_off" title="Nada por aqui" text="Ajuste os filtros ou cadastre um lançamento." />
        ) : (
          filtered.map((t) => (
            <TransactionItem
              key={t.id}
              tx={t}
              categories={categories}
              accounts={accounts}
              onClick={() => navigate('/app/nova?id=' + t.id)}
            />
          ))
        )}
      </Card>
    </div>
  );
}
