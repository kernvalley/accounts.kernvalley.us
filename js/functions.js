import { openWindow, statusDialog } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { on, attr, query } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { debounce } from 'https://cdn.kernvalley.us/js/std-js/events.js';
import { getDeferred } from 'https://cdn.kernvalley.us/js/std-js/promises.js';
import { getCustomElement } from 'https://cdn.kernvalley.us/js/std-js/custom-elements.js';
import { loadImage } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { pwned } from 'https://cdn.kernvalley.us/js/std-js/pwned.js';
import { md5 } from 'https://cdn.kernvalley.us/js/std-js/hash.js';
import { uuidv6 } from 'https://cdn.kernvalley.us/js/std-js/uuid.js';
import { getHTML } from 'https://cdn.kernvalley.us/js/std-js/http.js';
import { cookie, site } from './consts.js';

async function getToken() {
	return uuidv6();
}

export async function getForm(name, params = {}) {
	const frag = await getHTML(`/components/forms/${name}.html`);
	const { resolve, reject, promise } = getDeferred();
	const controller = new AbortController();
	const signal = controller.signal;
	const dialog = document.createElement('dialog');

	on(dialog, 'close', ({ target }) => target.remove());

	on(query('form', frag), {
		submit: event => {
			event.preventDefault();
			attr('button', { disabled: true }, { base: event.target });
			attr('input', { readonly: true }, { base: event.target });
			controller.abort();
			resolve(Object.fromEntries(new FormData(event.target)));
			event.target.closest('dialog').close();
		},
		reset: ({ target }) => {
			controller.abort();
			reject(new DOMException('User cancelled action'));
			const dialog = target.closest('dialog');
			if (dialog.animate instanceof Function) {
				dialog.animate([{
					opacity: 1,
				}, {
					opacity: 0,
				}], {
					duration: 600,
					easing: 'ease-in-out',
					fill: 'both'
				}).finished.then(() => dialog.close());
			} else {
				dialog.close();
			}
		}
	}, { signal });

	if (name === 'reset-password') {
		const img = await loadImage(await gravatar(params.email), { height: 94, width: 94 });
		img.classList.add('round');
		frag.getElementById('reset-avatar-container').append(img);
	}

	switch(name) {
		case 'login': {
			on(query('#login-email', frag), 'change', debounce(async ({ target }) => {
				const container = target.form.querySelector('#avatar-container');
				const grav = await loadImage(await gravatar(target.value), { width: 94, height: 94, alt: 'Gravatar' });
				grav.classList.add('round');
				container.replaceChildren(grav);
			}));
			break;
		}
		case 'register':
		case 'reset-password': {
			on(query('[type="password"]', frag), 'change', async ({ target }) => {
				if (await pwned(target.value)) {
					target.setCustomValidity('That password is insecure');
				} else {
					target.setCustomValidity('');
				}
			});
			break;
		}
	}

	dialog.append(frag);
	Object.entries(params).forEach(([name, value]) => {
		attr(`[name="${name}"]`, { value }, { base: dialog });
	});

	if (dialog.animate instanceof Function) {
		document.body.append(dialog);
		dialog.animate([{
			opacity: 0,
		}, {
			opacity: 1,
		}], {
			duration: 600,
			easing: 'ease-in-out',
		});
	}

	dialog.showModal();
	return promise;
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
	const data = { uuid, email, gravatar: await md5(email), date: Date.now(), expires: Date.now() + cookie.maxAge };
	data.hash = await md5(JSON.stringify(data));
	const value = btoa(JSON.stringify(data));
	return cookieStore.set({ value, ...cookie });
}

async function verifyToken({ token, email }) {
	return typeof token === 'string' && typeof email === 'string' && token.length !== 0 && email.length !== 0;
}

export async function gravatar(email, { s = 94, d = 'mm' } = {}) {
	const url = new URL(`./${await md5(email)}`, 'https://secure.gravatar.com/avatar/');
	url.searchParams.set('s', s);
	url.searchParams.set('d', d);
	return url.href;
}

const  supportsPasswordCredentials = ('credentials' in navigator && 'PasswordCredential' in window);

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
		const iconURL = await gravatar(id);
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
			const creds = await getForm('login', {
				email: params.get('email'),
			});
			storeCredentials(creds).catch(console.error);
			return creds;
		}
	} else {
		return await getForm('login', {
			email: params.get('email'),
		});
	}
}

export async function registerHandler() {
	const { name, email, password } = await getForm('register');
	storeCredentials({ name, email, password }).catch(console.error);

	return { name, email, password };
}

export async function changePasswordHandler(params = new URLSearchParams(location.search)) {
	const { email } = await getForm('change-password', {
		email: params.get('email'),
	});
	return { email };
}

export async function changePassword(params = new URLSearchParams(location.search)) {
	const { email } = await changePasswordHandler(params);
	const HTMLNotificationElement = await getCustomElement('html-notification');

	new HTMLNotificationElement('Password reset email not sent', {
		body: `No email sent to ${email} since this is only a demo at this point`,
		image: await gravatar(email),
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
	const { email, password } = await loginHandler(params);
	const user = await firebase.auth().signInWithEmailAndPassword(email, password);
	console.log({ user });
	setUserCookie({ email }).catch(console.error);
	const HTMLNotificationElement = await getCustomElement('html-notification');

	// $('.login-btn, .register-btn').disable();

	new HTMLNotificationElement('Welcome back', {
		body: 'No credentials were checked since this is just a demo for now',
		image: await gravatar(email),
		icon: '/img/favicon.svg',
		pattern: [300, 0, 300],
	});

	redirect(params);
}

export async function register() {
	const { email, name, password } = await registerHandler();
	const user = await firebase.auth().createUserWithEmailAndPassword(email, password);
	await user.updateProfile({
		photoUrl: await gravatar(email),
		displayName: name,
	});
	console.log({ user });
	setUserCookie({ email }).catch(console.error);
	const HTMLNotificationElement = await getCustomElement('html-notification');

	// $('.login-btn, .register-btn').disable();

	new HTMLNotificationElement(`Welcome, ${name}`, {
		body: 'No account was created, as this is just a demo for now',
		image: await gravatar(email),
		icon: '/img/favicon.svg',
		pattern: [300, 0, 300],
	});
}

export async function resetPassword(params = new URLSearchParams(location.search)) {
	if (await verifyToken({ email: params.get('email'), token: params.get('token')})) {
		const { email } = await getForm('reset-password', {
			email: params.get('email'),
			token: params.get('token'),
		});

		const HTMLNotificationElement = await getCustomElement('html-notification');

		new HTMLNotificationElement('No password was updated', {
			body: 'This is just a demo for testing purposes',
			image: await gravatar(email),
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
