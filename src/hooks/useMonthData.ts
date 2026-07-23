// Dados reativos do mês atual (atualiza em tempo real via liveQuery).
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { monthKey, todayISO } from '../utils/format';
import type { Transaction } from '../models/types';

export interface MonthData {
  all: Transaction[];
  month: Transaction[];
  income: number;
  expense: number;
  balance: number;
  overdue: Transaction[];
  upcoming: Transaction[];
  loading: boolean;
}

export function useMonthData(): MonthData {
  const all = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []);
  const today = todayISO();
  const key = monthKey(today);
  const list = all ?? [];
  const month = list.filter((t) => monthKey(t.date) === key);
  const income = month.filter((t) => t.type === 'receita' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const expense = month.filter((t) => t.type === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const overdue = list.filter((t) => t.status === 'pendente' && t.date < today);
  const upcoming = list
    .filter((t) => t.status === 'pendente' && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  return { all: list, month, income, expense, balance: income - expense, overdue, upcoming, loading: all === undefined };
}
