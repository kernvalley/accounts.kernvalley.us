import { YEARS } from 'https://cdn.kernvalley.us/js/std-js/timeIntervals.js';
export const env = (location.hostname === 'localhost' || location.hostname.endsWith('.netlify.live'))
	? 'development'
	: 'production';
export const debug = env === 'development';
export const GA = null;

export const site = {
	title: 'KernValley.US Accounts',
};

export const cookie = {
	name: 'kv-user',
	domain: debug ? location.hostname : 'kernvalley.us',
	secure: true,
	sameSite: 'strict',
	maxAge: 2 * YEARS,
};
