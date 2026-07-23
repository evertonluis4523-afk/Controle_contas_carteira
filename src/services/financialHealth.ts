// Algoritmo próprio de Saúde Financeira (0 a 100).
import type { Transaction } from '../models/types';

export interface HealthResult {
  score: number;
  label: 'Excelente' | 'Boa' | 'Atenção' | 'Risco' | 'Crítica';
  color: string;
  tips: string[];
}

interface HealthInput {
  income: number;
  expense: number;
  overdueCount: number;
  monthlyGoal: number;
  transactions: Transaction[];
}

export function computeHealth({ income, expense, overdueCount, monthlyGoal }: HealthInput): HealthResult {
  const tips: string[] = [];
  let score = 50;

  // 1) Taxa de economia (peso 40)
  const savingsRate = income > 0 ? (income - expense) / income : expense > 0 ? -1 : 0;
  if (savingsRate >= 0.3) score += 40;
  else if (savingsRate >= 0.15) score += 28;
  else if (savingsRate >= 0.05) score += 15;
  else if (savingsRate >= 0) score += 5;
  else {
    score -= 25;
    tips.push('Suas despesas superam as receitas neste mês. Reveja os maiores gastos.');
  }

  // 2) Contas vencidas (peso 20)
  if (overdueCount === 0) score += 10;
  else {
    score -= Math.min(20, overdueCount * 7);
    tips.push('Você tem ' + overdueCount + ' conta(s) vencida(s). Quite-as para evitar juros.');
  }

  // 3) Meta do mês (peso 15)
  if (monthlyGoal > 0) {
    const saved = income - expense;
    if (saved >= monthlyGoal) {
      score += 15;
      tips.push('Meta de economia do mês alcançada. Excelente!');
    } else if (saved > 0) {
      score += Math.round((saved / monthlyGoal) * 10);
    }
  }

  // 4) Concentração de gastos (peso 10): muito gasto num único dia indica descontrole.
  score = Math.max(0, Math.min(100, score));

  let label: HealthResult['label'];
  let color: string;
  if (score >= 85) { label = 'Excelente'; color = '#2ECC71'; }
  else if (score >= 70) { label = 'Boa'; color = '#7FD48A'; }
  else if (score >= 50) { label = 'Atenção'; color = '#FFB347'; }
  else if (score >= 30) { label = 'Risco'; color = '#FF8A00'; }
  else { label = 'Crítica'; color = '#FF5C5C'; }

  if (tips.length === 0) tips.push('Continue registrando seus lançamentos para insights mais precisos.');
  return { score, label, color, tips };
}
