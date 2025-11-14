const API = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8788';

type OnAppCloseResponse =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Отправляет событие закрытия мини-приложения на сервер
 */
export async function notifyAppClose(userId: number, useBeacon: boolean = true): Promise<void> {
  console.log(`📱 Notifying server about app close for user ${userId} (useBeacon: ${useBeacon})`);

  const payload = {
    user_id: userId,
  };

  const url = `${API}/on-app-close`;

  if (useBeacon && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    const sendBeacon = navigator.sendBeacon as ((url: string, data: FormData | Blob) => boolean) | undefined;
    
    if (sendBeacon) {
      try {
        const formData = new FormData();
        formData.append('user_id', userId.toString());
        
        const sent = sendBeacon(url, formData);
        
        if (sent) {
          console.log(`✅ App close notification sent via sendBeacon (FormData) for user ${userId}`);
          return;
        } else {
          console.warn(`⚠️ sendBeacon (FormData) returned false for user ${userId}, trying Blob`);
        }
      } catch (error) {
        console.error(`❌ sendBeacon (FormData) error for user ${userId}:`, error);
      }

      try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const sent = sendBeacon(url, blob);
        
        if (sent) {
          console.log(`✅ App close notification sent via sendBeacon (Blob/JSON) for user ${userId}`);
          return;
        } else {
          console.warn(`⚠️ sendBeacon (Blob) returned false for user ${userId}, falling back to fetch`);
        }
      } catch (error) {
        console.error(`❌ sendBeacon (Blob) error for user ${userId}:`, error);
      }
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    console.log(`✅ App close notification sent via fetch (keepalive) for user ${userId}`);
    
    if (response.ok) {
      response.json().then((result: unknown) => {
        const typedResult = result as OnAppCloseResponse;
        if (!typedResult.ok) {
          console.error(`❌ Server returned error for app close: ${typedResult.error}`);
        }
      }).catch(() => {
      });
    }
  } catch (error) {
    console.error(`❌ Failed to notify app close for user ${userId}:`, error);
  }
}

