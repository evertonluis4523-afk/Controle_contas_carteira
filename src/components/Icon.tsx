interface Props {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

/** Ícone Material Symbols. */
export default function Icon({ name, size = 22, color, className = '' }: Props) {
  return (
    <span className={'ms ' + className} style={{ fontSize: size, color }} aria-hidden="true">
      {name}
    </span>
  );
}
