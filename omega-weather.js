/* omega-weather.js -- the one place the platform turns an Open-Meteo reading into words, icons, coordinates and a request.
 *
 * Two pages used to carry their own copies of the weather-code table (the dashboard's daily brief and the pulse page), and the copies
 * disagreed with each other and with the service: each missed codes the API really sends, and the dashboard showed any code it did not
 * know as "CLEAR", so snow showers read as sunshine. This module is the only table. Pure functions, no DOM, no storage; the one network call
 * (fetchCurrent) sends only rounded coordinates to Open-Meteo and nothing else.
 *
 * Works as a browser global (window.OmegaWeather) and as a CommonJS module for node tests. */
(function (root) {
  'use strict';

  /* Every weather_code Open-Meteo documents (WMO 4677 subset), with a plain label and the monochrome glyph used across the platform. */
  var CODES = {
    0: ['Clear sky', '☀︎'], 1: ['Mainly clear', '☀︎'], 2: ['Partly cloudy', '⛅︎'], 3: ['Overcast', '☁︎'],
    45: ['Fog', '≋'], 48: ['Rime fog', '≋'],
    51: ['Light drizzle', '⌇'], 53: ['Drizzle', '☂'], 55: ['Dense drizzle', '☂'], 56: ['Light freezing drizzle', '❄︎'], 57: ['Freezing drizzle', '❄︎'],
    61: ['Light rain', '☂'], 63: ['Rain', '☂'], 65: ['Heavy rain', '☂'], 66: ['Light freezing rain', '❄︎'], 67: ['Freezing rain', '❄︎'],
    71: ['Light snow', '❄︎'], 73: ['Snow', '❄︎'], 75: ['Heavy snow', '❄︎'], 77: ['Snow grains', '❄︎'],
    80: ['Light showers', '⌇'], 81: ['Showers', '☂'], 82: ['Violent showers', '⛈︎'], 85: ['Light snow showers', '❄︎'], 86: ['Snow showers', '❄︎'],
    95: ['Thunderstorm', '⛈︎'], 96: ['Thunderstorm with slight hail', '⛈︎'], 99: ['Thunderstorm with heavy hail', '⛈︎']
  };
  var UNKNOWN = { text: 'Conditions unavailable', icon: '⊛', known: false };

  /* A code we do not know is never shown as fair weather. */
  function describe(code) {
    if (typeof code !== 'number' || !Object.prototype.hasOwnProperty.call(CODES, code)) return { code: code === undefined ? null : code, text: UNKNOWN.text, icon: UNKNOWN.icon, known: false };
    return { code: code, text: CODES[code][0], icon: CODES[code][1], known: true };
  }

  /* "40.7 N 74.0 W": the sign of a coordinate is the hemisphere, never part of the number. */
  function coords(lat, lon) {
    return Math.abs(lat).toFixed(1) + '°' + (lat >= 0 ? 'N' : 'S') + ' ' + Math.abs(lon).toFixed(1) + '°' + (lon >= 0 ? 'E' : 'W');
  }

  function url(lat, lon, opts) {
    opts = opts || {};
    return 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) +
      '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' + (opts.uv ? ',uv_index' : '') +
      '&temperature_unit=celsius&wind_speed_unit=kmh&timezone=' + encodeURIComponent(opts.tz || 'auto');
  }

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : null; }

  /* The reading, or null when the service did not give a usable temperature. A calm wind is 0, not missing. */
  function parse(json) {
    var c = json && json.current;
    if (!c || num(c.temperature_2m) === null) return null;
    return { temp: c.temperature_2m, humidity: num(c.relative_humidity_2m), wind: num(c.wind_speed_10m), uv: num(c.uv_index), code: num(c.weather_code) };
  }

  function tempText(t, digits) { return t === null || t === undefined ? '—' : (digits ? t.toFixed(digits) : String(Math.round(t))) + '°C'; }
  function windText(w) { return w === null || w === undefined ? '—' : String(Math.round(w)); }
  function humidityText(h) { return h === null || h === undefined ? '—' : String(Math.round(h)) + '%'; }

  /* One request. Rejects with a short Error on a network failure, a non-200, or a reply with no usable reading. */
  function fetchCurrent(lat, lon, opts) {
    return root.fetch(url(lat, lon, opts)).then(function (r) {
      if (!r.ok) throw new Error('Open-Meteo ' + r.status);
      return r.json();
    }).then(function (j) {
      var p = parse(j);
      if (!p) throw new Error('Open-Meteo returned no reading');
      return p;
    });
  }

  var api = { CODES: CODES, describe: describe, coords: coords, url: url, parse: parse, tempText: tempText, windText: windText, humidityText: humidityText, fetchCurrent: fetchCurrent };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OmegaWeather = api;
})(typeof window !== 'undefined' ? window : this);
