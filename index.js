const abi = require('./lib/abi.js');
const addresses = require('./lib/address.js');

module.exports = function (web3, opts = {}) {
  let networkId = opts["networkId"] || web3.version.network;
  let contracts = {};

  Object.keys(addresses).forEach(function (contractName) {
    let config = {
      address: addresses[contractName][networkId],
      abi: abi[contractName][networkId]
    };

    let contractOpts = opts[contractName];
    ['address', 'abi'].forEach(m => {
      if (contractOpts && contractOpts[m]) {
        config[m] = contractOpts[m];
      }
    });
    if(!config.abi) { throw 'ABI not found for contract: ' + contractName; }
    if(!config.address) { throw 'address not found for contract: ' + contractName;}

    contracts[contractName] = web3.eth.contract(config.abi).at(config.address);
  });

  return contracts;
};
