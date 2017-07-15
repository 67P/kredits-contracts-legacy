pragma solidity ^0.4.11;

import './dependencies/Ownable.sol';
import './dependencies/Operatable.sol';
import './lib/ipfs-utils.sol';

contract Contributors is Ownable, Operatable {

  struct Contributor {
    address account;
    bytes32 profileHash;
    uint8 hashFunction;
    uint8 hashSize;
    bool isCore;
    bool exists;
  }

  mapping (address => uint) public contributorIds;
  mapping (uint => Contributor) public contributors;
  uint public contributorsCount;

  event ContributorProfileUpdated(uint id, bytes32 oldProfileHash, bytes32 newProfileHash);
  event ContributorAddressUpdated(uint id, address oldAddress, address newAddress);
  event ContributorAdded(uint id, address _address, bytes32 profileHash);

  function Contributors() {
    addContributor(msg.sender, '', true);
  }

  function coreContributorsCount() constant returns (uint) {
    uint count = 0;
    for (var i = 0; i < contributorsCount; i++) {
      if (contributors[i].isCore) {
        count += 1;
      }
    }
    return count;
  }

  function updateContributorAddress(uint _id, address _oldAddress, address _newAddress) onlyOperator {
    delete contributorIds[_oldAddress];
    contributorIds[_newAddress] = _id;
    contributors[_id].account = _newAddress;
    ContributorAddressUpdated(_id, _oldAddress, _newAddress);
  }

  function updateContributorProfileHash(uint _id, bytes32 _profileHash) onlyOperator {
    Contributor c = contributors[_id];
    bytes32 _oldProfileHash = c.profileHash;
    c.profileHash = _profileHash;
    c.hashFunction = 0x12;
    c.hashSize = 0x20;

    ContributorProfileUpdated(_id, _oldProfileHash, c.profileHash);
  }

  function addContributor(address _address, bytes _profileHash, bool isCore) onlyOperator {
    (hashFunction, hashSize, hash) = ipfsUtils.splitHash(_profileHash);

    uint _id = contributorsCount + 1;
    if (contributors[_id].exists != true) {
      Contributor c = contributors[_id];
      c.exists = true;
      c.isCore = isCore;
      c.hashFunction = hashFunction;
      c.hashSize = hashSize;
      c.profileHash = hash;
      c.account = _address;
      contributorIds[_address] = _id;

      contributorsCount += 1;
      ContributorAdded(_id, _address, _profileHash);
    }
  }

  function isCore(uint _id) constant returns (bool) {
    return contributors[_id].isCore;
  }

  function exists(uint _id) constant returns (bool) {
    return contributors[_id].exists;
  }

  function addressIsCore(address _address) constant returns (bool) {
    return getContributorByAddress(_address).isCore;
  }

  function addressExists(address _address) constant returns (bool) {
    return getContributorByAddress(_address).exists;
  }

  function getContributorIdByAddress(address _address) constant returns (uint) {
    return contributorIds[_address];
  }

  function getContributorAddressById(uint _id) constant returns (address) {
    return contributors[_id].account;
  }

  function getContributorByAddress(address _address) internal returns (Contributor) {
    uint id = contributorIds[_address];
    return contributors[id];
  }
}
