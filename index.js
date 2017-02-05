const Contracts = require('./lib/contracts.js');

module.exports = function (web3) {
  let contracts = {};
  Object.keys(Contracts).forEach((contractName) => {
    contracts[contractName] = web3.eth.contract(Contracts[contractName].abi).at(Contracts[contractName].address);
  });
  return contracts;
};

