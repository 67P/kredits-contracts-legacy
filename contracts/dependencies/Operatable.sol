pragma solidity ^0.4.11;

contract Operatable {

  address public operator;
  modifier onlyOperator() { if (msg.sender != operator) { throw; } _; }

  function Operatable() {
    operator = msg.sender;
  }

  function setOperatorContract(address _address) onlyOperator {
    operator = _address;
  }

}
