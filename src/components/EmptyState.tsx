import Icon from './Icon';

interface Props {
  icon: string;
  title: string;
  text?: string;
}

export default function EmptyState({ icon, title, text }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-2)' }}>
      <Icon name={icon} size={44} color="var(--primary)" />
      <h2 style={{ margin: '12px 0 6px', color: 'var(--text)' }}>{title}</h2>
      {text && <p className="muted">{text}</p>}
    </div>
  );
}
