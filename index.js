var abi = require('./lib/abi.js');
var addresses = require('./lib/address.js');

module.exports = function (web3, overwriteAddresses, overwriteAbi) {
  var contractAddresses = overwriteAddresses || addresses;
  var contractAbi = overwriteAbi || abi;
  var contracts = {};

  Object.keys(abi).forEach(function (contractName) {
    contracts[contractName] = web3.eth.contract(contractAbi[contractName]).at(contractAddresses[contractName]);
  });
  return contracts;
};
