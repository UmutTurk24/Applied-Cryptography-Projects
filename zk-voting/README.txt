// Install dependencies
npm install
sudo npm install -g snarkjs@latest

git clone https://github.com/iden3/circom.git
cd circom
cargo build --release


// Setup ZK
run snark1 (ptau) and snark2 (generate verification key) scripts

sh -x scripts/snark1-ptau.sh 
sh -x scripts/snark2-compile-genverification.sh MerkleVerifier
cd PreimageVerifier_js // MerkleVerifier_js
snarkjs zkey export solidityverifier preimageverifier_final.zkey ../contracts/Verifier.sol // snarkjs zkey export solidityverifier merkleverifier_final.zkey ../contracts/Verifier.sol

// Edit and change the name of the contract (Verifier.sol) name to Verifier

// Generate Poseidon hasher
node scripts/generateHasher.mjs

// Compile contracts

** Change the name of the verifier contract from XXXXVerifier to Verifier within the file
npx hardhat compile

// Launch blockchain, deploy scripts, run example
npx hardhat node

node scripts/deploy.mjs

node index.mjs informRoot 
node index.mjs vote 