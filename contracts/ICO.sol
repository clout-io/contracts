pragma solidity 0.4.15;

import "./Ownable.sol";
import "./Clout.sol";
import "./CLC.sol";
import "./Multivest.sol";


contract ICO is Ownable, Multivest {
    uint256 public icoSince;
    uint256 public icoTill;

    uint8 public decimals;

    mapping(address => uint256) public holderEthers;
    uint256 public collectedEthers;
    uint256 public soldTokens;

    uint256 public minEthToContribute;

    Phase[] public phases;

    bool public locked;

    Clout public clout;
    CLC public clc;

    address[] public etherReceivers;
    address public etherMasterWallet;

    struct Phase {
        uint256 price;
        uint256 maxAmount;
    }

    event Contribution(address _holder, uint256 _ethers, uint256 _clouts, uint256 _clcs);

    function ICO(
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
        Multivest(msg.sender)
        public
    {
        icoSince = _icoSince;
        icoTill = _icoTill;
        decimals = _decimals;
        locked = _locked;

        clout = _clout;
        clc = _clc;

        if(_minEthToContribute > 0) {
            minEthToContribute = _minEthToContribute;
        } else {
            minEthToContribute = 0.5 ether;
        }

        phases.push(Phase(price1, 6000000 * (uint256(10) ** decimals)));
        phases.push(Phase(price2, 3000000 * (uint256(10) ** decimals)));
        phases.push(Phase(price3, 1000000 * (uint256(10) ** decimals)));
    }

    function setEtherReceivers(
        address _masterWallet,
        address[] _etherReceivers
    )
        public onlyOwner
    {
        require(_masterWallet != address(0));
        require(_etherReceivers.length == 4);
        require(_etherReceivers[0] != address(0));
        require(_etherReceivers[1] != address(0));
        require(_etherReceivers[2] != address(0));
        require(_etherReceivers[3] != address(0));

        etherMasterWallet = _masterWallet;
        etherReceivers = _etherReceivers;
    }

    function setPrice(uint256 price1, uint256 price2, uint256 price3) public onlyOwner {
        phases[0].price = price1;
        phases[1].price = price2;
        phases[2].price = price3;
    }

    function setPeriod(uint256 since, uint256 till) public onlyOwner {
        icoSince = since;
        icoTill = till;
    }

    function setClout(Clout _clout) public onlyOwner {
        clout = _clout;
    }

    function setCLC(CLC _clc) public onlyOwner {
        clc = _clc;
    }

    function setLocked(bool _locked) public onlyOwner {
        locked = _locked;
    }

    function getIcoTokensAmount(uint256 _soldTokens, uint256 _value) public constant returns (uint256) {
        uint256 amount;

        uint256 newSoldTokens = _soldTokens;
        uint256 remainingValue = _value;
    
        for (uint i = 0; i < phases.length; i++) {
            Phase storage phase = phases[i];

            uint256 tokens = remainingValue * (uint256(10) ** decimals) / phase.price;

            if (phase.maxAmount > newSoldTokens) {
                if (newSoldTokens + tokens > phase.maxAmount) {
                    uint256 diff = phase.maxAmount - tokens;

                    amount += diff;

                    // get optimal amount of ethers for this phase
                    uint256 phaseEthers = diff * phase.price / (uint256(10) ** decimals);

                    remainingValue -= phaseEthers;
                    newSoldTokens += (phaseEthers * (uint256(10) ** decimals) / phase.price);
                } else {
                    amount += tokens;

                    newSoldTokens += tokens;

                    remainingValue = 0;
                }
            }

            if (remainingValue == 0) {
                break;
            }
        }

        if (remainingValue > 0) {
            return 0;
        }

        return amount;
    }

    // solhint-disable-next-line code-complexity
    function transferEthers() public onlyOwner {
        require(this.balance > 0);
        require(etherReceivers.length == 4);
        require(etherMasterWallet != address(0));

        // ether balance on smart contract
        if (this.balance > 0) {
            uint256 balance = this.balance;

            etherReceivers[0].transfer(balance * 15 / 100);

            etherReceivers[1].transfer(balance * 15 / 100);

            etherReceivers[2].transfer(balance * 10 / 100);

            etherReceivers[3].transfer(balance * 10 / 100);

            // send rest to master wallet

            etherMasterWallet.transfer(this.balance);
        }
    }

    function buy(address _address, uint256 _time, uint256 _value) internal returns (bool) {
        if (locked == true) {
            return false;
        }

        if (_time < icoSince) {
            return false;
        }

        if (_time > icoTill) {
            return false;
        }

        if (_value < minEthToContribute) {
            return false;
        }

        uint256 amount = getIcoTokensAmount(soldTokens, _value);

        if (amount == 0) {
            return false;
        }

        uint256 cloutMinted = clout.mint(_address, amount);
        uint256 clcMinted = clc.mint(_address, amount);

        require(cloutMinted == amount);
        require(clcMinted == amount);

        soldTokens += amount;
        collectedEthers += _value;
        holderEthers[_address] += _value;

        Contribution(_address, _value, amount, amount);

        return true;
    }
}