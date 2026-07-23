// Modelos de dados centrais do Orange Finance.
export type TxType = 'receita' | 'despesa';
export type TxStatus = 'pago' | 'pendente';

export interface Account {
  id?: number;
  name: string;
  icon: string;
  color: string;
  initialBalance: number;
}

export interface CardInfo {
  id?: number;
  name: string;
  brand: string; // Visa, Mastercard, Elo...
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
}

export interface Category {
  id?: number;
  name: string;
  type: TxType;
  icon: string; // nome de Material Symbol
  color: string;
}

export interface Transaction {
  id?: number;
  type: TxType;
  amount: number;
  date: string; // ISO yyyy-MM-dd
  description: string;
  accountId?: number;
  cardId?: number;
  categoryId?: number;
  paymentMethod?: string; // pix | dinheiro | debito | credito | boleto
  installments?: number; // total de parcelas
  installmentIndex?: number; // parcela atual (1..n)
  status: TxStatus;
  note?: string;
  photo?: string; // dataURL opcional (foto / comprovante)
  location?: string;
}

export interface Goal {
  id?: number;
  name: string;
  icon: string;
  target: number;
  current: number;
  deadline?: string;
}

export interface HistoryEntry {
  id?: number;
  timestamp: string;
  action: string; // inclusao | edicao | exclusao | backup | importacao
  details: string;
}

export interface Settings {
  currency: string;
  monthlyGoal: number; // meta de economia do mês
  firstDayOfMonth: number;
  fontScale: number;
  highContrast: boolean;
  notifications: boolean;
  pinHash?: string;
  biometricsId?: string;
  rememberUser: boolean;
}
