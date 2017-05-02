pragma solidity ^0.4.1;

import './dependencies/SafeMath.sol';
import './dependencies/Ownable.sol';
import './dependencies/ERC20.sol';
import './TokenFactory.sol';
import './Kredits.sol';

contract Token is ERC20, SafeMath, Ownable {
  uint public totalSupply;
  string public name;
  string public symbol;
  uint8 public decimals; 

  Token public parentToken;
  Token public childToken;

  Kredits public kredits;
  uint public creationBlock;
  bool public locked;
 
  event Locked(string reason);
  event Forked(address indexed self, address indexed child);
  event Migrated(address indexed account);
  event Minted(address indexed recipient, uint256 amount, string reference);

  mapping(address => uint) balances;
  mapping (address => mapping (address => uint)) allowed;
  mapping(address => bool) migratedToChild;

  modifier onlyWithParentToken() {
    if (parentToken == address(0)) { throw; }
    _;
  }
  modifier onlyWithChildToken() {
    if (childToken == address(0)) { throw; }
    _;
  }
  modifier onlyKredits() {
    if (msg.sender != address(kredits)) { throw; }
    _;
  }

  function Token(address _parentToken) {
    parentToken = Token(_parentToken);
    name = "Kredits"; 
    symbol = "₭S";
    decimals = 0;
    totalSupply = 0;
    locked = false;
    creationBlock = block.number;
  }

  function transfer(address _to, uint _value) returns (bool) {
    if (balances[msg.sender] < _value) {
      throw;
    }
    if (_value == 0) { 
      return true;
    }

    balances[msg.sender] = safeSub(balances[msg.sender], _value);
    balances[_to] = safeAdd(balances[_to], _value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint _value) returns (bool) {
    // not implemented
    throw;
  }

  function balanceOf(address _who) constant returns (uint balance) {
    balance = balances[_who];
    if(balance == 0) {
      balance = parentBalanceOf(_who);
    }
    return balance;
  }

  function parentBalanceOf(address _who) constant returns (uint) {
    if(parentToken != address(0)) {
      return parentToken.balanceOf(_who);
    }
    return 0;
  }

  function migrateToChild() onlyWithChildToken returns (uint) {
    if (migratedToChild[msg.sender] == true || balances[msg.sender] == 0) {
      throw;
    }
    migratedToChild[msg.sender] = true;
    childToken.mintFor(msg.sender, balances[msg.sender], 'migration');
    balances[msg.sender] = 0;
    Migrated(msg.sender);
  }
  
  function approve(address _spender, uint _value) returns (bool success) {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _owner, address _spender) constant returns (uint remaining) {
    return allowed[_owner][_spender];
  }

  function mintFor(address _recipient, uint256 _amount, string _reference) returns (bool success) {
    if (msg.sender != owner && msg.sender != address(kredits)) {
      throw;
    } else {
      totalSupply = safeAdd(totalSupply, _amount);
      balances[_recipient] = safeAdd(balances[_recipient], _amount);
      Minted(_recipient, _amount, _reference);
      return true;
    }
  }

  function setKredits(address _kredits) onlyOwner returns (bool) {
    kredits = Kredits(_kredits);
    return true;
  }
  
  function fork(address _newAddress) onlyOwner {
    childToken = Token(_newAddress);
    lock('forked');
    Forked(this, childToken);
  }

  function lock(string _reason) onlyOwner returns (bool) {
    locked = true;
    Locked(_reason);
    return locked;
  }
  
  function unlock() onlyOwner returns (bool) {
    locked = false;
    return locked;
  }

}
