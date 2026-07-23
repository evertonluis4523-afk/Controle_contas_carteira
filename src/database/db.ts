// Camada de persistência local (IndexedDB via Dexie).
import Dexie, { type Table } from 'dexie';
import type {
  Account,
  CardInfo,
  Category,
  Goal,
  HistoryEntry,
  Transaction
} from '../models/types';

class OrangeDB extends Dexie {
  accounts!: Table<Account, number>;
  cards!: Table<CardInfo, number>;
  categories!: Table<Category, number>;
  transactions!: Table<Transaction, number>;
  goals!: Table<Goal, number>;
  history!: Table<HistoryEntry, number>;

  constructor() {
    super('orange-finance');
    this.version(1).stores({
      accounts: '++id, name',
      cards: '++id, name',
      categories: '++id, name, type',
      transactions: '++id, type, date, accountId, cardId, categoryId, status',
      goals: '++id, name',
      history: '++id, timestamp'
    });
  }
}

export const db = new OrangeDB();

export async function logHistory(action: string, details: string): Promise<void> {
  await db.history.add({ timestamp: new Date().toISOString(), action, details });
}

const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Salário', type: 'receita', icon: 'payments', color: '#2ECC71' },
  { name: 'Freelance', type: 'receita', icon: 'work', color: '#27AE60' },
  { name: 'Investimentos', type: 'receita', icon: 'trending_up', color: '#1ABC9C' },
  { name: 'Outros', type: 'receita', icon: 'add_circle', color: '#16A085' },
  { name: 'Alimentação', type: 'despesa', icon: 'restaurant', color: '#FF8A00' },
  { name: 'Mercado', type: 'despesa', icon: 'shopping_cart', color: '#E67E22' },
  { name: 'Transporte', type: 'despesa', icon: 'directions_car', color: '#3498DB' },
  { name: 'Moradia', type: 'despesa', icon: 'home', color: '#9B59B6' },
  { name: 'Saúde', type: 'despesa', icon: 'favorite', color: '#FF5C5C' },
  { name: 'Lazer', type: 'despesa', icon: 'sports_esports', color: '#F1C40F' },
  { name: 'Educação', type: 'despesa', icon: 'school', color: '#2980B9' },
  { name: 'Assinaturas', type: 'despesa', icon: 'subscriptions', color: '#E74C3C' }
];

/** Popula o banco na primeira execução. */
export async function seedIfEmpty(): Promise<void> {
  if ((await db.categories.count()) === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
  if ((await db.accounts.count()) === 0) {
    await db.accounts.add({ name: 'Carteira', icon: 'wallet', color: '#FF8A00', initialBalance: 0 });
  }
}

/** Saldo de uma conta = saldo inicial + receitas pagas - despesas pagas. */
export async function accountBalance(accountId: number): Promise<number> {
  const acc = await db.accounts.get(accountId);
  if (!acc) return 0;
  const txs = await db.transactions.where('accountId').equals(accountId).toArray();
  return txs.reduce((sum, t) => {
    if (t.status !== 'pago') return sum;
    return t.type === 'receita' ? sum + t.amount : sum - t.amount;
  }, acc.initialBalance);
}
