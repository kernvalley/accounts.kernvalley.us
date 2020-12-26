import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/js/std-js/theme-cookie.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/app/list-button.js';
import { $, ready } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { init } from 'https://cdn.kernvalley.us/js/std-js/data-handlers.js';
import { loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { HTMLNotificationElement } from 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import { GA } from './consts.js';
import{ loginHandler, registerHandler, gravatar } from './functions.js';

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

	$('.login-btn').click(() => loginHandler().then(({ email }) => {
		$('.login-btn, .register-btn').disable();
		new HTMLNotificationElement('Welcome back', {
			body: 'This is just a demo. No account really exists',
			image: gravatar(email),
			icon: '/img/favicon.svg',
			pattern: [300, 0, 300],
		});
	}, console.error));
	$('.register-btn').click(() => registerHandler().then(({ email, name }) => {
		$('.login-btn, .register-btn').disable();
		new HTMLNotificationElement(`Welcome, ${name}`, {
			body: 'No account was created, as this is just a demo for now',
			image: gravatar(email),
			icon: '/img/favicon.svg',
			pattern: [300, 0, 300],
		});
	}, console.error));
}).catch(console.error);
