/* Sovereign Command Core — local clock; display-only, no privileged state. */
(function () {
  'use strict';

  var time = document.getElementById('sc-time');
  var date = document.getElementById('sc-date');
  if (!time || !date) return;

  var clockFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  var dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  function tick() {
    var now = new Date();
    time.textContent = clockFormatter.format(now);
    date.textContent = dateFormatter.format(now).toUpperCase();
  }

  tick();
  var timer = window.setInterval(tick, 1000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      window.clearInterval(timer);
      timer = null;
      return;
    }
    tick();
    if (timer === null) timer = window.setInterval(tick, 1000);
  });
})();
