// Geração de relatórios: PDF (jsPDF), Excel (ExcelJS) e CSV.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import type { Account, Category, Transaction } from '../models/types';
import { formatCurrency, formatDate } from '../utils/format';

interface ReportData {
  title: string;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

function rows(data: ReportData): string[][] {
  const cat = (id?: number) => data.categories.find((c) => c.id === id)?.name ?? '-';
  const acc = (id?: number) => data.accounts.find((a) => a.id === id)?.name ?? '-';
  return data.transactions.map((t) => [
    formatDate(t.date, 'dd/MM/yyyy'),
    t.type === 'receita' ? 'Receita' : 'Despesa',
    t.description,
    cat(t.categoryId),
    acc(t.accountId),
    formatCurrency(t.type === 'receita' ? t.amount : -t.amount)
  ]);
}

function totals(txs: Transaction[]) {
  const income = txs.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(data: ReportData): void {
  const doc = new jsPDF();
  const t = totals(data.transactions);
  doc.setFontSize(18);
  doc.setTextColor(255, 138, 0);
  doc.text('Orange Finance', 14, 18);
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text(data.title, 14, 27);
  doc.setFontSize(10);
  doc.text('Receitas: ' + formatCurrency(t.income), 14, 36);
  doc.text('Despesas: ' + formatCurrency(t.expense), 80, 36);
  doc.text('Saldo: ' + formatCurrency(t.balance), 150, 36);
  autoTable(doc, {
    startY: 42,
    head: [['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta', 'Valor']],
    body: rows(data),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [255, 138, 0] }
  });
  doc.save('orange-relatorio.pdf');
}

export async function exportExcel(data: ReportData): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Relatório');
  ws.columns = [
    { header: 'Data', key: 'data', width: 12 },
    { header: 'Tipo', key: 'tipo', width: 10 },
    { header: 'Descrição', key: 'desc', width: 32 },
    { header: 'Categoria', key: 'cat', width: 18 },
    { header: 'Conta', key: 'conta', width: 16 },
    { header: 'Valor', key: 'valor', width: 14 }
  ];
  ws.getRow(1).font = { bold: true };
  rows(data).forEach((r) => ws.addRow(r));
  const buf = await wb.xlsx.writeBuffer();
  download(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'orange-relatorio.xlsx'
  );
}

export function exportCSV(data: ReportData): void {
  const head = 'Data;Tipo;Descricao;Categoria;Conta;Valor';
  const body = rows(data)
    .map((r) => r.map((c) => c.replace(/;/g, ',')).join(';'))
    .join('\n');
  download(new Blob(['\ufeff' + head + '\n' + body], { type: 'text/csv;charset=utf-8' }), 'orange-relatorio.csv');
}

export async function shareReport(data: ReportData): Promise<void> {
  const t = totals(data.transactions);
  const text =
    data.title +
    ' — Receitas: ' + formatCurrency(t.income) +
    ' | Despesas: ' + formatCurrency(t.expense) +
    ' | Saldo: ' + formatCurrency(t.balance);
  if (navigator.share) await navigator.share({ title: 'Orange Finance', text });
  else await navigator.clipboard.writeText(text);
}
