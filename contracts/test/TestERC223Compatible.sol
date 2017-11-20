pragma solidity ^0.4.13;

import '../ERC223.sol';

contract TestERC223Compatible is ContractReceiver {
    bytes public lastData;
    address public lastFrom;

    function tokenFallback(address _from, uint256 _value, bytes _data) {
        require(_value % 1000 == 0);

        lastData = _data;
        lastFrom = _from;
    }

    function customFallback(address _from, uint256 _value, bytes _data) {
        lastData = _data;
        lastFrom = _from;
    }
}