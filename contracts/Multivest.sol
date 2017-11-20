pragma solidity 0.4.15;


import "./Ownable.sol";


contract Multivest is Ownable {
    /* public variables */
    mapping (address => bool) public allowedMultivests;

    /* events */
    event MultivestSet(address multivest);

    event MultivestUnset(address multivest);

    event Contribution(address _holder, uint256 value, uint256 tokens);

    modifier onlyAllowedMultivests() {
        require(true == allowedMultivests[msg.sender]);
        _;
    }

    /* constructor */
    function Multivest(address multivest) {
        allowedMultivests[multivest] = true;
    }

    /* public methods */
    function setAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = true;
    }

    function unsetAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = false;
    }

    function multivestBuy(
        address _holder,
        uint256 _value
    )
    public
    onlyAllowedMultivests
    {
        bool status = buy(_holder, block.timestamp, _value);

        require(status == true);
    }

    function multivestBuy(
        bytes32 _hash,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        public payable
    {
        require(_hash == keccak256(msg.sender));
        require(allowedMultivests[verify(_hash, _v, _r, _s)] == true);
        bool status = buy(msg.sender, block.timestamp, msg.value);

        require(status == true);
    }

    function verify(bytes32 hash, uint8 v, bytes32 r, bytes32 s) public constant returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";

        return ecrecover(keccak256(prefix, hash), v, r, s);
    }

    function buy(address _address, uint256 _time, uint256 _value) internal returns (bool);
}
