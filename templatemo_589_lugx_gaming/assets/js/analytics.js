(function () {
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const startTime = Date.now();
  const sessionId = sessionStorage.getItem('session_id') || generateUUID();
  sessionStorage.setItem('session_id', sessionId);

  const pageUrl = window.location.pathname;
  const lastTrackedPage = sessionStorage.getItem('last_tracked_page_url');
  let scrollEventSent = false;

  const sendEvent = (eventType, data = {}) => {
    const payload = {
      id: generateUUID(),
      event_type: eventType,
      page_url: pageUrl,
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      click_target: null,
      scroll_depth: null,
      page_time_seconds: null,
      session_duration: null,
      user_agent: navigator.userAgent || null,
      ...data
    };

    fetch('http://acf34815464fb47d18ae1235d9eb010c-d038243ad85b06ab.elb.eu-north-1.amazonaws.com/analytics-service/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Analytics send failed', err));
  };

  // Page view
  if (lastTrackedPage !== pageUrl) {
    sendEvent('page_view');
    sessionStorage.setItem('last_tracked_page_url', pageUrl);
  }

  // Clicks
  document.addEventListener('click', (e) => {
    const tag = e.target.tagName;
    const id = e.target.id ? `#${e.target.id}` : '';
    const className = e.target.className ? `.${e.target.className.split(' ').join('.')}` : '';
    const clickTarget = `${tag}${id}${className}`.replace(/\.+$/, '');
    sendEvent('click', { click_target: clickTarget });
  });

  // Scroll to bottom detection
  window.addEventListener('scroll', () => {
    if (scrollEventSent) return;

    const scrollTop = window.scrollY;
    const winHeight = window.innerHeight;
    const docHeight = document.body.scrollHeight;

    const scrollDepth = Math.min(100, Math.round(((scrollTop + winHeight) / docHeight) * 100));

    if (scrollDepth >= 90) {
      const pageTimeSeconds = Math.round((Date.now() - startTime) / 1000);
      const previousSession = parseInt(sessionStorage.getItem('session_time') || '0', 10);
      const sessionDuration = previousSession + pageTimeSeconds;
      sessionStorage.setItem('session_time', sessionDuration);

      sendEvent('scroll', {
        scroll_depth: scrollDepth,
        page_time_seconds: pageTimeSeconds,
        session_duration: sessionDuration
      });

      scrollEventSent = true;
    }
  });
})();
