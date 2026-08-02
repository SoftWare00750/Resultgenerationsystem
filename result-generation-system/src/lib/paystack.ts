// Thin wrapper around Paystack's Inline JS (v2) popup. Loaded on demand so
// it never blocks the initial page render.

declare global {
  interface Window {
    PaystackPop?: new () => {
      newTransaction: (opts: {
        key: string;
        email: string;
        amount: number;
        reference: string;
        currency?: string;
        onSuccess?: (transaction: { reference: string }) => void;
        onCancel?: () => void;
        onError?: (error: unknown) => void;
      }) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadPaystackScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in browser'));
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Paystack — check your internet connection'));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Opens the Paystack card-capture popup. Resolves with the Paystack
 * reference once the popup reports success; rejects on cancel/error.
 */
export async function openPaystackPopup(opts: {
  publicKey: string;
  email: string;
  amountKobo: number;
  reference: string;
}): Promise<string> {
  await loadPaystackScript();
  if (!window.PaystackPop) throw new Error('Paystack failed to load');

  return new Promise((resolve, reject) => {
    const popup = new window.PaystackPop!();
    popup.newTransaction({
      key: opts.publicKey,
      email: opts.email,
      amount: opts.amountKobo,
      reference: opts.reference,
      currency: 'NGN',
      onSuccess: (transaction) => resolve(transaction.reference),
      onCancel: () => reject(new Error('Payment was cancelled')),
      onError: (err) => reject(err instanceof Error ? err : new Error('Payment failed')),
    });
  });
}
