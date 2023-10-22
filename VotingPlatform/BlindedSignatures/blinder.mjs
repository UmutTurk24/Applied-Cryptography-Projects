/**
 * @fileoverview This file contains the implementation of a blinder.
 * @author Umut Turk
 * @version 1.1.0
 * @module blinder
 */
import { bls12_381 } from '@noble/curves/bls12-381'

/* 
    Legend

    x: private key
    G: G1's generator
    P: G2's generator
    G_x: x * G
    P_x: x * P

*/

/**
 * @property {Function} Setup - Setup the blind signature scheme
 * @returns {Uint8Array, Uint8Array, Uint8Array} - x (private key), G_x (public key in G1), P_x (public key in G2)
 */
export function blindSignaturesSetup() {

    const x = bls12_381.utils.randomPrivateKey()
    const G_x = bls12_381.G1.ProjectivePoint.fromPrivateKey(x).toRawBytes(true);
    const P_x = bls12_381.G2.ProjectivePoint.fromPrivateKey(x).toRawBytes(true);
    
    return {x, G_x, P_x}
}

/**
 * @property {Function} Blind the message - Generate a key pair
 * @param {Uint8Array} encodedMessage - User's message
 * @returns {Uint8Array, Uint8Array} - BlindedMessage, randomNumber
 */
export function blindSignaturesPack(encodedMessage) {

    // Blind the message with a random number r
    const randomKey =  bls12_381.utils.randomPrivateKey()
    const randomNumber = bls12_381.G2.normPrivateKeyToScalar(randomKey) // r

    const P = bls12_381.G2.ProjectivePoint.BASE // P
    const P_r = P.multiply(randomNumber) // P_r

    const encodedMessagePoint = bls12_381.G2.hashToCurve(encodedMessage) // Hm
    const blindedMessage = P_r.add(encodedMessagePoint)   // P_r + Hm

    return {blindedMessage, randomNumber}
}

/**
 * @property {Function} Sign Blinded Signature given by the user
 * @param {Uint8Array} blindMessage - blinded message
 * @param {Uint8Array} x - Private Key
 * @returns {Uint8Array, Uint8Array} - x (private key), G_x (public key in G1)
 */
export function blindSignaturesSign(blindMessage, privateKey) {

    const signedBlindedMessage = bls12_381.sign(blindMessage, privateKey) // S = x * (P_r + Hm)
    return signedBlindedMessage

}

/**
 * @property {Function} Unpack Signed Blinded Signature
 * @param {Uint8Array} P_x - Public key in G2 of the signer
 * @param {Uint8Array} random number - Random number used to blind the message
 * @param {Uint8Array} signedBlindedMessage - Signed Blinded Message to be unpacked
 * @returns {Uint8Array} - Encoded message
 */
export function blindSignaturesUnpack(P_x, randomNumber, signedBlindedMessage) {

    const smartTrick = bls12_381.G2.ProjectivePoint.fromAffine(bls12_381.G2.CURVE.fromBytes(P_x)).multiply(randomNumber)
    const signedMessage = signedBlindedMessage.subtract(smartTrick) // Signature - P_x * r = x_H_m

    return signedMessage
}

