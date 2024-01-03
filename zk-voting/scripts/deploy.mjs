import * as ethers from 'ethers'

import * as blockchainInterface from '../blockchainInterface.mjs'

const PROVIDER = "http://127.0.0.1:8545/"

// Deploy contracts

// JSON RPC endpoint of a node
let provider = blockchainInterface.getProvider(PROVIDER)

let wallet = await provider.getSigner(0)
// The second parameter immediately connects the wallet to provider
// let wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider)
// No second parameter accepted, so connect to provider manually
// let wallet = new ethers.Wallet.fromMnemonic("word1 word2 ...")

let contractJson
let receipt

contractJson = blockchainInterface.readJSON("Poseidon.json")
let Hasher = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet)
let hasher = await Hasher.deploy()
// Wait until the transaction is mined and gets the receipt
receipt  = await hasher.deploymentTransaction().wait()
console.log(receipt)

contractJson = blockchainInterface.readJSON("./artifacts/contracts/Verifier.sol/Verifier.json")
let Verifier = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet)
let verifier = await Verifier.deploy()
// Wait until the transaction is mined and gets the receipt
receipt  = await verifier.deploymentTransaction().wait()
console.log(receipt)

contractJson = blockchainInterface.readJSON("./artifacts/contracts/TestToken.sol/TestToken.json")
let TestToken = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet)
let testToken = await TestToken.deploy()
// Wait until the transaction is mined and gets the receipt
receipt  = await testToken.deploymentTransaction().wait()
console.log(receipt)

contractJson = blockchainInterface.readJSON("./artifacts/contracts/PreimageVerifier.sol/PreimageVerifier.json") // MAKE THE CHANGES HERE, FUNCTION NAMES ETC
let PreimageVerifier = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet)
let preimageVerifier = await PreimageVerifier.deploy(await testToken.getAddress(), await hasher.getAddress(), await verifier.getAddress())
// Wait until the transaction is mined and gets the receipt
receipt  = await preimageVerifier.deploymentTransaction().wait()
console.log(receipt)

console.log("const HASHER_ADDRESS = \"" + await hasher.getAddress() + "\";")
console.log("const VERIFIER_ADDRESS = \"" + await verifier.getAddress() + "\";")
console.log("const TEST_TOKEN_ADDRESS = \"" + await testToken.getAddress() + "\";")
console.log("const PREIMAGE_VERIFIER_ADDRESS = \"" + await preimageVerifier.getAddress() + "\";")