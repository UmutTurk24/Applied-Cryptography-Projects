// Import necessary modules and libraries
import { sha256 } from "@noble/hashes/sha256"
import { secp256k1 } from '@noble/curves/secp256k1'
import { bytesToNumberLE, bytesToNumberBE } from '@noble/curves/abstract/utils'
import * as crypto from 'crypto'
import fs from 'fs'

// Define the elliptic curve module to use (secp256k1)
let module = secp256k1

// Define a Timestamp Server implementation with secp256k1 curve and sha256 hash
// Provides three functions: calculateHash(), timestamp(), verify()

/**
 * @property {Function} Calculates the hash of a given file
 * @param {String} filename - Filepath of the given file
 * @returns {Uint8Array} - Hash of the given file
 */
export function calculateHash(filename) {
    const fileContents = fs.readFileSync(filename)
    return sha256(fileContents)
}

/**
 * @property {Function} Timestamps the file
 * @param {Uint8Array} filename - Filepath of the given file
 * @param {Uint8Array} hash - Hash of the file given by the client
 * @returns {Object} - {prestamp, signature} containing prestamp and signature of the prestamp
 */
export function timestamp(filename, hash) {
    const currentDate = new Date().getDate()

    // Sign the received request
    const preTimestamp = sha256(hash + currentDate)
    const privateKey = readPrivateNobleCurves("certs/serv_privkey.pem", "Taylor")
    const encodedMessage = new TextEncoder().encode(preTimestamp + currentDate)
    const signature = module.sign(encodedMessage, privateKey, { prehash: false })

    // Append the received request to the signature
    const fileContents = fs.readFileSync(filename)
    const hashedFile = sha256(fileContents)
    const certauthPrestamp = sha256(hashedFile + currentDate)
    const prestamp = { certauthPrestamp, currentDate }

    return { prestamp, signature }
}

/**
 * @property {Function} Verifies the given file with the CA's timestamp
 * @param {String} filename - Filepath of the file
 * @param {Object} timestamp - Timestamp created by the CA
 * @returns {boolean} - Validity of the file-time correlation
 */
export function verify(filename, timestamp) {
    // Verify the date-file correlation
    let stampDate = timestamp.prestamp.currentDate
    let hashedFile = sha256(fs.readFileSync(filename))
    let clientPreStamp = sha256(hashedFile + stampDate)

    // Verify CA has signed this correlation
    let encPreTimeStamp = new TextEncoder().encode(clientPreStamp + stampDate)
    let certificate = readCertificate("certs/timestampCA.pem")
    let isSigned = module.verify(timestamp.signature, encPreTimeStamp, getPublicKeyNobleSecp256k1(certificate), { prehash: false })

    return isSigned && (timestamp.prestamp.currentDate == stampDate) &&
        isEqual(timestamp.prestamp.certauthPrestamp, clientPreStamp)
}

// Helper function to read a certificate file
function readCertificate(filename) {
    const fileContents = fs.readFileSync(filename)
    return new crypto.X509Certificate(fileContents)
}

// Helper function to read a private key from a file
function readPrivateNobleCurves(filename, passphrase) {
    const privateKey = readPrivate(filename, passphrase)

    const privateKeyJWK = privateKey.export({ type: 'pkcs8', format: 'jwk' })
    const privateKeyBuffer = Buffer.from(privateKeyJWK.d, 'base64')

    return Uint8Array.from(privateKeyBuffer)
}

// Helper function to read a private key
function readPrivate(filename, passphrase) {
    const fileContents = fs.readFileSync(filename)
    return crypto.createPrivateKey({ key: fileContents, passphrase })
}

// Helper function to get the public key from a certificate
export function getPublicKeyNobleSecp256k1(certificate) {
    const publicKeyJWK = certificate.publicKey.export({ type: 'pkcs8', format: 'jwk' })

    const xBuffer = Buffer.from(publicKeyJWK.x, 'base64')
    const yBuffer = Buffer.from(publicKeyJWK.y, 'base64')

    const x = bytesToNumberBE(xBuffer)
    const y = bytesToNumberBE(yBuffer)

    return secp256k1.ProjectivePoint.fromAffine({ x, y }).toRawBytes()
}

// Helper function to compare two Uint8Arrays for equality
function isEqual(buf1, buf2) {
    if (buf1.byteLength != buf2.byteLength) return false;
    var dv1 = new Int8Array(buf1);
    var dv2 = new Int8Array(buf2);
    for (var i = 0; i != buf1.byteLength; i++) {
        if (dv1[i] != dv2[i]) return false;
    }
    return true;
}