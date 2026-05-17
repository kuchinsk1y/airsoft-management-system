'use client';

import {
  logout,
  processOAuthToken as processOAuthTokenAction,
} from '@/actions/auth';
import { getUser } from '@/actions/user';
import { User, UserContextType } from '@/interfaces';
import { useCartStore } from '@/stores/cartStore';
import { useUserStore } from '@/stores/userStore';
import {
  OAUTH_PROTECTED_PAGES,
  OAUTH_TOKEN_PARAMS,
} from '@/utils/auth-constants';
import { getCleanUrl } from '@/utils/url';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const UserContext = createContext<UserContextType | undefined>(undefined);
const USER_REFRESH_COOLDOWN_MS = 60_000;
const USER_NULL_RETRY_GUARD_MS = 3_000;

// Keeps retry pacing stable even if UserProvider remounts.
let globalLastUserLoadAttemptAt = 0;

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    return {
      user: null,
      isLoading: true,
      loadUser: async () => {},
      handleLogout: async () => {},
      setUser: () => {},
    };
  }
  return ctx;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const tokenProcessedRef = useRef(false);
  const lastLoadedPathRef = useRef<string | null>(null);
  const lastLoadedAtRef = useRef<number>(0);

  const loadUser = useCallback(async (): Promise<User | null> => {
    const nextUser = await getUser();
    if (nextUser) {
      setUser(nextUser);
      useCartStore.getState().switchCartUser(nextUser.id);
    } else {
      setUser(null);
      useCartStore.getState().switchCartUser(null);
      useUserStore.getState().resetProfile();
    }
    return nextUser;
  }, []);

  const processOAuthTokenFromUrl = useCallback(async (): Promise<boolean> => {
    if (
      pathname &&
      OAUTH_PROTECTED_PAGES.includes(
        pathname as (typeof OAUTH_PROTECTED_PAGES)[number],
      )
    ) {
      return false;
    }

    if (tokenProcessedRef.current) {
      return false;
    }

    const url = new URL(window.location.href);
    const oauthTokenParam = OAUTH_TOKEN_PARAMS[0];
    const oauthToken = url.searchParams.get(oauthTokenParam);

    if (oauthToken) {
      tokenProcessedRef.current = true;
      const cleanUrl = getCleanUrl(OAUTH_TOKEN_PARAMS);
      router.replace(cleanUrl);
      await processOAuthTokenAction(oauthToken);
      return true;
    }

    return false;
  }, [pathname, router]);

  const handleLogout = useCallback(async () => {
    try {
      setUser(null);
      useCartStore.getState().switchCartUser(null);
      useUserStore.getState().resetProfile();
      await logout();
    } finally {
      window.dispatchEvent(new CustomEvent('user-logged-out'));
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    const handleLogoutRequest = () => {
      handleLogout();
    };

    const handleLoginSuccess = () => {
      useUserStore.getState().resetProfile();
      void loadUser();
    };

    window.addEventListener('user-logout-request', handleLogoutRequest);
    window.addEventListener('user-logged-in', handleLoginSuccess);
    return () => {
      window.removeEventListener('user-logout-request', handleLogoutRequest);
      window.removeEventListener('user-logged-in', handleLoginSuccess);
    };
  }, [handleLogout, loadUser]);

  useEffect(() => {
    const now = Date.now();
    const params = new URLSearchParams(window.location.search);
    const hasOAuthToken = OAUTH_TOKEN_PARAMS.some((param) => params.has(param));

    // Allow processing again for future auth flows once oauth token is gone from URL.
    if (!hasOAuthToken) {
      tokenProcessedRef.current = false;
    }

    const isGuardedNullRetry =
      user === null &&
      !hasOAuthToken &&
      now - globalLastUserLoadAttemptAt < USER_NULL_RETRY_GUARD_MS;

    if (isGuardedNullRetry) {
      setIsLoading(false);
      return;
    }

    const shouldReloadUser =
      user === null ||
      hasOAuthToken ||
      now - lastLoadedAtRef.current > USER_REFRESH_COOLDOWN_MS;

    if (!shouldReloadUser) {
      setIsLoading(false);
      return;
    }

    const isSamePath = lastLoadedPathRef.current === pathname;
    const isRecentlyLoaded = now - lastLoadedAtRef.current < 1500;
    if (isSamePath && isRecentlyLoaded && !hasOAuthToken && user !== null) {
      setIsLoading(false);
      return;
    }

    lastLoadedPathRef.current = pathname;
    lastLoadedAtRef.current = now;
    globalLastUserLoadAttemptAt = now;

    let mounted = true;
    (async () => {
      setIsLoading(true);
      const oauthProcessed = await processOAuthTokenFromUrl();
      let loadedUser = await loadUser();

      // OAuth cookie may not be visible to immediate subsequent requests in some browsers.
      if (!loadedUser && oauthProcessed) {
        const retryDelaysMs = [250, 500, 1000];
        for (const delayMs of retryDelaysMs) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          loadedUser = await loadUser();
          if (loadedUser) {
            break;
          }
        }
      }

      if (mounted) setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [loadUser, pathname, processOAuthTokenFromUrl]);

  useEffect(() => {
    const refreshOnFocus = () => {
      const now = Date.now();
      if (now - lastLoadedAtRef.current < USER_REFRESH_COOLDOWN_MS) {
        return;
      }
      lastLoadedAtRef.current = now;
      void loadUser();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshOnFocus();
      }
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadUser]);

  const value = useMemo(
    () => ({ user, isLoading, loadUser, handleLogout, setUser }),
    [user, isLoading, loadUser, handleLogout, setUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
