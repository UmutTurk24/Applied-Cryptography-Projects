/**
 * @fileoverview This file contains the implementation of a Voting platform
 * @author Umut Turk
 * @version 1.1.0
 */

import { MerkleTree } from "./merkle_tree.mjs"
import { blindSignaturesSetup, blindSignaturesSign } from "./blinder.mjs"
import { bls12_381 } from '@noble/curves/bls12-381'
import { sha256 } from '@noble/hashes/sha256'

// Initialize the requirements of the vote platform
// Initialize the merkle tree with height 2 and sha256
var voteTree;

// Initialize the blinding parameters
var x;
var G_x;
var P_x

// Initialize the registered votes
var registeredBlindedVotes;

// Initialize the registered votes
var registeredVotes;

/**
 * @property {Function} Initialize Platform - Initialize the voting platform
 * @param {Number} treeSize - Size of the merkle tree
 * @param {Function} hasher - Hashing function
 * @returns {Object} - voteTree, P_x
 */
export function initializePlatform(treeSize, hasher) {
    // Initialize the merkle tree with height 2 and sha256
    voteTree = new MerkleTree(treeSize, hasher);

    // Initialize the blinding parameters
    const setup = blindSignaturesSetup();
    x = setup.x;
    G_x = setup.G_x;
    P_x = setup.P_x;

    // Initialize the registered votes
    registeredBlindedVotes = new Set();

    // Initialize the registered votes
    registeredVotes = [];

    return {voteTree, P_x}
}


/**
 * @property {Function} Register Vote - Register a vote
 * @param {Uint8Array} publicKey - User's public key
 * @returns {Uint8Array, Uint8Array, Uint8Array}  - index of the vote in the tree
 */
export function registerVote(publicKey) {
    return voteTree.append(publicKey)
}

/**
 * @property {Function} Get Proof - Get the root of the merkle tree
 * @returns {Uint8Array} - root of the merkle tree
 */
export function getProof() {

    return voteTree.getRoot()
}

/**
 * @property {Function} Authorize Vote - Authorize a vote
 * @param {Uint8Array} blindedVote - Blinded vote
 * @param {Uint8Array} publicKey - User's public key
 * @param {Uint8Array} merklePath - Merkle path of the user's vote
 * @returns {Uint8Array} - Signed Blinded Vote. Null if the vote is not authorized
 */
export function authorizeVote(blindedVote, publicKey, merklePath) {

    // Check if the vote is authorized
    const {root, siblings, isLeft} = merklePath
    
    publicKey = sha256(publicKey)
    for (let x = 0; x < siblings.length; x++) {
        if (!isLeft[x]) {
            publicKey = sha256(publicKey + siblings[x])
        } else {
            publicKey = sha256(siblings[x] + publicKey)
        }
    }

    
    // Sign the vote if it is authorized
    if (isEqual(publicKey, root) && !registeredBlindedVotes.has(blindedVote)) {
        registeredBlindedVotes.add(blindedVote)
        return blindSignaturesSign(blindedVote, x);
    }

    return null;
}

/**
 * @property {Function} Unpack Signed Blinded Signature
 * @param {Uint8Array} P_x - Public Key in G2
 * @param {Uint8Array} randomNumber - Random Number
 * @param {Uint8Array} signedBlindedMessage - Signed Blinded Message
 * @returns {Uint8Array} - Signed Message
 */
export function submitVote(unblindedVote) {
    // Submit the vote
    registeredVotes.push(unblindedVote)
}

/**
 * @property {Function} Calculate Outcome
 * @returns {Object} - Outcome of the vote
 */
export function calculateOutcome() {
    
    // Calculate the outcome and check if the vote is valid
    var voteCount = {};
    voteCount["Y"] = 0;
    voteCount["N"] = 0;
    voteCount["Invalid"] = 0;

    const encodedYay = new TextEncoder().encode("Y")
    const encodedNay = new TextEncoder().encode("N")
    
    for (let x = 0; x < registeredVotes.length; x++) {
        if (bls12_381.verify(registeredVotes[x], encodedYay, G_x)) {
            voteCount["Y"] += 1;
        } else if (bls12_381.verify(registeredVotes[x], encodedNay, G_x)) {
            voteCount["N"] += 1;
        } else {
            voteCount["Invalid"] += 1;
        }
    }

    return voteCount;
}

/**
 * @property {Function} Compare two Uint8Arrays
 * @param {Uint8Array} buf1 - First Uint8Array
 * @param {Uint8Array} buf2 - Second Uint8Array
 * @returns {Boolean} - True if the two Uint8Arrays are equal
 */
function isEqual (buf1, buf2) {
    if (buf1.byteLength != buf2.byteLength) return false;
    var dv1 = new Int8Array(buf1);
    var dv2 = new Int8Array(buf2);
    for (var i = 0 ; i != buf1.byteLength ; i++) {
        if (dv1[i] != dv2[i]) return false;
    }
    return true;
}