import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Doughnut, Line } from 'react-chartjs-2';
import { db } from '../database/db';
import { useMonthData } from '../hooks/useMonthData';
import { useApp } from '../contexts/AppContext';
import { computeHealth } from '../services/financialHealth';
import { buildInsights } from '../services/insights';
import { formatCurrency } from '../utils/format';
import Card from '../components/Card';
import Icon from '../components/Icon';
import ProgressBar from '../components/ProgressBar';
import ScoreRing from '../components/ScoreRing';
import Skeleton from '../components/Skeleton';
import TransactionItem from '../components/TransactionItem';
import { endOfMonth, differenceInCalendarDays } from 'date-fns';

export default function Dashboard() {
  const { settings } = useApp();
  const data = useMonthData();
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];

  const health = useMemo(
    () =>
      computeHealth({
        income: data.income,
        expense: data.expense,
        overdueCount: data.overdue.length,
        monthlyGoal: settings.monthlyGoal,
        transactions: data.month
      }),
    [data.income, data.expense, data.overdue.length, settings.monthlyGoal, data.month]
  );

  const insights = useMemo(
    () => buildInsights(data.all, categories, settings.monthlyGoal).slice(0, 3),
    [data.all, categories, settings.monthlyGoal]
  );

  const now = new Date();
  const daysLeft = Math.max(1, differenceInCalendarDays(endOfMonth(now), now) + 1);
  const canSpendToday = Math.max(0, (data.income - data.expense - settings.monthlyGoal) / daysLeft);

  const expenses = data.month.filter((t) => t.type === 'despesa');
  const biggest = expenses.reduce<typeof expenses[number] | null>(
    (max, t) => (max && max.amount >= t.amount ? max : t),
    null
  );
  const byCat = new Map<number, number>();
  expenses.forEach((t) => t.categoryId && byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount));
  const topCatId = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topCat = categories.find((c) => c.id === topCatId);

  // Gráfico de linha: gasto acumulado por dia do mês
  const lineData = useMemo(() => {
    const days = endOfMonth(now).getDate();
    const perDay = new Array(days).fill(0);
    expenses.forEach((t) => {
      perDay[Number(t.date.slice(8, 10)) - 1] += t.amount;
    });
    let acc = 0;
    const cumulative = perDay.map((v) => (acc += v));
    return {
      labels: cumulative.map((_, i) => String(i + 1)),
      datasets: [
        {
          data: cumulative,
          borderColor: '#FF8A00',
          backgroundColor: 'rgba(255,138,0,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0
        }
      ]
    };
  }, [data.month]);

  const catChart = useMemo(() => {
    const entries = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return {
      labels: entries.map(([id]) => categories.find((c) => c.id === id)?.name ?? '—'),
      datasets: [
        {
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([id]) => categories.find((c) => c.id === id)?.color ?? '#555'),
          borderWidth: 0
        }
      ]
    };
  }, [data.month, categories]);

  if (data.loading) {
    return (
      <div className="page">
        <Skeleton height={120} style={{ marginBottom: 14 }} />
        <Skeleton height={90} style={{ marginBottom: 14 }} />
        <Skeleton height={200} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="between" style={{ marginBottom: 16 }}>
        <div>
          <p className="muted">Bem-vindo de volta</p>
          <h1>Visão geral</h1>
        </div>
        <Link to="/app/insights" className="btn btn-icon" aria-label="Insights">
          <Icon name="auto_awesome" color="var(--primary)" />
        </Link>
      </div>

      <Card>
        <p className="muted">Saldo do mês</p>
        <h1 style={{ fontSize: '2rem', margin: '4px 0 14px' }}>{formatCurrency(data.balance)}</h1>
        <div className="grid-2">
          <div className="row">
            <div className="icon-badge" style={{ background: 'rgba(46,204,113,0.15)' }}>
              <Icon name="arrow_upward" color="var(--income)" />
            </div>
            <div>
              <p className="muted">Receitas</p>
              <strong className="income">{formatCurrency(data.income)}</strong>
            </div>
          </div>
          <div className="row">
            <div className="icon-badge" style={{ background: 'rgba(255,92,92,0.15)' }}>
              <Icon name="arrow_downward" color="var(--expense)" />
            </div>
            <div>
              <p className="muted">Despesas</p>
              <strong className="expense">{formatCurrency(data.expense)}</strong>
            </div>
          </div>
        </div>
      </Card>

      <Card delay={0.05}>
        <div className="row" style={{ gap: 20 }}>
          <ScoreRing score={health.score} color={health.color} label={health.label} />
          <div style={{ flex: 1 }}>
            <h2>Saúde financeira</h2>
            <p className="muted" style={{ margin: '6px 0 10px' }}>{health.tips[0]}</p>
            <div className="between">
              <span className="muted">Pode gastar hoje</span>
              <strong style={{ color: 'var(--primary-2)' }}>{formatCurrency(canSpendToday)}</strong>
            </div>
          </div>
        </div>
      </Card>

      {settings.monthlyGoal > 0 && (
        <Card delay={0.08}>
          <div className="between" style={{ marginBottom: 10 }}>
            <h2>Meta do mês</h2>
            <span className="muted">
              {formatCurrency(Math.max(0, data.balance))} / {formatCurrency(settings.monthlyGoal)}
            </span>
          </div>
          <ProgressBar value={settings.monthlyGoal > 0 ? data.balance / settings.monthlyGoal : 0} />
        </Card>
      )}

      <div className="grid-2" style={{ marginTop: 14 }}>
        <Card delay={0.1}>
          <p className="muted">Maior gasto</p>
          <strong>{biggest ? formatCurrency(biggest.amount) : '—'}</strong>
          <p className="muted">{biggest?.description ?? 'Sem despesas'}</p>
        </Card>
        <Card delay={0.12}>
          <p className="muted">Maior categoria</p>
          <strong>{topCat?.name ?? '—'}</strong>
          <p className="muted">{topCatId ? formatCurrency(byCat.get(topCatId) ?? 0) : 'Sem despesas'}</p>
        </Card>
      </div>

      {insights.length > 0 && (
        <Card delay={0.14}>
          <h2 style={{ marginBottom: 10 }}>Insights</h2>
          {insights.map((i, idx) => (
            <div className="list-item" key={idx}>
              <Icon name={i.icon} color={i.tone === 'negative' ? 'var(--expense)' : i.tone === 'positive' ? 'var(--income)' : 'var(--primary)'} />
              <div>
                <strong style={{ fontSize: '0.9rem' }}>{i.title}</strong>
                <p className="muted">{i.text}</p>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card delay={0.16}>
        <h2 style={{ marginBottom: 8 }}>Gasto acumulado no mês</h2>
        <div style={{ height: 180 }}>
          <Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>
      </Card>

      {catChart.labels.length > 0 && (
        <Card delay={0.18}>
          <h2 style={{ marginBottom: 8 }}>Por categoria</h2>
          <div style={{ height: 220 }}>
            <Doughnut data={catChart} options={{ maintainAspectRatio: false, cutout: '68%' }} />
          </div>
        </Card>
      )}

      {data.upcoming.length > 0 && (
        <Card delay={0.2}>
          <h2 style={{ marginBottom: 4 }}>Próximas contas</h2>
          {data.upcoming.map((t) => (
            <TransactionItem key={t.id} tx={t} categories={categories} accounts={accounts} />
          ))}
        </Card>
      )}

      <Card delay={0.22}>
        <div className="between" style={{ marginBottom: 4 }}>
          <h2>Últimos lançamentos</h2>
          <Link to="/app/extrato" className="muted">Ver todos</Link>
        </div>
        {data.all.slice(0, 5).map((t) => (
          <TransactionItem key={t.id} tx={t} categories={categories} accounts={accounts} />
        ))}
      </Card>
    </div>
  );
}
