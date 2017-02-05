pragma solidity ^0.4.1;

import './Token.sol';

contract Kredits is Token {
  struct Person {
    string id;
    string name;
    string ipfsHash;
    bool exists;
    bool isCore;
  }
  struct Proposal {
    address creator;
    address recipient;
    uint votesCount;
    uint votesNeeded;
    uint256 amount;
    bool executed;
    string url;
    string ipfsHash;
    mapping (address => bool) votes;
    bool exists;
  }


  Proposal[] public proposals;
  uint votesNeeded;

  mapping (address => Person) public contributors;
  address[] public contributorAddresses;

  address public creator;
  string public ipfsHash;

  event ContributorAdded(address _address, string _id, string _name, string _ipfsHash, bool _isCore);
  event ProposalCreated(uint256 _id, address _creator, address _recipient, uint256 _amount, string _url, string _ipfsHash);
  event ProposalExecuted(uint256 _id, address _recipient, uint256 _amount, string _url, string _ipfsHash);

  modifier coreOnly() { if (!contributors[msg.sender].isCore) { throw; } _; }
  modifier contributorOnly() { if (!contributors[msg.sender].exists) { throw; } _; }
  modifier noEther() { if (msg.value > 0) throw; _; }

  function Kredits(string _ipfsHash) {
    name = "Kredit"; 
    symbol = "₭S";
    decimals = 0;
    totalSupply = 0;
    creator = msg.sender;
    ipfsHash = _ipfsHash;
    Person p = contributors[msg.sender];
    p.exists = true;
    p.isCore = true;
    contributorAddresses.push(msg.sender);
    votesNeeded = 2;
  }

  function contributorsCount() constant returns (uint) {
    return contributorAddresses.length;
  }
  function proposalsCount() constant returns (uint) {
    return proposals.length;
  }

  function mintFor(address _recipient, uint256 _amount) noEther coreOnly returns (bool success) {
    addContributor(_recipient, "", "", false, "");
    totalSupply = totalSupply + _amount;
    balances[_recipient] += _amount;
    return true;
  }

  function addContributor(address _address, string _name, string _ipfsHash, bool isCore, string _id) noEther coreOnly returns (bool success) {
    if(contributors[_address].exists != true) {
      Person p = contributors[_address];
      p.exists = true;
      p.isCore = isCore;
      p.name = _name;
      p.ipfsHash = _ipfsHash;
      p.id = _id;
      contributorAddresses.push(_address);
      ContributorAdded(_address, p.id, p.name, p.ipfsHash, p.isCore);
    }
    return true;
  }

  function updateContributor(address _address, string _name, string _ipfsHash, bool isCore, string _id) noEther coreOnly returns (bool success) {
    if(contributors[_address].exists != true) { throw; }
    Person p = contributors[_address];
    p.exists = true;
    p.isCore = isCore;
    p.name = _name;
    p.ipfsHash = _ipfsHash;
    p.id = _id;
    return true;
  }

  function removeContributor(address _address) noEther coreOnly returns (bool) {
    contributors[_address].exists = false;
  }

  function updateProfile(string _name, string _id, string _ipfsHash) contributorOnly noEther returns (bool success) {
    if(contributors[msg.sender].exists == true) {
      Person p = contributors[msg.sender];
      p.name = _name;
      p.id = _id;
      p.ipfsHash = _ipfsHash;
    }
  }

  function addProposal(address _recipient, uint256 _amount, string _url, string _ipfsHash) public noEther returns (uint256 proposalId) {
    proposalId = proposals.length;
    var _votesNeeded = votesNeeded; // TODO: calculation depending on amount
    
    var p = Proposal({creator: msg.sender, recipient: _recipient, amount: _amount, url: _url, ipfsHash: _ipfsHash, votesCount: 0, votesNeeded: _votesNeeded, executed: false, exists: true});
    proposals.push(p);
    ProposalCreated(proposalId, msg.sender, p.recipient, p.amount, p.url, p.ipfsHash);
  }
  
  function vote(uint256 _proposalId) public noEther coreOnly returns (uint _pId, bool _executed) {
    var p = proposals[_proposalId];
    if(p.executed) { throw; }
    if(p.votes[msg.sender] == true) { throw; }
    p.votes[msg.sender] = true;
    p.votesCount++;
    _executed = false;
    _pId = _proposalId;
    if(p.votesCount >= p.votesNeeded) {
      executeProposal(_proposalId);
      _executed = true;
    }
  }

  function executeProposal(uint proposalId) private returns (bool) {
    var p = proposals[proposalId];
    if(p.executed) { throw; }
    if(p.votesCount < p.votesNeeded) { throw; }
    addContributor(p.recipient, "", "", false, "");
    mintFor(p.recipient, p.amount);
    p.executed = true;
    ProposalExecuted(proposalId, p.recipient, p.amount, p.url, p.ipfsHash);    
    return true;
  }

 
  function kill() public noEther {
    if(msg.sender != creator) { throw; }
    suicide(creator);
  }
}
