export function registerSmartCampusPwa() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {
      // PWA support should never block the campus dashboard.
    });
  });
}

export function isStandaloneApp() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
