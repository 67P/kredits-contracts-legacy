#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const pkg = require(path.join(__dirname, '../package.json'));

program
  .version(pkg.version)
  .option('-w, --what <abi|address|bytecode>', 'what to inspect. default: address')
  .option('-c, --contracts <Contract,Names>', 'comma sparated list of contracts to deploy. default: all contracts found in the meatadata file')
  .option('-r, --raw', 'do not print contract names (when piping output somewhere)')
  .parse(process.argv);

let what = program.what || 'address';

const Metadata = require(path.join(__dirname, '..', `lib/${what}.js`));
let contractNames = program.contracts || Object.keys(Metadata);

contractNames.forEach((c) => {
  let output = JSON.stringify(Metadata[c]);
  if (program.raw) {
    console.log(output);
  } else {
    console.log(`${c}:`);
    console.log(output);
  }
});
