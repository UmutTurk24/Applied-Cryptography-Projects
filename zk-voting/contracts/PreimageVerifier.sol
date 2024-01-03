// SPDX-License-Identifier: MIT
pragma solidity >=0.8 <0.9.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// import "hardhat/console.sol";

interface IHasher {
	// "pure" ensures that the function does not read or modify state
	function poseidon(bytes32[2] calldata input) pure external returns (bytes32);
	function poseidon(uint256[2] calldata input) pure external returns (uint256);
}

// Signature comes from the generated Solidity verifier
interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
		uint[1] memory input
    ) external view returns (bool r);
}

contract PreimageVerifier is Context, ReentrancyGuard {
	IERC20 public immutable token;
	IHasher public immutable hasher;
	IVerifier public immutable verifier;

	mapping(uint256 => bool) keyValueStore; // Store the nullifier
	bool[] votes; // List of votes
	uint256 merkleRoot; // Merkle root of the votes

	// We can call withdraw, and other functions thanks to this constructor
	constructor(address _token, address _hasher, address _verifier) {
		token = IERC20(_token); // coin interface (we can call withdraw, deposit, etc)
		hasher = IHasher(_hasher); // hashing stuff - poseidon
		verifier = IVerifier(_verifier); // implements the verifying with zk. 
	}

	

	function informRoot(uint256 _root) external nonReentrant { 
		merkleRoot = _root;
	}

	function vote(
		uint[2] memory a,
		uint[2][2] memory b,
		uint[2] memory c,
		uint256[3] memory nullifier,
		bool _vote
	) external nonReentrant {

		// Verify the proof
		require(verifier.verifyProof(a, b, c, [uint(merkleRoot)]), "Proof verification failed");

		// Concatenate the nullifier
		uint256[2] memory input = [nullifier[0], nullifier[1]];
		uint256 nullifierHash = hasher.poseidon(input);

		// Check if the nullifier has been used before
		require(!keyValueStore[nullifierHash], "Not verifying the previously commited merkle root image");
		keyValueStore[nullifierHash] = true;

		// Add the vote into the list
		votes.push(_vote);
	}
}
