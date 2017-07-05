pragma solidity ^0.4.11;

import './dependencies/Ownable.sol';

contract Contributors is Ownable {

  struct Contributor {
    string id;
    string name;
    string ipfsHash;
    bool exists;
    bool isCore;
    uint addedAt;
  }

  mapping (address => Contributor) public contributors;
  mapping (uint => address) public ContributorIds;
  uint public contributorsCount;

  address public operator;

  event ContributorUpdated(address _address, string id, string name, string ipfsHash);
  event ContributorAdded(address _address, string id, string name, string ipfsHash);

  modifier onlyOperator() { if (msg.sender != operator) { throw; } _; }

  function setOperatorContract(address _address) onlyOperator {
    operator = _address;
  }

  function updateContributor(address _address, string _name, string _ipfsHash, bool isCore, string _id) onlyOperator {
    if(contributors[_address].exists != true) {
      throw;
    } else {
      Contributor c = contributors[_address];
      c.isCore = isCore;
      c.name = _name;
      c.ipfsHash = _ipfsHash;
      c.id = _id;
      ContributorUpdated(_address, c.id, c.name, c.ipfsHash);
    }
  }

  function addContributor(address _address, string _name, string _ipfsHash, bool isCore, string _id) onlyOperator {
    if(contributors[_address].exists != true) {
      Contributor c = contributors[_address];
      c.exists = true;
      c.isCore = isCore;
      c.name = _name;
      c.ipfsHash = _ipfsHash;
      c.id = _id;
      contributorsCount += 1;
      ContributorIds[contributorsCount] = _address;
      ContributorAdded(_address, c.id, c.name, c.ipfsHash);
    }
  }

  function isCore(address _address) constant returns (bool) {
    return contributors[_address].isCore;
  }

  function exists(address _address) constant returns (bool) {
    return contributors[_address].exists;
  }
}
