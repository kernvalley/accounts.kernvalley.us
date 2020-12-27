import { $, sleep, getCustomElement, openWindow } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import isPwned from 'https://cdn.kernvalley.us/js/std-js/haveIBeenPwned.js';
import md5 from 'https://cdn.kernvalley.us/js/std-js/md5.js';
import { uuidv6 } from 'https://cdn.kernvalley.us/js/std-js/uuid.js';

export function gravatar(email, { s = 94, d = 'mm' } = {}) {
	const url = new URL(`./${md5(email)}`, 'https://secure.gravatar.com/avatar/');
	url.searchParams.set('s', s);
	url.searchParams.set('d', d);
	return url.href;
	// https://secure.gravatar.com/avatar/43578597e449298f5488c2407c8a8ae5?s=256&d=mm
}

const  supportsPasswordCredentials = ('credentials' in navigator && 'PasswordCredential' in window);

async function formHandler(form) {
	const dialog = form.closest('dialog');

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
					$('.reset-link', this).unhide();
					this.querySelector('[name="password"]').focus();
				} else {
					resolve(Object.fromEntries(data.entries()));
					this.closest('dialog').close();
				}
			} else {
				resolve(Object.fromEntries(data.entries()));
				this.closest('dialog').close();
			}
		}

		function resetHandler() {
			this.closest('dialog').close();
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

export async function loginHandler() {
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
			const creds = await formHandler(document.forms.login);
			storeCredentials(creds).catch(console.error);
			return creds;
		}
	} else {
		return await formHandler(document.forms.login);
	}
}

export async function registerHandler() {
	const { name, email, password } = await formHandler(document.forms.register);

	storeCredentials({ name, email, password }).catch(console.error);
	return { name, email, password };
}

export async function changePasswordHandler() {
	const { email } = await formHandler(document.forms.changePassword);
	return { email };
}

export async function changePassword() {
	const { email } = await changePasswordHandler();
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
			token: uuidv6(),
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

export async function login() {
	const { email } = await loginHandler();
	const HTMLNotificationElement = await getCustomElement('html-notification');

	// $('.login-btn, .register-btn').disable();

	new HTMLNotificationElement('Welcome back', {
		body: 'No credentials were checked since this is just a demo for now',
		image: gravatar(email),
		icon: '/img/favicon.svg',
		pattern: [300, 0, 300],
	});
}

export async function register() {
	const { email, name } = await registerHandler();
	const HTMLNotificationElement = await getCustomElement('html-notification');

	// $('.login-btn, .register-btn').disable();

	new HTMLNotificationElement(`Welcome, ${name}`, {
		body: 'No account was created, as this is just a demo for now',
		image: gravatar(email),
		icon: '/img/favicon.svg',
		pattern: [300, 0, 300],
	});
}

export async function resetPassword(params) {
	if (params.has('token') && params.has('email')) {
		$('[name="token"]', document.forms.reset).value(params.get('token'));
		$('[name="email"]', document.forms.reset).value(params.get('email'));
		$('#reset-avatar-container > *').remove();
		const avatar = await loadImage(gravatar(params.get('email')));
		avatar.classList.add('round');
		document.getElementById('reset-avatar-container').append(avatar);
		const { password, email, token } = await formHandler(document.forms.reset);
		const HTMLNotificationElement = await getCustomElement('html-notification');
		console.info({ password, email, token });

		new HTMLNotificationElement('No password was updated', {
			body: 'This is just a demo for testing purposes',
			image: gravatar(email),
			icon: '/img/favicon.svg',
			pattern: [300, 0, 300],
		});

	} else {
		const dialog = document.createElement('dialog');
		dialog.classList.add('status-box', 'alert');
		dialog.textContent = 'Cannot reset password without a valid token';
		dialog.addEventListener('close', ({ target }) => target.remove());
		history.replaceState(history.state, document.title, '/');
		document.body.append(dialog);
		dialog.showModal();
		await sleep(10000);
		dialog.close();
	}
}
