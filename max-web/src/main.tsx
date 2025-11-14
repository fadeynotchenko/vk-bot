import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MaxUI } from '@maxhub/max-ui'
import '@maxhub/max-ui/dist/styles.css'
import './styles.css'
import App from './App'
import { notifyMaxReady } from './utils/maxBridge'

// Уведомляем MAX, что приложение готово
// Скрипт max-web-app.js загружается синхронно в <head>, поэтому WebApp должен быть доступен
function initMaxBridge() {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.WebApp?.ready) {
    notifyMaxReady();
  } else {
    // Если WebApp еще не загружен, ждем события DOMContentLoaded или load
    const tryNotify = () => {
      if (window.WebApp?.ready) {
        notifyMaxReady();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryNotify);
    } else {
      // DOM уже загружен, пробуем сразу или через небольшую задержку
      setTimeout(tryNotify, 50);
    }
  }
}

initMaxBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MaxUI>
      <App />
    </MaxUI>
  </StrictMode>
)
