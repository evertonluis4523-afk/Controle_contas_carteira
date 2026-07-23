// Registro único do Chart.js + defaults do tema escuro.
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js';

Chart.register(
  ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip
);

Chart.defaults.color = '#A0A6B0';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

// Performance em celular: sem animação por frame (evita rAF contínuo/travamento)
// e limita o devicePixelRatio (telas 3x fazem o canvas processar ~9x pixels).
Chart.defaults.animation = false;
Chart.defaults.devicePixelRatio = Math.min(
  typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  2
);
