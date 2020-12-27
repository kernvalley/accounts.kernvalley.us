export const debug = ! (location.hostname.endsWith('.kernvalley.us') || location.hostname === 'kernvalley.us');
export const domain = debug ? location.hostname : 'kernvalley.us';
export const GA = null;
