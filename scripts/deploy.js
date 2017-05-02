const fs = require('fs');
const path = require('path');
const solc = require('solc');
const Web3 = require('web3');
const glob = require('glob');

/* naiv and hacky try for a custom deployment script */

const Config = require(path.join(__dirname, '..', 'config/contracts.js'));

let currentContracts = require(path.join(__dirname, '..', 'lib/contracts.js'));
let network = process.argv[2] || 'testnet';
let defaultGas = 4000000;
let providerURL;
let overwrite = process.argv[3] || false;

if (network === 'dev') {
  providerURL = process.env.PROVIDER_URL || 'http://localhost:8545';
} else if (network == 'testnet') {
  providerURL = process.env.PROVIDER_URL || 'http://parity.kosmos.org:8545';
} else {
  console.log('network not supported: ' + network);
  process.exit();
}
console.log(`connecting to ${providerURL}`);

let web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

let deployAccount = web3.eth.accounts[0];
console.log(`using account: ${deployAccount}`);

let contractSources = {};
let contracts = {};

glob("contracts/**/*.sol", (err, files) => {
  if (err) { console.log(err); process.exit(1); }

  files.forEach((file) => {
    console.log(file);
    if (file.match(/\.sol/)) {
      contractSources[file] = fs.readFileSync(path.join(__dirname, '..', file)).toString('utf8');
    }
  });

  console.log('compiling contracts. please wait...');
  let compiledContracts = solc.compile({sources: contractSources}, 1);

  let deployPromisses = [];
  //Object.keys(Config.contracts).forEach((contractName) => {
  ['Token', 'TokenFactory'].forEach((contractName) => {
    console.log(`processing ${contractName}`);
    console.log(Object.keys(compiledContracts.contracts));
    let compiled = compiledContracts.contracts['contracts/' + contractName + '.sol:' + contractName];
    let abi = JSON.parse(compiled.interface);
    let bytecode = '0x' + compiled.bytecode;
    contracts[contractName] = {abi: abi};
    let contractConfig = Config.contracts[contractName] || {};
    let gasEstimate = defaultGas; //compiled.gasEstimates.creation[1]; //contractConfig.gas; // compiled.gasEstimates.creation[1];
    let contract = web3.eth.contract(abi);
    console.log(`deploying contract ${contractName} with gas ${gasEstimate}`);

    deployPromisses.push(new Promise((resolve, reject) => {
      contract.new(...(contractConfig.args||[]), {from: deployAccount, data: bytecode, gas: gasEstimate}, function (err, deployedContract) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          if (!deployedContract.address) {
            console.log(`transaction hash for ${contractName}: ${deployedContract.transactionHash}`);
          } else { // check address on the second call (contract deployed)
            console.log(`address for ${contractName}: ${deployedContract.address}`);
            contracts[contractName].address = deployedContract.address;
            resolve(deployedContract);
          }
        }
      });
    }));
  });

  Promise.all(deployPromisses).then((deployedContracts) => {
    let newContracts = currentContracts;
    if (overwrite) {
      newContracts[network] = contracts;
    } else {
      if (!newContracts[network]) {
        newContracts[network] = {};
      }
      Object.keys(contracts).forEach((name) => {
        newContracts[network][name] = contracts[name];
      });
    }
    let fileContent = `module.exports = ${JSON.stringify(newContracts)};`;
    fs.writeFileSync('lib/contracts.js', fileContent);

    console.log(`contracts details for ${network}  written to lib/contracts.js`);
  }).catch((err) => {
    console.log('error deploying contracts');
    console.log(err);
  });
});

