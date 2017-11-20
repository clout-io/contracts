const TestRPC = require('ethereumjs-testrpc');
const web3 = require('web3');

const server = TestRPC.server({
    accounts: [
        { balance: web3.utils.toWei('1000', 'ether') }, // 0
        { balance: web3.utils.toWei('1000', 'ether') }, // 1
        { balance: web3.utils.toWei('1000', 'ether') }, // 2
        { balance: web3.utils.toWei('1000', 'ether') }, // 3
        { balance: web3.utils.toWei('1000', 'ether') }, // 4
        { balance: web3.utils.toWei('1000', 'ether') }, // 5
        { balance: web3.utils.toWei('1000', 'ether') }, // 6
        { balance: web3.utils.toWei('1000', 'ether') }, // 7
        { balance: web3.utils.toWei('1000', 'ether') }, // 8
        { balance: web3.utils.toWei('1000', 'ether') }, // 9
        { balance: "0" }, // 10
        { balance: "0" }, // 11
        { balance: "0" }, // 12
        { balance: "0" }, // 13
        { balance: "0" }, // 14
        { balance: "0" }, // 15
        { balance: "0" }, // 16
        { balance: "0" }, // 17
        { balance: "0" }, // 18
        { balance: "0" }, // 19
        { balance: "0" }, // 20
    ]
});

server.listen(8545, function(err, blockchain) {
    "use strict";

    if(err) {
        console.error(err);

        process.exit(1);
    }
    else {
        console.log("Started...");
    }
});