const Web3 = require('web3');
const repl = require('repl');

let providerURL = process.env.PROVIDER_URL || 'http://parity.kosmos.org:8545';
console.log(`connecting to ${providerURL}`);
global.web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

var network = process.argv[2] || 'testnet';
console.log(`using chain: ${network}`);
global.contracts = require('../index.js')(global.web3, network);

Object.keys(global.contracts).forEach((contractName) => {
  global[contractName] = global.contracts[contractName];
});
console.log('Available contracts: ');
console.log(Object.keys(global.contracts));

repl.start('ETH> ');
