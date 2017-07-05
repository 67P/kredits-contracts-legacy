pragma solidity ^0.4.1;

import './Token.sol';
import './KreditsContributors.sol';

contract Kredits {
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
  KreditsContributors contributors;

  Proposal[] public proposals;
  uint votesNeeded;

  address public creator;
  string public ipfsHash;

  event ProposalCreated(uint256 id, address creator, address recipient, uint256 amount, string url, string ipfsHash);
  event ProposalVoted(uint256 id, address voter);
  event ProposalVoted(uint256 id, address voter, uint256 totalVotes);
  event ProposalExecuted(uint256 id, address recipient, uint256 amount, string url, string ipfsHash);

  modifier coreOnly() { if(contributors.isCore(msg.sender)) { _; } else { throw; } }
  modifier contributorOnly() { if(contributors.exists(msg.sender)) { _; } else { throw; } }
  modifier noEther() { if (msg.value > 0) throw; _; }

  function Kredits(string _ipfsHash) {
    votesNeeded = 2;
    creator = msg.sender;
    ipfsHash = _ipfsHash;
  }

  function setTokenContract(address _address) coreOnly {
    kredits = Token(_address);
  }

  function setContributorsContract(address _address) {
    contributors = KreditsContributors(_address);
  }

  function updateOperatorContract(address _newOperatorAddress) {
    contributors.setOperatorContract(_newOperatorAddress);
    kredits.setOperatorContract(_newOperatorAddress);
  }

  function contributorsCount() constant returns (uint) {
    return contributors.contributorsCount();
  }

  function addContributor(address _address, string _name, string _ipfsHash, bool isCore, string _id) coreOnly {
    contributors.addContributor(_address, _name, _ipfsHash, isCore, _id);
  }
  
  function updateContributor(address _address, string _name, string _ipfsHash, bool isCore, string _id) coreOnly {
    contributors.updateContributor(_address, _name, _ipfsHash, isCore, _id);
  }
  
  function proposalsCount() constant returns (uint) {
    return proposals.length;
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
    ProposalVoted(_pId, msg.sender, p.votesCount);
  }

  function hasVotedFor(address _sender, uint256 _proposalId) public constant returns (bool) {
    Proposal p = proposals[_proposalId];
    return p.exists && p.votes[_sender];
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
