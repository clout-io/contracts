pragma solidity ^0.4.13;

import "../GenesisToken.sol";
import "../AbstractClaimableToken.sol";

contract TestGenesisToken is GenesisToken {
    AbstractClaimableToken public claimableToken;
    uint256 public createdAt;
    
    function TestGenesisToken()
    GenesisToken(720000, 0, "Test Genesis Token", "TGT", true, false, now, 720000)
    {
        standard = "Test Genesis Token 0.1";

        createdAt = now;
    }

    function setClaimableToken(AbstractClaimableToken _token) onlyOwner {
        claimableToken = _token;
    }

    function tokensClaimedHook(address _holder, uint256 _since, uint256 _till, uint256 _tokens) internal {
        claimableToken.claimedTokens(_holder, _tokens);

        ClaimedTokens(_holder, _since, _till, _tokens);
    }

    function testClaim(uint256 _time) returns (uint256) {
        uint256 currentBalance = balanceOf(msg.sender);
        uint256 currentTotalSupply = totalSupply();

        return claimInternal(_time, msg.sender, currentBalance, currentTotalSupply);
    }

    function testTransfer(uint256 _time, address _to, uint256 _value) {
        bytes memory data;

        claimableTransfer(_time, msg.sender, _to, _value, data, false, "");
    }

    function testTransferFrom(uint256 _time, address _from, address _to, uint256 _value) {
        claimableTransferFrom(_time, _from, _to, _value);
    }

    function testCalculateEmissionTokens(uint256 _lastClaimedAt, uint256 _currentTime, uint256 _currentBalance, uint256 _totalSupply) returns (uint256 tokens){
        return super.calculateEmissionTokens(_lastClaimedAt, _currentTime, _currentBalance, _totalSupply);
    }

    function nonClaimableTransfer(address _to, uint256 _value) {
        require(transferInternal(msg.sender, _to, _value));
    }
}