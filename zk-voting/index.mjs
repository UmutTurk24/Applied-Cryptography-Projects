import { buildPoseidon } from 'circomlibjs'
import { wtns, groth16 } from 'snarkjs'
import { program } from 'commander'
import { utils } from 'ffjavascript'
import fs from 'fs'

import { Wallet } from 'ethers'

import * as blockchainInterface from './blockchainInterface.mjs'

const PROVIDER = "http://127.0.0.1:8545/"

const HASHER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const VERIFIER_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
const TEST_TOKEN_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
const PREIMAGE_VERIFIER_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"

let provider = blockchainInterface.getProvider(PROVIDER)
let contractJson

contractJson = blockchainInterface.readJSON("./artifacts/contracts/TestToken.sol/TestToken.json")
let testToken = blockchainInterface.getContract(provider, TEST_TOKEN_ADDRESS, contractJson.abi)


contractJson = blockchainInterface.readJSON("./artifacts/contracts/PreimageVerifier.sol/PreimageVerifier.json")
let preimageVerifier = blockchainInterface.getContract(provider, PREIMAGE_VERIFIER_ADDRESS, contractJson.abi)

// You can create a Wallet by asking for a private key if you blockchain is a local development network
let wallet = await provider.getSigner(0)

import { MerkleTree } from './merkle_tree.mjs';

async function informRoot() {
	let poseidon = await buildPoseidon()
	let hasher = (a, b) => {
		return poseidon.F.toObject(poseidon([a, b]))
	}
	
	let merkleTree = new MerkleTree(3, hasher);
	for (var i = 0; i < 8; i++) {
		merkleTree.append(42n);
	}

	let [root, siblings, isLeft] = merkleTree.getProof(0);
	
	const circuitInput = {
		element: 42,
		siblings: siblings.map((s) => s.toString()),
		isLeft: isLeft,
		merkleRoot: root.toString() 
	}

	console.log("Hash certificate: ", circuitInput)

	// Save {root, sibling, isLeft} to a file
	fs.writeFileSync('input.json', JSON.stringify(circuitInput))

	let resultDeposit = await preimageVerifier.connect(wallet).informRoot(root); // setMerkleRoot(root) function should be called here. and don't forget to define it.
	let t1 = await resultDeposit.wait()

	console.log(resultDeposit)
	console.log(t1)
}

async function vote() { // make the filename bsed on the name you defined above (input.json)
	// Read from the file
	let {element, siblings, isLeft, merkleRoot} = JSON.parse(fs.readFileSync("input.json"))

	const circuitInput = {
		element: element, 
		siblings: siblings,
		isLeft: isLeft,
		merkleRoot: merkleRoot
	}

	console.log(circuitInput)

	let witness = {type: "mem"} // MerkleVerifier_js/MerkleVerifier.wasm
	await wtns.calculate(circuitInput, "./MerkleVerifier_js/MerkleVerifier.wasm", witness)

	const proofResponse = await groth16.prove("./MerkleVerifier_js/merkleverifier_final.zkey", witness)

	let proof = utils.unstringifyBigInts(proofResponse.proof)
	let publicSignals = utils.unstringifyBigInts(proofResponse.publicSignals)

	// // (optional) Prints proof, public part, and Solidity calldata
	console.log("Proof:")
	console.log(proof)
	console.log("Public:")
	console.log(publicSignals)
	console.log("Solidity calldata:")
	console.log(await groth16.exportSolidityCallData(proof, publicSignals))

	// Vote for 0
	let resultWithdraw = await preimageVerifier.connect(wallet).vote(
		[proof.pi_a[0], proof.pi_a[1]],
		[[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
		[proof.pi_c[0], proof.pi_c[1]],
		siblings, // nullifier
		0, // vote
	)
	
	let t1 = await resultWithdraw.wait()

	console.log(resultWithdraw)
	console.log(t1)
}

async function main() {
	program.option("-r, --rpc", "Node RPC endpoint", "'http://localhost:8545")

	program
		.command("informRoot")
		.action(informRoot)

	program
		.command("vote")
		.action(vote)

	await program.parseAsync()
}

await main()