import { registerCustomElement } from 'https://cdn.kernvalley.us/js/std-js/custom-elements.js';

const protectedData = new WeakMap();

registerCustomElement('firebase-sign-in', class HTMLFirebaseSignInElement extends HTMLElement {
	constructor(firebase) {
		super();
		protectedData.set(this, { firebase });
	}
});
