#!/usr/bin/env node

// this script generates the content of an address_book.js file
// to watch the deployed contracts in parity.
// the output of this script must be put into [parity home]/keys/KreditsChain/address_book.json

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

let addresses, abi;
if (program.directory) {
  abi = require(path.join(program.directory, `abi.js`));
  address = require(path.join(program.directory, `address.js`));
} else {
  if (fs.existsSync(path.join(__dirname, '..', `lib/dev/address.js`))) {
    abi = require(path.join(__dirname, '..', `lib/dev/abi.js`));
    address = require(path.join(__dirname, '..', `lib/dev/address.js`));
  } else {
    abi = require(path.join(__dirname, '..', `lib/abi.js`));
    address = require(path.join(__dirname, '..', `lib/address.js`));
  }
}

let addressBook = {};
Object.keys(address).forEach(contractName => {
  addressBook[address[contractName][networkId]] = {
    meta: JSON.stringify({
      contract: true,
      deleted: false,
      timestamp: (new Date()).getTime(),
      abi: abi[contractName][networkId],
      type: "custom",
      description: ""
    }),
    name: contractName,
    uuid: null
  };
});
console.log(JSON.stringify(addressBook));
