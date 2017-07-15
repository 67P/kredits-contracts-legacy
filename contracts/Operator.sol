pragma solidity ^0.4.11;

import './dependencies/Ownable.sol';
import './lib/ipfs-utils.sol';
import './Token.sol';
import './Contributors.sol';

contract Operator is Ownable {

  struct Contributor {
    address account;
    string profileHash;
    bool exists;
    bool isCore;
  }

  struct Proposal {
    address creator;
    uint recipientId;
    uint votesCount;
    uint votesNeeded;
    uint256 amount;
    bool executed;
    string ipfsHash;
    mapping (address => bool) votes;
    bool exists;
  }

  Token kredits;
  Contributors public contributors;

  Proposal[] public proposals;

  event ProposalCreated(uint256 id, address creator, uint recipient, uint256 amount, string ipfsHash);
  event ProposalVoted(uint256 id, address voter);
  event ProposalVoted(uint256 id, address voter, uint256 totalVotes);
  event ProposalExecuted(uint256 id, uint recipient, uint256 amount, string ipfsHash);

  modifier coreOnly() { if(contributors.addressIsCore(msg.sender)) { _; } else { throw; } }
  modifier contributorOnly() { if(contributors.addressExists(msg.sender)) { _; } else { throw; } }
  modifier noEther() { if (msg.value > 0) throw; _; }

  function Kredits(address _contributorsAddress) {
    contributors = Contributors(_contributorsAddress);
  }

  function setTokenContract(address _address) coreOnly {
    kredits = Token(_address);
  }

  function setContributorsContract(address _address) {
    if (msg.sender != owner) { throw; }
    contributors = Contributors(_address);
  }

  function updateOperatorContract(address _newOperatorAddress) coreOnly {
    contributors.setOperatorContract(_newOperatorAddress);
    kredits.setOperatorContract(_newOperatorAddress);
  }

  function contributorsCount() constant returns (uint) {
    return contributors.contributorsCount();
  }

  function addContributor(address _address, bytes _profileHash, bool isCore) coreOnly {
    contributors.addContributor(_address, _profileHash, isCore);
  }

  function updateContributorProfileHash(uint _id, bytes32 _profileHash) coreOnly {
    contributors.updateContributorProfileHash(_id, _profileHash);
  }

  function updateContributorAddress(uint _id, address _oldAddress, address _newAddress) coreOnly {
    contributors.updateContributorAddress(_id, _oldAddress, _newAddress);
    kredits.migrateBalance(_oldAddress, _newAddress);
  }

  function getContributor(uint _id) constant returns (address account, bytes hash, bool isCore) {
    uint8 hashFunction;
    uint8 hashSize;
    bool exists;

    (account, profileHash, hashFunction, hashSize,  isCore, exists) = contributors.contributors(_id);

    if (!exists) { throw; }

    hash = ipfsUtils.combineHash(hashFunction, hashSize, profileHash)
  }

  function proposalsCount() constant returns (uint) {
    return proposals.length;
  }

  function addProposal(uint _recipient, uint256 _amount, string _ipfsHash) public returns (uint256 proposalId) {
    if (!contributors.exists(_recipient)) { throw; }

    proposalId = proposals.length;
    uint _votesNeeded = contributors.coreContributorsCount() / 100 * 75;

    var p = Proposal({
      creator: msg.sender,
      recipientId: _recipient,
      amount: _amount,
      ipfsHash: _ipfsHash,
      votesCount: 0,
      votesNeeded: _votesNeeded,
      executed: false,
      exists: true
    });
    proposals.push(p);
    ProposalCreated(proposalId, msg.sender, p.recipientId, p.amount, p.ipfsHash);
  }

  function vote(uint256 _proposalId) public coreOnly returns (uint _pId, bool _executed) {
    var p = proposals[_proposalId];
    if (p.executed) { throw; }
    if (p.votes[msg.sender] == true) { throw; }
    p.votes[msg.sender] = true;
    p.votesCount++;
    _executed = false;
    _pId = _proposalId;
    if (p.votesCount >= p.votesNeeded) {
      executeProposal(_proposalId);
      _executed = true;
    }
    ProposalVoted(_pId, msg.sender, p.votesCount);
  }

  function hasVotedFor(address _sender, uint256 _proposalId) public constant returns (bool) {
    Proposal p = proposals[_proposalId];
    return p.exists && p.votes[_sender];
  }

  function executeProposal(uint proposalId) private returns (bool) {
    var p = proposals[proposalId];
    if (p.executed) { throw; }
    if (p.votesCount < p.votesNeeded) { throw; }
    address recipientAddress = contributors.getContributorAddressById(p.recipientId);
    kredits.mintFor(recipientAddress, p.amount, p.recipientId, p.ipfsHash);
    p.executed = true;
    ProposalExecuted(proposalId, p.recipientId, p.amount, p.ipfsHash);
    return true;
  }

}
