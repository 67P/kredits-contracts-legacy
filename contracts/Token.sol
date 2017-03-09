pragma solidity ^0.4.1;

import './dependencies/SafeMath.sol';
import './dependencies/Ownable.sol';
import './dependencies/ERC20.sol';
import './TokenFactory.sol';

contract Token is ERC20, SafeMath, Ownable {
  uint public totalSupply;
  string public name;
  string public symbol;
  uint8 public decimals; 

  Token public parentToken;
  Token public childToken;

  TokenFactory public tokenFactory;
  uint public creationBlock;
  bool public locked;
 
  event Locked(string reason);
  event Forked(address indexed self, address indexed child);
  event Minted(address indexed recipient, uint256 amount, string reference);

  mapping(address => uint) balances;
  mapping (address => mapping (address => uint)) allowed;

  modifier onlyWithParentToken() {
    if (parentToken == address(0)) { throw; }
    _;
  }

  function Token(address _parentToken) {
    parentToken = Token(_parentToken);
    name = "Kredit"; 
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

    balances[msg.sender] = safeSub(balances[msg.sender], _value);
    balances[_to] = safeAdd(balances[_to], _value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint _value) returns (bool) {
    var _allowance = allowed[_from][msg.sender];
   
    if (balances[_from] < _value || _allowance < _value) {
      throw;
    }

    balances[_to] = safeAdd(balances[_to], _value);
    balances[_from] = safeSub(balances[_from], _value);
    allowed[_from][msg.sender] = safeSub(_allowance, _value);
    Transfer(_from, _to, _value);
    return true;
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

  function updateFromParent() onlyWithParentToken returns (uint) {
    // danger... do we want to overwrite the child balance?
  }

  function approve(address _spender, uint _value) returns (bool success) {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _owner, address _spender) constant returns (uint remaining) {
    return allowed[_owner][_spender];
  }

  function mintFor(address _recipient, uint256 _amount, string _reference) onlyOwner returns (bool success) {
    totalSupply = totalSupply + _amount;
    balances[_recipient] += _amount;
    Minted(_recipient, _amount, _reference);
    return true;
  }

  function setTokenFactory(address _tokenFactory) onlyOwner returns (bool) {
    tokenFactory = TokenFactory(_tokenFactory);
    return true;
  }
  
  function fork() onlyOwner returns (address newAddress) {
    newAddress = tokenFactory.fork(this);
    childToken = Token(newAddress);
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
