var ICO = artifacts.require("./test/TestICO.sol");
var Clout = artifacts.require("./Clout.sol");
var CLC = artifacts.require("./CLC.sol");
var Utils = require("./utils");

var BigNumber = require('bignumber.js');

var precision = new BigNumber("1000000000000000000");

/*
 + deploy & check ico params
 + set clout & clc addresses
 + set token prices
 + set period
 + set locked & unlocked
 + set min ethers
 + calculate tokens amount


 + send 10000 wei with locked equal true & check balance of clout & clc
 + buy before ico
 + buy after ico
 + transfer ethers
 */

contract('ICO', function(accounts) {
    it("deploy & check ico params", async () => {
        var instance;

        const now = (await Utils.getCurrentBlock()).timestamp;

        let since = now;
        let till = now + 3600;

        let price1 = "1000000";
        let price2 = "2000000";
        let price3 = "4000000";

        return ICO.new(since, till, 18, price1, price2, price3, accounts[1], accounts[2], 0, false)
            .then(function (_instance) {
                instance = _instance;
            })
            .then(() => instance.decimals.call())
            .then((result) => assert.equal(result.valueOf(), 18, "deciams is not equal to 18"))
            .then(() => instance.icoSince.call())
            .then((result) => assert.equal(result.valueOf(), since, "icoSince is not equal"))
            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), till, "icoTill is not equal"))
            .then(() => instance.collectedEthers.call())
            .then((result) => assert.equal(result.valueOf(), 0, "collectedEthers is not equal to 0"))
            .then(() => instance.clout.call())
            .then((result) => assert.equal(result.valueOf(), accounts[1], "clout is not equal"))
            .then(() => instance.clc.call())
            .then((result) => assert.equal(result.valueOf(), accounts[2], "clc is not equal"))
            .then(() => instance.locked.call())
            .then((result) => assert.equal(result.valueOf(), false, "locked is not equal"))

            .then(() => instance.minEthToContribute.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(0.5).mul(precision), "minEthToContribute is not equal"))

            .then(() => Utils.getPhase(instance, 0))
            .then((phase) => Utils.checkPhase(phase, price1, new BigNumber(6000000).mul(precision).valueOf()))

            .then(() => Utils.getPhase(instance, 1))
            .then((phase) => Utils.checkPhase(phase, price2, new BigNumber(3000000).mul(precision).valueOf()))

            .then(() => Utils.getPhase(instance, 2))
            .then((phase) => Utils.checkPhase(phase, price3, new BigNumber(1000000).mul(precision).valueOf()))
    });

    it("set clout & clc addresses", async () => {
        var instance;

        const now = (await Utils.getCurrentBlock()).timestamp;

        let since = now;
        let till = now + 3600;

        let price1 = "1000000";
        let price2 = "2000000";
        let price3 = "4000000";

        return ICO.new(since, till, 18, price1, price2, price3, accounts[1], accounts[2], 0, false)
            .then(function (_instance) {
                instance = _instance;
            })
            .then(() => instance.setClout(accounts[3]))
            .then(() => instance.clout.call())
            .then((result) => assert.equal(result.valueOf(), accounts[3], "clout address is not equal"))
            .then(() => instance.setCLC(accounts[4]))
            .then(() => instance.clc.call())
            .then((result) => assert.equal(result.valueOf(), accounts[4], "clout address is not equal"))

            .then(() => instance.setClout(accounts[5], {from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => instance.clout.call())
            .then((result) => assert.equal(result.valueOf(), accounts[3], "clout address is not equal"))

            .then(() => instance.setCLC(accounts[6], {from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => instance.clc.call())
            .then((result) => assert.equal(result.valueOf(), accounts[4], "clout address is not equal"))
    });

    it("set period", async () => {
        var instance;

        const now = (await Utils.getCurrentBlock()).timestamp;

        let since = now;
        let till = now + 3600;

        let since2 = since + 3600;
        let till2 = till + 3600;

        let price1 = "1000000";
        let price2 = "2000000";
        let price3 = "4000000";

        return ICO.new(0, 0, 18, price1, price2, price3, accounts[1], accounts[2], 0, false)
            .then(function (_instance) {
                instance = _instance;
            })

            .then(() => instance.icoSince.call())
            .then((result) => assert.equal(result.valueOf(), 0, "since is not equal"))
            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), 0, "till is not equal"))

            .then(() => instance.setPeriod(since, till))

            .then(() => instance.icoSince.call())
            .then((result) => assert.equal(result.valueOf(), since, "since is not equal"))
            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), till, "till is not equal"))

            .then(() => instance.setPeriod(since2, till2, {from: accounts[1]}))

            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => instance.icoSince.call())
            .then((result) => assert.equal(result.valueOf(), since, "since is not equal"))
            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), till, "till is not equal"))
    });

    it("set locked & unlocked", async () => {
        var instance;

        const now = (await Utils.getCurrentBlock()).timestamp;

        let since = now;
        let till = now + 3600;

        let price1 = "1000000";
        let price2 = "2000000";
        let price3 = "4000000";

        return ICO.new(0, 0, 18, price1, price2, price3, accounts[1], accounts[2], 0, false)
            .then(function (_instance) {
                instance = _instance;
            })

            .then(() => instance.setLocked(true))

            .then(() => instance.locked.call())
            .then((result) => assert.equal(result.valueOf(), true, "locked is not equal"))

            .then(() => instance.setLocked(true, {from: accounts[1]}))

            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => instance.locked.call())
            .then((result) => assert.equal(result.valueOf(), true, "locked is not equal"))

            .then(() => instance.setLocked(false, {from: accounts[1]}))

            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => instance.locked.call())
            .then((result) => assert.equal(result.valueOf(), true, "locked is not equal"))

            .then(() => instance.setLocked(false))

            .then(() => instance.locked.call())
            .then((result) => assert.equal(result.valueOf(), false, "locked is not equal"))
    });

    it("calculate tokens", async () => {
        var instance;

        const now = (await Utils.getCurrentBlock()).timestamp;

        let since = now;
        let till = now + 3600;

        let price1 = "2889593100000000";
        let price2 = "7223982750000000";
        let price3 = "14447965500000000";

        return ICO.new(since, till, 18, price1, price2, price3, accounts[1], accounts[2], 0, false)
            .then((_instance) => {
                instance = _instance;
            })
            // contribute 1 ether
            .then(() => instance.getIcoTokensAmount.call(0, new BigNumber(10).pow(18)))
            .then((result) => assert.equal(result.valueOf(), "346069486392392063782"))
            // contribute 1000 ether
            .then(() => instance.getIcoTokensAmount.call(0, new BigNumber(1000).mul(new BigNumber(10).pow(18))))
            .then((result) => assert.equal(result.valueOf(), "3.46069486392392063782267e+23"))
            // contribvute 1000000 ethers
            .then(() => instance.getIcoTokensAmount.call(0, new BigNumber(10000000).mul(new BigNumber(10).pow(18))))
            .then((result) => assert.equal(result.valueOf(), "0"));
    });

    it("buy 10 ethers with locked equal true & check balance of clout & clc", async () => {
        var instance;

        let clout;
        let clc;

        const now = (await Utils.getCurrentBlock()).timestamp;

        let since = now;
        let till = now + 3600;

        let price1 = "2889593100000000";
        let price2 = "7223982750000000";
        let price3 = "14447965500000000";

        return Clout.new(since, true, new BigNumber("100000000").mul(precision), 18, "CLOUT", "CLT", false)
            .then((_token) => {
                clout = _token;

                return CLC.new(new BigNumber("1000000000").mul(precision), 18, clout.address, false);
            })
            .then((instance) => {
                clc = instance;

                return clout.setClaimableToken(clc.address);
            })
            .then(() => {
                return ICO.new(since, till, 18, price1, price2, price3, clout.address, clc.address, 1000, false);
            })
            .then((_instance) => {
                instance = _instance;

                return instance.setLocked(true);
            })
            .then(() => {
                return clout.addMinter(instance.address);
            })
            .then(() => {
                return clc.addMinter(instance.address);
            })

            .then(() => {
                return instance.sendTransaction({value: 10000});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => Utils.balanceShouldEqualTo(clout, accounts[0], "0"))
            .then(() => Utils.balanceShouldEqualTo(clc, accounts[0], "0"))

            .then(() => instance.setLocked(false))
            .then(() => {
                return instance.sendTransaction({value: 10000});
            })
            .then(Utils.receiptShouldSucceed)

            // .then(() => Utils.balanceShouldEqualTo(clout, accounts[0], "3460694"))
            // .then(() => Utils.balanceShouldEqualTo(clc, accounts[0], "3460694"));
    });

    it("buy before pre ico", async () => {
        var instance;

        let clout;
        let clc;

        const now = (await Utils.getCurrentBlock()).timestamp;

        let since = now - 7200;
        let till = now - 3600;

        let price1 = "2889593100000000";
        let price2 = "7223982750000000";
        let price3 = "14447965500000000";

        return Clout.new(since, true, new BigNumber("100000000").mul(precision), 18, "CLOUT", "CLT", 1000, false)
            .then((_token) => {
                clout = _token;

                return CLC.new(new BigNumber("1000000000").mul(precision), 18, clout.address, false);
            })
            .then((instance) => {
                clc = instance;

                return clout.setClaimableToken(clc.address);
            })
            .then(() => {
                return ICO.new(since, till, 18, price1, price2, price3, clout.address, clc.address, false);
            })
            .then((_instance) => {
                instance = _instance;
            })
            .then(() => {
                return clout.addMinter(instance.address);
            })
            .then(() => {
                return clc.addMinter(instance.address);
            })

            .then(() => {
                return instance.sendTransaction({value: 10000});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => Utils.balanceShouldEqualTo(clout, accounts[0], "0"))
            .then(() => Utils.balanceShouldEqualTo(clc, accounts[0], "0"))
    });

    it("buy after pre ico", async () => {
        var instance;

        let clout;
        let clc;

        const now = (await Utils.getCurrentBlock()).timestamp;

        let since = now + 3600;
        let till = now + 7200;

        let price1 = "2889593100000000";
        let price2 = "7223982750000000";
        let price3 = "14447965500000000";

        return Clout.new(since, true, new BigNumber("100000000").mul(precision), 18, "CLOUT", "CLT", 1000, false)
            .then((_token) => {
                clout = _token;

                return CLC.new(new BigNumber("1000000000").mul(precision), 18, clout.address, false);
            })
            .then((instance) => {
                clc = instance;

                return clout.setClaimableToken(clc.address);
            })
            .then(() => {
                return ICO.new(since, till, 18, price1, price2, price3, clout.address, clc.address, false);
            })
            .then((_instance) => {
                instance = _instance;
            })
            .then(() => {
                return clout.addMinter(instance.address);
            })
            .then(() => {
                return clc.addMinter(instance.address);
            })

            .then(() => {
                return instance.sendTransaction({value: 10000});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => Utils.balanceShouldEqualTo(clout, accounts[0], "0"))
            .then(() => Utils.balanceShouldEqualTo(clc, accounts[0], "0"))
    });

    it("transfer ethers", async () => {
        var instance;

        let clout;
        let clc;

        const now = (await Utils.getCurrentBlock()).timestamp;

        let since = now;
        let till = now + 3600;

        let price1 = "2889593100000000";
        let price2 = "7223982750000000";
        let price3 = "14447965500000000";

        return Clout.new(since, true, new BigNumber("100000000").mul(precision), 18, "CLOUT", "CLT", false)
            .then((_token) => {
                clout = _token;

                return CLC.new(new BigNumber("1000000000").mul(precision), 18, clout.address, false);
            })
            .then((instance) => {
                clc = instance;

                return clout.setClaimableToken(clc.address);
            })
            .then(() => {
                return ICO.new(since, till, 18, price1, price2, price3, clout.address, clc.address, 1000, false);
            })
            .then((_instance) => {
                instance = _instance;
            })

            .then(() => {
                return instance.setEtherReceivers(accounts[0], [accounts[1], accounts[2], accounts[3], accounts[3]]);
            })

            .then(() => instance.etherMasterWallet.call())
            .then((result) => assert.equal(result.valueOf(), accounts[0]))

            .then(() => instance.etherReceivers.call(0))
            .then((result) => assert.equal(result.valueOf(), accounts[1]))

            .then(() => instance.etherReceivers.call(1))
            .then((result) => assert.equal(result.valueOf(), accounts[2]))

            .then(() => instance.etherReceivers.call(2))
            .then((result) => assert.equal(result.valueOf(), accounts[3]))


            .then(() => {
                return clout.addMinter(instance.address);
            })
            .then(() => {
                return clc.addMinter(instance.address);
            })

            .then(() => {
                return instance.sendTransaction({value: 10000});
            })

            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(clout, accounts[0], "3460694"))
            .then(() => Utils.balanceShouldEqualTo(clc, accounts[0],   "3460694"))

            .then(() => {
                return instance.sendTransaction({value: 2000000});
            })
            .then(Utils.receiptShouldSucceed)

            .then(() => instance.minEthToContribute.call())
            .then((result) => assert.equal(result.valueOf(), 1000, "minEthers is not equal"))
            .then(() => {
                return instance.sendTransaction({value: 1000});
            })
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(clout, accounts[0], "695945735"))
            .then(() => Utils.balanceShouldEqualTo(clc, accounts[0], "695945735"))

            .then(() => Utils.checkEtherBalance(instance.address, 2011000))

            .then(() => instance.transferEthers())

            .then(() => Utils.checkEtherBalance(instance.address, 0));
    });
});