import {x25519} from '@noble/curves/ed25519'
import { pbkdf2, pbkdf2Async } from '@noble/hashes/pbkdf2';
import { verify } from "crypto"
let module = x25519
import * as crypto from 'crypto'

import { sha256 } from '@noble/hashes/sha256'

// PGP:
// Pretty Good Privacy
// PGP Algorithm - Sender
    // Generate a private key
    // Hash your data with the private key
    // Hash your public key with receiver’s private key
    // Encrypt the data with your encrypted key 
    // Send encrypted data and encrypted key
// PGP Algorithm - Receiver
    // Decrypt the encrypted key with public key
    // Decrypt the data with decrypted key  

// ECIES: Elliptic Curve Integrated Encryption Scheme
function encrypt(message, receiverPublicKey) {

    const privateKey = x25519.utils.randomPrivateKey()
	const publicKey = x25519.getPublicKey(privateKey)
    
    const sharedKey = x25519.getSharedSecret(privateKey, receiverPublicKey)

    // const hashSalt = crypto.randomBytes(32)
    const hashSalt = crypto.randomBytes(32)
    const key = pbkdf2(sha256, sharedKey, hashSalt, {c: 131072, dkLen: 32})

    return { 
        encrypted: encryptAuthenticated(key, message), 
        publicKey, 
        hashSalt 
    }
}

function decrypt(privateKey, crpytogram) {

    const { encrypted, publicKey: senderPublicKey, hashSalt } = crpytogram

    const sharedKey = x25519.getSharedSecret(privateKey, senderPublicKey)

    const key = pbkdf2(sha256, sharedKey, hashSalt, {c: 131072, dkLen: 32})
   

    return decryptAuthenticated(key, encrypted)
}

function encryptAuthenticated(keyE, message) {
    let iv = crypto.randomBytes(16)

    const symmetricCipher = crypto.createCipheriv('aes-256-gcm', keyE, iv)

    let ciphertext = symmetricCipher.update(message, 'utf8', 'hex')
    ciphertext += symmetricCipher.final('hex')

    const tag = symmetricCipher.getAuthTag()
    let ivString = iv.toString('hex')
    return { ciphertext, tag, ivString }
}

function decryptAuthenticated(keyE, crpytogram) {

    const {ciphertext, tag, ivString} = crpytogram
    let iv = Buffer.from(ivString, 'hex')
    
    // Convert the ivString to a Buffer
    const symmetricDecipher = crypto.createDecipheriv('aes-256-gcm', keyE, iv)

    // Set the authentication tag on the decipher
    symmetricDecipher.setAuthTag(tag)

    return decryptedMessage = symmetricDecipher.update(ciphertext, 'hex', 'utf8')
}

function testECIES() {
    // Test encrypt and decrypt functions
    const privateKeyReceiver = x25519.utils.randomPrivateKey()
    const publicKeyReceiver = x25519.getPublicKey(privateKeyReceiver)
    const message = 'Hello World!'
    const encrypted = encrypt(message, publicKeyReceiver)
    const decrypted = decrypt(privateKeyReceiver, encrypted)

    console.log(decrypted) 
}

testECIES()