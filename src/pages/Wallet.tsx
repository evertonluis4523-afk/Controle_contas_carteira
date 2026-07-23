import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, accountBalance, logHistory } from '../database/db';
import { formatCurrency } from '../utils/format';
import type { Account, CardInfo } from '../models/types';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Sheet from '../components/Sheet';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';

const ACCOUNT_PRESETS = ['Nubank', 'Caixa', 'Banco do Brasil', 'Santander', 'Inter', 'Dinheiro', 'Carteira'];
const BRANDS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'];

/** Carteira: contas bancárias + cartões de crédito. */
export default function Wallet() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? [];
  const txs = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [accSheet, setAccSheet] = useState(false);
  const [cardSheet, setCardSheet] = useState(false);
  const [accForm, setAccForm] = useState<Account>({ name: '', icon: 'account_balance', color: '#FF8A00', initialBalance: 0 });
  const [cardForm, setCardForm] = useState<CardInfo>({ name: '', brand: 'Visa', limit: 0, closingDay: 1, dueDay: 10, color: '#7B2FF7' });

  useEffect(() => {
    Promise.all(accounts.map(async (a) => [a.id, await accountBalance(a.id as number)] as const)).then(
      (pairs) => setBalances(Object.fromEntries(pairs))
    );
  }, [accounts, txs]);

  function cardUsed(cardId: number): number {
    return txs
      .filter((t) => t.cardId === cardId && t.type === 'despesa' && t.status !== 'pago')
      .reduce((s, t) => s + t.amount, 0);
  }

  async function saveAccount() {
    if (!accForm.name) return;
    await db.accounts.add({ ...accForm, initialBalance: Number(accForm.initialBalance) || 0 });
    await logHistory('inclusao', 'Conta criada: ' + accForm.name);
    setAccSheet(false);
    setAccForm({ name: '', icon: 'account_balance', color: '#FF8A00', initialBalance: 0 });
  }

  async function saveCard() {
    if (!cardForm.name) return;
    await db.cards.add({ ...cardForm, limit: Number(cardForm.limit) || 0 });
    await logHistory('inclusao', 'Cartão criado: ' + cardForm.name);
    setCardSheet(false);
  }

  async function removeAccount(id: number) {
    if (confirm('Excluir esta conta?')) {
      await db.accounts.delete(id);
      await logHistory('exclusao', 'Conta #' + id + ' excluída');
    }
  }

  async function removeCard(id: number) {
    if (confirm('Excluir este cartão?')) {
      await db.cards.delete(id);
      await logHistory('exclusao', 'Cartão #' + id + ' excluído');
    }
  }

  return (
    <div className="page">
      <div className="between" style={{ marginBottom: 14 }}>
        <h1>Carteira</h1>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-icon" onClick={() => setAccSheet(true)} aria-label="Nova conta">
            <Icon name="account_balance" color="var(--primary)" />
          </button>
          <button className="btn btn-icon" onClick={() => setCardSheet(true)} aria-label="Novo cartão">
            <Icon name="credit_card" color="var(--primary)" />
          </button>
        </div>
      </div>

      <h2 style={{ margin: '6px 0 10px' }}>Contas</h2>
      {accounts.length === 0 && <EmptyState icon="account_balance" title="Sem contas" />}
      {accounts.map((a, i) => (
        <Card key={a.id} delay={i * 0.04}>
          <div className="between">
            <div className="row">
              <div className="icon-badge" style={{ background: a.color + '22' }}>
                <Icon name={a.icon} color={a.color} />
              </div>
              <div>
                <strong>{a.name}</strong>
                <p className="muted">Saldo disponível</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>{formatCurrency(balances[a.id as number] ?? 0)}</strong>
              <button
                className="muted"
                style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                onClick={() => removeAccount(a.id as number)}
              >
                Excluir
              </button>
            </div>
          </div>
        </Card>
      ))}

      <h2 style={{ margin: '22px 0 10px' }}>Cartões</h2>
      {cards.length === 0 && <EmptyState icon="credit_card" title="Sem cartões" />}
      {cards.map((c, i) => {
        const used = cardUsed(c.id as number);
        return (
          <Card key={c.id} delay={i * 0.04}>
            <div
              style={{
                borderRadius: 16, padding: 16, marginBottom: 12,
                background: 'linear-gradient(135deg, ' + c.color + ', ' + c.color + '99)'
              }}
            >
              <div className="between">
                <strong>{c.name}</strong>
                <span style={{ fontWeight: 700 }}>{c.brand}</span>
              </div>
              <p style={{ marginTop: 18, opacity: 0.9 }}>
                Fecha dia {c.closingDay} · Vence dia {c.dueDay}
              </p>
            </div>
            <div className="between" style={{ marginBottom: 8 }}>
              <span className="muted">Fatura aberta: {formatCurrency(used)}</span>
              <span className="muted">Disponível: {formatCurrency(Math.max(0, c.limit - used))}</span>
            </div>
            <ProgressBar value={c.limit > 0 ? used / c.limit : 0} color={used / c.limit > 0.8 ? 'var(--expense)' : undefined} />
            <button
              className="muted"
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 10 }}
              onClick={() => removeCard(c.id as number)}
            >
              Excluir cartão
            </button>
          </Card>
        );
      })}

      <Sheet open={accSheet} onClose={() => setAccSheet(false)}>
        <h2 style={{ marginBottom: 12 }}>Nova conta</h2>
        <div className="chips">
          {ACCOUNT_PRESETS.map((p) => (
            <button key={p} className={'chip' + (accForm.name === p ? ' active' : '')} onClick={() => setAccForm({ ...accForm, name: p })}>
              {p}
            </button>
          ))}
        </div>
        <div className="field">
          <label>Nome</label>
          <input value={accForm.name} onChange={(e) => setAccForm({ ...accForm, name: e.target.value })} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Saldo inicial</label>
            <input type="number" step="0.01" value={accForm.initialBalance} onChange={(e) => setAccForm({ ...accForm, initialBalance: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Cor</label>
            <input type="color" value={accForm.color} onChange={(e) => setAccForm({ ...accForm, color: e.target.value })} style={{ height: 48, padding: 4 }} />
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={saveAccount}>Salvar conta</button>
      </Sheet>

      <Sheet open={cardSheet} onClose={() => setCardSheet(false)}>
        <h2 style={{ marginBottom: 12 }}>Novo cartão</h2>
        <div className="field">
          <label>Nome</label>
          <input value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} placeholder="Ex.: Nubank Ultravioleta" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Bandeira</label>
            <select value={cardForm.brand} onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}>
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Limite</label>
            <input type="number" step="0.01" value={cardForm.limit} onChange={(e) => setCardForm({ ...cardForm, limit: Number(e.target.value) })} />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Dia de fechamento</label>
            <input type="number" min={1} max={28} value={cardForm.closingDay} onChange={(e) => setCardForm({ ...cardForm, closingDay: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Dia de vencimento</label>
            <input type="number" min={1} max={28} value={cardForm.dueDay} onChange={(e) => setCardForm({ ...cardForm, dueDay: Number(e.target.value) })} />
          </div>
        </div>
        <div className="field">
          <label>Cor do cartão</label>
          <input type="color" value={cardForm.color} onChange={(e) => setCardForm({ ...cardForm, color: e.target.value })} style={{ height: 48, padding: 4 }} />
        </div>
        <button className="btn btn-primary btn-block" onClick={saveCard}>Salvar cartão</button>
      </Sheet>
    </div>
  );
}
