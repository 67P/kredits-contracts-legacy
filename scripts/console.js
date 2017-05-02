const Web3 = require('web3');
const repl = require('repl');
const util = require('util')

let network = process.argv[2] || 'testnet';
if (network === 'dev') {
  providerURL = process.env.PROVIDER_URL || 'http://localhost:8545';
} else if (network == 'testnet') {
  providerURL = process.env.PROVIDER_URL || 'http://parity.kosmos.org:8545';
} else {
  console.log('network not supported: ' + network);
  process.exit();
}

console.log(`connecting to ${providerURL}`);
global.web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

console.log(`using chain: ${network}`);
global.contracts = require('../index.js')(global.web3, network);

Object.keys(global.contracts).forEach((contractName) => {
  global[contractName] = global.contracts[contractName];
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

web3.eth.defaultAccount = web3.eth.accounts[0];

console.log('Available contracts: ');
console.log(Object.keys(global.contracts));

console.log(`accounts: ${util.inspect(web3.eth.accounts)}`);
repl.start('ETH> ');
