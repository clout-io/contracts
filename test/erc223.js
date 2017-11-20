var ERC223 = artifacts.require("./test/TestERC223.sol");
var ERC20 = artifacts.require("./ERC20.sol");
var CompatibleToken = artifacts.require("test/TestERC223Compatible.sol");
var Utils = require("./utils");

var abi = require('ethereumjs-abi');
var BigNumber = require('bignumber.js');

/*
    + deploy erc223 & compatible token
    + transfer to incompatible token
    + transfer to compatible token
    + transfer to compatible token but tokenFallback throwed
    - transfer to compatible token with custom fallback
*/

contract('ERC223', function(accounts) {
    it("deploy erc223 & compatible token", function() {
        var erc223, compatibleToken, incompatibleToken;

        return ERC223.new(
                1000000000000000,
                "TEST",
                18,
                "TEST",
                false,
                true
        ).then(function(_instance) {
            erc223 = _instance;

            return CompatibleToken.new();
        }).then(_compatibleToken => {
            compatibleToken = _compatibleToken;

            return ERC20.new(
                1000000000000000,
                "TEST",
                18,
                "TEST",
                false,
                true
            );
        }).then(instance => {
            "use strict";

            incompatibleToken = instance;
        });
    });

    it("transfer to incompatible token", function() {
        var erc223, incompatibleToken;

        return ERC223.new(
            1000000000000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        )
        .then(function(_instance) {
            erc223 = _instance;

            return ERC20.new(
                1000000000000000,
                "TEST",
                18,
                "TEST",
                true,
                false);
        })
        .then(instance => {
            "use strict";

            incompatibleToken = instance;

            return erc223.transfer(incompatibleToken.address, 1000);
        })
        .then(Utils.receiptShouldFailed)
        .catch(Utils.catchReceiptShouldFailed)
        .then(() => {
            "use strict";

            var data = abi.simpleEncode("transfer(address,uint256,bytes):(bool)", incompatibleToken.address, 1000, 0).toString('hex');

            return erc223.sendTransaction({data: data});
        })
        .then(Utils.receiptShouldFailed)
        .catch(Utils.catchReceiptShouldFailed)
    });

    it("transfer to compatible token", function() {
        var erc223, compatibleToken;

        return ERC223.new(
            1000000000000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        )
        .then(function(_instance) {
            erc223 = _instance;

            return CompatibleToken.new();
        })
        .then(_compatibleToken => {
            compatibleToken = _compatibleToken;

            return erc223.transfer(compatibleToken.address, 1000);
        })
        .then(Utils.receiptShouldSucceed)
        .then(() => Utils.balanceShouldEqualTo(erc223, compatibleToken.address, 1000, false))
        .then(() => {
            "use strict";

            var data = abi.simpleEncode("transfer(address,uint256,bytes):(bool)", compatibleToken.address, 10000, "0x123").toString('hex');

            return erc223.sendTransaction({data: data});
        })
        .then(Utils.receiptShouldSucceed)
        .then(() => Utils.balanceShouldEqualTo(erc223, compatibleToken.address, 11000, false))
        .then(() => compatibleToken.lastData.call())
        .then(result => assert.equal(result.valueOf(), "0x3078313233", "lastData is not equal"))
        .then(() => compatibleToken.lastFrom.call())
        .then(result => assert.equal(result.valueOf(), accounts[0], "lastFrom is not equal"))
    });

    it("transfer to compatible token but tokenFallback throwed", function() {
        var erc223, compatibleToken;

        return ERC223.new(
            1000000000000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        )
            .then(function(_instance) {
                erc223 = _instance;

                return CompatibleToken.new();
            })
            .then(_compatibleToken => {
                compatibleToken = _compatibleToken;

                return erc223.transfer(compatibleToken.address, 5050);
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(erc223, compatibleToken.address, 0, false))
            .then(() => {
                "use strict";

                var data = abi.simpleEncode("transfer(address,uint256,bytes):(bool)", compatibleToken.address, 5050, "0x123").toString('hex');

                return erc223.sendTransaction({data: data});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(erc223, compatibleToken.address, 0, false))
    });

    it("transfer to compatible token with custom fallback", function() {
        var erc223, compatibleToken;

        return ERC223.new(
            1000000000000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        )
            .then(function(_instance) {
                erc223 = _instance;

                return CompatibleToken.new();
            })
            .then(_compatibleToken => {
                compatibleToken = _compatibleToken;

                return erc223.transfer(compatibleToken.address, 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(erc223, compatibleToken.address, 1000, false))
            .then(() => {
                var data = abi.simpleEncode("transfer(address,uint256,bytes,string)", compatibleToken.address, 10050, "0x123", "customFallback(address,uint256,bytes)").toString('hex');

                return erc223.sendTransaction({data: data});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(erc223, compatibleToken.address, 11050, false))
            .then(() => compatibleToken.lastFrom.call())
            .then(result => assert.equal(result.valueOf(), accounts[0], "lastFrom is not equal"))
    });


/////////////////
/////////////////
/////////////////
/////////////////
/////////////////
/////////////////
/////////////////


    it("deploy & check for total supply & balance of smart contract & sender", function() {
        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            false,
            true
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 0));
    });

    it("transfer with enabled lock", function() {
        var instance;

        return ERC223.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            true
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.transfer(accounts[1], 1000);
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
    });

    it("transfer with disabled lock", function() {
        var instance;

        return ERC223.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.transfer(accounts[1], 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 999000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 1000))
            .then(function() {
                return instance.transfer(accounts[1], 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(function() {
                return instance.transfer(accounts[1], 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(function() {
                return instance.transfer(accounts[1], 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 996000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 4000));
    });

    it("approve, transfer by transferFrom", function() {
        var instance;

        return ERC223.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.approve(accounts[1], 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 1000, "allowance is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom.call(accounts[0], accounts[1], 1001, {from: accounts[1]});
            })
            .then(function(result) {
                assert.equal(result.valueOf(), false, "transferFrom succeed");
            })
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 1001, {from: accounts[1]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom.call(accounts[0], accounts[1], 1000, {from: accounts[1]});
            })
            .then(function(result) {
                assert.equal(result.valueOf(), true, "transferFrom failed");
            })
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 1000, {from: accounts[1]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 999000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 1000))
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 0, "allowance is not equal");
            });
    });

    it("approve, transferFrom more than exists", function() {
        var instance;

        return ERC223.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.approve(accounts[1], 2000000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 2000000, "allowance is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom.call(accounts[0], accounts[1], 1000001, {from: accounts[1]});
            })
            .then(function(result) {
                assert.equal(result.valueOf(), false, "transferFrom succeed");
            })
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 1000001, {from: accounts[1]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 2000000, "allowance is not equal");
            });
    });

    it("try to transfer tokens to itself", function() {
        "use strict";

        var instance;

        return ERC223.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.transfer(accounts[0], 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
    });

});