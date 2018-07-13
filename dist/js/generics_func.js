if (!window.browserSupported) {
	document.getElementById("unsupported-browser").style.display = "block";
}

const allScreens = [
	"screen-about",
	"screen-generate",
	"screen-encrypt",
	"screen-decrypt",
];
const showScreen = active => {
	for (let name of allScreens) {
		const element = document.getElementById(name);
		if (element) {
			if (active === name) {
				element.classList.remove("screen-inactive");
				element.classList.add("screen-active");
			} else {
				element.classList.remove("screen-active");
				element.classList.add("screen-inactive");
			}
		}
	}
	return true;
}

document.querySelector('#aboutScreen').addEventListener('click', () => {
	showScreen('screen-about')
})

document.querySelector('#generateKeypair').addEventListener('click', () => {
	checkCryptoSupport()
	showScreen('screen-generate')
	generateKeypair()
		.then(result => {
			document.getElementById("public-key").value = JSON.stringify(result.publicKey, null, "    ");
			document.getElementById("private-key").value = JSON.stringify(result.privateKey, null, "    ");
		})
})

document.querySelector('#encryptMesage').addEventListener('click', () => {
	checkCryptoSupport()
	showScreen('screen-encrypt')
})

document.querySelector('#decryptMesage').addEventListener('click', () => {
	checkCryptoSupport()
	showScreen('screen-decrypt')
})

document.querySelector('#encrypt').addEventListener('click', () => {
	encryptMesage(document.getElementById("encrypt-public-key").value, document.getElementById("encrypt-input").value)
		.then(result => document.getElementById("encrypt-output").value = result)
})

document.querySelector('#decrypt').addEventListener('click', () => {
	decryptMesage(document.getElementById("decrypt-private-key").value, document.getElementById("decrypt-input").value)
		.then(result => document.getElementById("decrypt-output").value = result)
})