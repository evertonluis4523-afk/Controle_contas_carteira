interface Props {
  height?: number;
  width?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ height = 20, width = '100%', style }: Props) {
  return <div className="skeleton" style={{ height, width, ...style }} />;
}
