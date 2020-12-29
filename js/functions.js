import { $, sleep, getCustomElement, openWindow, statusDialog } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import isPwned from 'https://cdn.kernvalley.us/js/std-js/haveIBeenPwned.js';
import md5 from 'https://cdn.kernvalley.us/js/std-js/md5.js';
import { uuidv6 } from 'https://cdn.kernvalley.us/js/std-js/uuid.js';
import { cookie, site } from './consts.js';

async function getToken() {
	return uuidv6();
}

function redirect(params = new URLSearchParams) {
	if (params.has('redirect')) {
		const url = new URL(params.get('redirect'));

		if (url.hostname.endsWith('.kernvalley.us') || url.hostname === 'kernvalley.us') {
			location.href = url;
		}
	}
}

async function setUserCookie({ uuid = uuidv6(), email }) {
	const data = { uuid, email, gravatar: md5(email), date: Date.now(), expires: Date.now() + cookie.maxAge };
	data.hash = md5(JSON.stringify(data));
	const value = btoa(JSON.stringify(data));
	return cookieStore.set({ value, ...cookie });
}

async function verifyToken({ token, email }) {
	return typeof token === 'string' && typeof email === 'string' && token.length !== 0 && email.length !== 0;
}

export function gravatar(email, { s = 94, d = 'mm' } = {}) {
	const url = new URL(`./${md5(email)}`, 'https://secure.gravatar.com/avatar/');
	url.searchParams.set('s', s);
	url.searchParams.set('d', d);
	return url.href;
}

const  supportsPasswordCredentials = ('credentials' in navigator && 'PasswordCredential' in window);

async function formHandler(form, params) {
	if (! (form instanceof HTMLFormElement)) {
		throw new DOMException('Expected form to be a <form>');
	}
	const dialog = form.closest('dialog');

	if (typeof params === 'object') {
		Object.entries(params).forEach(([name, value]) => {
			if (typeof value === 'string') {
				$(`[name="${name}"]`, form).each(input => {
					input.value = value;
					input.readOnly = true;
					input.dispatchEvent(new Event('change'));
					input.dispatchEvent(new Event('input'));
				});
			}
		});
	}

	return new Promise((resolve, reject) => {
		async function submitHandler(event) {
			event.preventDefault();
			const data = new FormData(this);

			if (data.has('password')) {
				const pwned = await isPwned(data.get('password'));

				if (pwned !== 0) {
					$('.error-message', this).text('That password may not be used as it was found in a known password leak. Please update your password wherever you have used it and enter a different password.').then(async $el => {
						$el.unhide();
						await sleep(30000);
						$el.text('');
						$el.hide();
					});

					$('a.reset-link', this).each(link => {
						const url = new URL(link.href);
						url.searchParams.set('email', data.get('email'));
						link.href = url.href;
						link.hidden = false;
					});

					this.querySelector('[name="password"]').focus();
				} else {
					resolve(Object.fromEntries(data.entries()));
					setTimeout(() => this.closest('dialog').close(), 100);
				}
			} else {
				resolve(Object.fromEntries(data.entries()));
				setTimeout(() => this.closest('dialog').close(), 100);
			}
		}

		function resetHandler() {
			this.closest('dialog').close();
			$('a.reset-link', this).hide();
		}

		form.addEventListener('submit', submitHandler);
		form.addEventListener('reset', resetHandler);

		dialog.addEventListener('close', () => {
			form.addEventListener('submit', submitHandler);
			form.addEventListener('reset', resetHandler);
			reject(new DOMException('User cancelled'));
		});

		dialog.showModal();
	});
}

async function getCredentials() {
	if (supportsPasswordCredentials) {
		const { id: email, password, name } = await navigator.credentials.get({ password: true });
		return { email, password, name };
	} else {
		return { email: null, password: null, name: null };
	}
}

async function storeCredentials({ name = null, email: id, password }) {
	if (supportsPasswordCredentials && typeof name === 'string' && typeof password === 'string') {
		const iconURL = gravatar(id);
		const creds = new PasswordCredential({ id, name, password, iconURL });
		navigator.credentials.store(creds);
	}
}

