/**
 * @fileoverview This file contains the implementation of a ring signature.
 * @author Umut Turk
 * @version 1.0.0
 * @module ring-signature
 */
// npm install @guildofweavers/galois
// https://medium.com/asecuritysite-when-bob-met-alice/ring-signatures-and-anonymisation-c9640f08a193


import { bls12_381 } from '@noble/curves/bls12-381'
import { sha256 } from '@noble/hashes/sha256'

/**
 * @property {Function} Generate Key Pair - Generates a key pair for a signer
 * @returns {Uint8Array, Uint8Array} - Returns one public/private keypair for the signer.
 */

export function generateKeyPair() {
    const privateKey = bls12_381.utils.randomPrivateKey();
    const publicKey = bls12_381.G2.ProjectivePoint.fromPrivateKey(privateKey).toRawBytes(true);
    return { publicKey, privateKey };
}

// Signs the message using the private key signerKey. 
// Such private key has index signerIndex in the list of public keys, which is provided in publicKeys.

/**
 * @property {Function} GenerateRingSignature - Generates a ring signature with a signer
 * @param {Uint8Array} signerKey - Private key of the signer
 * @param {Number} signerIndex - Index of the signer
 * @param {Array[Uint8Array]} publicKeys - List of public keys
 * @param {Uint8Array} encodedMessage - Encoded message
 * @returns {Uint8Array, Uint8Array} - Returns the ring signature and the c1 value
 */
export function signRing(signerKey, signerIndex, publicKeys, encodedMessage) {
    
    // Check if the signerIndex is valid
    if (signerIndex < 0 || signerIndex >= publicKeys.length) {
        throw new Error('Invalid signerIndex');
    }

    // Generate fake responses for the other public keys
    let ringSignature = {};
    
    for (let i = 0; i < publicKeys.length; i++) {
        if (i != signerIndex) {
            // let randomNumber = bls12_381.utils.randomPrivateKey();
            // ringSignature[i] = bls12_381.G1.normPrivateKeyToScalar(randomNumber)

            ringSignature[i] = bls12_381.utils.randomPrivateKey();
        }
    }

    // Compute the public key hash
    let concatenatedPublicKeys = new Uint8Array();
    for (let i = 0; i < publicKeys.length; i++) {   
        concatenatedPublicKeys = new Uint8Array([...concatenatedPublicKeys, ...publicKeys[i]]);
    }
    
    // Generate a, a random number
    const a = bls12_381.G1.normPrivateKeyToScalar(bls12_381.utils.randomPrivateKey())
    const G = bls12_381.G1.ProjectivePoint.BASE;
    const aG = G.multiply(a).toRawBytes(true);

    // Seed: H(R, m, [aG])
    let c = sha256(concatenatedPublicKeys, aG, encodedMessage);

    let c1 = null;
    // Compute the ring signature 
    for (let i = signerIndex + 1; i != signerIndex; i++) {
        if (i == publicKeys.length) {
            i = 0
            c1 = c;
        };

        // Calculate rG
        const rG = G.multiply(
            bls12_381.G1.normPrivateKeyToScalar(ringSignature[i])).toRawBytes(true);

        // Calculate cK
        const ck = c * publicKeys[i];

        // Calculate cK + rG
        const ckrG = ck + rG;

        // Calculate the new c
        c = sha256(concatenatedPublicKeys, encodedMessage, ckrG);
    }

    // Insert the signer's fake response - individual variables for testing and debugging
    let curvePoint = bls12_381.G1.hashToCurve(c);
    let signerCurvePoint = bls12_381.G1.hashToCurve(signerKey);
    let multipliedSignerPoint = signerCurvePoint.multiply(a);

    // r_signer = a - c * priv_signer
    ringSignature[signerIndex] = sha256(curvePoint.subtract(multipliedSignerPoint).toRawBytes(true));

    return {c1, ringSignature}
}

// Returns true only if the verification procedure can attest that a private key associated 
// with one of the public keys listed in publicKeys produced the signature ringSignature for the message.

/**
 * @property {Function} VerifyRing - Verifies a ring signature
 * @param {Array[Uint8Array]} publicKeys - List of public keys
 * @param {Uint8Array} encodedMessage - Encoded message
 * @param {Uint8Array} ringSignatureCompact - Ring signature
 * @returns {Boolean} - Returns true if the verification procedure can attest that a private key associated
 */
export function verifyRing(publicKeys, encodedMessage, ringSignatureCompact) {

    // Compute the public key hash
    let concatenatedPublicKeys = new Uint8Array();
    for (let i = 0; i < publicKeys.length; i++) {   
        concatenatedPublicKeys = new Uint8Array([...concatenatedPublicKeys, ...publicKeys[i]]);
    }

    let c = ringSignatureCompact.c1;
    const ringSignature = ringSignatureCompact.ringSignature;

    const G = bls12_381.G1.ProjectivePoint.BASE;

    // Compute the ring signature
    for (let i = 0; i < publicKeys.length; i++) { 

        // Calculate rG
        const rG = G.multiply(
            bls12_381.G1.normPrivateKeyToScalar(ringSignature[i])).toRawBytes(true);

        // Calculate cK
        const ck = c * publicKeys[i];

        // Calculate cK + rG
        const ckrG = ck + rG;

        // Calculate the new c
        c = sha256(concatenatedPublicKeys, encodedMessage, ckrG);
    }
    
    // Check if c and c1 arrays are the same
    for (let x = 0; x < c.length; x++) {
        if (c[x] != ringSignatureCompact.c1[x]) {
            return false;
        }
    }

    return true;
}


// Test the ring signature
export function testRingSignature() {
    // Keypair of the signer
    let {publicKey, privateKey} = generateKeyPair();

    // Message to be signed
    const message = "Champagne Problems";
    const encodedMessage = new TextEncoder().encode(message);

    // Generate 15 public keys for the ring
    let publicKeys = [];

    for (let i = 0; i < 15; i++) {
        const privateKey = bls12_381.utils.randomPrivateKey();
        const publicKey = bls12_381.G1.ProjectivePoint.fromPrivateKey(privateKey).toRawBytes(true);

        publicKeys.push(publicKey);
    }

    // We know the last key belongs to the signer
    publicKeys.push(publicKey);
    const signerIndex = publicKeys.length - 1;

    let ringSignatureCompact = signRing(privateKey, signerIndex, publicKeys, encodedMessage);

    const result = verifyRing(publicKeys, encodedMessage, ringSignatureCompact);
    console.log(result);

}

testRingSignature()