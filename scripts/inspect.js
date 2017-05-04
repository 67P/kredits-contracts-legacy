#!/usr/bin/env node

const program = require('commander');
const path = require('path');

program
  .version('77')
  .option('-w, --what <abi|address|bytecode>', 'what to inspect')
  .option('-c, --contractNames <Contract Name>', 'name of contract', function (val) { return val.split(','); })
  .option('-r, --raw', 'do not print contract names. Useful to c&p the output directy')
  .parse(process.argv);

let what = program.what || 'address';

const Metadata = require(path.join(__dirname, '..', `lib/${what}.js`));
let contractNames = program.contractNames || Object.keys(Metadata);

contractNames.forEach((c) => {
  let output = JSON.stringify(Metadata[c]);
  if (program.raw) {
    console.log(output);
  } else {
    console.log(`${c}:`);
    console.log(output);
  }
});
