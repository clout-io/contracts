pragma solidity ^0.4.13;

import '../ERC20.sol';

contract TestTokenRecipient is TokenRecipient {
    address from;
    uint256 value;
    address token;
    bytes extraData;

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) public {
        from = _from;
        value = _value;
        token = _token;
        extraData = _extraData;
    }
}