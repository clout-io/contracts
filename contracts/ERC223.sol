pragma solidity 0.4.15;

import "./ERC20.sol";


contract ERC223 {
    event Transfer(address indexed from, address indexed to, uint value, bytes indexed data);
    function transfer(address to, uint value, bytes data) public returns (bool ok);
    function transfer(address to, uint value, bytes data, string customFallback) public returns (bool ok);
}


contract ContractReceiver {
    function tokenFallback(address _from, uint _value, bytes _data) public;
}

/*
    Based on https://github.com/Dexaran/ERC223-token-standard/blob/Recommended/ERC223_Token.sol
*/

contract ERC223Token is ERC223, ERC20 {
    function ERC223Token(
        uint256 _initialSupply,
        string tokenName,
        uint8 decimalUnits,
        string tokenSymbol,
        bool transferAllSupplyToOwner,
        bool _locked
    )
        public
        ERC20(_initialSupply, tokenName, decimalUnits, tokenSymbol, transferAllSupplyToOwner, _locked)
    {
        
    }

    function transfer(address to, uint256 value, bytes data) public returns (bool success) {
        require(locked == false);
        
        bool status = transferInternal(msg.sender, to, value, data);

        return status;
    }

    function transfer(address to, uint value, bytes data, string customFallback) public returns (bool success) {
        require(locked == false);

        bool status = transferInternal(msg.sender, to, value, data, true, customFallback);

        return status;
    }

    function transferInternal(address from, address to, uint256 value, bytes data) internal returns (bool success) {
        return transferInternal(from, to, value, data, false, "");
    }

    function transferInternal(
        address from,
        address to,
        uint256 value,
        bytes data,
        bool useCustomFallback,
        string customFallback
    )
        internal returns (bool success)
    {
        bool status = super.transferInternal(from, to, value);

        if (status) {
            if (isContract(to)) {
                ContractReceiver receiver = ContractReceiver(to);

                if (useCustomFallback) {
                    // solhint-disable-next-line avoid-call-value
                    require(receiver.call.value(0)(bytes4(keccak256(customFallback)), from, value, data) == true);
                } else {
                    receiver.tokenFallback(from, value, data);
                }
            }

            Transfer(from, to, value, data);
        }

        return status;
    }

    function transferInternal(address from, address to, uint256 value) internal returns (bool success) {
        require(locked == false);

        bytes memory data;

        return transferInternal(from, to, value, data, false, "");
    }

    //assemble the given address bytecode. If bytecode exists then the _addr is a contract.
    function isContract(address _addr) private returns (bool) {
        uint length;
        assembly {
        //retrieve the size of the code on target address, this needs assembly
            length := extcodesize(_addr)
        }
        return (length > 0);
    }
}