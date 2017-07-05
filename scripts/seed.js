#!/usr/bin/env node

const path = require('path');
const pkg = require(path.join(__dirname, '../package.json'));
const Web3 = require('web3');
const program = require('commander');
const util = require('util');
const async = require('async');

program
  .version(pkg.version)
  .option('-a, --account <account address>', 'from account address. default: web3.eth.accounts[0]')
  .parse(process.argv);

let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const abi = require(path.join(__dirname, '..', 'lib/dev/abi.js'));
const addresses = require(path.join(__dirname, '..', 'lib/dev/address.js'));

let networkId = web3.version.network;
web3.eth.defaultAccount = program.account || web3.eth.accounts[0];

let contracts = {};
Object.keys(abi).forEach((contractName) => {
  console.log(`Using ${contractName} at ${addresses[contractName][networkId]}`);
  contracts[contractName] = web3.eth.contract(abi[contractName][networkId]).at(addresses[contractName][networkId]);
});

let seeds = require(path.join(__dirname, '..', '/config/seeds.js'))(contracts);

let executors = [];
Object.keys(seeds).forEach(contract => {
  Object.keys(seeds[contract]).forEach(method => {
    seeds[contract][method].forEach(args => {
      executors.push((cb) => {
        console.log(`[${contract}] calling ${method} with ${util.inspect(args)}`);
        contracts[contract][method](...args, cb);
      });
    });
  });
});

// execution order matters. some seeds depend on each other
async.series(executors, (errors, responses) => {
  console.log('\nDone seeding');
  console.log('responses: ', responses);
  console.log('errors: ', errors);
});