export async function loginHandler(params = new URLSearchParams(location.search)) {
	if (supportsPasswordCredentials) {
		try {
			const { email, password } = await getCredentials();

			if (typeof email === 'string' && typeof password === 'string') {
				return { email, password };
			} else {
				throw new DOMException('User rejected credentials or none available');
			}
		} catch(err) {
			console.error(err);
			const creds = await formHandler(document.forms.login, {
				email: params.get('email'),
			});
			storeCredentials(creds).catch(console.error);
			return creds;
		}
	} else {
		return await formHandler(document.forms.login, {
			email: params.get('email'),
		});
	}
}

export async function registerHandler() {
	const { name, email, password } = await formHandler(document.forms.register);
	storeCredentials({ name, email, password }).catch(console.error);

	return { name, email, password };
}

export async function changePasswordHandler(params = new URLSearchParams(location.search)) {
	const { email } = await formHandler(document.forms.changePassword, {
		email: params.get('email'),
	});
	return { email };
}

export async function changePassword(params = new URLSearchParams(location.search)) {
	const { email } = await changePasswordHandler(params);
	const HTMLNotificationElement = await getCustomElement('html-notification');

	new HTMLNotificationElement('Password reset email not sent', {
		body: `No email sent to ${email} since this is only a demo at this point`,
		image: gravatar(email),
		icon: '/img/favicon.svg',
		pattern: [300, 0, 300],
		requireInteraction: true,
		actions: [{
			title: 'Open Reset Linik',
			action: 'reset',
			icon: '/img/octicons/link.svg',
		}, {
			title: 'Dismiss',
			action: 'close',
			icon: '/img/octicons/x.svg',
		}],
		data: {
			action: 'reset',
			email,
			token: await getToken(),
		}
	}).addEventListener('notificationclick', async ({ action, target }) => {
		switch(action) {
			case 'reset':
				target.close();
				Promise.resolve(target.data).then(({ email, token, action }) => {
					const url = new URL(document.baseURI);
					url.searchParams.set('action', action);
					url.searchParams.set('token', token);
					url.searchParams.set('email', email);
					openWindow(url.href);
				});
				break;

			case 'dismiss':
				target.close();
				break;
		}
	});
}

export async function login(params = new URLSearchParams(location.search)) {
	const { email } = await loginHandler(params);
	setUserCookie({ email }).catch(console.error);
	const HTMLNotificationElement = await getCustomElement('html-notification');

	// $('.login-btn, .register-btn').disable();

	new HTMLNotificationElement('Welcome back', {
		body: 'No credentials were checked since this is just a demo for now',
		image: gravatar(email),
		icon: '/img/favicon.svg',
		pattern: [300, 0, 300],
	});

	redirect(params);
}

export async function register() {
	const { email, name } = await registerHandler();
	setUserCookie({ email }).catch(console.error);
	const HTMLNotificationElement = await getCustomElement('html-notification');

	// $('.login-btn, .register-btn').disable();

	new HTMLNotificationElement(`Welcome, ${name}`, {
		body: 'No account was created, as this is just a demo for now',
		image: gravatar(email),
		icon: '/img/favicon.svg',
		pattern: [300, 0, 300],
	});
}

export async function resetPassword(params = new URLSearchParams(location.search)) {
	if (await verifyToken({ email: params.get('email'), token: params.get('token')})) {
		$('#reset-avatar-container > *').remove();
		const avatar = await loadImage(gravatar(params.get('email')));
		avatar.classList.add('round');
		document.getElementById('reset-avatar-container').append(avatar);
		const { email } = await formHandler(document.forms.reset, {
			email: params.get('email'),
			token: params.get('token'),
		});
		const HTMLNotificationElement = await getCustomElement('html-notification');

		new HTMLNotificationElement('No password was updated', {
			body: 'This is just a demo for testing purposes',
			image: gravatar(email),
			icon: '/img/favicon.svg',
			pattern: [300, 0, 300],
		});

		document.title = `Login | ${site.title}`;

		await login(new URLSearchParams({ email }));

	} else {
		statusDialog('Cannot reset password without a valid token');
	}
}

export async function logout(params = new URLSearchParams(location.search)) {
	await cookieStore.delete({ name: cookie.name, domain: cookie.domain });
	redirect(params);
}
