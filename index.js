const Contracts = require('./lib/contracts.js');

module.exports = function (web3, chain, contractAddresses) {
  var contracts = {};
  var network = chain || 'main';
  Object.keys(Contracts[network]).forEach(function (contractName) {
    var address;
    if (contractAddresses && contractAddresses[contractName]) {
      address = contractAddresses[contractName];
    } else {
      address = Contracts[network][contractName].address;
    }
    contracts[contractName] = web3.eth.contract(Contracts[network][contractName].abi).at(address);
  });
  return contracts;
};

