import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { verifyBiometrics, biometricsAvailable } from '../services/biometrics';
import Icon from '../components/Icon';

/** Tela de bloqueio: PIN + biometria/Face ID. */
export default function Login() {
  const { settings, verifyPin, unlock } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  async function press(d: string) {
    if (error) setError(false);
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (await verifyPin(next)) unlock();
      else {
        setError(true);
        setTimeout(() => setPin(''), 350);
      }
    }
  }

  async function biometric() {
    if (settings.biometricsId && (await verifyBiometrics(settings.biometricsId))) unlock();
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" width={72} height={72} />
        <h1 style={{ marginTop: 12 }}>Digite seu PIN</h1>
        <p className="muted">Seus dados ficam protegidos neste dispositivo</p>
        <motion.div
          className="pin-dots"
          animate={error ? { x: [0, -10, 10, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={'pin-dot' + (pin.length > i ? ' filled' : '')} />
          ))}
        </motion.div>
      </div>
      <div className="pinpad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)}>{d}</button>
        ))}
        <button onClick={biometric} disabled={!settings.biometricsId || !biometricsAvailable()} aria-label="Biometria">
          <Icon name="fingerprint" size={26} color="var(--primary)" />
        </button>
        <button onClick={() => press('0')}>0</button>
        <button onClick={() => setPin(pin.slice(0, -1))} aria-label="Apagar">
          <Icon name="backspace" size={22} />
        </button>
      </div>
    </div>
  );
}
