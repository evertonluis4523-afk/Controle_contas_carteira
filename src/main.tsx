import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './utils/chartSetup';
import { registerSW } from 'virtual:pwa-register';

// Atualização automática do PWA quando houver nova versão publicada.
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
