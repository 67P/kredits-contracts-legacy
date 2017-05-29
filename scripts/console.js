#!/usr/bin/env node

const fs = require('fs');
const Web3 = require('web3');
const repl = require('repl');
const util = require('util');
const program = require('commander');
const path = require('path');
const pkg = require(path.join(__dirname, '../package.json'));

program
  .version(pkg.version)
  .option('-n, --network <dev|test|main>', 'Etherem network for which the contract will be deployed. default: dev')
  .option('-p, --provider-url <url>', 'Ethereum RPC provider url. default: dev=localhost:8545 test/main=parity.kosmos.org')
  .option('-a, --account <account address>', 'from account address. default: web3.eth.accounts[0]')
  .parse(process.argv);

let network = program.network || 'dev';
let providerURL;
if (network === 'dev') {
  providerURL = program.providerUrl || 'http://localhost:8545';
} else if (network === 'test') {
  providerURL = program.providerURL || 'https://parity.kosmos.org:8545';
} else {
  console.log('network not supported: ' + network);
  process.exit();
}
console.log(`connecting to ${providerURL}`);

global.web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

let account = program.account || global.web3.eth.accounts[0];

let networkId = web3.version.network;
console.log(`using network: ${networkId}`);
let abi, addresses;
if (fs.existsSync(path.join(__dirname, '..', `lib/dev/address.js`))) {
  console.log('found dev address/abi');
  abi = require(path.join(__dirname, '..', 'lib/dev/abi.js'));
  addresses = require(path.join(__dirname, '..', 'lib/dev/address.js'));
} else {
  abi = require(path.join(__dirname, '..', 'lib/abi.js'));
  addresses = require(path.join(__dirname, '..', 'lib/address.js'));
}

global.contracts = {};
console.log(addresses);
Object.keys(addresses).forEach(function (contractName) {
  contracts[contractName] = web3.eth.contract(abi[contractName][networkId]).at(addresses[contractName][networkId]);
  global[contractName] = contracts[contractName];
  global[contractName].allEvents({fromBlock: 'latest'}).watch((err, e) => {
    if (err) {
      console.log('event error:');
      console.log(err);
    } else {
      global['latestEvent'] = e;
      console.log(`Event: ${e.event}(${util.inspect(e.args)})`);
    }
  });
});

global.web3.eth.defaultAccount = account;

console.log('Available contracts: ');
console.log(Object.keys(global.contracts));

console.log(`accounts: ${util.inspect(global.web3.eth.accounts)}`);
repl.start('ETH> ');
