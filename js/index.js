import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/js/std-js/theme-cookie.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/app/list-button.js';
// import 'https://cdn.kernvalley.us/components/pwa/install.js';
// import 'https://cdn.kernvalley.us/components/app/stores.js';
import { statusDialog } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { $ } from 'https://cdn.kernvalley.us/js/std-js/esQuery.js';
import { ready } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { init } from 'https://cdn.kernvalley.us/js/std-js/data-handlers.js';
import 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import { GA, site, firebaseConfig } from './consts.js';
import{ login, logout, register, changePassword, resetPassword, getForm } from './functions.js';
window.getForm = getForm;

$(document.documentElement).toggleClass({
	'no-dialog': document.createElement('dialog') instanceof HTMLUnknownElement,
	'no-details': document.createElement('details') instanceof HTMLUnknownElement,
	'js': true,
	'no-js': false,
});

if (typeof GA === 'string') {
	requestIdleCallback(() => {
		importGa(GA).then(async ({ ga }) => {
			if (ga instanceof Function) {
				ga('create', GA, 'auto');
				ga('set', 'transport', 'beacon');
				ga('send', 'pageview');
			}

			await ready();

			$('a[rel~="external"]').click(externalHandler, { passive: true, capture: true });
			$('a[href^="tel:"]').click(telHandler, { passive: true, capture: true });
			$('a[href^="mailto:"]').click(mailtoHandler, { passive: true, capture: true });
		});
	});
}

Promise.allSettled([
	init(),
]).then(() => {
	firebase.initializeApp(firebaseConfig);
	Promise.resolve(new URLSearchParams(location.search)).then(async params => {
		if (params.has('action')) {
			switch(params.get('action')) {
				case 'login':
					document.title = `Login | ${site.title}`;
					await login(params).catch(console.error);
					document.title = site.title;
					history.replaceState(history.state, document.title, '/');
					break;

				case 'register':
					document.title = `Register | ${site.title}`;
					await register(params).catch(console.error);
					document.title = site.title;
					history.replaceState(history.state, document.title, '/');
					break;

				case 'logout':
					await logout(params).catch(console.error);
					history.replaceState(history.state, document.title, '/');
					break;

				case 'changePassword':
					document.title = `Change Passowrd | ${site.title}`;
					await changePassword(params).catch(console.error);
					document.title = site.title;
					history.replaceState(history.state, document.title, '/');
					break;

				case 'reset':
					document.title = `Reset Password | ${site.title}`;
					await resetPassword(params).catch(console.error);
					document.title = site.title;
					history.replaceState(history.state, document.title, '/');
					break;

				default:
					await statusDialog(`Unsupported action: ${params.get('action')}`);
					history.replaceState(history.state, document.title, '/');
			}
		}
	});

	$('#login-btn').click(async () => {
		document.title = `Login | ${site.title}`;
		await login().finally(() => document.title = site.title);
	});

	$('#register-btn').click(async () => {
		document.title = `Register | ${site.title}`;
		await register().finally(() => document.title = site.title);
	});

	$('#change-password-btn').click(async () => {
		document.title = `Change Password | ${site.title}`;
		await changePassword().finally(() => document.title = site.title);
	});
}).catch(console.error);
