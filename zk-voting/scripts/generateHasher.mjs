import { poseidonContract } from 'circomlibjs';
import fs from 'fs';

const outputPath = 'Poseidon.json'

function main() {
  const contract = {
    contractName: 'Poseidon',
    abi: poseidonContract.generateABI(2),
    bytecode: poseidonContract.createCode(2)
  }

  fs.writeFileSync(outputPath, JSON.stringify(contract))
}

main()