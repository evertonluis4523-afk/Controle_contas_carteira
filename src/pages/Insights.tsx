import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { useApp } from '../contexts/AppContext';
import { buildInsights } from '../services/insights';
import Card from '../components/Card';
import Icon from '../components/Icon';

/** Central de insights gerados pela IA local. */
export default function Insights() {
  const { settings } = useApp();
  const all = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const insights = useMemo(
    () => buildInsights(all, categories, settings.monthlyGoal),
    [all, categories, settings.monthlyGoal]
  );

  return (
    <div className="page">
      <h1 style={{ marginBottom: 4 }}>Insights</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Análises geradas localmente, sem enviar seus dados para a internet.
      </p>
      {insights.map((ins, i) => (
        <Card key={i} delay={i * 0.06}>
          <div className="row">
            <div
              className="icon-badge"
              style={{
                background:
                  ins.tone === 'positive' ? 'rgba(46,204,113,0.15)' :
                  ins.tone === 'negative' ? 'rgba(255,92,92,0.15)' : 'rgba(255,138,0,0.15)'
              }}
            >
              <Icon
                name={ins.icon}
                color={
                  ins.tone === 'positive' ? 'var(--income)' :
                  ins.tone === 'negative' ? 'var(--expense)' : 'var(--primary)'
                }
              />
            </div>
            <div>
              <strong>{ins.title}</strong>
              <p className="muted">{ins.text}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
