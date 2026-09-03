/**
 * Phase D.2: Data Binding Framework
 * Provides reactive data binding between page elements and Supabase queries.
 * Enables declarative data fetching, automatic UI updates, and real-time
 * subscription handling.
 *
 * Binding modes:
 * - Static: One-time query, cache result
 * - Live: Real-time subscription with automatic UI sync
 * - Computed: Derive values from other bindings
 * - Remote: Computed on server via RPC
 *
 * Element selectors:
 * - data-bind-query: Bind to Supabase table/RPC
 * - data-bind-to: Target property (innerHTML, textContent, dataset.*, style.*)
 * - data-bind-template: Handle arrays (repeat element, set data attributes)
 * - data-bind-format: Apply formatter function to value
 */

(function(){
  if(window.OmegaDataBinding) return;

  var bindings = {};
  var subscriptions = [];

  var API = window.OmegaDataBinding = {
    /**
     * Create a data binding from element attributes
     */
    bind: function(element, config){
      config = config || {};
      var bindId = 'bind_' + Date.now() + '_' + Math.random().toString(36).slice(2);

      var binding = {
        id: bindId,
        element: element,
        query: config.query || element.getAttribute('data-bind-query'),
        target: config.target || element.getAttribute('data-bind-to') || 'innerHTML',
        template: config.template || element.getAttribute('data-bind-template'),
        formatter: config.formatter || getFormatter(element.getAttribute('data-bind-format')),
        mode: config.mode || 'static',
        cache: null,
        loading: false,
        error: null
      };

      if(binding.query){
        bindings[bindId] = binding;
        if(binding.mode === 'static' || binding.mode === 'computed'){
          API.fetch(bindId);
        } else if(binding.mode === 'live'){
          API.subscribe(bindId);
        }
      }

      return bindId;
    },

    /**
     * Fetch data for a binding
     */
    fetch: function(bindId){
      var binding = bindings[bindId];
      if(!binding) return Promise.reject('Binding not found');

      binding.loading = true;
      binding.error = null;
      updateLoadingState(binding);

      return executeQuery(binding).then(function(data){
        binding.cache = data;
        binding.loading = false;
        binding.error = null;
        updateLoadingState(binding);
        renderBinding(binding);
        return data;
      }).catch(function(err){
        binding.error = err;
        binding.loading = false;
        updateLoadingState(binding);
        return Promise.reject(err);
      });
    },

    /**
     * Subscribe to real-time updates for a binding
     */
    subscribe: function(bindId){
      var binding = bindings[bindId];
      if(!binding) return;

      // Initial fetch
      API.fetch(bindId).then(function(){
        // Set up real-time subscription if it's a table
        if(window.OmegaSB && binding.query.indexOf('rpc') === -1){
          var table = binding.query;
          var subscription = window.OmegaSB.sb
            .channel('public:' + table)
            .on('postgres_changes', { event: '*', schema: 'public', table: table }, function(payload){
              binding.cache = payload.new || payload.old;
              renderBinding(binding);
            })
            .subscribe();

          subscriptions.push({ binding: bindId, subscription: subscription });
        }
      });
    },

    /**
     * Update binding with new data
     */
    update: function(bindId, data){
      var binding = bindings[bindId];
      if(!binding) return;

      binding.cache = data;
      renderBinding(binding);
    },

    /**
     * Get cached data for a binding
     */
    getCached: function(bindId){
      var binding = bindings[bindId];
      return binding ? binding.cache : null;
    },

    /**
     * Unbind and cleanup
     */
    unbind: function(bindId){
      var binding = bindings[bindId];
      if(!binding) return;

      // Unsubscribe from real-time updates
      subscriptions = subscriptions.filter(function(sub){
        if(sub.binding === bindId){
          if(sub.subscription && sub.subscription.unsubscribe){
            sub.subscription.unsubscribe();
          }
          return false;
        }
        return true;
      });

      delete bindings[bindId];
    },

    /**
     * Get binding status
     */
    getStatus: function(bindId){
      var binding = bindings[bindId];
      if(!binding) return null;

      return {
        id: bindId,
        loading: binding.loading,
        error: binding.error,
        hasCached: binding.cache !== null,
        cached: binding.cache
      };
    },

    /**
     * Get all bindings for debug
     */
    debugBindings: function(){
      return Object.keys(bindings).map(function(key){
        return API.getStatus(key);
      });
    }
  };

  /**
   * Execute a query against Supabase
   */
  function executeQuery(binding){
    if(!window.OmegaSB) return Promise.reject('Supabase not initialized');

    var query = binding.query;
    var parts = query.split('?');
    var queryPart = parts[0];
    var filterPart = parts[1];

    if(queryPart.indexOf('rpc:') === 0){
      // RPC call
      var rpcName = queryPart.replace('rpc:', '');
      return window.OmegaSB.sb.rpc(rpcName, {}).then(function(response){
        if(response.error) throw response.error;
        return response.data;
      });
    } else {
      // Table query
      var tableQuery = window.OmegaSB.sb.from(queryPart).select('*');

      if(filterPart){
        // Parse filter: col1=val1&col2=val2&col1.gte=val3
        var pairs = filterPart.split('&');
        pairs.forEach(function(pair){
          var kv = pair.split('=');
          var key = kv[0];
          var val = decodeURIComponent(kv[1]);

          if(key.indexOf('.') > -1){
            var keyParts = key.split('.');
            var col = keyParts[0];
            var op = keyParts[1];
            if(op === 'eq') tableQuery = tableQuery.eq(col, val);
            else if(op === 'neq') tableQuery = tableQuery.neq(col, val);
            else if(op === 'gt') tableQuery = tableQuery.gt(col, val);
            else if(op === 'gte') tableQuery = tableQuery.gte(col, val);
            else if(op === 'lt') tableQuery = tableQuery.lt(col, val);
            else if(op === 'lte') tableQuery = tableQuery.lte(col, val);
            else if(op === 'like') tableQuery = tableQuery.like(col, val);
            else if(op === 'in') tableQuery = tableQuery.in(col, val.split(','));
          } else {
            tableQuery = tableQuery.eq(key, val);
          }
        });
      }

      return tableQuery.then(function(response){
        if(response.error) throw response.error;
        return response.data;
      });
    }
  }

  /**
   * Render binding result to DOM
   */
  function renderBinding(binding){
    if(!binding.element) return;

    var value = binding.cache;
    if(binding.formatter && typeof binding.formatter === 'function'){
      value = binding.formatter(value);
    }

    if(binding.template && Array.isArray(binding.cache)){
      // Template rendering for arrays
      renderTemplate(binding);
    } else if(binding.target === 'innerHTML'){
      binding.element.innerHTML = value || '';
    } else if(binding.target === 'textContent'){
      binding.element.textContent = value || '';
    } else if(binding.target.indexOf('dataset.') === 0){
      var dataKey = binding.target.replace('dataset.', '');
      binding.element.dataset[dataKey] = value || '';
    } else if(binding.target.indexOf('style.') === 0){
      var styleProp = binding.target.replace('style.', '');
      binding.element.style[styleProp] = value || '';
    } else {
      binding.element.setAttribute(binding.target, value || '');
    }
  }

  /**
   * Render array data using template
   */
  function renderTemplate(binding){
    if(!binding.template || !Array.isArray(binding.cache)) return;

    var container = binding.element;
    var template = document.getElementById(binding.template);
    if(!template) return;

    container.innerHTML = '';
    binding.cache.forEach(function(item, index){
      var clone = template.cloneNode(true);
      clone.removeAttribute('id');
      clone.style.display = '';

      // Set data attributes on clone
      Object.keys(item).forEach(function(key){
        clone.setAttribute('data-' + key, item[key]);
      });

      // Update text content of child elements with data-field attributes
      var fields = clone.querySelectorAll('[data-field]');
      fields.forEach(function(field){
        var fieldName = field.getAttribute('data-field');
        if(item[fieldName]){
          field.textContent = item[fieldName];
        }
      });

      container.appendChild(clone);
    });
  }

  /**
   * Update loading state styling
   */
  function updateLoadingState(binding){
    if(!binding.element) return;

    if(binding.loading){
      binding.element.classList.add('is-loading');
      binding.element.setAttribute('aria-busy', 'true');
    } else {
      binding.element.classList.remove('is-loading');
      binding.element.setAttribute('aria-busy', 'false');
    }

    if(binding.error){
      binding.element.classList.add('has-error');
      binding.element.setAttribute('data-error', binding.error.message || 'Error');
    } else {
      binding.element.classList.remove('has-error');
      binding.element.removeAttribute('data-error');
    }
  }

  /**
   * Get formatter function by name
   */
  function getFormatter(formatName){
    if(!formatName) return null;

    var formatters = {
      'uppercase': function(val){ return String(val).toUpperCase(); },
      'lowercase': function(val){ return String(val).toLowerCase(); },
      'currency': function(val){ return '$' + parseFloat(val).toFixed(2); },
      'percent': function(val){ return Math.round(val * 100) + '%'; },
      'date': function(val){ return new Date(val).toLocaleDateString(); },
      'time': function(val){ return new Date(val).toLocaleTimeString(); },
      'json': function(val){ return JSON.stringify(val, null, 2); }
    };

    return formatters[formatName] || null;
  }

  /**
   * Auto-bind elements on page load
   */
  function autoBindElements(){
    var elements = document.querySelectorAll('[data-bind-query]');
    elements.forEach(function(el){
      API.bind(el);
    });
  }

  document.addEventListener('DOMContentLoaded', autoBindElements);
  if(document.readyState !== 'loading') autoBindElements();
})();
