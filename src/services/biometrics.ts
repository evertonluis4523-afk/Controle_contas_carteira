// Biometria / Face ID via WebAuthn (autenticador de plataforma).
export function biometricsAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

export async function registerBiometrics(): Promise<string | null> {
  if (!biometricsAvailable()) return null;
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Orange Finance' },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'orange-user',
          displayName: 'Orange Finance'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' }
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000
      }
    })) as PublicKeyCredential | null;
    if (!cred) return null;
    return btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
  } catch {
    return null;
  }
}

export async function verifyBiometrics(idB64: string): Promise<boolean> {
  if (!biometricsAvailable()) return false;
  try {
    const rawId = Uint8Array.from(atob(idB64), (c) => c.charCodeAt(0));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: rawId, type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    return !!assertion;
  } catch {
    return false;
  }
}
