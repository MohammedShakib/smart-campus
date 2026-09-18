export function readUrlOption(paramName, allowedValues, fallback) {
  const requestedValue = new URLSearchParams(window.location.search).get(paramName);
  return allowedValues.includes(requestedValue) ? requestedValue : fallback;
}

export function writeUrlOption(paramName, value, fallback) {
  const params = new URLSearchParams(window.location.search);
  if (value === fallback) {
    params.delete(paramName);
  } else {
    params.set(paramName, value);
  }

  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);
}
