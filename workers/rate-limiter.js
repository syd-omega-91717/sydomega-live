/**
 * Ω SYD OMEGA 91717 — RATE LIMITER WORKER
 * Cloudflare Worker for protecting platform against excessive API usage.
 *
 * Rate limit policy:
 * - IP-based: 1000 requests/minute per IP
 * - Member-based: 100 requests/minute per authenticated user
 * - Burst tolerance: 20 concurrent requests
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Skip rate limiting for non-API endpoints
    if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/.supabase/')) {
      return fetch(request);
    }

    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const authHeader = request.headers.get('Authorization');
    const memberId = authHeader ? extractMemberId(authHeader) : null;

    // Check rate limits
    const ipLimit = await checkRateLimit(env.RATE_LIMIT_STORE, `ip:${clientIP}`, 1000, 60);
    if (!ipLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded (IP)', retry_after: ipLimit.retryAfter }),
        {
          status: 429,
          headers: {
            'Retry-After': String(ipLimit.retryAfter),
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Member-level rate limit (stricter)
    if (memberId) {
      const memberLimit = await checkRateLimit(
        env.RATE_LIMIT_STORE,
        `member:${memberId}`,
        100,
        60
      );
      if (!memberLimit.allowed) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded (member)', retry_after: memberLimit.retryAfter }),
          {
            status: 429,
            headers: {
              'Retry-After': String(memberLimit.retryAfter),
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    // Burst protection (max 20 concurrent requests)
    const burstKey = `burst:${memberId || clientIP}`;
    const burstCount = await env.RATE_LIMIT_STORE.get(burstKey);
    const currentBurst = (burstCount ? parseInt(burstCount) : 0) + 1;

    if (currentBurst > 20) {
      return new Response(
        JSON.stringify({ error: 'Too many concurrent requests' }),
        { status: 503 }
      );
    }

    // Track concurrent request
    await env.RATE_LIMIT_STORE.put(burstKey, String(currentBurst), { expirationTtl: 5 });

    // Proceed with request
    const response = await fetch(request);

    // Decrement burst counter
    const finalBurst = currentBurst - 1;
    if (finalBurst > 0) {
      await env.RATE_LIMIT_STORE.put(burstKey, String(finalBurst), { expirationTtl: 5 });
    } else {
      await env.RATE_LIMIT_STORE.delete(burstKey);
    }

    return response;
  }
};

async function checkRateLimit(store, key, limit, windowSeconds) {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Retrieve current request count
  const data = await store.get(key);
  let requestData = data ? JSON.parse(data) : { requests: [], count: 0 };

  // Filter out old requests outside the window
  requestData.requests = requestData.requests.filter(ts => ts > windowStart);
  requestData.count = requestData.requests.length;

  // Check if limit exceeded
  if (requestData.count >= limit) {
    const oldestRequest = Math.min(...requestData.requests);
    const retryAfter = Math.ceil((oldestRequest + (windowSeconds * 1000) - now) / 1000);

    return {
      allowed: false,
      retryAfter: Math.max(1, retryAfter)
    };
  }

  // Increment counter
  requestData.requests.push(now);
  requestData.count = requestData.requests.length;

  // Store with TTL slightly longer than window
  await store.put(key, JSON.stringify(requestData), {
    expirationTtl: windowSeconds + 10
  });

  return {
    allowed: true,
    remaining: limit - requestData.count
  };
}

function extractMemberId(authHeader) {
  // Extract member ID from JWT Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null; // JWT sub claim contains user ID
  } catch (e) {
    return null;
  }
}
