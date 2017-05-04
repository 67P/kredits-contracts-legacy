module.exports = function (web3, chain, overwriteAddresses) {
  var network = chain || 'main';
  var contractAbi = require('./lib/' + network + '/abi.js');
  var addresses = require('./lib/' + network + '/address.js');
  var contractAddresses = overwriteAddresses || addresses;

  var contracts = {};
  Object.keys(contractAbi).forEach(function (contractName) {
    var address = contractAddresses[contractName];
    contracts[contractName] = web3.eth.contract(contractAbi[contractName]).at(address);
  });
  return contracts;
};

