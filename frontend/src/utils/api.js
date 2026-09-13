export function api(path, options = {}) {
  return fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  }).then(async (response) => {
    if (response.status === 401 || response.status === 403) throw new Error('SESSION_REQUIRED');
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
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
