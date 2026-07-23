import { motion } from 'framer-motion';
import type { Account, Category, Transaction } from '../models/types';
import { formatCurrency, formatDate } from '../utils/format';
import Icon from './Icon';

interface Props {
  tx: Transaction;
  categories: Category[];
  accounts: Account[];
  onClick?: () => void;
}

export default function TransactionItem({ tx, categories, accounts, onClick }: Props) {
  const cat = categories.find((c) => c.id === tx.categoryId);
  const acc = accounts.find((a) => a.id === tx.accountId);
  const negative = tx.type === 'despesa';
  const parcela =
    tx.installments && tx.installments > 1
      ? ' · ' + (tx.installmentIndex ?? 1) + '/' + tx.installments
      : '';
  return (
    <motion.button
      className="list-item"
      style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="icon-badge" style={{ background: (cat?.color ?? '#555') + '22' }}>
        <Icon name={cat?.icon ?? 'receipt_long'} color={cat?.color ?? 'var(--text-2)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.description || cat?.name || 'Lançamento'}
        </div>
        <div className="muted">
          {formatDate(tx.date)} · {acc?.name ?? 'Sem conta'}{parcela}
          {tx.status === 'pendente' ? ' · pendente' : ''}
        </div>
      </div>
      <strong className={negative ? 'expense' : 'income'}>
        {negative ? '-' : '+'}{formatCurrency(tx.amount)}
      </strong>
    </motion.button>
  );
}
