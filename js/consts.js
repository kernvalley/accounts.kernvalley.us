export const debug = location.hostname.endsWith('.netlify.live');
export const domain = debug ? location.hostname : 'kernvalley.us';
export const GA = null;
