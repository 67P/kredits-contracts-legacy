pragma solidity ^0.4.11;

import './dependencies/SafeMath.sol';
import './dependencies/Ownable.sol';
import './dependencies/Operatable.sol';
import './dependencies/ERC20.sol';

contract Token is ERC20, SafeMath, Ownable, Operatable {

  uint public totalSupply;
  string public name;
  string public symbol;
  uint8 public decimals;

  Token public parentToken;
  Token public childToken;

  uint public creationBlock;
  bool public locked;

  event Locked(string reason);
  event Forked(address indexed self, address indexed child);
  event Migrated(address indexed account);
  event Minted(address indexed recipient, uint256 amount, uint indexed contributorId, string reference);

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

  function migrateBalance(address _from, address _to) onlyOperator {
    balances[_to] = safeAdd(balances[_to], balances[_from]);
    balances[_from] = 0;
    Transfer(_from, _to, balances[_to]);
  }

  function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
    //same as above. Replace this line with the following if you want to protect against wrapping uints.
    //if (balances[_from] >= _value && allowed[_from][msg.sender] >= _value && balances[_to] + _value > balances[_to]) {
    if (balances[_from] >= _value && allowed[_from][msg.sender] >= _value && _value > 0) {
      balances[_to] = safeAdd(balances[_to], _value);
      balances[_from] = safeSub(balances[_from], _value);
      allowed[_from][msg.sender] = safeSub(allowed[_from][msg.sender], _value);
      Transfer(_from, _to, _value);
      return true;
    } else { 
      return false; 
    }
  }

  function balanceOf(address _who) constant returns (uint balance) {
    return balances[_who];
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
  }
  
  function approve(address _spender, uint _value) returns (bool success) {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _owner, address _spender) constant returns (uint remaining) {
    return allowed[_owner][_spender];
  }

  function mintFor(address _recipient, uint256 _amount, uint _contributorId, string _contributionHash) returns (bool success) {
    if (msg.sender != owner && msg.sender != address(operator)) {
      throw;
    } else {
      totalSupply = safeAdd(totalSupply, _amount);
      balances[_recipient] = safeAdd(balances[_recipient], _amount);
      Minted(_recipient, _amount, _contributorId, _contributionHash);
      return true;
    }
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
