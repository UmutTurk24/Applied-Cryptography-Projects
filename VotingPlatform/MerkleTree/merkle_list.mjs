/**
 * @fileoverview This file contains the implementation of a Merkle List.
 * @author Umut Turk
 * @version 1.1.0
 * @module merkle_list
 */

export class merkleList {


    #list;
    #nextAvailableIndex
    #treeHeight
    #hasher 

    // Create an alias for left and right
    static LEFT = 0;
    static RIGHT = 1;

    /** 
     * @property {Function} MerkleList - Constructor for MerkleList
     * @param {Number} treeHeight - The height of the tree
     * @param {Function} hasher - The hash function to be used
     * @returns {merkleList} - Returns a MerkleList object
    */
    constructor(treeHeight = 0, hasher = sha256){

        // Define a full binary tree in an array form
        this.#list = new Array(Math.pow(2,treeHeight+1) - 1).fill(new TextEncoder().encode(-1));
        this.#nextAvailableIndex = 2*treeHeight - 1;
        this.#treeHeight = treeHeight
        this.#hasher = hasher

    }

    /**
     * @property {Function} appendNode - Append a node to the tree
     * @param {Uint8Array} element - The element to be added to the tree
     * @returns {Number} - Returns the index of the element added, -1 if no available space
     */
    appendNode(element){

        // Check if there is available space
        if (this.#nextAvailableIndex >= this.#list.length){ 
            return -1
        }
        // Add element to the next available index
        this.#list[this.#nextAvailableIndex] = this.#hasher(element);
        this.#nextAvailableIndex += 1;
        return (this.#nextAvailableIndex - 1) - (2 * this.#treeHeight - 1);
    }

    /** 
     * @property {Function} removeNode - Remove a node from the tree
     * @param {Number} index - The index of the element to be removed
     * @returns {void}
    */
    removeNode(index){
        // Remove the element in the given index from the list
        this.#list[index] = -1;
    }

    /**
     * @property {Function} getRoot - Return the root of the tree
     * @returns {Uint8Array} - Returns the root of the tree
    */
    getRoot(){
        // Return the root of the tree
        return this.#list[0];
    }

    /**
     * @property {Function} findElement - Find the index of the element in the tree
     * @param {Uint8Array} element - The element to be searched
     * @returns {Number} - Returns the index of the element, -1 if not found
    */
    findElement(element){
        // Search for the value in the list
        startingIndex = ((2*this.#treeHeight - 1) + bottomIndex);

        for (let x = startingIndex; x < this.#list.length; x++){
            if (this.#list[x] === element){
                return x;
            }
        }

        return -1;
    }

    /**
     * @property {Function} updateInternalState - Update the internal state of the tree
     * @param {Number} bottomIndex - The index of the element to be updated
     * @returns {void}
    */
    updateInternalState(bottomIndex){
        // Find the index of the bottomIndex in the list
        let listIndex = (( 2 * this.#treeHeight - 1) + bottomIndex);
        if (bottomIndex === undefined ||
            listIndex < 0 || listIndex > this.#list.length){ return; }

        // Update the internal state of the tree
        while(listIndex > 0){
            
            // Get the sibling index
            let siblingIndex = this.#getSiblingIndex(listIndex);

            // Find the Left/Right Node
            let {leftNodeIndex, rightNodeIndex} = this.#orderNodes(listIndex, siblingIndex);
            
            // Get the value of the left node
            let leftNodeValue = this.#list[leftNodeIndex];
            
            // Get the value of the right node
            let rightNodeValue = this.#list[rightNodeIndex];

            // Get the parent index
            let parentIndex = this.#getParentIndex(listIndex);

            // Update the parent value with the new hash
            this.#list[parentIndex] = this.#calculateParentHash(leftNodeValue, rightNodeValue);

            // Update the list index
            listIndex = parentIndex;
        }
    }

    /**
     * @property {Function} getPath - Return the path of the element in the tree
     * @param {Number} bottomIndex - The index of the element to be searched
     * @returns {Array} - Returns the path of the element
    */
    getPath(bottomIndex){

        let listIndex = ((2*this.#treeHeight - 1) + bottomIndex);

        let path = [];

        while(listIndex > 0){
            let siblingIndex = this.#getSiblingIndex(listIndex);

            // Get the sibling information
            let sibling_information = this.#getSiblingInformation(siblingIndex);

            // Add the sibling information to the path
            path.push(sibling_information);

            // Update the list index
            listIndex = this.#getParentIndex(listIndex);
        }

        return path;

    }

    /**
     * @property {Function} printList - Print the list
     * @returns {void}
    */
    printList(){
        console.log(this.#list);
    }

    /**
     * @property {Function} getBottomListLength - Return the length of the bottom list
     * @returns {Number} - Returns the length of the bottom list
     */
    getBottomListLength() {
        return this.#list.length - (2*this.#treeHeight - 1);
    }

    /**
     * @property {Function} getSiblingInformation - Return the sibling information
     * @param {Number} siblingIndex - The index of the sibling
     * @returns {Object} - Returns the sibling orientation (Left or Right)
     * @returns {Uint8Array} - Returns the sibling value
     */
    #getSiblingInformation(siblingIndex){
        if (this.#isLeftNode(siblingIndex)){
            return {siblingValue: this.#list[siblingIndex], siblingOrientation: merkleList.LEFT};
        } else {
            return {siblingValue: this.#list[siblingIndex], siblingOrientation: merkleList.RIGHT};
        }
    }

    /** 
     * @property {Function} getSiblingIndex - Return the sibling index
     * @param {Number} index - The index of the element
     * @returns {Number} - Returns the sibling index
     */
    #getSiblingIndex(index){
        // Return the sibling index of the given index
        if (this.#isLeftNode(index)) {
            return index + 1;
        } else {
            return index - 1;
        }
    }

    /**
     * @property {Function} isLeftNode - Return true if the node is a left node
     * @param {Number} index - The index of the element
     * @returns {Boolean} - Returns true if the node is a left node, false otherwise
     */
    #isLeftNode(index){
        // Return true if the node is a left node
        if (index % 2 === 0) return false;
        return true;
    }

    /**
     * @property {Function} getParentIndex - Return the parent index
     * @param {Number} index - The index of the element
     * @returns {Number} - Returns the parent index
     */
    #getParentIndex(index){
        // Return the parent index of the given index
        return Math.floor((index-1)/2);
    }

    /**
     * @property {Function} calculateParentHash - Return the hash of the parent node
     * @param {Uint8Array} left - The left node
     * @param {Uint8Array} right - The right node
     * @returns {Uint8Array} - Returns the hash of the parent node
     */
    #calculateParentHash(left, right){
        // Return the hash of the parent node
        return this.#hash(left + right);
    }

    /**
     * @property {Function} hash - Return the hash of the given element
     * @param {Uint8Array} value - The value to be hashed
     * @returns {Uint8Array} - Returns the hash of the given element
     */
    #hash(value){
        // Return the hash of the given element
        return this.#hasher(value);
    }

    /**
     * @property {Function} orderNodes - Return the left and right node in the correct order
     * @param {Number} index1 - The index of the first element
     * @param {Number} index2 - The index of the second element
     * @returns {Number, Number} - Returns the left and right node in the correct order
     */
    #orderNodes(index1, index2){
        // Return the left and right node in the correct order
        if (index1 < index2){
            return {leftNodeIndex: index1, rightNodeIndex: index2};
        } else if (index1 > index2) {
            return {leftNodeIndex: index2, rightNodeIndex: index1};
        } else {
            return null;
        }

    }
}


