import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db, logHistory } from '../database/db';
import { exportCSV, exportExcel, exportPDF, shareReport } from '../services/reports';
import { monthKey, todayISO } from '../utils/format';
import Card from '../components/Card';
import Icon from '../components/Icon';

type Period = 'diario' | 'semanal' | 'mensal' | 'anual';
const periods: { id: Period; label: string }[] = [
  { id: 'diario', label: 'Diário' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'mensal', label: 'Mensal' },
  { id: 'anual', label: 'Anual' }
];

/** Relatórios com gráficos e exportação em PDF, Excel e CSV. */
export default function Reports() {
  const [period, setPeriod] = useState<Period>('mensal');
  const all = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];

  const filtered = useMemo(() => {
    const today = todayISO();
    const now = Date.now();
    return all.filter((t) => {
      if (period === 'diario') return t.date === today;
      if (period === 'semanal') return (now - new Date(t.date + 'T12:00:00').getTime()) / 86400000 <= 7;
      if (period === 'mensal') return monthKey(t.date) === monthKey(today);
      return t.date.slice(0, 4) === today.slice(0, 4);
    });
  }, [all, period]);

  // Comparativo receitas x despesas (últimos 6 meses)
  const compare = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i));
    const keys = months.map((m) => format(m, 'yyyy-MM'));
    const sum = (key: string, type: string) =>
      all.filter((t) => monthKey(t.date) === key && t.type === type).reduce((s, t) => s + t.amount, 0);
    return {
      labels: months.map((m) => format(m, 'MMM', { locale: ptBR })),
      datasets: [
        { label: 'Receitas', data: keys.map((k) => sum(k, 'receita')), backgroundColor: '#2ECC71', borderRadius: 8 },
        { label: 'Despesas', data: keys.map((k) => sum(k, 'despesa')), backgroundColor: '#FF5C5C', borderRadius: 8 }
      ]
    };
  }, [all]);

  // Fluxo de caixa acumulado (últimos 6 meses)
  const cashflow = useMemo(() => {
    let acc = 0;
    const data = compare.labels.map((_, i) => {
      acc += (compare.datasets[0].data[i] as number) - (compare.datasets[1].data[i] as number);
      return acc;
    });
    return {
      labels: compare.labels,
      datasets: [{
        data, borderColor: '#FF8A00', backgroundColor: 'rgba(255,138,0,0.12)',
        fill: true, tension: 0.35
      }]
    };
  }, [compare]);

  const byCategory = useMemo(() => {
    const map = new Map<number, number>();
    filtered.forEach((t) => {
      if (t.type === 'despesa' && t.categoryId) map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });
    const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(([id]) => categories.find((c) => c.id === id)?.name ?? '—'),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map(([id]) => categories.find((c) => c.id === id)?.color ?? '#555'),
        borderWidth: 0
      }]
    };
  }, [filtered, categories]);

  const title = 'Relatório ' + periods.find((p) => p.id === period)?.label.toLowerCase();
  const reportData = { title, transactions: filtered, categories, accounts };

  async function doExport(kind: 'pdf' | 'xlsx' | 'csv' | 'share' | 'print') {
    if (kind === 'pdf') exportPDF(reportData);
    if (kind === 'xlsx') await exportExcel(reportData);
    if (kind === 'csv') exportCSV(reportData);
    if (kind === 'share') await shareReport(reportData);
    if (kind === 'print') window.print();
    await logHistory('backup', 'Relatório exportado (' + kind + ')');
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 14 }}>Relatórios</h1>
      <div className="chips">
        {periods.map((p) => (
          <button key={p.id} className={'chip' + (period === p.id ? ' active' : '')} onClick={() => setPeriod(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <Card>
        <h2 style={{ marginBottom: 8 }}>Receitas x Despesas</h2>
        <div style={{ height: 220 }}>
          <Bar data={compare} options={{ maintainAspectRatio: false }} />
        </div>
      </Card>
      <Card delay={0.05}>
        <h2 style={{ marginBottom: 8 }}>Fluxo de caixa</h2>
        <div style={{ height: 200 }}>
          <Line data={cashflow} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>
      </Card>
      {byCategory.labels.length > 0 && (
        <Card delay={0.1}>
          <h2 style={{ marginBottom: 8 }}>Despesas por categoria</h2>
          <div style={{ height: 240 }}>
            <Doughnut data={byCategory} options={{ maintainAspectRatio: false, cutout: '66%' }} />
          </div>
        </Card>
      )}
      <Card delay={0.15}>
        <h2 style={{ marginBottom: 12 }}>Exportar</h2>
        <div className="grid-2">
          <button className="btn" onClick={() => doExport('pdf')}>
            <Icon name="picture_as_pdf" size={18} color="var(--expense)" /> PDF
          </button>
          <button className="btn" onClick={() => doExport('xlsx')}>
            <Icon name="table_chart" size={18} color="var(--income)" /> Excel
          </button>
          <button className="btn" onClick={() => doExport('csv')}>
            <Icon name="description" size={18} color="var(--primary)" /> CSV
          </button>
          <button className="btn" onClick={() => doExport('share')}>
            <Icon name="share" size={18} color="var(--primary-2)" /> Compartilhar
          </button>
        </div>
        <button className="btn btn-block" style={{ marginTop: 10 }} onClick={() => doExport('print')}>
          <Icon name="print" size={18} /> Imprimir
        </button>
      </Card>
    </div>
  );
}
