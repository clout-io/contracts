pragma solidity ^0.4.13;

import "../ERC20.sol";
import "../AbstractClaimableToken.sol";

contract TestClaimableToken is ERC20, AbstractClaimableToken {
    uint256 public initialSupply;
    uint256 public currentTotalSupply;
    uint256 public createdAt;
    address public genesisToken;
    uint256 public lastGeneratedTotalSupply;

    function TestClaimableToken(address _genesisToken)
    ERC20(15000000 * 10 ** 18, "Test claimable token", 18, "TCT", false, false)
    {
        initialSupply = 15000000 * 10 ** 18;
        currentTotalSupply = initialSupply;
        createdAt = now;
        lastGeneratedTotalSupply = createdAt;
        standard = "TCT 0.1";
        genesisToken = _genesisToken;
    }

    function claimedTokens(address _holder, uint256 tokens) {
        require(msg.sender == genesisToken);

        bool status = transferInternal(this, _holder, tokens);

        require(status == true);
    }

    function totalSupplyCalculation(uint256 time) public returns (uint256) {
        return currentTotalSupply + ((time - lastGeneratedTotalSupply) * 10 ** 18) / 60;
    }

    function totalSupplyInternal(uint256 time) internal returns (uint256) {
        lastGeneratedTotalSupply = time;

        uint256 tmp = currentTotalSupply;

        currentTotalSupply = totalSupplyCalculation(time);

        if(tmp < currentTotalSupply) {
            Transfer(0, this, tmp - currentTotalSupply);
        }

        return currentTotalSupply;
    }

    function totalSupply() constant returns (uint256) {
        return totalSupplyInternal(now);
    }

    function setGenesisToken(address _genesisToken) onlyOwner {
        genesisToken = _genesisToken;
    }
}