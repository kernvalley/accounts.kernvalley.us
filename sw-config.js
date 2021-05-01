/* eslint no-unused-vars: 0 */
/* eslint-env serviceworker */
const config = {
	version: '1.0.2',
	fresh: [
		'/',
		'https://apps.kernvalley.us/apps.json',
	].map(url => new URL(url, location.origin).href),
	stale: [
		'/js/index.min.js',
		// 'https://www.gstatic.com/firebasejs/8.3.1/firebase-app.js',
		// 'https://www.gstatic.com/firebasejs/8.3.1/firebase-auth.js',
		'/css/index.min.css',
		'/img/icons.svg',
		'https://cdn.kernvalley.us/components/toast-message.html',
		'https://cdn.kernvalley.us/components/toast-message.css',
		'https://cdn.kernvalley.us/components/github/user.html',
		'https://cdn.kernvalley.us/components/github/user.css',
		'https://cdn.kernvalley.us/img/keep-kern-clean.svg',
		'https://cdn.kernvalley.us/fonts/roboto.woff2',
	].map(path => new URL(path, location.origin).href),
	allowed: [
		/https:\/\/secure\.gravatar\.com\/avatar\/*/,
		/https:\/\/i\.imgur\.com\/*/,
		/https:\/\/api\.github\.com\/users\/*/,
		/https:\/\/*\.githubusercontent.com\/u\/*/,
	],
	allowedFresh: [
		/\.(js|css|html|json|jpg)$/,
	]
};
