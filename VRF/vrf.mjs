// Import necessary modules and libraries
import { sha256 } from '@noble/hashes/sha256'
import { ed25519 } from '@noble/curves/ed25519'

// Define variables to store the public key, seed, private key, and elliptic curve module
export let publicKey 
export let seed 
let privateKey
let module = ed25519

/**
 * @property {Function} Initializes the VRF with a random key pair and generates a seed
 * @returns {Object} - {publicKey, seed} Generated public key and the seed
 */
export function initializeVRF() { 
    // Generate a random private key
	privateKey = module.utils.randomPrivateKey()
	// Calculate the corresponding public key
	publicKey = module.getPublicKey(privateKey)
    // Generate a seed
    seed = seedGenerator();

    return { publicKey, seed };
}

/**
 * @property {Function} Selects a random winner from the lottery
 * @param {number} i - A number used for randomness
 * @returns {Object} - {signature, signatureHash}
 */
export function generate(i) {
    // Encode the seed and 'i' to create the input for signing
    const encodedSecret = new TextEncoder().encode(seed + i)
    // Sign the input using the private key
    const signature = module.sign(encodedSecret, privateKey)
    // Calculate the hash of the signature
    const signatureHash = sha256(signature)

    return { signature, signatureHash }
}

/**
 * @property {Function} Verifies if the signature and the signature hash match
 * @param {Uint8Array} signature - Signature of the random beacon
 * @param {Uint8Array} signatureHash - Hash of the signature taken by the random beacon
 * @returns {boolean} - True if the proof is correct, false otherwise
 */
export function verify(signature, signatureHash) {
    // Calculate the hash of the provided signature and compare it to the given signature hash
    return isEqual(sha256(signature), signatureHash)
}

// Helper function to generate a seed
function seedGenerator() {
    return new TextEncoder().encode("Fearless" + Math.random())
}

// Helper function to compare two Uint8Arrays for equality
function isEqual (buf1, buf2) {
    if (buf1.byteLength != buf2.byteLength) return false;
    var dv1 = new Int8Array(buf1);
    var dv2 = new Int8Array(buf2);
    for (var i = 0 ; i != buf1.byteLength ; i++) {
        if (dv1[i] != dv2[i]) return false;
    }
    return true;
}
