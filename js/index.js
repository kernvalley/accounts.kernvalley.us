import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/js/std-js/theme-cookie.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/app/list-button.js';
// import 'https://cdn.kernvalley.us/components/pwa/install.js';
// import 'https://cdn.kernvalley.us/components/app/stores.js';
import { $, ready, statusDialog } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { init } from 'https://cdn.kernvalley.us/js/std-js/data-handlers.js';
import { loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import { GA, site } from './consts.js';
import{ login, logout, register, changePassword, gravatar, resetPassword } from './functions.js';

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

	$('#login-email').debounce('input', async ({ target }) => {
		if (target.validity.valid && target.value !== '') {
			const avatar = await loadImage(gravatar(target.value, { s: 150 }));
			avatar.classList.add('round');
			avatar.id = 'user-avatar';
			document.getElementById('default-avatar').setAttribute('hidden', '');
			$(`#${avatar.id}`).remove();
			document.getElementById('avatar-container').append(avatar);
		} else if (target.value === '') {
			$('#user-avatar').remove();
			document.getElementById('default-avatar').removeAttribute('hidden');
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
