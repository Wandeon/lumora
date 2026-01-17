'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export type ConsentStatus = 'pending' | 'accepted' | 'rejected';

interface CookieConsentContextType {
  consent: ConsentStatus;
  acceptCookies: () => void;
  rejectCookies: () => void;
  resetConsent: () => void;
}

const CookieConsentContext = createContext<
  CookieConsentContextType | undefined
>(undefined);

const CONSENT_KEY = 'lumora_cookie_consent';

function readConsentFromStorage(): ConsentStatus {
  if (typeof window === 'undefined') return 'pending';
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted' || stored === 'rejected') {
      return stored;
    }
    return 'pending';
  } catch {
    return 'pending';
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentStatus>('pending');
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadConsent = async () => {
      const stored = readConsentFromStorage();
      setConsent(stored);
      setIsHydrated(true);
    };

    loadConsent();
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return;
    if (consent === 'pending') return;

    try {
      localStorage.setItem(CONSENT_KEY, consent);
    } catch (e) {
      console.error('Failed to persist cookie consent:', e);
    }
  }, [consent, isHydrated]);

  const acceptCookies = useCallback(() => {
    setConsent('accepted');
  }, []);

  const rejectCookies = useCallback(() => {
    setConsent('rejected');
  }, []);

  const resetConsent = useCallback(() => {
    setConsent('pending');
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch (e) {
      console.error('Failed to reset cookie consent:', e);
    }
  }, []);

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        acceptCookies,
        rejectCookies,
        resetConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextType {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error(
      'useCookieConsent must be used within a CookieConsentProvider'
    );
  }
  return context;
}
