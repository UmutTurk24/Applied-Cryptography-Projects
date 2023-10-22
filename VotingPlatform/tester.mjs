import { blindSignaturesSetup, blindSignaturesPack, blindSignaturesSign, blindSignaturesUnpack } from "./blinder.mjs"
import { bls12_381 } from '@noble/curves/bls12-381'
import { sha256 } from '@noble/hashes/sha256'
import { MerkleTree } from "./merkle_tree.mjs"
import { registerVote, authorizeVote, submitVote, calculateOutcome, initializePlatform } from "./voting_platform.mjs"


/// TESTS ///
// merkleTreeTest()
// simulateBlind()
votingPlatformTest()


function votingPlatformTest() {

    // Initialize the voting platform with height 2, and hasher sha256
    const {voteTree, P_x} = initializePlatform(2, sha256);

    // Register 4 votes
    for (var x = 0; x < 4; x++) {
        const x = bls12_381.utils.randomPrivateKey()
        const publicKey = bls12_381.getPublicKey(x)
        const index = registerVote(publicKey)

        const encodedVote = new TextEncoder().encode("N")
        const {blindedMessage, randomNumber} = blindSignaturesPack(encodedVote)

        const merklePath = voteTree.getProof(index)
        const signedBlindedMessage = authorizeVote(blindedMessage, publicKey, merklePath)

        const signedMessage = blindSignaturesUnpack(P_x, randomNumber, signedBlindedMessage)
        submitVote(signedMessage)
    }
    
    // Calculate the outcome
    const outcome = calculateOutcome()
    console.log(outcome)
}

function merkleTreeTest() {
    const newTree = new MerkleTree(2, sha256)

    for (let x = 0; x < 1; x++) { 
        const encodedMessage = new TextEncoder().encode(x.toString())
        const res = newTree.append(encodedMessage)
    }

    const {root, siblings, isLeft} = newTree.getProof(0)
    console.log("root: ", root)
    console.log("siblings: ", siblings)
    console.log("isLeft: ", isLeft)

}


function simulateBlind() {    

    const encodedMessage = new TextEncoder().encode("Hello")
    const {x, G_x, P_x} = blindSignaturesSetup()

    const {blindedMessage, randomNumber} = blindSignaturesPack(encodedMessage)
    const signedBlindedMessage = blindSignaturesSign(blindedMessage, x)
    const signedMessage = blindSignaturesUnpack(P_x, randomNumber, signedBlindedMessage)

    const verified = bls12_381.verify(signedMessage, encodedMessage, G_x)
    console.log(verified)

}

