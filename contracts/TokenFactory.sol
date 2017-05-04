pragma solidity ^0.4.1;

pragma solidity ^0.4.1;

import './Token.sol';

contract TokenFactory {

  function setup() returns (address token) {
    token = new Token(address(0));
  }

  function fork(address _parentToken) returns (address newToken) {
    newToken = new Token(_parentToken);
  }
}
