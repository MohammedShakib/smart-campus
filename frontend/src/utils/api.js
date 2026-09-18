export function api(path, options = {}) {
  return fetch(path, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  }).then(async (response) => {
    if (response.redirected && response.url.includes('/login')) throw new Error('SESSION_REQUIRED');
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const payload = text && contentType.includes('application/json') ? JSON.parse(text) : null;
    if (response.status === 401 || payload?.message === 'SESSION_REQUIRED') throw new Error('SESSION_REQUIRED');
    if (response.status === 403 || payload?.message === 'FORBIDDEN') throw new Error('FORBIDDEN');
    if (text && !payload) throw new Error(response.ok ? 'Unexpected server response' : 'Request failed');
    if (!response.ok) throw new Error(payload?.message || payload?.error || 'Request failed');
    if (payload?.success === false) throw new Error(payload.message || 'Request failed');
    return payload;
  });
}

export function postAction(path, reload) {
  fetch(path, { method: 'POST', credentials: 'same-origin' })
    .then((res) => res.json())
    .then((res) => { alert(res.message); if (reload) reload(); })
    .catch((err) => alert(err.message));
}
