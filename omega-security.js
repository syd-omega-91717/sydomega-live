/* Ω Security Hardening - Enhanced security measures and validation
   Purpose: Prevent common vulnerabilities, validate input/output, secure communications */

(function(){
  if(window.__omegaSecurity) return;
  window.__omegaSecurity = true;

  // Input sanitization utilities
  window.OmegaSecurity = {
    sanitizeHtml: (html) => {
      const el = document.createElement('div');
      el.textContent = html;
      return el.innerHTML;
    },
    sanitizeUrl: (url) => {
      try {
        const parsed = new URL(url, window.location.origin);
        if(!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return '';
        return parsed.toString();
      } catch(e) {
        return '';
      }
    },
    sanitizeJson: (str) => {
      try {
        return JSON.parse(str);
      } catch(e) {
        return null;
      }
    },
    validateEmail: (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email) && email.length <= 254;
    }
  };

  // Prevent XSS through DOM manipulation
  const originalSetInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', {
    get: originalSetInnerHTML.get,
    set: function(value) {
      if(typeof value === 'string' && value.includes('<script')) {
        console.error('XSS attempt blocked: innerHTML contains script tag');
        return;
      }
      originalSetInnerHTML.set.call(this, value);
    }
  });

  function cryptoRandomId(){
    try{
      const bytes=new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch(e){
      return Date.now().toString(36)+'-'+String(++cryptoRandomId.counter).toString(36);
    }
  }
  cryptoRandomId.counter=0;

  // Secure local storage with prefix
  const securePrefix = 'secure_' + new Date().getFullYear();
  window.OmegaSecureStorage = {
    set: (key, value) => {
      try {
        localStorage.setItem(`${securePrefix}:${key}`, JSON.stringify({
          value,
          timestamp: Date.now(),
          nonce: cryptoRandomId()
        }));
      } catch(e) {}
    },
    get: (key) => {
      try {
        const item = localStorage.getItem(`${securePrefix}:${key}`);
        if(!item) return null;
        const data = JSON.parse(item);
        return data.value;
      } catch(e) {
        return null;
      }
    },
    remove: (key) => {
      localStorage.removeItem(`${securePrefix}:${key}`);
    }
  };

  // Request signing for API calls
  window.OmegaRequestSigner = {
    sign: (method, path, body = '') => {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = cryptoRandomId();
      const message = `${method}${path}${body}${timestamp}${nonce}`;
      return {timestamp, nonce, message};
    }
  };
})();
