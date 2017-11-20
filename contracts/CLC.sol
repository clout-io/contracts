pragma solidity 0.4.15;

import "./ERC223.sol";
import "./AbstractClaimableToken.sol";
import "./Clout.sol";


contract CLC is MintingERC20, AbstractClaimableToken {
    uint256 public createdAt;
    Clout public genesisToken;

    function CLC(uint256 _maxSupply, uint8 decimals, Clout _genesisToken, bool transferAllSupplyToOwner) public
        MintingERC20(0, _maxSupply, "CLC", decimals, "CLC", transferAllSupplyToOwner, false)
    {
        createdAt = now;
        standard = "CLC 0.1";
        genesisToken = _genesisToken;
    }

    function claimedTokens(address _holder, uint256 _tokens) public {
        require(msg.sender == address(genesisToken));

        uint256 minted = internalMint(_holder, _tokens);

        require(minted == _tokens);
    }

    function setGenesisToken(Clout _genesisToken) public onlyOwner {
        genesisToken = _genesisToken;
    }

    function setTransferFrozen(bool _frozen) public onlyOwner {
        transferFrozen = _frozen;
    }

    function setLocked(bool _locked) public onlyOwner {
        locked = _locked;
    }
}