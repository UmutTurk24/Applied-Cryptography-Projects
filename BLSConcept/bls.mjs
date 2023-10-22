// Documentation in https://nodejs.org/api/crypto.htm
import * as crypto from 'crypto'


import { bls12_381 } from '@noble/curves/bls12-381'

export function signBLS(encodedMessage, privateKey) {
	const Hm = bls12_381.G2.hashToCurve(encodedMessage)	

	return Hm.multiply(
		bls12_381.G2.normPrivateKeyToScalar(privateKey)
	).toRawBytes()
}

export function verifyBLS(signature, encodedMessage, publicKey) {
	// G1's generator
	const G = bls12_381.G1.ProjectivePoint.BASE
	// Signature
	const x_Hm = bls12_381.G2.ProjectivePoint.fromAffine(
		bls12_381.G2.CURVE.fromBytes(signature)
	)

	// Public key
	const G_x = bls12_381.G1.ProjectivePoint.fromAffine(
		bls12_381.G1.CURVE.fromBytes(publicKey)
	)
	// Hashed message
	const Hm = bls12_381.G2.hashToCurve(encodedMessage)	

	const pairingA = bls12_381.pairing(G, x_Hm)
	const pairingB = bls12_381.pairing(G_x, Hm)

	return ( bls12_381.fields.Fp12.eql(pairingA, pairingB))
}

