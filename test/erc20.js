var ERC20 = artifacts.require("./ERC20.sol");
var TokenReceipientTest = artifacts.require("./test/TestTokenRecipient.sol");
var Utils = require("./utils");

var BigNumber = require('bignumber.js');


/*
    + deploy & check for total supply & balance of smart contract & sender
    + approve, transfer by transferFrom
    + transfer with disabled lock
    + approve, transfer by transferFrom
    + approve, transferFrom more than exists
    + try to transfer tokens to itself
*/

contract('ERC20', function(accounts) {
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

        return ERC20.new(
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

        return ERC20.new(
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

        return ERC20.new(
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

    it("test approveAndCall", function() {
        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        )
            .then(function(_instance) {
                instance = _instance;
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))

            .then(() => {
                return TokenReceipientTest.new();
            })
            .then((_spender) => {
                spender = _spender;
            })
            
            .then(function() {
                return instance.approveAndCall(spender.address, "1000", '0x42');
            })

            .then(Utils.receiptShouldSucceed)

            .then(function() {
                return instance.allowance.call(accounts[0], spender.address);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 1000, "allowance is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0));
    });

    it("test approveAndCall on locked erc20", function() {
        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            true
        )
            .then(function(_instance) {
                instance = _instance;
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))

            .then(() => {
                return TokenReceipientTest.new();
            })
            .then((_spender) => {
                spender = _spender;
            })

            .then(function() {
                return instance.approveAndCall(spender.address, "1000", '0x42');
            })

            .then(Utils.receiptShouldSucceed)

            .then(function() {
                return instance.allowance.call(accounts[0], spender.address);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 0, "allowance is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0));
    });

    it("approve, transferFrom more than exists", function() {
        var instance;

        return ERC20.new(
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


    it("approve, lock, transferFrom should fail", function() {
        var instance;

        return ERC20.new(
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
                assert.equal(result.valueOf(), 0, "allowance is not equal");
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
                assert.equal(result.valueOf(), 0, "allowance is not equal");
            });
    });


    it("try to transfer tokens to itself", function() {
        "use strict";

        var instance;

        return ERC20.new(
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

    it("try to transfer 0 tokens", function() {
        "use strict";

        var instance;

        return ERC20.new(
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
                return instance.transfer(accounts[0], 0);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.transfer(accounts[1], 0);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
    });
});