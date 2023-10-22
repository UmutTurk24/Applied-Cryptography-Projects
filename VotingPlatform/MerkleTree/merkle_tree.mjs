/**
 * @fileoverview This file contains the implementation of a Merkle Tree.
 * @author Umut Turk
 * @version 1.1.0
 * @module merkle_tree
 */
import { merkleList } from "./merkle_list.mjs";

export class MerkleTree {

	// The bottom level of the tree
	bottomLevel;
	// The hash function
	hasher;
	// List of nodes at the bottom of the tree
	merkleList;
	// The root of the tree
	root;

	/**
	 * @property {Function} MerkleTree - Constructor for MerkleTree
	 * @param {Number} bottomLevel - The height of the tree
	 * @param {Function} hasher - The hash function to be used
	 * @returns {MerkleTree} - Returns a MerkleTree object
	 */
	constructor(bottomLevel, hasher) {
		this.bottomLevel = bottomLevel; 
		this.hasher = hasher; 
		this.merkleList = new merkleList(bottomLevel, hasher);
		this.root = null;
	}

	/**
	 * @property {Function} append - Append a node to the tree
	 * @param {Uint8Array} element - The element to be added to the tree
	 * @returns {Number} - Returns the index of the element added, -1 if no available space
	 */
	append(element, updateInternalState = false){

		// Append the hashed element to the tree
		const addedIndex = this.merkleList.appendNode(element);

		if (updateInternalState) {
			this.merkleList.updateInternalState(addedIndex);
		}

		// Check if there is available space
		if (addedIndex == -1) throw new Error("No available space in the tree");
		

		// Return the index of the element added
		return addedIndex;

	}

	/**
	 * @property {Function} appendAll - Append a list of nodes to the tree
	 * @param {Uint8Array} elements - The elements to be added to the tree
	 * @returns {void}
	 */
	appendAll(elements) {
		for(let element of elements) {
			this.append(element);
		}
	}

	/**
	 * @property {Function} remove - Remove a node from the tree
	 * @param {Number} index - The index of the element to be removed
	 * @returns {void}
	 */
	getBottomIndex(element) {
		// Find the element (hashed version of it) in the merkleList
		return this.merkleList.findElement(this.hasher(element));
	}

	/**
	 * @property {Function} getRoot - Return the root of the tree
	 * @returns {Uint8Array} - Returns the root of the tree
	 */
	getRoot() {
		// Update the internal state of the tree and return the root value
		for (let x = 0; x < this.merkleList.getBottomListLength() - 1; x += 2) { 
			this.merkleList.updateInternalState(x);
		}
		return this.merkleList.getRoot();
	}

	/**
	 * @property {Function} getProof - Return the proof of the element at the given index
	 * @param {Number} bottomIndex - The index of the element to be proved
	 * @returns {Uint8Array} - Returns the proof of the element at the given index
	 */
	getProof(bottomIndex) {
		var siblings = [];
		var isLeft = [];

		// Call getRoot() to lazily evaluate all elements in the positionMap
		var root = this.getRoot();
		
		// Start from bottomLevel at bottomIndex, and backward-calculate siblings and isLeft
		const rootPath = this.merkleList.getPath(bottomIndex);
		
		for (let x = 0; x < rootPath.length; x++) {
			const {siblingValue, siblingOrientation} = rootPath[x];

			if (siblingOrientation === merkleList.LEFT) {
				isLeft.push(1);
			} else {
				isLeft.push(0);
			}
			siblings.push(siblingValue);
		}

		return {root, siblings, isLeft};
	}

}
