const Contracts = require('./lib/contracts.js');

module.exports = function (web3) {
  var contracts = {};
  Object.keys(Contracts).forEach(function (contractName) {
    contracts[contractName] = web3.eth.contract(Contracts[contractName].abi).at(Contracts[contractName].address);
  });
  return contracts;
};

