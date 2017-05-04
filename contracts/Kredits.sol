pragma solidity ^0.4.1;

import './Token.sol';

contract Kredits {
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

  Token kredits;
  Proposal[] public proposals;
  uint votesNeeded;

  mapping (address => Person) public contributors;
  address[] public contributorAddresses;

  address public creator;
  string public ipfsHash;

  event ContributorAdded(address account, string id, string name, string ipfsHash, bool isCore);
  event ProposalCreated(uint256 id, address creator, address recipient, uint256 amount, string url, string ipfsHash);
  event ProposalVoted(uint256 id, address voter);
  event ProposalExecuted(uint256 id, address recipient, uint256 amount, string url, string ipfsHash);

  modifier coreOnly() { if (!contributors[msg.sender].isCore) { throw; } _; }
  modifier contributorOnly() { if (!contributors[msg.sender].exists) { throw; } _; }
  modifier noEther() { if (msg.value > 0) throw; _; }

  function Kredits(address tokenAddress, address contributor, string _ipfsHash) {
    votesNeeded = 2;
    kredits = Token(tokenAddress);
    creator = msg.sender;
    ipfsHash = _ipfsHash;
    Person p = contributors[contributor];
    p.exists = true;
    p.isCore = true;
    contributorAddresses.push(contributor);
  }

  function contributorsCount() constant returns (uint) {
    return contributorAddresses.length;
  }
  function proposalsCount() constant returns (uint) {
    return proposals.length;
  }

  function addContributor(address _address, string _name, string _ipfsHash, bool isCore, string _id) noEther returns (bool success) {
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
    ProposalVoted(_pId, msg.sender);
  }

  function executeProposal(uint proposalId) private returns (bool) {
    var p = proposals[proposalId];
    if(p.executed) { throw; }
    if(p.votesCount < p.votesNeeded) { throw; }
    addContributor(p.recipient, "", "", false, "");
    kredits.mintFor(p.recipient, p.amount, "");
    p.executed = true;
    ProposalExecuted(proposalId, p.recipient, p.amount, p.url, p.ipfsHash);    
    return true;
  }

 
  function kill() public noEther {
    if(msg.sender != creator) { throw; }
    selfdestruct(creator);
  }
}
