import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { formatDate } from '../utils/format';
import Card from '../components/Card';
import Icon from '../components/Icon';

const items = [
  { to: '/app/relatorios', icon: 'bar_chart', label: 'Relatórios', desc: 'PDF, Excel, CSV e gráficos' },
  { to: '/app/calendario', icon: 'calendar_month', label: 'Calendário', desc: 'Contas e eventos do mês' },
  { to: '/app/metas', icon: 'flag', label: 'Metas', desc: 'Viagem, casa, reserva...' },
  { to: '/app/categorias', icon: 'category', label: 'Categorias', desc: 'Personalize ícones e cores' },
  { to: '/app/insights', icon: 'auto_awesome', label: 'Insights', desc: 'Análises inteligentes' },
  { to: '/app/config', icon: 'settings', label: 'Configurações', desc: 'PIN, backup, moeda e mais' }
];

/** Menu "Mais" + histórico de atividades. */
export default function More() {
  const history = useLiveQuery(() => db.history.orderBy('timestamp').reverse().limit(8).toArray(), []) ?? [];

  return (
    <div className="page">
      <h1 style={{ marginBottom: 14 }}>Mais</h1>
      <Card>
        {items.map((i) => (
          <Link to={i.to} key={i.to} className="list-item">
            <div className="icon-badge" style={{ background: 'rgba(255,138,0,0.12)' }}>
              <Icon name={i.icon} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <strong>{i.label}</strong>
              <p className="muted">{i.desc}</p>
            </div>
            <Icon name="chevron_right" color="var(--text-2)" />
          </Link>
        ))}
      </Card>
      {history.length > 0 && (
        <Card delay={0.08}>
          <h2 style={{ marginBottom: 6 }}>Histórico recente</h2>
          {history.map((h) => (
            <div className="list-item" key={h.id}>
              <Icon name="history" size={18} color="var(--text-2)" />
              <div>
                <p style={{ fontSize: '0.85rem' }}>{h.details}</p>
                <p className="muted">{formatDate(h.timestamp.slice(0, 10), 'dd/MM/yyyy')} · {h.action}</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
