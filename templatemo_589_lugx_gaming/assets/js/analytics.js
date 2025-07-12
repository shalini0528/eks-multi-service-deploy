(function () {
  // Polyfill UUID generator for all browsers
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

  const sendEvent = (eventType, data = {}) => {
    fetch('http://ae2098f8d4e284d408d7cab2e17cf26e-356597941.us-east-1.elb.amazonaws.com/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_time: new Date().toISOString(),
        session_id: sessionId,
        event_type: eventType,
        page_url: window.location.pathname,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        ip_address: null,
        ...data
      })
    }).catch(err => console.error('Analytics send failed', err));
  };

  // Track page view
  sendEvent('page_view');

  // Track clicks
  document.addEventListener('click', (e) => {
    const tag = e.target.tagName;
    const id = e.target.id ? `#${e.target.id}` : '';
    const className = e.target.className ? `.${e.target.className.split(' ').join('.')}` : '';
    const clickTarget = `${tag}${id}${className}`;
    sendEvent('click', { click_target: clickTarget });
  });

  // Track scroll + time before unload
  window.addEventListener('beforeunload', () => {
    const scrollDepth = Math.min(
      100,
      Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100)
    );
    const pageTimeSeconds = Math.round((Date.now() - startTime) / 1000);
    const previousSessionTime = sessionStorage.getItem('session_time') || 0;
    const newSessionTime = parseInt(previousSessionTime) + pageTimeSeconds;
    sessionStorage.setItem('session_time', newSessionTime);

    sendEvent('scroll', {
      scroll_depth: scrollDepth,
      page_time_seconds: pageTimeSeconds,
      session_time: newSessionTime
    });
  });
})();
