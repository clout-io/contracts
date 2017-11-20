pragma solidity 0.4.15;

import "../Multivest.sol";
import "../ERC223.sol";


contract TestMultivest is Multivest, ERC223Token {
    function TestMultivest(address allowedMultivest)
    ERC223Token(
        1000000,
        "TEST",
        18,
        "TST",
        false,
        false
    )
    Multivest(allowedMultivest)
    {
    }

    function buy(address _address, uint256 value, uint256) internal returns (bool) {
        return transfer(_address, value);
    }
}