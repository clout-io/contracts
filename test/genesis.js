var Genesis = artifacts.require("./GenesisToken.sol");
var TestGenesisToken = artifacts.require("./test/TestGenesisToken.sol");
var TestClaimableToken = artifacts.require("./test/TestClaimableToken.sol");


let Utils = require("./utils");

let BigNumber = require('bignumber.js');


/*
 - create contract & check emissions info
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
    return instance.testCalculateEmissionTokens(parseInt(offsetDate) + parseInt(lastClaimedAt), parseInt(offsetDate) + parseInt(currentTime), currentBalance, totalSupply)
        .then(function() {
            return instance.testCalculateEmissionTokens.call(parseInt(offsetDate) + parseInt(lastClaimedAt), parseInt(offsetDate) + parseInt(currentTime), currentBalance, totalSupply);
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

contract('Genesis', function(accounts) {
    "use strict";

    it("create contract & check emission info", function() {
        var instance;

        var emitTokensSince = parseInt(new Date().getTime() / 1000);

        return Genesis.new(
            new BigNumber("78000000").mul(precision), 18,
            "TEST", "TST",
            false, false,
            emitTokensSince,
            new BigNumber("78000000").mul(precision)
        )
        .then(function(_instance) {
            instance = _instance;
        })
        .then(function() {
            return instance.addTokenEmission(15, new BigNumber("9.940068493").mul(precision), 1640995199);
        })
        .then(Utils.receiptShouldSucceed)
        .then(function() {
            return instance.addTokenEmission(15, new BigNumber("4.970034247").mul(precision), 1767225599);
        })
        .then(Utils.receiptShouldSucceed)
        .then(function() {
            return instance.addTokenEmission(15, new BigNumber("2.485017123").mul(precision), 1893455999);
        })
        .then(Utils.receiptShouldSucceed)
        .then(function() {
            return instance.addTokenEmission(15, new BigNumber("1.242508562").mul(precision), 2082758399);
        })
        .then(Utils.receiptShouldSucceed)
        .then(() => instance.standard.call())
        .then((result) => assert.equal(result.valueOf(), "GenesisToken 0.1", "standard is not equal"))
        .then(() => instance.name.call())
        .then((result) => assert.equal(result.valueOf(), "TEST", "token name is not equal"))
        .then(() => instance.symbol.call())
        .then((result) => assert.equal(result.valueOf(), "TST", "token symbol is not equal"))
        .then(() => instance.decimals.call())
        .then((result) => assert.equal(result.valueOf(), 18, "precision is not equal"))
        .then(() => instance.totalSupply.call())
        .then((result) => assert.equal(result.valueOf(), new BigNumber("78000000000000000000000000").valueOf(), "total supply is not equal"))
        .then(() => instance.locked.call())
        .then((result) => assert.equal(result.valueOf(), false, "locked is not equal"))
        .then(() => instance.emitTokensSince.call())
        .then((result) => assert.equal(result.valueOf(), emitTokensSince, "emitTokensSince is not equal"))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("78000000000000000000000000").valueOf()))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 0))
        .then(() => Utils.getEmission(instance, 0))
        .then((emission) => Utils.checkEmission(emission, 15, "9940068493000000000", 1640995199, false))
        .then(() => Utils.getEmission(instance, 1))
        .then((emission) => Utils.checkEmission(emission, 15, "4970034247000000000", 1767225599, false))
        .then(() => Utils.getEmission(instance, 2))
        .then((emission) => Utils.checkEmission(emission, 15, "2485017123000000000", 1893455999, false))
        .then(() => Utils.getEmission(instance, 3))
        .then((emission) => Utils.checkEmission(emission, 15, "1242508562000000000", 2082758399, false))
    });

    it("add emission, update emission, remove emission", function() {
        var instance;

        var emitTokensSince = parseInt(new Date().getTime() / 1000);

        var firstEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 2);
        var secondEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 4);

        return Genesis.new(
            new BigNumber("1720000000000000000000000"), 18,
            "TEST", "TST",
            true, false,
            emitTokensSince,
            new BigNumber("1720000000000000000000000")
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

        return Genesis.new(
                new BigNumber("1720000000000000000000000"), 18,
                "TEST", "TST",
                true, false,
                emitTokensSince,
                new BigNumber("1720000000000000000000000")
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

    // it("update of non existent emission should fail", function() {
    //     var instance;
    //
    //     var emitTokensSince = parseInt(new Date().getTime() / 1000);
    //
    //     var firstEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 2);
    //     var secondEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 4);
    //
    //     return Genesis.new(
    //         new BigNumber("1720000000000000000000000"), 18,
    //         "TEST", "TST",
    //         true, false,
    //         emitTokensSince,
    //         new BigNumber("1720000000000000000000000")
    //     )
    //         .then(function(_instance) {
    //             instance = _instance;
    //         })
    //         .then(function() {
    //             return instance.addTokenEmission(3600, 100, firstEmissionEndsAt);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(() => Utils.getEmission(instance, 0))
    //         .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false))
    //         .then(function() {
    //             return instance.updateTokenEmission(1, 7200, 200, secondEmissionEndsAt);
    //         })
    //         .then(Utils.receiptShouldFailed)
    //         .catch(Utils.catchReceiptShouldFailed)
    //         .then(() => Utils.getEmission(instance, 0))
    //         .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false));
    // });
    //
    // it("removal of non existent emission should fail", function() {
    //     var instance;
    //
    //     var emitTokensSince = parseInt(new Date().getTime() / 1000);
    //
    //     var firstEmissionEndsAt = parseInt(new Date().getTime() / 1000 + 3600 * 2);
    //
    //     return Genesis.new(
    //         new BigNumber("1720000000000000000000000"), 18,
    //         "TEST", "TST",
    //         true, false,
    //         emitTokensSince,
    //         new BigNumber("1720000000000000000000000"))
    //         .then(function(_instance) {
    //             instance = _instance;
    //         })
    //         .then(function() {
    //             return instance.addTokenEmission(3600, 100, firstEmissionEndsAt);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(() => Utils.getEmission(instance, 0))
    //         .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false))
    //         .then(function() {
    //             return instance.removeTokenEmission(1, {from: accounts[1]});
    //         })
    //         .then(Utils.receiptShouldFailed)
    //         .catch(Utils.catchReceiptShouldFailed)
    //         .then(() => Utils.getEmission(instance, 0))
    //         .then((emission) => Utils.checkEmission(emission, 3600, 100, firstEmissionEndsAt, false));
    // });
    //
    // it("check token amount calculations", function() {
    //     var instance;
    //
    //     var totalSupply = 720000;
    //
    //     var emitTokensSince = 1514764800;
    //
    //     var firstPeriodEnds = 1640995200;
    //     var secondPeriodEnds = 1767225600;
    //     var thirdPeriodEnds = 1893456000;
    //     var forthPeriodEnds = 2082758400;
    //
    //     // return Genesis.new(
    //     //         720000, 0,
    //     //         "TEST", "TST",
    //     //         true, false,
    //     //         emitTokensSince,
    //     //         720000
    //     //     )
    //
    //     // GenesisToken(5000000 * 10 ** 18, 18, "Test Genesis Token", "TGT", true, false, now, 5000000 * 10 ** 18)
    //     return TestGenesisToken.new()
    //         .then(function(_instance) {
    //             instance = _instance;
    //         })
    //         .then(function() {
    //             return instance.addTokenEmission(15, new BigNumber("9.940068493").mul(precision), firstPeriodEnds);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //
    //         .then(function() {
    //             return instance.addTokenEmission(15, new BigNumber("4.970034247").mul(precision), secondPeriodEnds);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function() {
    //             return instance.addTokenEmission(15, new BigNumber("2.485017123").mul(precision), thirdPeriodEnds);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function() {
    //             return instance.addTokenEmission(15, new BigNumber("1.242508562").mul(precision), forthPeriodEnds);
    //         })
    //
    //         /*
    //          phase 1 - 8.7165514262377258e+25 = 9.940068493 * 10 ^ 18* 8769106     // 8,769,106
    //          phase 2 - 4.182462740083392e+25 = 4.970034247 * 10 ^ 18 * 8415360     // 8,415,360
    //          phase 3 - 2.091231369620928e+25 = 2.485017123 * 10  ** 18 * 8415360   // 8,415,360
    //          phase 5 - 1.568065685380992e+25 = 1.242508562*  10 ** 18 * 12620160   // 12,620,160
    //          */
    //
    //
    //
    //         .then(Utils.receiptShouldSucceed)
    //         .then(() => instance.emitTokensSince.call())
    //         .then((result) => emitTokensSince = result.valueOf())
    //         // 3600 / 15 = 240 blocks
    //         // total generated tokens for 240 blocks = 2,385.61643832 * 10^18
    //         // user part of total supply = 0.0001388888889
    //         // total generated tokens for user = 2,385.61643832 * 10^18 * 0.0001388888889 = 3.313356165E17
    //     // checkClaimedTokensAmount(instance, offsetDate, lastClaimedAt, currentTime, currentBalance, totalSupply, expectedValue)
    //         .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 0, 3600, 100, totalSupply, "331335616433333333"))
    //         .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 0, 3600, 0, totalSupply, "0"))
    //         .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 3600, 3600, 100, totalSupply, "0"))
    //         // test for 100 days
    //         .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 8640000, 8640000 * 2, 100, totalSupply, "795205479440000000000"))
    //         // test for 100 days if genesis balance = 0
    //         .then(() => checkClaimedTokensAmount(instance, emitTokensSince, 8640000, 8640000 * 2, 0, totalSupply, "0"))
    //         // test for calculations between two periods, 100 days in first period, 100 in second period, 99 tokens
    //         // blocks in 1 period: 576,000
    //         // blocks in 2 period: 437,760
    //         // emitted for 1 period: 787.2534246456
    //         // emitted for 2 period: 302.1780822176
    //         .then(() => checkClaimedTokensAmount(instance, firstPeriodEnds - 86400 * 100, 0, 86400 * 176, 99, totalSupply, "1.086409726041024e+21"))
    //         // actual total tokens for 1 period:   8.3649244853183987e+25
    //         // expected total tokens for 1 period: 8.3592E25
    //         // actual total tokens for 2 period:   4.182462740083392e+25
    //         // expected total tokens for 2 period: 4.1796E25
    //         // actual total tokens for 3 period:   2.091231369620928e+25
    //         // expected total tokens for 3 period: 2.0898E25
    //         // actual total tokens for 4 period:   1.568065685380992e+25
    //         // expected total tokens for 4 period: 1.56735E25
    //         .then(() => checkClaimedTokensAmount(instance, 1514764800, 0, forthPeriodEnds - 1514764800, 720000, totalSupply, "1.620668527441056e+26"))
    // });
    //
    // it("test genesis token with claimable token", function() {
    //     var instance;
    //
    //     var genesisToken;
    //     var claimableToken;
    //
    //     var createdAt;
    //
    //     return TestGenesisToken.new()
    //         .then(function(_instance) {
    //             genesisToken = _instance;
    //
    //             return genesisToken.createdAt.call();
    //         })
    //         .then(function(result) {
    //             createdAt = parseInt(result.valueOf());
    //         })
    //         .then(function() {
    //             // emissions.push(TokenEmission(60, 10 ** 18, 2**255 - now, false));
    //             return genesisToken.addTokenEmission(60, new BigNumber("1").mul(precision), 2**255 - createdAt);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function() {
    //             return TestClaimableToken.new(genesisToken.address);
    //         })
    //         .then(function(_instance) {
    //             claimableToken = _instance;
    //
    //             return genesisToken.setClaimableToken(claimableToken.address);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function() {
    //             return genesisToken.nonClaimableTransfer(accounts[1], new BigNumber(1000).valueOf());
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], new BigNumber(0).valueOf()))
    //         .then(function() {
    //             return genesisToken.testClaim(createdAt + 3600, {from: accounts[1]});
    //         })
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "83333333333333333"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "0"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "0"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "0"))
    //         // .then(function() {
    //         //     return genesisToken.testTransfer(createdAt + 7200, accounts[2], new BigNumber(500), {from: accounts[1]});
    //         // })
    //         // .then(Utils.receiptShouldSucceed)
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(500).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "166666666666666666"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "0"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "0"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "0"))
    //         // .then(function() {
    //         //     return genesisToken.testTransfer(createdAt + 10800, accounts[3], new BigNumber(150), {from: accounts[2]});
    //         // })
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(350).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[3], new BigNumber(150).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "166666666666666666"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "41666666666666666"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "0"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "0"))
    //         // .then(function() {
    //         //     return genesisToken.testTransfer(createdAt + 14400, accounts[4], new BigNumber(43), {from: accounts[3]});
    //         // })
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(350).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[3], new BigNumber(107).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[4], new BigNumber(43).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "166666666666666666"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "41666666666666666"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "12500000000000000"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "0"))
    //         // .then(function() {
    //         //     return genesisToken.testTransfer(createdAt + 18000, accounts[2], new BigNumber(18), {from: accounts[4]});
    //         // })
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(368).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[3], new BigNumber(107).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[4], new BigNumber(25).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "166666666666666666"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "99999999999999999"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "12500000000000000"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "3583333333333333"))
    //         // .then(function() {
    //         //     return genesisToken.testClaim(createdAt + 86400, {from: accounts[1]});
    //         // })
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(368).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[3], new BigNumber(107).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[4], new BigNumber(25).valueOf()))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "1083333333333333332"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "99999999999999999"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "12500000000000000"))
    //         // .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "3583333333333333"))
    // });
    //
    // it("test genesis token transferFrom with claimable token", function() {
    //     var instance;
    //
    //     var genesisToken;
    //     var claimableToken;
    //
    //     var createdAt;
    //
    //     return TestGenesisToken.new()
    //         .then(function(_instance) {
    //             genesisToken = _instance;
    //
    //             return genesisToken.createdAt.call();
    //         })
    //         .then(function(result) {
    //             createdAt = parseInt(result.valueOf());
    //         })
    //         .then(function() {
    //             // emissions.push(TokenEmission(60, 10 ** 18, 2**255 - now, false));
    //             return genesisToken.addTokenEmission(60, new BigNumber("1").mul(precision), 2**255 - createdAt);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function() {
    //             return TestClaimableToken.new(genesisToken.address);
    //         })
    //         .then(function(_instance) {
    //             claimableToken = _instance;
    //
    //             return genesisToken.setClaimableToken(claimableToken.address);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function() {
    //             return genesisToken.nonClaimableTransfer(accounts[1], new BigNumber(1000).valueOf());
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], new BigNumber(0).valueOf()))
    //         .then(function() {
    //             return genesisToken.testClaim(createdAt + 3600, {from: accounts[1]});
    //         })
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "83333333333333333"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "0"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "0"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "0"))
    //
    //         .then(() => genesisToken.approve(accounts[0], 500, {from: accounts[1]}))
    //         .then(() => genesisToken.approve(accounts[0], 150, {from: accounts[2]}))
    //         .then(() => genesisToken.approve(accounts[0], 43, {from: accounts[3]}))
    //         .then(() => genesisToken.approve(accounts[0], 18, {from: accounts[4]}))
    //
    //
    //         .then(function() {
    //             return genesisToken.testTransferFrom(createdAt + 7200, accounts[1], accounts[2], new BigNumber("50000000000000000"), {from: accounts[0]});
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(0).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "83333333333333333"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "0"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "0"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "0"))
    //
    //         .then(function() {
    //             return genesisToken.testTransferFrom(createdAt + 7200, accounts[1], accounts[2], new BigNumber(500), {from: accounts[0]});
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(500).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "166666666666666666"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "0"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "0"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "0"))
    //
    //         .then(() => genesisToken.allowance.call(accounts[1], [accounts[0]]))
    //         .then((result) => assert.equal(result.valueOf(), "0"))
    //
    //         .then(function() {
    //             return genesisToken.testTransferFrom(createdAt + 10800, accounts[2], accounts[3], new BigNumber(150), {from: accounts[0]});
    //         })
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(350).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[3], new BigNumber(150).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "166666666666666666"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "41666666666666666"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "0"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "0"))
    //
    //         .then(() => genesisToken.allowance.call(accounts[2], [accounts[0]]))
    //         .then((result) => assert.equal(result.valueOf(), "0"))
    //
    //         .then(function() {
    //             return genesisToken.testTransferFrom(createdAt + 14400, accounts[3], accounts[4], new BigNumber(43), {from: accounts[0]});
    //         })
    //
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(350).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[3], new BigNumber(107).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[4], new BigNumber(43).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "166666666666666666"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "41666666666666666"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "12500000000000000"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "0"))
    //
    //         .then(() => genesisToken.allowance.call(accounts[3], [accounts[0]]))
    //         .then((result) => assert.equal(result.valueOf(), "0"))
    //
    //         .then(function() {
    //             return genesisToken.testTransferFrom(createdAt + 18000, accounts[4], accounts[2], new BigNumber(18), {from: accounts[0]});
    //         })
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(368).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[3], new BigNumber(107).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[4], new BigNumber(25).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "166666666666666666"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "99999999999999999"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "12500000000000000"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "3583333333333333"))
    //
    //         .then(() => genesisToken.allowance.call(accounts[4], [accounts[0]]))
    //         .then((result) => assert.equal(result.valueOf(), "0"))
    //
    //         .then(function() {
    //             return genesisToken.testClaim(createdAt + 86400, {from: accounts[1]});
    //         })
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(500).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[2], new BigNumber(368).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[3], new BigNumber(107).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[4], new BigNumber(25).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "1083333333333333332"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[2], "99999999999999999"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[3], "12500000000000000"))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[4], "3583333333333333"))
    // });
    //
    // it("test claimable token totalSupply", function() {
    //     var instance;
    //
    //     var createdAt;
    //
    //     return TestClaimableToken.new()
    //         .then(function(_instance) {
    //             instance = _instance;
    //         })
    //         .then(function() {
    //             return instance.createdAt.call();
    //         })
    //         .then(function(result) {
    //             createdAt = parseInt(result.valueOf());
    //         })
    //         .then(() => checkTotalSupply(instance, createdAt, 0, new BigNumber(15000000).mul(precision)))
    //         .then(() => checkTotalSupply(instance, createdAt, 3600, new BigNumber(15000000 + 60).mul(precision)))
    //         .then(() => checkTotalSupply(instance, createdAt, 7200, new BigNumber(15000000 + 120).mul(precision)))
    //         .then(() => checkTotalSupply(instance, createdAt, 86400, new BigNumber(15000000 + 1440).mul(precision)))
    //         .then(() => checkTotalSupply(instance, createdAt, 150123, "1.500250205e+25"));
    // });
    //
    // it("test reclaiming tokens before last claim", function() {
    //     var instance;
    //
    //     var genesisToken;
    //     var claimableToken;
    //
    //     var createdAt;
    //
    //     return TestGenesisToken.new()
    //         .then(function (_instance) {
    //             genesisToken = _instance;
    //
    //             return genesisToken.createdAt.call();
    //         })
    //         .then(function (result) {
    //             createdAt = parseInt(result.valueOf());
    //         })
    //         .then(function () {
    //             // emissions.push(TokenEmission(60, 10 ** 18, 2**255 - now, false));
    //             return genesisToken.addTokenEmission(60, new BigNumber("1").mul(precision), 2 ** 255 - createdAt);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function () {
    //             return TestClaimableToken.new(genesisToken.address);
    //         })
    //         .then(function (_instance) {
    //             claimableToken = _instance;
    //
    //             return genesisToken.setClaimableToken(claimableToken.address);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function () {
    //             return genesisToken.nonClaimableTransfer(accounts[1], new BigNumber(1000).valueOf());
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], new BigNumber(0).valueOf()))
    //         .then(function () {
    //             return genesisToken.testClaim(createdAt + 3600, {from: accounts[1]});
    //         })
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "83333333333333333"))
    //         .then(function () {
    //             return genesisToken.testClaim(createdAt - 3000, {from: accounts[1]});
    //         })
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "83333333333333333"));
    // });
    //
    // it("test reclaiming tokens in short time after last claim", function() {
    //     var instance;
    //
    //     var genesisToken;
    //     var claimableToken;
    //
    //     var createdAt;
    //
    //     return TestGenesisToken.new()
    //         .then(function (_instance) {
    //             genesisToken = _instance;
    //
    //             return genesisToken.createdAt.call();
    //         })
    //         .then(function (result) {
    //             createdAt = parseInt(result.valueOf());
    //         })
    //         .then(function () {
    //             // emissions.push(TokenEmission(60, 10 ** 18, 2**255 - now, false));
    //             return genesisToken.addTokenEmission(60, new BigNumber("1").mul(precision), 2 ** 255 - createdAt);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function () {
    //             return TestClaimableToken.new(genesisToken.address);
    //         })
    //         .then(function (_instance) {
    //             claimableToken = _instance;
    //
    //             return genesisToken.setClaimableToken(claimableToken.address);
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(function () {
    //             return genesisToken.nonClaimableTransfer(accounts[1], new BigNumber(1000).valueOf());
    //         })
    //         .then(Utils.receiptShouldSucceed)
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], new BigNumber(0).valueOf()))
    //         .then(function () {
    //             return genesisToken.testClaim(createdAt + 3600, {from: accounts[1]});
    //         })
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "83333333333333333"))
    //         .then(function () {
    //             return genesisToken.testClaim(createdAt + 3600, {from: accounts[1]});
    //         })
    //         .then(() => Utils.balanceShouldEqualTo(genesisToken, accounts[1], new BigNumber(1000).valueOf()))
    //         .then(() => Utils.balanceShouldEqualTo(claimableToken, accounts[1], "83333333333333333"));
    // });
});

