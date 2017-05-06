const abi = require('./lib/abi.js');
const addresses = require('./lib/address.js');

module.exports = function (web3, opts = {}) {
  let contracts = {};
  Object.keys(abi).forEach(function (contractName) {
    let config = {
      address: addresses[contractName],
      abi: abi[contractName]
    };

    let contractOpts = opts[contractName];
    ['address', 'abi'].forEach(m => {
      if (contractOpts && contractOpts[m]) {
        config[m] = contractOpts[m];
      }
    });

    contracts[contractName] = web3.eth.contract(config.abi).at(config.address);
  });

  return contracts;
};
