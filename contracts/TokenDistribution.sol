pragma solidity 0.4.15;

import "./Ownable.sol";
import "./Clout.sol";
import "./CLC.sol";


contract TokenDistribution is Ownable {
    uint256 public onlyAfter;

    uint8 public decimals;

    Clout public clout;
    CLC public clc;

    mapping (address => Holder) public holders;

    bool public initialAllocations1Done;

    struct Holder {
        address holder;

        uint256 totalCloutTokens;
        uint256 totalClcTokens;

        uint256 sentCloutTokens;
        uint256 sentClcTokens;

        uint256 since;
        uint256 period;
        uint256 lastIssuedAt;

        bool inited;

        bool revocable;
    }

    event Issued(address holder, uint256 cloutTokens, uint256 clcTokens);

    function TokenDistribution(
        uint256 _onlyAfter,
        Clout _clout,
        CLC _clc,
        uint8 _decimals
    )
        public
    {
        onlyAfter = _onlyAfter;
    
        clout = _clout;
        clc = _clc;

        decimals = _decimals;
        initialAllocations1Done = false;
    }

    function initialAllocations1(uint256 _allocSince) public onlyOwner {
        require(_allocSince >= now);
        require(false == initialAllocations1Done);

        initialAllocations1Done = true;
    }

    function addHolder(
        address holder,
        uint256 cloutTokens,
        uint256 clcTokens,
        uint256 since,
        uint256 period,
        bool revocable
    )
        public onlyOwner
    {
        require(since >= onlyAfter);

        if (holders[holder].inited) {
            return;
        }

        holders[holder] = Holder(holder, cloutTokens, clcTokens, 0, 0, since, period, since, true, revocable);
    }

    function removeHolder(address holder) public onlyOwner {
        if (holders[holder].inited == false) {
            return;
        }

        if (holders[holder].revocable == false) {
            return;
        }

        delete holders[holder];
    }

    function issue() public returns (bool) {
        return issueInternal(msg.sender, now);
    }

    function issueInternal(address _address, uint256 time) internal returns (bool) {
        require(time >= onlyAfter);

        Holder storage holder = holders[_address];

        if (holder.inited == false) {
            return false;
        }

        // next period is not started
        if (holder.lastIssuedAt + holder.period > time) {
            return false;
        }

        uint8 prevPeriod = uint8((holder.lastIssuedAt - holder.since) / holder.period);

        // more than 100%
        if (prevPeriod >= 20) {
            return false;
        }

        uint8 periods = uint8((time - holder.lastIssuedAt) / holder.period);

        if(prevPeriod + periods > 20) {
            periods = 20 - prevPeriod;

            if(periods == 0) {
                return;
            }
        }
    
        holder.lastIssuedAt = holder.since + (prevPeriod + periods) * holder.period;

        uint256 cloutTokens = holder.totalCloutTokens / 20 * periods;
        uint256 clcTokens = holder.totalClcTokens / 20 * periods;

        if (cloutTokens > 0) {
            holder.sentCloutTokens += cloutTokens;

            require(cloutTokens == clout.mint(msg.sender, cloutTokens));
        }

        if (clcTokens > 0) {
            holder.sentClcTokens += clcTokens;

            require(clcTokens == clc.mint(msg.sender, clcTokens));
        }

        Issued(holder.holder, cloutTokens, clcTokens);

        return true;
    }
}
