var Clout = artifacts.require("./Clout.sol");
var CLC = artifacts.require("./CLC.sol");


var Utils = require("./utils");

var BigNumber = require('bignumber.js');


/*
 + create contract & check emissions info
 + add emission, update emission, remove emission
 + add emission, try to update emission not by owner, try to remove emission not by owner
 + update of non existent emission should fail
 + removal of non existent emission should fail
 + check token amount calculations
 + should not be able to claim before emission since date
 + should not be able to claim after last emission period
 + should not be able to claim if is locked
 + claim should succeed after emission date
 */

function checkClaimedTokensAmount(instance, offsetDate, lastClaimedAt, currentTime, currentBalance, totalSupply, expectedValue) {
    return instance.calculateEmissionTokens(offsetDate + lastClaimedAt, offsetDate + currentTime, currentBalance, totalSupply)
        .then(function() {
            return instance.calculateEmissionTokens(offsetDate + lastClaimedAt, offsetDate + currentTime, currentBalance, totalSupply);
        })
        .then(function() {
            return instance.calculateEmissionTokens.call(offsetDate + lastClaimedAt, offsetDate + currentTime, currentBalance, totalSupply);
        })
        .then(function(result) {
            assert.equal(result.valueOf(), expectedValue.valueOf(), "amount is not equal");
        });
}

function checkTotalSupply(instance, offsetDate, currentTime, expectedValue) {
    return instance.totalSupplyCalculation(offsetDate + currentTime)
        .then(function() {
            return instance.totalSupplyCalculation.call(offsetDate + currentTime);
        })
        .then(function(result) {
            assert.equal(result.valueOf(), expectedValue.valueOf(), "totalSupply is not equal");
        });
}

var precision = new BigNumber("1000000000000000000");

