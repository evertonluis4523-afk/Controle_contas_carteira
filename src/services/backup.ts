// Backup local: exportação e importação em JSON (estrutura pronta p/ nuvem).
import { z } from 'zod';
import { db, logHistory } from '../database/db';

export async function exportJSON(): Promise<void> {
  const data = {
    app: 'orange-finance',
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: await db.accounts.toArray(),
    cards: await db.cards.toArray(),
    categories: await db.categories.toArray(),
    transactions: await db.transactions.toArray(),
    goals: await db.goals.toArray()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'orange-finance-backup-' + data.exportedAt.slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  await logHistory('backup', 'Backup JSON exportado');
}

const backupSchema = z.object({
  app: z.literal('orange-finance'),
  accounts: z.array(z.any()),
  cards: z.array(z.any()),
  categories: z.array(z.any()),
  transactions: z.array(z.any()),
  goals: z.array(z.any())
});

export async function importJSON(file: File): Promise<boolean> {
  try {
    const parsed = backupSchema.parse(JSON.parse(await file.text()));
    await db.transaction('rw', [db.accounts, db.cards, db.categories, db.transactions, db.goals], async () => {
      await Promise.all([
        db.accounts.clear(), db.cards.clear(), db.categories.clear(),
        db.transactions.clear(), db.goals.clear()
      ]);
      await db.accounts.bulkAdd(parsed.accounts);
      await db.cards.bulkAdd(parsed.cards);
      await db.categories.bulkAdd(parsed.categories);
      await db.transactions.bulkAdd(parsed.transactions);
      await db.goals.bulkAdd(parsed.goals);
    });
    await logHistory('importacao', 'Backup JSON importado');
    return true;
  } catch {
    return false;
  }
}
