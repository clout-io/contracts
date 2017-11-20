pragma solidity ^0.4.13;

import '../ERC223.sol';

contract TestERC223 is ERC223Token {
    function TestERC223(
        uint256 _initialSupply,
        string tokenName,
        uint8 decimalUnits,
        string tokenSymbol,
        bool transferAllSupplyToOwner,
        bool _locked
    )
        ERC223Token(_initialSupply, tokenName, decimalUnits, tokenSymbol, transferAllSupplyToOwner, _locked)
    {
        
    }
}