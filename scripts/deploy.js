#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pkg = require(path.join(__dirname, '../package.json'));
const solc = require('solc');
const Web3 = require('web3');
const glob = require('glob');
const program = require('commander');

/* naive and hacky try for a custom deployment script */

const Config = require(path.join(__dirname, '..', 'config/contracts.js'));

program
  .version(pkg.version)
  .option('-n, --network <dev|test|main>', 'Etherem network for which the contract will be deployed. default: dev')
  .option('-p, --provider-url <url>', 'Ethereum RPC provider url. default: dev=localhost:8545 test/main=parity.kosmos.org')
  .option('-c, --contracts <Contract,Names>', 'comma sparated list of contracts to deploy. default: all .sol files in the contracts directory', function (val) { return val.split(','); })
  .option('-a, --account <account address>', 'from account address. default: web3.eth.accounts[0]')
  .option('-o, --overwrite-metadata', 'overwrite existing contracts meta data. if true writes new address/abi files and does not merge current data')
  .option('-g, --gas <amount>', 'gas amount to use for deploying contracts')
  .option('-d, --directory <path/to/directory>', 'direcoty path to which the metadata files are saved')
  .option('-m, --manual-deployment', 'print contract deployment data for manual deployment. does not deploy the contract')
  .parse(process.argv);

let network = program.network || 'dev';
let defaultGas = program.gas;
let contractsToDeploy = program.contracts;
let overwriteMetadata = program.overwriteMetadata || false;
let contractsDirectory = path.join(path.join(__dirname), '..', 'contracts');
let manualDeployment = program.manualDeployment || false;

let networks = { dev: 'http://localhost:8545', test: 'https://parity.kosmos.org:8545' };
let providerURL = program.providerUrl || networks[network];
console.log(`connecting to ${providerURL}`);

let web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

// loading all sources of our contracts that we want to deploy
// by default these are all .sol files in the ./contracts directory - but not sub directories (like dependencies)
if (!contractsToDeploy) {
  contractsToDeploy = glob.sync(path.join(contractsDirectory, '*.sol')).map((file) => {
    return file.match(/.+\/(.+)\.sol/)[1];
  });
}

let contractSources = {};
// load existing contract metadata (abi/address)
// helpful when only deploying specific contracts to not loose existing metadata
let contractsMetadata = {'abi': {}, 'bytecode': {}, 'address': {}};
if (!overwriteMetadata) {
  Object.keys(contractsMetadata).forEach((m) => {
    try {
      contractsMetadata[m] = require(path.join(__dirname, '..', `lib/${m}.js`));
    } catch (e) {}
  });
}

// read contract sources for all contracts INCLUDING dependencies - which are all .sol files in the contracts directory including sub directories
glob.sync(path.join(contractsDirectory, '/**/*.sol')).forEach((file) => {
  if (file.match(/\.sol/)) {
    contractSources[file] = fs.readFileSync(file).toString('utf8');
  }
});

// use solc to complie the contracts
console.log('compiling contracts. please wait...');
let compiledContracts = solc.compile({sources: contractSources}, 1);

if (compiledContracts.errors) {
  console.log('compilation failed with the following errors:');
  compiledContracts.errors.forEach(error => console.log(error));
  process.exit(1);
}

console.log(`compiled contracts: ${Object.keys(compiledContracts.contracts)}`);
let deployPromises = [];
contractsToDeploy.forEach((contractName) => {
  // hack because of no idea why. worked differently on a mac vs. linux machine
  let compiled = compiledContracts.contracts[contractName];
  if (!compiled) {
    compiled = compiledContracts.contracts[contractsDirectory + '/' + contractName + '.sol:' + contractName];
  }
  if (!compiled) { // still not found?
    console.log(`${contractName} not found in compiled contracts. fatal.`);
  }
  let abi = JSON.parse(compiled.interface);
  let bytecode = '0x' + compiled.bytecode;
  contractsMetadata['bytecode'][contractName] = bytecode;
  contractsMetadata['abi'][contractName] = abi;
  let contractConfig = Config.contracts[contractName] || {};
  let gasEstimate = defaultGas || contractConfig.gas || compiled.gasEstimates.creation[1] * 2.0; // * 2.0 - I have no idea why gas estimation does not work
  let contract = web3.eth.contract(abi);

  // if we want to deploy the contract from another, not connected wallet we only print the contract data that can be used in a manual transaction
  // otherwise we deploy the contract through the connected node using the specified deployAccount
  if (manualDeployment) {
    let contractDeplyData = contract.new.getData(...(contractConfig.args || []), {data: bytecode});
    console.log(`\nUse the following data to deploy ${contractName}:`);
    console.log(contractDeplyData);
  } else {
    let deployAccount = program.account || web3.eth.accounts[0];
    console.log(`deploying contract ${contractName} with gas ${gasEstimate} and account ${deployAccount}`);
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
  }
});

// for non manual deployments we wait until the deploy transactions are mined and write the metadata (abi, address) to the lib directory
if (!manualDeployment) {
  Promise.all(deployPromises).then(() => {
    let directory = program.directory || path.join(__dirname, '..', 'lib/dev');
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
    ['abi', 'address', 'bytecode'].forEach((metadata) => {
      let fileContent = `module.exports = ${JSON.stringify(contractsMetadata[metadata])};`;
      fs.writeFileSync(path.join(directory, `${metadata}.js`), fileContent);
    });
    console.log(`contracts metadata for ${network} network written to ${directory}`);
  }).catch((err) => {
    console.log('error deploying contracts');
    console.log(err);
  });
}
