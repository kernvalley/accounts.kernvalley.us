import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/js/std-js/theme-cookie.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/app/list-button.js';
import { uuidv6 } from 'https://cdn.kernvalley.us/js/std-js/uuid.js';
import { $, ready } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { init } from 'https://cdn.kernvalley.us/js/std-js/data-handlers.js';
import { loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import { GA } from './consts.js';
import{ login, logout, register, changePassword, gravatar, resetPassword, dialogError } from './functions.js';

$(document.documentElement).toggleClass(document.documentElement, {
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
	if (window.opener) {
		postMessage({ uuid: uuidv6() });
	}
	Promise.resolve(new URLSearchParams(location.search)).then(async params => {
		if (params.has('action')) {
			switch(params.get('action')) {
				case 'login':
					await login(params).catch(console.error);
					history.replaceState(history.state, document.title, '/');
					break;

				case 'register':
					await register(params).catch(console.error);
					history.replaceState(history.state, document.title, '/');
					break;

				case 'logout':
					await logout(params).catch(console.error);
					history.replaceState(history.state, document.title, '/');
					break;

				case 'changePassword':
					await changePassword(params).catch(console.error);
					history.replaceState(history.state, document.title, '/');
					break;

				case 'reset':
					await resetPassword(params).catch(console.error);
					history.replaceState(history.state, document.title, '/');
					break;

				default:
					await dialogError(`Unsupported action: ${params.get('action')}`);
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

	$('#login-btn').click(() => login());
	$('#register-btn').click(() => register());
	$('#change-password-btn').click(() => changePassword());
}).catch(console.error);
