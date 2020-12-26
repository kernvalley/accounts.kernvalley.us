import md5 from 'https://cdn.kernvalley.us/js/std-js/md5.js';

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
		function submitHandler(event) {
			event.preventDefault();
			const data = new FormData(this);
			this.removeEventListener('submit', submitHandler);
			this.removeEventListener('reset', resetHandler);
			this.closest('dialog').close();
			resolve(Object.fromEntries(data.entries()));
			this.reset();
		}

		function resetHandler() {
			this.removeEventListener('submit', submitHandler);
			this.removeEventListener('reset', resetHandler);
			this.closest('dialog').close();
			reject(new DOMException('User cancelled'));
		}

		form.addEventListener('submit', submitHandler);
		form.addEventListener('reset', resetHandler);

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
	const creds = await formHandler(document.forms.register);
	storeCredentials(creds).catch(console.error);
	return creds;
}
