const Contracts = require('../lib/contracts.js');

let what = process.argv[2] || 'abi';
let network = process.argv[3] || 'testnet';
let contractName = process.argv[4];
if (Contracts[network][contractName]) {
  console.log(JSON.stringify(Contracts[network][contractName][what]));
} else {
  console.log(`${contractName} not found`);
}
