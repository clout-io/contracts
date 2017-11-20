pragma solidity 0.4.15;


contract AbstractClaimableToken {
    function claimedTokens(address _holder, uint256 _tokens) public;
}