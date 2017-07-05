pragma solidity ^0.4.11;

contract Operatable {

  address operator;
  modifier onlyOperator() { if (msg.sender != operator) { throw; } _; }

  function setOperatorContract(address _address) onlyOperator {
    operator = _address;
  }

}
