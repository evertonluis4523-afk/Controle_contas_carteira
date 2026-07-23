import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

let activeCurrency = 'BRL';
export function setCurrency(c: string): void {
  activeCurrency = c;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: activeCurrency }).format(
    value
  );
}

export function formatDate(iso: string, pattern = "dd 'de' MMM"): string {
  return format(parseISO(iso), pattern, { locale: ptBR });
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // yyyy-MM
}
