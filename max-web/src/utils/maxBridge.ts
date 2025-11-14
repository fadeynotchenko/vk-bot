/**
 * Утилиты для работы с MAX Bridge API
 * Документация: https://dev.max.ru/docs/webapps/bridge
 */

declare global {
  interface Window {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          id: number;
          first_name: string;
          last_name: string;
          username?: string;
          language_code?: string;
          photo_url?: string;
        };
        query_id?: string;
        auth_date?: number;
        hash?: string;
      };
      version?: string;
      platform?: string;
      ready: () => void;
      close: () => void;
      onEvent: (eventName: string, callback: (data: any) => void) => void;
      offEvent: (eventName: string, callback: (data: any) => void) => void;
    };
  }
}

export interface MaxUser {
  id: number;
  firstName: string;
  lastName: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
}

/**
 * Получает данные пользователя из MAX Bridge
 * @returns Данные пользователя или null, если недоступны
 */
export function getMaxUser(): MaxUser | null {
  const webApp = window.WebApp;
  if (!webApp?.initDataUnsafe?.user) {
    return null;
  }

  const user = webApp.initDataUnsafe.user;
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    languageCode: user.language_code,
    photoUrl: user.photo_url,
  };
}

/**
 * Получает полное имя пользователя
 */
export function getUserFullName(user: MaxUser | null): string {
  if (!user) {
    return 'Пользователь';
  }
  return `${user.firstName} ${user.lastName}`.trim() || 'Пользователь';
}

/**
 * Получает инициалы пользователя для аватара
 */
export function getUserInitials(user: MaxUser | null): string {
  if (!user) {
    return '?';
  }
  const first = user.firstName?.[0]?.toUpperCase() || '';
  const last = user.lastName?.[0]?.toUpperCase() || '';
  return (first + last) || '?';
}

/**
 * Уведомляет MAX, что мини-приложение готово к работе
 */
export function notifyMaxReady(): void {
  if (window.WebApp?.ready) {
    window.WebApp.ready();
  }
}

/**
 * Проверяет, доступен ли MAX Bridge
 */
export function isMaxBridgeAvailable(): boolean {
  return typeof window.WebApp !== 'undefined';
}

/**
 * Подписывается на событие закрытия мини-приложения
 */
export function onAppClose(callback: () => void): () => void {
  let lastCallTime = 0;
  const CALL_THROTTLE_MS = 1000;
  let isClosing = false;
  
  const callOnce = () => {
    if (isClosing) {
      console.log('⚠️ App close callback already called, skipping duplicate call');
      return;
    }
    
    const now = Date.now();
    if (now - lastCallTime < CALL_THROTTLE_MS) {
      console.log(`⚠️ App close callback called too soon (${now - lastCallTime}ms ago), skipping duplicate call`);
      return;
    }
    lastCallTime = now;
    isClosing = true;
    console.log('📱 Calling app close callback');
    try {
      callback();
    } catch (error) {
      console.error('❌ Error in app close callback:', error);
      isClosing = false;
      lastCallTime = 0;
    }
  };

  const cleanupFunctions: Array<() => void> = [];

  if (window.WebApp?.onEvent) {
    const handleBackButton = () => {
      console.log('📱 App close event detected (backButtonClicked)');
      callOnce();
    };

    try {
      window.WebApp.onEvent('backButtonClicked', handleBackButton);
      console.log('✅ Subscribed to backButtonClicked event (critical for mobile)');
      cleanupFunctions.push(() => {
        if (window.WebApp?.offEvent) {
          window.WebApp.offEvent('backButtonClicked', handleBackButton);
          console.log('🔕 Unsubscribed from backButtonClicked event');
        }
      });
    } catch (error) {
      console.error('❌ Failed to subscribe to backButtonClicked event:', error);
    }

    const handleViewportChanged = (data: any) => {
      console.log('🔔 viewportChanged event received:', data);
      if (data?.isStateVisible === false || data?.isExpanded === false) {
        console.log('📱 App close event detected (viewportChanged with isStateVisible: false or isExpanded: false)');
        callOnce();
      }
    };

    try {
      window.WebApp.onEvent('viewportChanged', handleViewportChanged);
      console.log('✅ Subscribed to viewportChanged event');
      cleanupFunctions.push(() => {
        if (window.WebApp?.offEvent) {
          window.WebApp.offEvent('viewportChanged', handleViewportChanged);
          console.log('🔕 Unsubscribed from viewportChanged event');
        }
      });
    } catch (error) {
      console.error('❌ Failed to subscribe to viewportChanged event:', error);
    }
  } else {
    console.warn('⚠️ MAX Bridge onEvent is not available, using browser events only');
  }

  const handlePageHide = (event: PageTransitionEvent) => {
    if (!event.persisted) {
      console.log('📱 App close event detected (pagehide, not persisted)');
      callOnce();
    } else {
      console.log('📱 Page hidden but persisted (likely cached), not treating as close');
    }
  };
  window.addEventListener('pagehide', handlePageHide, { capture: true });
  cleanupFunctions.push(() => {
    window.removeEventListener('pagehide', handlePageHide, { capture: true });
  });

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      console.log('📱 App close event detected (visibilitychange: hidden)');
      callOnce();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange, { capture: true });
  cleanupFunctions.push(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange, { capture: true });
  });

  const handleBeforeUnload = () => {
    console.log('📱 App close event detected (beforeunload)');
    callOnce();
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  cleanupFunctions.push(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  return () => {
    console.log('🔕 Cleaning up app close handlers');
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

