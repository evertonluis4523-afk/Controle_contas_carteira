// IA local: gera insights comparando o mês atual com o anterior.
import { differenceInCalendarDays, endOfMonth, subMonths } from 'date-fns';
import type { Category, Transaction } from '../models/types';
import { formatCurrency, monthKey, todayISO } from '../utils/format';

export interface Insight {
  icon: string;
  title: string;
  text: string;
  tone: 'positive' | 'negative' | 'neutral';
}

function sumByCategory(txs: Transaction[]): Map<number, number> {
  const map = new Map<number, number>();
  txs.forEach((t) => {
    if (t.type !== 'despesa' || !t.categoryId) return;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  });
  return map;
}

export function buildInsights(
  all: Transaction[],
  categories: Category[],
  monthlyGoal: number
): Insight[] {
  const now = new Date();
  const curKey = monthKey(todayISO());
  const prevKey = monthKey(subMonths(now, 1).toISOString().slice(0, 10));
  const cur = all.filter((t) => monthKey(t.date) === curKey);
  const prev = all.filter((t) => monthKey(t.date) === prevKey);

  const curExp = cur.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  const prevExp = prev.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  const curInc = cur.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0);

  const insights: Insight[] = [];
  const catName = (id: number) => categories.find((c) => c.id === id)?.name ?? 'Sem categoria';

  if (prevExp > 0) {
    const diff = curExp - prevExp;
    if (diff < 0) {
      insights.push({
        icon: 'trending_down',
        title: 'Você gastou menos',
        text: 'Suas despesas caíram ' + formatCurrency(Math.abs(diff)) + ' em relação ao mês passado.',
        tone: 'positive'
      });
    } else if (diff > 0) {
      insights.push({
        icon: 'trending_up',
        title: 'Gastos em alta',
        text: 'Você já gastou ' + formatCurrency(diff) + ' a mais que no mês passado.',
        tone: 'negative'
      });
    }
  }

  // Categoria que mais aumentou / diminuiu
  const curCat = sumByCategory(cur);
  const prevCat = sumByCategory(prev);
  let upId = 0, upDiff = 0, downId = 0, downDiff = 0;
  curCat.forEach((v, id) => {
    const d = v - (prevCat.get(id) ?? 0);
    if (d > upDiff) { upDiff = d; upId = id; }
  });
  prevCat.forEach((v, id) => {
    const d = v - (curCat.get(id) ?? 0);
    if (d > downDiff) { downDiff = d; downId = id; }
  });
  if (upId && upDiff > 0) {
    insights.push({
      icon: 'north_east',
      title: catName(upId) + ' subiu',
      text: 'A categoria que mais cresceu foi ' + catName(upId) + ' (+' + formatCurrency(upDiff) + ').',
      tone: 'negative'
    });
  }
  if (downId && downDiff > 0) {
    insights.push({
      icon: 'south_east',
      title: catName(downId) + ' caiu',
      text: 'Você reduziu ' + formatCurrency(downDiff) + ' em ' + catName(downId) + '. Continue assim!',
      tone: 'positive'
    });
  }

  // Quanto pode gastar por dia até o fim do mês
  const daysLeft = Math.max(1, differenceInCalendarDays(endOfMonth(now), now) + 1);
  const available = curInc - curExp - monthlyGoal;
  if (available > 0) {
    insights.push({
      icon: 'today',
      title: 'Pode gastar por dia',
      text: 'Para fechar o mês na meta, você pode gastar até ' + formatCurrency(available / daysLeft) + ' por dia.',
      tone: 'neutral'
    });
  }

  // Previsão de fechamento do mês
  const dayOfMonth = now.getDate();
  if (dayOfMonth >= 5 && curExp > 0) {
    const daysInMonth = endOfMonth(now).getDate();
    const projected = (curExp / dayOfMonth) * daysInMonth;
    insights.push({
      icon: 'query_stats',
      title: 'Previsão do mês',
      text: 'No ritmo atual, suas despesas devem fechar o mês em ' + formatCurrency(projected) + '.',
      tone: projected > curInc ? 'negative' : 'neutral'
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: 'lightbulb',
      title: 'Comece a registrar',
      text: 'Cadastre suas receitas e despesas para receber insights personalizados.',
      tone: 'neutral'
    });
  }
  return insights;
}
