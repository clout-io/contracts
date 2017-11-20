pragma solidity ^0.4.13;

import '../ICO.sol';
import "../Clout.sol";
import "../CLC.sol";

contract TestICO is ICO {
    function TestICO(
        uint256 _icoSince,
        uint256 _icoTill,
        uint8 _decimals,
        uint256 price1,
        uint256 price2,
        uint256 price3,
        Clout _clout,
        CLC _clc,
        uint256 _minEthToContribute,
        bool _locked
    )
    public
    ICO(_icoSince, _icoTill, _decimals, price1, price2, price3, _clout, _clc, _minEthToContribute, _locked)
    {
    
    }

    function () payable {
        bool status = buy(msg.sender, block.timestamp, msg.value);

        require(status == true);
    }
}