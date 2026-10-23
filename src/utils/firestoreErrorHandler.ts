import { auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const FIRESTORE_PROJECT_ID = 'gen-lang-client-0631502092';
export const FIRESTORE_DATABASE_ID = 'ai-studio-dashboardpiutang-bfd51357-e5c9-429d-9bf7-ba19575b338f';
export const UPGRADE_URL = `https://console.firebase.google.com/project/${FIRESTORE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data?openUpgradeDialog=true`;
export const PRICING_URL = 'https://firebase.google.com/pricing#cloud-firestore';

const QUOTA_STORAGE_KEY = 'rsud_firestore_quota_exceeded';

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('quota metric') ||
    msg.includes('Free daily write units') ||
    msg.includes('Free daily read units')
  );
}

export function checkIsQuotaExceeded(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY) || sessionStorage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Valid for the current 24-hour cycle
      if (Date.now() - (data.timestamp || 0) < 24 * 60 * 60 * 1000) {
        return true;
      }
    } else {
      // Seed with detected quota state from runtime
      const defaultState = {
        timestamp: Date.now(),
        message: "Quota exceeded for quota metric 'Free daily write units per project (free tier database)' per day.",
        upgradeUrl: UPGRADE_URL
      };
      localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(defaultState));
      return true;
    }
  } catch (_) {}
  return false;
}

export function markQuotaExceeded(errorMessage?: string) {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      timestamp: Date.now(),
      message: errorMessage || 'Free daily write quota exceeded.',
      upgradeUrl: UPGRADE_URL
    };
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(payload));
    sessionStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('firestore_quota_exceeded', { detail: payload }));
  } catch (_) {}
}

export function clearQuotaExceeded() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
    sessionStorage.removeItem(QUOTA_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('firestore_quota_cleared'));
  } catch (_) {}
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);

  if (isQuotaExceededError(error)) {
    markQuotaExceeded(errStr);
  }

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
