const fs = require('fs');
const path = require('path');
const solc = require('solc');
const Web3 = require('web3');

/* naiv and hacky try for a custom deployment script */

const Config = require(path.join(__dirname, '..', 'config/contracts.js'));

let currentContracts = require(path.join(__dirname, '..', 'lib/contracts.js'));
let network = process.argv[2] || 'testnet';

let providerURL = process.env.PROVIDER_URL || 'http://parity.kosmos.org:8545';
console.log(`connecting to ${providerURL}`);

let web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

let deployAccount = web3.eth.accounts[0];
console.log(`using account: ${deployAccount}`);

let contractSources = {};
let contracts = {};

fs.readdir('contracts', (err, files) => {
  if (err) { console.log(err); process.exit(1); }

  files.forEach((file) => {
    if (file.match(/\.sol/)) {
      contractSources[file] = fs.readFileSync(path.join(__dirname, '..', 'contracts', file)).toString('utf8');
    }
  });

  console.log('compiling contracts. please wait...');
  let compiledContracts = solc.compile({sources: contractSources}, 1);

  let deployPromisses = [];
  Object.keys(Config.contracts).forEach((contractName) => {
    console.log(`processing ${contractName}`);
    let compiled = compiledContracts.contracts[contractName + '.sol:' + contractName];
    let abi = JSON.parse(compiled.interface);
    let bytecode = '0x' + compiled.bytecode;
    contracts[contractName] = {abi: abi};
    let gasEstimate = Config.contracts[contractName].gas; // compiled.gasEstimates.creation[1];
    let contract = web3.eth.contract(abi);
    console.log(`deploying contract ${contractName}`);

    deployPromisses.push(new Promise((resolve, reject) => {
      contract.new(...Config.contracts[contractName].args, {from: deployAccount, data: bytecode, gas: gasEstimate}, function (err, deployedContract) {
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
    newContracts[network] = contracts;
    let fileContent = `module.exports = ${JSON.stringify(newContracts)};`;
    fs.writeFileSync('lib/contracts.js', fileContent);

    console.log(`contracts details for ${network}  written to lib/contracts.js`);
  }).catch((err) => {
    console.log('error deploying contracts');
    console.log(err);
  });
});

