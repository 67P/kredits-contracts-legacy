#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const fs = require('fs');
const Web3 = require('web3');
const pkg = require(path.join(__dirname, '../package.json'));

program
  .version(pkg.version)
  .option('-w, --what <abi|address|bytecode>', 'what to inspect. default: address')
  .option('-c, --contracts <Contract,Names>', 'comma sparated list of contracts to deploy. default: all contracts found in the meatadata file', function (val) { return val.split(','); })
  .option('-r, --raw', 'do not print contract names (when piping output somewhere)')
  .option('-d, --directory <path/to/directory>', 'absolute(!) direcoty path where to find the metadata files.')
  .option('-p, --provider-url <url>', 'Ethereum RPC provider url. default: dev=localhost:8545 test/main=parity.kosmos.org')
  .parse(process.argv);


let web3 = new Web3(new Web3.providers.HttpProvider(program.providerUrl));
let networkId = web3.version.network;
let what = program.what || 'address';

let filePath;

if (program.directory) {
  filePath = path.join(program.directory, `${what}.js`);
} else {
  if (fs.existsSync(path.join(__dirname, '..', `lib/dev/${what}.js`))) {
    filePath = path.join(__dirname, '..', `lib/dev/${what}.js`);
  } else {
    filePath = path.join(__dirname, '..', `lib/${what}.js`);
  }
}
const Metadata = require(filePath);
let contractNames = program.contracts || Object.keys(Metadata);

contractNames.forEach((c) => {
  let output;
  if (typeof Metadata[c] === 'string') {
    output = Metadata[c][networkId];
  } else {
    output = JSON.stringify(Metadata[c][networkId]);
  }
  if (program.raw) {
    console.log(output);
  } else {
    console.log(`${c}:`);
    console.log(output);
  }
});
