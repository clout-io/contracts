pragma solidity 0.4.15;

import "./ERC223.sol";
import "./GenesisToken.sol";
import "./AbstractClaimableToken.sol";

contract Clout is GenesisToken {
    AbstractClaimableToken public claimableToken;
    uint256 public createdAt;

    mapping (address => bool) public issuers;

    function Clout(uint256 emitTokensSince,
        bool init,
        uint256 initialSupply,
        uint8 decimals,
        string tokenName,
        string tokenSymbol,
        bool transferAllSupplyToOwner
    )
        public
        GenesisToken(
            0,
            decimals,
            tokenName,
            tokenSymbol,
            transferAllSupplyToOwner,
            false,
            emitTokensSince,
            initialSupply
        )
        // solhint-disable-next-line function-max-lines
    {
        standard = "Clout 0.1";

        createdAt = now;

        // emissions
        if (init) {
//            uint256 period0 = createdAt;
//            uint256 period1 = 1514764800; // 2018-01-01T00:00:00Z
//            uint256 period2 = 1577836800; // 2020-01-01T00:00:00Z
//            uint256 period3 = 1672531200; // 2023-01-01T00:00:00Z
//            uint256 period4 = 1798761600; // 2027-01-01T00:00:00Z
//            uint256 period5 = 1956528000; // 2032-01-01T00:00:00Z
//            uint256 period6 = 2145916800; // 2038-01-01T00:00:00Z
//            uint256 period7 = 2366841600; // 2045-01-01T00:00:00Z
//            uint256 period8 = 2619302400; // 2053-01-01T00:00:00Z
//            uint256 period9 = 2903299200; // 2062-01-01T00:00:00Z

            uint256 blockDuration = 15;

            // after ico till 2018-01-01
            emissions.push(
                TokenEmission(
                    blockDuration,
                    100000000 * 10 ** 18 / ((1514764800 - emitTokensSince) / blockDuration), // tokens
                    1514764800, // till
                    false // removed
                )
            );

            // till 2020-01-01. blocks 4,204,800, tokens per block 2.378234399E19
            emissions.push(
                TokenEmission(
                    blockDuration,
                    100000000 * 10 ** 18 / ((1577836800 - 1514764800) / blockDuration), // tokens
                    1577836800, // till
                    false // removed
                )
            );

            // till 2023-01-01, blocks 6,312,960, tokens per block 1.584042985E19
            emissions.push(
                TokenEmission(
                    blockDuration,
                    100000000 * 10 ** 18 / ((1672531200 - 1577836800) / blockDuration), // tokens
                    1672531200, // till
                    false // removed
                )
            );

            // till 2027-01-01, blocks 8,415,360, tokens per block 1.188303293E19
            emissions.push(
                TokenEmission(
                    blockDuration,
                    100000000 * 10 ** 18 / ((1798761600 - 1672531200) / blockDuration), // tokens
                    1798761600, // till
                    false // removed
                )
            );

            // till 2032-01-01, blocks 10,517,760, tokens per block 9.507727881E18
            emissions.push(
                TokenEmission(
                    blockDuration,
                    100000000 * 10 ** 18 / ((1956528000 - 1798761600) / blockDuration), // tokens
                    1956528000, // till
                    false // removed
                )
            );

            // till 2038-01-01, blocks 12,625,920, tokens per block 7.920214923E18
            emissions.push(
                TokenEmission(
                    blockDuration,
                    100000000 * 10 ** 18 / ((2145916800 - 1956528000) / blockDuration), // tokens
                    2145916800, // till
                    false // removed
                )
            );

            // till 2045-01-01, blocks 14,728,320, tokens per block 6.789640638E18
            emissions.push(
                TokenEmission(
                    blockDuration,
                    100000000 * 10 ** 18 / ((2366841600 - 2145916800) / blockDuration), // tokens
                    2366841600, // till
                    false // removed
                )
            );

            // till 2053-01-01, blocks 16,830,720, tokens per block 5.941516465E18
            emissions.push(
                TokenEmission(
                    blockDuration,
                    100000000 * 10 ** 18 / ((2619302400 - 2366841600) / blockDuration), // tokens
                    2619302400, // till
                    false // removed
                )
            );

            // till 2062-01-01, blocks 18,933,120, tokens per block 5.281749654E18
            emissions.push(
                TokenEmission(
                    blockDuration,
                    100000000 * 10 ** 18 / ((2903299200 - 2619302400) / blockDuration), // tokens
                    2903299200, // till
                    false // removed
                )
            );
        }
    }

    function setEmissions(uint256[] array) public onlyOwner {
        require(array.length % 4 == 0);

        delete emissions;

        for (uint256 i = 0; i < array.length; i += 4) {
            emissions.push(TokenEmission(array[i], array[i + 1], array[i + 2], array[i + 3] == 0 ? false : true));
        }
    }

    function setClaimableToken(AbstractClaimableToken _token) public onlyOwner {
        claimableToken = _token;
    }

    function setTransferFrozen(bool _frozen) public onlyOwner {
        transferFrozen = _frozen;
    }

    function tokensClaimedHook(address _holder, uint256 since, uint256 till, uint256 amount) internal {
        if (claimableToken != address(0)) {
            claimableToken.claimedTokens(_holder, amount);
        }

        ClaimedTokens(_holder, since, till, amount);
    }

    function setLocked(bool _locked) public onlyOwner {
        locked = _locked;
    }
}