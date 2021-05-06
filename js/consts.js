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

export const firebaseConfig = {
	apiKey: 'AIzaSyBzmFe7vL1x_Pq9BfNnhWwilYicXmHgcKU',
	authDomain: 'kernvalley-us.firebaseapp.com',
	databaseURL: 'https://kernvalley-us-default-rtdb.firebaseio.com',
	projectId: 'kernvalley-us',
	storageBucket: 'kernvalley-us.appspot.com',
	messagingSenderId: '689798221482',
	appId: '1:689798221482:web:9d9b1f311555a8579a4ad3',
	measurementId: 'G-CV2DW72WP7'
};
