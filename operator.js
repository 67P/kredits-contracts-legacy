/* global module, Buffer */
const abi = require('./lib/abi.js');
const addresses = require('./lib/address.js');
const base58 = require('base-58');

module.exports = function(web3, contractOpts = {}) {
  this.networkId = contractOpts['networkId'] || web3.version.network;
  this.contractName = 'Operator';

  this.config = {
    address: addresses[this.contractName][this.networkId],
    abi: abi[this.contractName][this.networkId]
  };

  ['address', 'abi'].forEach(m => {
    if (contractOpts && contractOpts[m]) {
      this.config[m] = contractOpts[m];
    }
  });
  if (!this.config.abi) { throw 'ABI not found for contract: ' + this.contractName; }
  if (!this.config.address) { throw 'address not found for contract: ' + this.contractName;}

  this.contract = web3.eth.contract(this.config.abi).at(this.config.address);

  this.getValueFromContract = function(contractMethod, ...args) {
    return new Promise((resolve, reject) => {
      this.contract[contractMethod](...args, (err, data) => {
        if (err) { reject(err); return; }
        resolve(data);
      });
    });
  };

  //
  // Contributors
  //

  this.contributorsCount = function() {
    return this.getValueFromContract('contributorsCount');
  };

  this.addContributor = function(address, profileHashBase58, isCore) {
    const profileHashHex = Buffer.from(base58.decode(profileHashBase58))
                                 .toString('hex');

    return new Promise((resolve, reject) => {
      this.contract.addContributor(address, '0x'+profileHashHex, isCore, (err, res) => {
        if (err) { reject(err); } else { resolve(res); }
      });
    });
  };

  this.getContributor = function(id) {
    return new Promise((resolve, reject) => {
      this.contract.getContributor(id, (err, res) => {
        if (err) { reject(err); return; }
        const profileHashHex = res[1].replace('0x','');
        const profileHashBase58 = base58.encode(new Buffer(profileHashHex, 'hex'));
        const contributor = {
          id: id,
          address: res[0],
          profileHash: profileHashBase58,
          isCore: res[2]
        };
        resolve(contributor);
      });
    });
  };

  //
  // Proposals
  //

  this.proposalsCount = function() {
    return this.getValueFromContract('proposalsCount');
  };

  this.proposals = function(i) {
    return this.getValueFromContract('proposals', i);
  };

  //
  // Events
  //

  this.allEvents = function(filters = {}) {
    return this.contract.allEvents(filters);
  };

};
