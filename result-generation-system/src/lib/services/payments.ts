import { api } from '../api';

export type PlanKey = 'starter' | 'standard' | 'premium';

export interface PricingBreakdown {
  plan: PlanKey;
  rateNaira: number;
  totalNaira: number;
  totalKobo: number;
  band: number;
  discountPct: number;
}

export interface InitializePaymentResponse {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
  publicKey: string;
  amountKobo: number;
  pricing: PricingBreakdown;
}

export interface VerifyPaymentResponse {
  status: 'success' | 'failed';
  authorizationCode: string | null;
  last4: string | null;
  cardType: string | null;
}

export const paymentsService = {
  /**
   * Starts a Paystack transaction so the frontend can open the Inline
   * popup (or redirect) to collect card details before the Admin account
   * is actually created.
   */
  async initialize(email: string, plan: PlanKey, studentCount: number): Promise<InitializePaymentResponse> {
    return api.post('/payments/initialize', { email, plan, studentCount }, { skipAuth: true });
  },

  /** Confirms a transaction after the Paystack popup closes. */
  async verify(reference: string): Promise<VerifyPaymentResponse> {
    return api.get(`/payments/verify/${reference}`, { skipAuth: true });
  },
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  starter: 'School Starter',
  standard: 'School Standard',
  premium: 'School Premium',
};

export const PLAN_TRIAL_LIMITS: Record<PlanKey, number> = {
  starter: 10,
  standard: 5,
  premium: 8,
};

export const PLAN_BASE_PRICE: Record<PlanKey, number> = {
  starter: 2000,
  standard: 3000,
  premium: 4000,
};
