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
  .option('-d, --directory <path/to/directory>', 'absolute(!) direcoty path where to find the metadata files.')
  .option('-w, --write', 'write the address book file to <parity dir>/keys/<chain name>/address_book.json')
  .option('--parity-dir', 'parity root share directory. default: ~/.local/share/io.parity.ethereum')
  .option('-p, --provider-url <url>', 'Ethereum RPC provider url. default: localhost:8545')
  .parse(process.argv);

let web3 = new Web3(new Web3.providers.HttpProvider(program.providerUrl));
let networkId = web3.version.network;
const parityConfig = require(path.join(__dirname, '../config/parity-dev-chain.json'));
let chainName = parityConfig['name'];
let parityDir = program.parityDir || path.join(process.env.HOME, '.local/share/io.parity.ethereum/');
let addressBookPath = path.join(parityDir, 'keys', chainName, 'address_book.json');

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
if (program.write) {
  fs.writeFileSync(addressBookPath, JSON.stringify(addressBook));
  console.log(`Written address book to ${addressBookPath}. \nPlease restart parity!`);
} else {
  console.log(JSON.stringify(addressBook));
}
