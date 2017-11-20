pragma solidity ^0.4.13;

import '../TokenDistribution.sol';

contract TokenDistributionTest is TokenDistribution {
    function TokenDistributionTest(
        uint256 _onlyAfter,
        Clout _clout,
        CLC _clc,
        uint8 _decimals
    )
        TokenDistribution(_onlyAfter, _clout, _clc, _decimals)
    {

    }

    function issueTest(uint256 time) returns (bool) {
        return issueInternal(msg.sender, time);
    }
}