contract('Clout', function(accounts) {
    "use strict";

    it("create contract & check emission info", function() {
        var instance;

        // 2017-12-01
        var emitTokensSince = 1512086400;

        return Clout.new(
            emitTokensSince,
            true,
            new BigNumber("78000000").mul(precision), 18,
            "CLOUT", "CLOUT",
            false,
        )
        .then(function(_instance) {
            instance = _instance;
        })
        .then(() => instance.standard.call())
        .then((result) => assert.equal(result.valueOf(), "Clout 0.1", "standard is not equal"))
        .then(() => instance.name.call())
        .then((result) => assert.equal(result.valueOf(), "CLOUT", "token name is not equal"))
        .then(() => instance.symbol.call())
        .then((result) => assert.equal(result.valueOf(), "CLOUT", "token symbol is not equal"))
        .then(() => instance.decimals.call())
        .then((result) => assert.equal(result.valueOf(), 18, "precision is not equal"))

        .then(() => instance.totalSupply.call())
        .then((result) => assert.equal(result.valueOf(), new BigNumber("0").valueOf(), "total supply is not equal"))

        .then(() => instance.maxSupply.call())
        .then((result) => assert.equal(result.valueOf(), new BigNumber("78000000000000000000000000").valueOf(), "max supply is not equal"))

        .then(() => instance.locked.call())
        .then((result) => assert.equal(result.valueOf(), false, "locked is not equal"))
        .then(() => instance.emitTokensSince.call())
        .then((result) => assert.equal(result.valueOf(), emitTokensSince, "emitTokensSince is not equal"))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("0").valueOf()))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 0))
        .then(() => Utils.getEmission(instance, 0))

        //    till december, blocks 178,560, per block 5.600358423E20

        .then((emission) => Utils.checkEmission(emission, 15, "560035842293906810035", 1514764800, false))
        .then(() => Utils.getEmission(instance, 1))

        // till 2020-01-01. blocks 4,204,800, tokens per block 2.378234399E19

        .then((emission) => Utils.checkEmission(emission, 15, "23782343987823439878", 1577836800, false))
        .then(() => Utils.getEmission(instance, 2))

        // till 2023-01-01, blocks 6,312,960, tokens per block 1.584042985E19

        .then((emission) => Utils.checkEmission(emission, 15, "15840429845904298459", 1672531200, false))
        .then(() => Utils.getEmission(instance, 3))

        // till 2027-01-01, blocks 8,415,360, tokens per block 1.188303293E19

        .then((emission) => Utils.checkEmission(emission, 15, "11883032930260856338", 1798761600, false))
        .then(() => Utils.getEmission(instance, 4))

        // till 2032-01-01, blocks 10,517,760, tokens per block 9.507727881E18

        .then((emission) => Utils.checkEmission(emission, 15, "9507727881221857125", 1956528000, false))
        .then(() => Utils.getEmission(instance, 5))

        // till 2038-01-01, blocks 12,625,920, tokens per block 7.920214923E18

        .then((emission) => Utils.checkEmission(emission, 15, "7920214922952149229", 2145916800, false))
        .then(() => Utils.getEmission(instance, 6))

        // till 2045-01-01, blocks 14,728,320, tokens per block 6.789640638E18

        .then((emission) => Utils.checkEmission(emission, 15, "6789640637900317212", 2366841600, false))
        .then(() => Utils.getEmission(instance, 7))

        // till 2053-01-01, blocks 16,830,720, tokens per block 5.941516465E18

        .then((emission) => Utils.checkEmission(emission, 15, "5941516465130428169", 2619302400, false))
        .then(() => Utils.getEmission(instance, 8))

        // till 2062-01-01, blocks 18,933,120, tokens per block 5.281749654E18

        .then((emission) => Utils.checkEmission(emission, 15, "5281749653517222729", 2903299200, false))
    });

    it("add emission, update emission, remove emission", function() {
        var instance;

        // 2017-12-01
        var emitTokensSince = 1512086400;

        var firstEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 2);
        var secondEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 4);

        return Clout.new(
            emitTokensSince,
            false,
            new BigNumber("78000000").mul(precision), 18,
            "CLOUT", "CLOUT",
            false,
        )
        .then(function(_instance) {
            instance = _instance;
        })
        .then(function() {
            return instance.addTokenEmission(3600, 100, firstEmissionEndsAt);
        })
        .then(Utils.receiptShouldSucceed)
        .then(() => Utils.getEmission(instance, 0))
        .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false))
        .then(function() {
            return instance.updateTokenEmission(0, 7200, 200, secondEmissionEndsAt);
        })
        .then(Utils.receiptShouldSucceed)
        .then(function() {
            return instance.removeTokenEmission(0);
        })
        .then(() => Utils.getEmission(instance, 0))
        .then((emission) => Utils.checkEmission(emission, 7200, 200, secondEmissionEndsAt, true))
    });

    it("add emission, try to update emission not by owner, try to remove emission not by owner", function() {
        var instance;

        var emitTokensSince = parseInt(new Date().getTime() / 1000);

        var firstEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 2);
        var secondEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 4);

        return Clout.new(
            emitTokensSince,
            false,
            new BigNumber("78000000").mul(precision), 18,
            "CLOUT", "CLOUT",
            false,
        )
            .then(function(_instance) {
                instance = _instance;
            })
            .then(function() {
                return instance.addTokenEmission(3600, 100, firstEmissionEndsAt);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.getEmission(instance, 0))
            .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false))
            .then(function() {
                return instance.updateTokenEmission(0, 7200, 200, secondEmissionEndsAt, {from: accounts[1]});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.getEmission(instance, 0))
            .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false))
            .then(function() {
                return instance.removeTokenEmission(0, {from: accounts[1]});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.getEmission(instance, 0))
            .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false));
    });

    it("update of non existent emission should fail", function() {
        var instance;

        var emitTokensSince = parseInt(new Date().getTime() / 1000);

        var firstEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 2);
        var secondEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 4);

        return Clout.new(
            emitTokensSince,
            false,
            new BigNumber("78000000").mul(precision), 18,
            "CLOUT", "CLOUT",
            false,
        )
            .then(function(_instance) {
                instance = _instance;
            })
            .then(function() {
                return instance.addTokenEmission(3600, 100, firstEmissionEndsAt);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.getEmission(instance, 0))
            .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false))
            .then(function() {
                return instance.updateTokenEmission(1, 7200, 200, secondEmissionEndsAt);
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.getEmission(instance, 0))
            .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false));
    });

    it("removal of non existent emission should fail", function() {
        var instance;

        var emitTokensSince = parseInt(new Date().getTime() / 1000);

        var firstEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 2);

        return Clout.new(
            emitTokensSince,
            false,
            new BigNumber("78000000").mul(precision), 18,
            "CLOUT", "CLOUT",
            false,
        )
            .then(function(_instance) {
                instance = _instance;
            })
            .then(function() {
                return instance.addTokenEmission(3600, 100, firstEmissionEndsAt);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.getEmission(instance, 0))
            .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false))
            .then(function() {
                return instance.removeTokenEmission(1, {from: accounts[1]});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.getEmission(instance, 0))
            .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false));
    });

    it("test set emissions", function() {
        var instance;

        // 2017-12-01
        var emitTokensSince = 1512086400;

        var till1 = parseInt(new Date().getTime() / 1000);
        var till2 = parseInt(new Date().getTime() / 1000 + 1000);
        var till3 = parseInt(new Date().getTime() / 1000 + 2000);
        var till4 = parseInt(new Date().getTime() / 1000 + 3000);
        var till5 = parseInt(new Date().getTime() / 1000 + 4000);

        return Clout.new(
            emitTokensSince,
            true,
            new BigNumber("78000000").mul(precision), 18,
            "CLOUT", "CLOUT",
            false,
        )
            .then(function (_instance) {
                instance = _instance;
            })
            .then(() => {
                return instance.setEmissions([
                    25, 10, till1, 0,
                    35, 20, till2, 0,
                    45, 30, till3, 1,
                    55, 40, till4, 0,
                    65, 50, till5, 0]);
            })

            .then(() => Utils.getEmission(instance, 0))
            .then((emission) => Utils.checkEmission(emission, 25, "10", till1, false))

            .then(() => Utils.getEmission(instance, 1))
            .then((emission) => Utils.checkEmission(emission, 35, "20", till2, false))

            .then(() => Utils.getEmission(instance, 2))
            .then((emission) => Utils.checkEmission(emission, 45, "30", till3, true))

            .then(() => Utils.getEmission(instance, 3))
            .then((emission) => Utils.checkEmission(emission, 55, "40", till4, false))

            .then(() => Utils.getEmission(instance, 4))
            .then((emission) => Utils.checkEmission(emission, 65, "50", till5, false))

            .then(() => {
                return instance.setEmissions([
                    125, 110, till5, 0,
                    135, 120, till4, 0,
                    145, 130, till3, 1,
                    155, 140, till2, 0,
                    165, 150, till1, 0], {from: accounts[1]});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => Utils.getEmission(instance, 0))
            .then((emission) => Utils.checkEmission(emission, 25, "10", till1, false))

            .then(() => Utils.getEmission(instance, 1))
            .then((emission) => Utils.checkEmission(emission, 35, "20", till2, false))

            .then(() => Utils.getEmission(instance, 2))
            .then((emission) => Utils.checkEmission(emission, 45, "30", till3, true))

            .then(() => Utils.getEmission(instance, 3))
            .then((emission) => Utils.checkEmission(emission, 55, "40", till4, false))

            .then(() => Utils.getEmission(instance, 4))
            .then((emission) => Utils.checkEmission(emission, 65, "50", till5, false))
    });

    it("check token amount calculations", function() {
        var instance;

        // 2017-12-01
        var emitTokensSince = 1512086400;

        var totalSupply = new BigNumber("100000000").mul(precision);

        return Clout.new(
            emitTokensSince,
            true,
            totalSupply, 18,
            "CLOUT", "CLOUT",
            false,
        )
            .then(function(_instance) {
                instance = _instance;
            })
            .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 0, 3600, 1000, totalSupply, "1"))
            .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 0, 3600, 0, totalSupply, "0"))
            .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 3600, 3600, 100, totalSupply, "0"))
            // test for 100 days
            .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 8640000, 8640000 * 2, 100, totalSupply, "13"))

            // test for 100 days if genesis balance = 10001
            .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 864000, 8640000 * 2, 10001, totalSupply, "9089"))

            // test for 100 days if genesis balance = 0
            .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 864000, 8640000 * 2, 0, totalSupply, "0"))
    });
});


