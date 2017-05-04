#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const solc = require('solc');
const Web3 = require('web3');
const glob = require('glob');
const program = require('commander');

/* naive and hacky try for a custom deployment script */

const Config = require(path.join(__dirname, '..', 'config/contracts.js'));

program
  .version('77')
  .option('-n, --network <dev|test|main>', 'ethereum network')
  .option('-p, --provider-url <url>', 'ethereum node provider url. defaults to localhost for dev and to parity.kosmos.org for test/main')
  .option('-c, --contracts <Contract,Names>', 'comma sparated list of contracts to deploy. defaults to all kredits contracts')
  .option('-a, --account <account address>', 'account to use as creator. defaults to web3.eth.accounts[0]')
  .option('-o, --overwrite-metadata', 'overwrite existing contracts meta data')
  .option('-g, --gas <amount>', 'set GAS amount to use for deploying contracts')
  .option('-d, --directory <path/to/directory>', 'directory path where the contracts metadata should be written to')
  .parse(process.argv);

let network = program.network || 'dev';
let defaultGas = program.gas;
let providerURL;
let contractsToDeploy = program.contracts;
let overwriteMetadata = program.overwriteMetadata || false;
let contractsDirectory = path.join(path.join(__dirname), '..', 'contracts');

if (contractsToDeploy) {
  contractsToDeploy = contractsToDeploy.split(',');
} else {
  contractsToDeploy = glob.sync(path.join(contractsDirectory, '*.sol')).map((file) => {
    return file.match(/.+\/(.+)\.sol/)[1];
  });
}

if (network === 'dev') {
  providerURL = program.providerUrl || 'http://localhost:8545';
} else if (network === 'test') {
  providerURL = program.providerURL || 'https://parity.kosmos.org:8545';
} else {
  console.log('network not supported: ' + network);
  process.exit();
}
console.log(`connecting to ${providerURL}`);

let web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

let deployAccount = program.account || web3.eth.accounts[0];
console.log(`using account: ${deployAccount}`);

let contractSources = {};
let contractsMetadata = {'abi': {}, 'bytecode': {}, 'address': {}};
if (!overwriteMetadata) {
  Object.keys(contractsMetadata).forEach((m) => {
    try {
      contractsMetadata[m] = require(path.join(__dirname, '..', `lib/${m}.js`));
    } catch (e) {}
  });
}

glob(path.join(contractsDirectory, '/**/*.sol'), (err, files) => {
  if (err) { console.log(err); process.exit(1); }

  files.forEach((file) => {
    if (file.match(/\.sol/)) {
      contractSources[file] = fs.readFileSync(file).toString('utf8');
    }
  });

  console.log('compiling contracts. please wait...');
  let compiledContracts = solc.compile({sources: contractSources}, 1);

  let deployPromises = [];
  contractsToDeploy.forEach((contractName) => {
    console.log(`processing ${contractName}`);

    // hack because of no idea why. worked differently on a mac vs. linux machine
    let compiled = compiledContracts.contracts[contractName];
    if (!compiled) {
      compiled = compiledContracts.contracts['contracts/' + contractName + '.sol:' + contractName];
    }

    let abi = JSON.parse(compiled.interface);
    let bytecode = '0x' + compiled.bytecode;
    contractsMetadata['bytecode'][contractName] = bytecode;
    contractsMetadata['abi'][contractName] = abi;
    let contractConfig = Config.contracts[contractName] || {};
    let gasEstimate = defaultGas || contractConfig.gas || compiled.gasEstimates.creation[1] * 2.0; // * 2.0 - I have no idea
    let contract = web3.eth.contract(abi);
    console.log(`deploying contract ${contractName} with gas ${gasEstimate}`);
    console.log("!! If you're using parity and did not unlock your account you have to enter the password in the UI. Go there!");
    deployPromises.push(new Promise((resolve, reject) => {
      contract.new(...(contractConfig.args || []), {from: deployAccount, data: bytecode, gas: gasEstimate}, function (err, deployedContract) {
        if (err) {
          console.log(`failed deploying ${contractName}`);
          reject(err);
        } else {
          if (!deployedContract.address) {
            console.log(`transaction hash for ${contractName}: ${deployedContract.transactionHash}`);
          } else { // check address on the second call (contract deployed)
            console.log(`address for ${contractName}: ${deployedContract.address}`);
            contractsMetadata['address'][contractName] = deployedContract.address;
            resolve(deployedContract);
          }
        }
      });
    }));
  });

  Promise.all(deployPromises).then(() => {
    let directory = program.directory || path.join(__dirname, '..', 'lib');
    ['abi', 'address', 'bytecode'].forEach((metadata) => {
      let fileContent = `module.exports = ${JSON.stringify(contractsMetadata[metadata])};`;
      fs.writeFileSync(path.join(directory, `${metadata}.js`), fileContent);
    });
    console.log(`contracts metadata for ${network}  written to ${directory}`);
  }).catch((err) => {
    console.log('error deploying contracts');
    console.log(err);
  });
});
