import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, logHistory } from '../database/db';
import type { Category, TxType } from '../models/types';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Sheet from '../components/Sheet';

const ICONS = [
  'restaurant', 'shopping_cart', 'directions_car', 'home', 'favorite', 'sports_esports',
  'school', 'subscriptions', 'flight', 'pets', 'fitness_center', 'checkroom',
  'payments', 'work', 'trending_up', 'card_giftcard', 'local_cafe', 'phone_iphone'
];

/** Gerenciador de categorias ilimitadas. */
export default function Categories() {
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Category>({ name: '', type: 'despesa', icon: 'restaurant', color: '#FF8A00' });

  async function save() {
    if (!form.name) return;
    await db.categories.add({ ...form });
    await logHistory('inclusao', 'Categoria criada: ' + form.name);
    setOpen(false);
    setForm({ name: '', type: 'despesa', icon: 'restaurant', color: '#FF8A00' });
  }

  async function remove(id: number, name: string) {
    if (confirm('Excluir a categoria "' + name + '"?')) {
      await db.categories.delete(id);
      await logHistory('exclusao', 'Categoria excluída: ' + name);
    }
  }

  const grouped: { type: TxType; label: string }[] = [
    { type: 'despesa', label: 'Despesas' },
    { type: 'receita', label: 'Receitas' }
  ];

  return (
    <div className="page">
      <div className="between" style={{ marginBottom: 14 }}>
        <h1>Categorias</h1>
        <button className="btn btn-icon" onClick={() => setOpen(true)} aria-label="Nova categoria">
          <Icon name="add" color="var(--primary)" />
        </button>
      </div>
      {grouped.map((g) => (
        <Card key={g.type}>
          <h2 style={{ marginBottom: 6 }}>{g.label}</h2>
          {categories.filter((c) => c.type === g.type).map((c) => (
            <div className="list-item" key={c.id}>
              <div className="icon-badge" style={{ background: c.color + '22' }}>
                <Icon name={c.icon} color={c.color} />
              </div>
              <strong style={{ flex: 1 }}>{c.name}</strong>
              <button
                className="muted"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => remove(c.id as number, c.name)}
              >
                <Icon name="delete" size={18} />
              </button>
            </div>
          ))}
        </Card>
      ))}
      <Sheet open={open} onClose={() => setOpen(false)}>
        <h2 style={{ marginBottom: 12 }}>Nova categoria</h2>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <button className={'chip' + (form.type === 'despesa' ? ' active' : '')} onClick={() => setForm({ ...form, type: 'despesa' })}>Despesa</button>
          <button className={'chip' + (form.type === 'receita' ? ' active' : '')} onClick={() => setForm({ ...form, type: 'receita' })}>Receita</button>
        </div>
        <div className="field">
          <label>Nome</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Ícone</label>
          <div className="chips" style={{ flexWrap: 'wrap' }}>
            {ICONS.map((i) => (
              <button key={i} className={'chip' + (form.icon === i ? ' active' : '')} onClick={() => setForm({ ...form, icon: i })}>
                <Icon name={i} size={18} />
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Cor</label>
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: 48, padding: 4 }} />
        </div>
        <button className="btn btn-primary btn-block" onClick={save}>Salvar categoria</button>
      </Sheet>
    </div>
  );
}
