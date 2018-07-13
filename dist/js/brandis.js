"use strict"

const fromBase64 = str => {
	const bin = atob(str)
	const buf = new ArrayBuffer(bin.length)
	const bytes = new Uint8Array(buf)
	for (const i in bin)
		bytes[i] = bin.charCodeAt(i)
	return buf
}

const toBase64 = buf => {
	const chars = []
	const bytes = new Uint8Array(buf)
	for (const i in bytes)
		chars[i] = String.fromCharCode(bytes[i])
	return btoa(chars.join(""))
}

const stringToArrayBufferUTF16 = str => {
	const buf = new ArrayBuffer(str.length * 2)
	const view = new Uint16Array(buf)
	for (const i in str)
		view[i] = str.charCodeAt(i)
	return buf
}

const arrayBufferToStringUTF16 = plaintext => {
	const dec16 = new Uint16Array(plaintext)
	let decstr = ""
	for (const i in dec16)
		decstr += String.fromCharCode(dec16[i])
	return decstr
}

const joinBuffers = buffers => {
	let totalInputLength = 0
	for (const inputBuf of buffers)
		totalInputLength += inputBuf.byteLength
	const joinedBuffer = new ArrayBuffer(totalInputLength)
	const joined8 = new Uint8Array(joinedBuffer)
	let pos = 0
	for (const buffer of buffers) {
		const input8 = new Uint8Array(buffer)
		for (const i in input8)
			joined8[pos++] = input8[i]
	}
	return joinedBuffer
}

const handleError = e => {
	console.error(e)
	alert(e)
}

const unsupported = () => {
	console.error("It appears that your browser does not properly support the Web Crypto APIs. " +
		"Please try this app in the latest version of Chrome or Firefox.")
}

const checkCryptoSupport = () => {
	if (!crypto ||
		!crypto.subtle ||
		!crypto.subtle.generateKey ||
		!crypto.subtle.importKey) {
		unsupported()
		return false
	}
	return true
}
let alreadyGenerated = false
const generateKeypair = async () => {
	if (alreadyGenerated)
		return
	alreadyGenerated = true
	const keyParams = {
		name: "RSA-OAEP",
		modulusLength: 2048,
		publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
		hash: {
			name: "SHA-256"
		},
	}
	try {
		const key = await crypto.subtle.generateKey(keyParams, true, ["encrypt", "decrypt"])
		return {
			'publicKey': await crypto.subtle.exportKey("jwk", key.publicKey),
			'privateKey': await crypto.subtle.exportKey("jwk", key.privateKey)
		}
	} catch (e) {
		handleError(e)
	}
}
const rsaOptions = {
	name: "RSA-OAEP",
	hash: {
		name: "SHA-256"
	},
}
const CHUNK_SIZE = 190
const encryptMesage = async (uPubKey, message) => {
	let rawPublicKey
	try {
		rawPublicKey = JSON.parse(uPubKey)
	} catch (e) {
		handleError("Invalid public key")
		return
	}
	try {
		const plaintextBuffer = stringToArrayBufferUTF16(message)
		const publicKey = await crypto.subtle.importKey("jwk", rawPublicKey,
			rsaOptions, false, ["encrypt"])
		const encryptedChunks = []
		for (let i = 0; i < plaintextBuffer.byteLength; i += CHUNK_SIZE) {
			const partialSize = Math.min(CHUNK_SIZE, plaintextBuffer.byteLength - i)
			encryptedChunks.push(await crypto.subtle.encrypt(rsaOptions,
				publicKey, plaintextBuffer.slice(i, i + partialSize)))
		}
		const encryptedBuffer = joinBuffers(encryptedChunks)
		return toBase64(encryptedBuffer)
	} catch (e) {
		handleError(e)
	}
}
const decryptMesage = async (uPrivateKey, message) => {
	let rawPrivateKey
	try {
		rawPrivateKey = JSON.parse(uPrivateKey)
	} catch (e) {
		handleError("Invalid private key")
		return
	}
	try {
		const privateKey = await crypto.subtle.importKey("jwk", rawPrivateKey,
			rsaOptions, false, ["decrypt"])
		const encryptedBuffer = fromBase64(message)
		const plaintextChunks = []
		for (let i = 0; i < encryptedBuffer.byteLength; i += 256) {
			const encryptedChunk = encryptedBuffer.slice(i, i + 256)
			plaintextChunks.push(await crypto.subtle.decrypt(rsaOptions,
				privateKey, encryptedChunk))
		}
		const plaintext = joinBuffers(plaintextChunks)
		return arrayBufferToStringUTF16(plaintext)
	} catch (e) {
		handleError(e)
	}
}

window.browserSupported = true