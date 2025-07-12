(function () {
  // UUID generator for event/session IDs
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

  const sendEvent = (eventType, data = {}) => {
    const timestamp = new Date().toISOString();

    const payload = {
      id: generateUUID(),
      event_type: eventType,
      page_url: pageUrl,
      timestamp: timestamp,
      session_id: sessionId,
      click_target: null,
      scroll_depth: null,
      page_time_seconds: null,
      session_duration: null,
      user_agent: navigator.userAgent || null,
      ...data
    };

    fetch('http://ae2098f8d4e284d408d7cab2e17cf26e-356597941.us-east-1.elb.amazonaws.com/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Analytics send failed', err));
  };

  // Guard: prevent double firing page_view
  if (!sessionStorage.getItem('page_view_sent')) {
    sendEvent('page_view');
    sessionStorage.setItem('page_view_sent', 'true');
  }

  // Track clicks
  document.addEventListener('click', (e) => {
    const tag = e.target.tagName;
    const id = e.target.id ? `#${e.target.id}` : '';
    const className = e.target.className ? `.${e.target.className.split(' ').join('.')}` : '';
    const clickTarget = `${tag}${id}${className}`;
    sendEvent('click', { click_target: clickTarget });
  });

  // Track scroll + session duration
  window.addEventListener('beforeunload', () => {
    const scrollDepth = Math.min(
      100,
      Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100)
    );

    const pageTimeSeconds = Math.round((Date.now() - startTime) / 1000);
    const previousSessionTime = parseInt(sessionStorage.getItem('session_time') || 0, 10);
    const newSessionTime = previousSessionTime + pageTimeSeconds;
    sessionStorage.setItem('session_time', newSessionTime);

    sendEvent('scroll', {
      scroll_depth: scrollDepth,
      page_time_seconds: pageTimeSeconds,
      session_duration: newSessionTime
    });

    // Clear page view flag to allow new one on reload
    sessionStorage.removeItem('page_view_sent');
  });
})();
