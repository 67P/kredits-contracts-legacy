pragma solidity ^0.4.11;

contract IpfsUtils {

  function splitHash(bytes source) returns(uint8, uint8, bytes32 hash) {
    uint8 tag = uint8(source[0]);
    uint8 len = uint8(source[1]);

    assembly {
      hash := mload(add(source,34))
    }

    return (tag, len, hash);
  }

  function combineHash(uint8 tag, uint8 len, bytes32 hash) returns(bytes) {
    bytes memory out = new bytes(34);

    out[0] = byte(tag);
    out[1] = byte(len);

    uint8 i;
    for (i = 0; i < 32; i++) {
      out[i+2] = hash[i];
    }

    return out;
  }

}
