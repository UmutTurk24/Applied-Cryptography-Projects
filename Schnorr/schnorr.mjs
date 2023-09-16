// Import necessary modules from the '@noble/curves/secp256k1' library
import { secp256k1 } from '@noble/curves/secp256k1'
import { schnorr } from '@noble/curves/secp256k1'

// Define a function called demoSchnorr that takes a 'message' as an input
function demoSchnorr(message) {
    // Generate a random private key using the schnorr library
    const privKey = schnorr.utils.randomPrivateKey()

    // Calculate the corresponding public key from the generated private key
    const pubKey = schnorr.getPublicKey(privKey)

    // Encode the 'message' into bytes using the TextEncoder
    const encodedMessage = new TextEncoder().encode(message)

    // Sign the encoded message using the private key to create a digital signature
    const signature = schnorr.sign(encodedMessage, privKey)

    // Verify the digital signature against the encoded message and the public key
    const isSignatureValid = schnorr.verify(signature, encodedMessage, pubKey)

    // Print the result of the signature verification (true if valid, false otherwise)
    console.log(isSignatureValid)
}

// Example usage of the demoSchnorr function:
// Call the function with a message to demonstrate Schnorr signature generation and verification
demoSchnorr("Hello, world!")