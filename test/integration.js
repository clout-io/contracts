var ICO = artifacts.require("./ICO.sol");
var Clout = artifacts.require("./Clout.sol");
var CLC = artifacts.require("./CLC.sol");
var TokensDistributionTest = artifacts.require("./test/TokenDistributionTest.sol");
var Utils = require("./utils");

var BigNumber = require("bignumber.js");
var BN = require('bn.js');
var abi = require("ethereumjs-abi");

var precision = new BigNumber("1000000000000000000");

contract('Integration', function(accounts) {
    let now;

    beforeEach(async () => {
        now = (await Utils.getCurrentBlock()).timestamp;
    });

    const price1 = "2889593100000000";
    const price2 = "7223982750000000";
    const price3 = "14447965500000000";

    const account0 = accounts[0];
    const account1 = accounts[1];
    const account2 = accounts[2];
    const account3 = accounts[3];
    const account4 = accounts[4];
    const account5 = accounts[5];
    const account6 = accounts[6];
    const account7 = accounts[7];
    const account8 = accounts[8];
    const account9 = accounts[9];
    const account10 = accounts[10];
    const account11 = accounts[11];
    const account12 = accounts[12];
    const account13 = accounts[13];
    const account14 = accounts[14];
    const account15 = accounts[15];
    const account16 = accounts[16];
    const account17 = accounts[17];
    const account18 = accounts[18];
    const account19 = accounts[19];
    const account20 = accounts[20];

    async function deploy() {
        const since = now;
        const till = now + 3600;

        const clout = await Clout.new(since, true, new BigNumber("100000000").mul(precision), 18, "CLOUT", "CLT", false);
        const clc = await CLC.new(new BigNumber("1000000000").mul(precision), 18, clout.address, false);

        await clout.setClaimableToken(clc.address);
        await clc.setGenesisToken(clout.address);

        const ico = await ICO.new(since, till, 18, price1, price2, price3, clout.address, clc.address, 0, false);

        await clout.addMinter(ico.address);
        await clc.addMinter(ico.address);

        const tokensDistribution = await TokensDistributionTest.new(now, clout.address, clc.address, 18);

        await clout.addMinter(tokensDistribution.address);
        await clc.addMinter(tokensDistribution.address);

        return {
            clout, clc, ico, tokensDistribution
        };
    }

    async function multivestBuy(contract, signer, holder, value) {
        const hash = abi.soliditySHA3(['address'], [new BN(holder.substr(2), 16)]);
        const signature = (await Utils.sign(signer, hash.toString('hex'))).slice(2);
        const r = `0x${signature.slice(0, 64)}`;
        const s = `0x${signature.slice(64, 128)}`;
        const v = web3.toDecimal(signature.slice(128, 130)) + 27;

        var data = abi.simpleEncode("multivestBuy(bytes32,uint8,bytes32,bytes32)", hash, v, r, s);

        return contract.sendTransaction({ from: holder, value, data: data.toString('hex')});
    }

    it("deploy clout & clc & claim", async function () {
        const { clout, clc, ico, tokensDistribution } = await deploy();

        await Utils.balanceShouldEqualTo(clout, accounts[0], "0");
        await Utils.balanceShouldEqualTo(clc, accounts[0], "0");

        await clout.mint(accounts[0], 100000);

        await Utils.balanceShouldEqualTo(clout, accounts[0], "100000");
        await Utils.balanceShouldEqualTo(clc, accounts[0], "0");

        await Utils.timeJump(3600);

        const mintedAt = parseInt(await clout.lastClaims.call(accounts[0]));

        await clout.calculateEmissionTokens(mintedAt, mintedAt + 3600, 100000, 100000);
        const claimedAmount = await clout.calculateEmissionTokens.call(mintedAt, mintedAt + 3600, 100000, 100000);

        await clout.claim();

        await Utils.balanceShouldEqualTo(clout, accounts[0], "100000");
        await Utils.balanceShouldEqualTo(clc, accounts[0], claimedAmount);

        await clout.transfer(accounts[1], 1000);

        await Utils.balanceShouldEqualTo(clout, accounts[0], "99000");
        await Utils.balanceShouldEqualTo(clout, accounts[1], "1000");
        await Utils.balanceShouldEqualTo(clc, accounts[0], claimedAmount);

        await clout.approve(accounts[2], 500, {from: accounts[1]});
        await Utils.balanceShouldEqualTo(clout, accounts[0], "99000");
        await Utils.balanceShouldEqualTo(clout, accounts[1], "1000");
        await Utils.balanceShouldEqualTo(clout, accounts[2], "0");
        await Utils.balanceShouldEqualTo(clc, accounts[0], claimedAmount);

        await clout.transferFrom(accounts[1], accounts[3], 600, {from: accounts[2]});

        await Utils.balanceShouldEqualTo(clout, accounts[0], "99000");
        await Utils.balanceShouldEqualTo(clout, accounts[1], "1000");
        await Utils.balanceShouldEqualTo(clout, accounts[2], "0");
        await Utils.balanceShouldEqualTo(clc, accounts[0], claimedAmount);

        await clout.transferFrom(accounts[1], accounts[3], 400, {from: accounts[2]});

        await Utils.balanceShouldEqualTo(clout, accounts[0], "99000");
        await Utils.balanceShouldEqualTo(clout, accounts[1], "600");
        await Utils.balanceShouldEqualTo(clout, accounts[2], "0");
        await Utils.balanceShouldEqualTo(clout, accounts[3], "400");
        await Utils.balanceShouldEqualTo(clc, accounts[0], claimedAmount);
    });

    it("deploy clout; test freezing / transfer / unfreezing/ transfer", async function () {
        const { clout } = await deploy();

        // mint clouts

        await clout.mint(accounts[0], 100000000);

        try {
            await clout.setTransferFrozen(true, {from: accounts[1]});

            assert.fail("transfer freezed not by owner");
        }
        catch(err) {}

        assert.equal(await clout.transferFrozen(), false, "transfer is freezed not by owner");

        await clout.transfer(accounts[1], 1000);
        await Utils.balanceShouldEqualTo(clout, accounts[0], 99999000);
        await Utils.balanceShouldEqualTo(clout, accounts[1], 1000);

        await clout.setTransferFrozen(true);
        assert.equal(await clout.transferFrozen(), true, "transfer is not freezed");

        try {
            await clout.transfer(accounts[1], 1000);

            assert.fail("transfer succeed");
        }
        catch(err) {}

        await Utils.balanceShouldEqualTo(clout, accounts[0], 99999000);
        await Utils.balanceShouldEqualTo(clout, accounts[1], 1000);

        try {
            await clout.setTransferFrozen(false, {from: accounts[1]});

            assert.fail("transfer freezed not by owner");
        }
        catch(err) {}
        assert.equal(await clout.transferFrozen(), true, "transfer is unfreezed not by owner");

        await clout.setTransferFrozen(false);
        assert.equal(await clout.transferFrozen(), false, "transfer is not unfreezed");

        await clout.transfer(accounts[2], 200, {from: accounts[1]});

        await Utils.balanceShouldEqualTo(clout, accounts[0], 99999000);
        await Utils.balanceShouldEqualTo(clout, accounts[1], 800);
        await Utils.balanceShouldEqualTo(clout, accounts[2], 200);
    });

    it("deploy clc; test freezing / transfer / unfreezing/ transfer", async function () {
        const { clc } = await deploy();

        // mint clouts

        await clc.mint(accounts[0], 100000000);

        try {
            await clc.setTransferFrozen(true, {from: accounts[1]});

            assert.fail("transfer freezed not by owner");
        }
        catch(err) {}

        assert.equal(await clc.transferFrozen(), false, "transfer is freezed not by owner");

        await clc.transfer(accounts[1], 1000);
        await Utils.balanceShouldEqualTo(clc, accounts[0], 99999000);
        await Utils.balanceShouldEqualTo(clc, accounts[1], 1000);

        await clc.setTransferFrozen(true);
        assert.equal(await clc.transferFrozen(), true, "transfer is not freezed");

        try {
            await clc.transfer(accounts[1], 1000);

            assert.fail("transfer succeed");
        }
        catch(err) {}

        await Utils.balanceShouldEqualTo(clc, accounts[0], 99999000);
        await Utils.balanceShouldEqualTo(clc, accounts[1], 1000);

        try {
            await clc.setTransferFrozen(false, {from: accounts[1]});

            assert.fail("transfer freezed not by owner");
        }
        catch(err) {}
        assert.equal(await clc.transferFrozen(), true, "transfer is unfreezed not by owner");

        await clc.setTransferFrozen(false);
        assert.equal(await clc.transferFrozen(), false, "transfer is not unfreezed");

        await clc.transfer(accounts[2], 200, {from: accounts[1]});

        await Utils.balanceShouldEqualTo(clc, accounts[0], 99999000);
        await Utils.balanceShouldEqualTo(clc, accounts[1], 800);
        await Utils.balanceShouldEqualTo(clc, accounts[2], 200);
    });

    // it("deploy clout, clc, ico; freze transfer; contribute to ico; stop ico; unfreeze tokens transfer", async function () {
    //     const { clout, clc, ico, tokensDistribution } = await deploy();
    //
    //     await clout.setTransferFrozen(true);
    //     await clc.setTransferFrozen(true);
    //
    //     await Utils.sendTransaction(ico, accounts[0], web3.toWei('0.003', 'ether'), null, true);
    //
    //     await Utils.checkState({ clout, clc, ico }, {
    //         ico: {
    //             collectedEthers: 0,
    //             soldTokens: 0,
    //             locked: false
    //         },
    //         clout: {
    //             balanceOf: [
    //                 {[account0] : 0}
    //             ],
    //             totalSupply: 0,
    //             transferFrozen: true
    //         },
    //         clc: {
    //             balanceOf: [
    //                 {[account0]: 0}
    //             ],
    //             totalSupply: 0,
    //             transferFrozen: true
    //         }
    //     });
    //
    //     await Utils.sendTransaction(ico, accounts[0], web3.toWei('0.53', 'ether'), null, false);
    //
    //     let tokensSold = await ico.getIcoTokensAmount(0, web3.toWei('0.53', 'ether'));
    //
    //     await Utils.checkState({ clout, clc, ico }, {
    //         ico: {
    //             collectedEthers: web3.toWei('0.53', 'ether'),
    //             soldTokens: tokensSold,
    //             locked: false
    //         },
    //         clout: {
    //             balanceOf: [
    //                 {[account0]: tokensSold}
    //             ],
    //             totalSupply: tokensSold,
    //             transferFrozen: true
    //         },
    //         clc: {
    //             balanceOf: [
    //                 {[account0]: tokensSold}
    //             ],
    //             totalSupply: tokensSold,
    //             transferFrozen: true
    //         }
    //     });
    //
    //     await Utils.erc20.transfer(clout, accounts[0], accounts[1], 100000, true);
    //     await Utils.erc20.transfer(clc, accounts[0], accounts[1], 100000, true);
    //
    //     await Utils.checkState({ clout, clc }, {
    //         clout: {
    //             balanceOf: [
    //                 {[account0]: tokensSold},
    //                 {[account1]: 0}
    //             ],
    //             totalSupply: tokensSold,
    //             transferFrozen: true
    //         },
    //         clc: {
    //             balanceOf: [
    //                 {[account0]: tokensSold},
    //                 {[account1]: 0}
    //             ],
    //             totalSupply: tokensSold,
    //             transferFrozen: true
    //         }
    //     });
    //
    //     await ico.setLocked(true);
    //     assert.equal(await ico.locked.call(), true, "ico is not locked");
    //
    //     await Utils.sendTransaction(ico, accounts[0], web3.toWei('0.53', 'ether'), null, true);
    //     await Utils.checkState({ clout, clc, ico }, {
    //         ico: {
    //             collectedEthers: web3.toWei('0.53', 'ether'),
    //             soldTokens: tokensSold,
    //             locked: true
    //         },
    //         clout: {
    //             balanceOf: [
    //                 {[ account0 ]: tokensSold}
    //             ],
    //             totalSupply: tokensSold
    //         },
    //         clc: {
    //             balanceOf: [
    //                 {[ account0 ]: tokensSold}
    //             ],
    //             totalSupply: tokensSold
    //         }
    //     });
    //
    //     await clout.setTransferFrozen(false);
    //     await clc.setTransferFrozen(false);
    //
    //     await Utils.checkState({ clout, clc, ico }, {
    //         clout: {
    //             transferFrozen: false
    //         },
    //         clc: {
    //             transferFrozen: false
    //         }
    //     });
    //
    //     await Utils.erc20.transfer(clout, accounts[0], accounts[1], 100000, false);
    //     await Utils.erc20.transfer(clc, accounts[0], accounts[1], 100000, false);
    //
    //     await Utils.checkState({ clout, clc }, {
    //         clout: {
    //             balanceOf: [
    //                 {[account0]: tokensSold.sub(100000)},
    //                 {[account1]: 100000}
    //             ],
    //             transferFrozen: false
    //         },
    //         clc: {
    //             balanceOf: [
    //                 {[account0]: tokensSold.sub(100000)},
    //                 {[account1]: 100000}
    //             ],
    //             transferFrozen: false
    //         }
    //     });
    //
    //     await ico.setLocked(false);
    //
    //     tokensSold = tokensSold.add(await ico.getIcoTokensAmount(web3.toWei('0.53', 'ether'), web3.toWei('1', 'ether')));
    //
    //     await Utils.sendTransaction(ico, accounts[0], web3.toWei('1', 'ether'), null, false);
    //
    //     await Utils.checkState({ clout, clc, ico }, {
    //         ico: {
    //             collectedEthers: web3.toWei('1.53', 'ether'),
    //             soldTokens: tokensSold,
    //             locked: false
    //         },
    //         clout: {
    //             balanceOf: [
    //                 {[ account0 ]: tokensSold.sub(100000)}
    //             ],
    //             totalSupply: tokensSold
    //         },
    //         clc: {
    //             balanceOf: [
    //                 {[ account0 ]: tokensSold.sub(100000)}
    //             ],
    //             totalSupply: tokensSold
    //         }
    //     });
    //
    //     let timeJump = 86400;
    //
    //     await Utils.timeJump(86400);
    //
    //     await Utils.erc20.test.transferFrom(clout, accounts[1], accounts[2], accounts[3], 1000);
    //     await Utils.erc20.test.transferFrom(clc, accounts[1], accounts[2], accounts[3], 1000);
    //
    //     timeJump += 30 * 86400;
    //
    //     await Utils.timeJump(30 * 86400);
    //
    //     //@TODO: calculate how many tokens were calculated
    //
    //     const lastClaimAccount0 = await clout.lastClaims.call(account0);
    //     const lastClaimAccount1 = await clout.lastClaims.call(account1);
    //
    //     // test
    //     await clout.calculateEmissionTokens(lastClaimAccount0,
    //         lastClaimAccount0.add(30 * 86400),
    //         await clout.balanceOf.call(account0),
    //         await clout.totalSupply.call());
    //
    //     const claimedTokensAccount0 = await clout.calculateEmissionTokens.call(lastClaimAccount0,
    //         lastClaimAccount0.add(30 * 86400),
    //         await clout.balanceOf.call(account0),
    //         await clout.totalSupply.call());
    //
    //     const claimedTokensAccount1 = await clout.calculateEmissionTokens.call(lastClaimAccount1,
    //         lastClaimAccount1.add(30 * 86400),
    //         await clout.balanceOf.call(account1),
    //         await clout.totalSupply.call());
    //
    //     console.log("Tokens sold", tokensSold.valueOf(), " accounts0 balance", (await clout.balanceOf.call(account0)).valueOf(), "last claimed at", lastClaimAccount0.valueOf(), " claimdTokensAccount0", claimedTokensAccount0.valueOf());
    //     console.log("Tokens sold", tokensSold.valueOf(), " accounts0 balance", 99500, "last claimed at", lastClaimAccount1.valueOf(), " claimdTokensAccount0", claimedTokensAccount1.valueOf());
    //
    //     await clout.claim({ from: account0 });
    //     // await clout.claim({ from: account1 });
    //
    //     await Utils.checkState({ clout, clc, ico }, {
    //         ico: {
    //             collectedEthers: web3.toWei('1.53', 'ether'),
    //             soldTokens: tokensSold,
    //             locked: false
    //         },
    //         clout: {
    //             balanceOf: [
    //                 {[account0]: tokensSold.sub(100000)},
    //                 {[account1]: 99500},
    //                 {[account2]: 0},
    //                 {[account3]: 500}
    //             ],
    //             totalSupply: tokensSold
    //         },
    //         clc: {
    //             balanceOf: [
    //                 {[account0]: tokensSold.sub(100000).add(claimedTokensAccount0).valueOf()},
    //                 {[account1]: claimedTokensAccount1.valueOf()},
    //                 {[account2]: 0},
    //                 {[account3]: 500}
    //             ],
    //             totalSupply: tokensSold.add(claimedTokensAccount0).add(claimedTokensAccount1).valueOf()
    //         }
    //     });
    // });

    it("deploy clout, clc, ico, tokens distribution; simulate tokens distribution", async function () {
        async function checkHolder(instance, id, totalCloutTokens, totalClcTokens, sentCloutTokens, sentClcTokens, since, period, revocable) {
            let obj = await instance.holders.call(id);

            let holder = {
                holder: obj[0].valueOf(),
                totalCloutTokens: obj[1].valueOf(),
                totalClcTokens: obj[2].valueOf(),

                sentCloutTokens: obj[3].valueOf(),
                sentClcTokens: obj[4].valueOf(),

                since: obj[5].valueOf(),
                period: obj[6].valueOf(),
                lastIssuedAt: obj[7].valueOf(),

                inited: obj[8].valueOf(),

                revocable: obj[9].valueOf()
            };

            await assert.equal(holder.totalCloutTokens, totalCloutTokens.valueOf(), "holder totalCloutTokens is not equal");
            await assert.equal(holder.totalClcTokens, totalClcTokens.valueOf(), "holder totalClcTokens is not equal");

            await assert.equal(holder.sentCloutTokens, sentCloutTokens.valueOf(), "holder sentCloutTokens is not equal");
            await assert.equal(holder.sentClcTokens, sentClcTokens.valueOf(), "holder sentClcTokens is not equal");

            await assert.equal(holder.since, since.valueOf(), "holder since is not equal");

            await assert.equal(holder.revocable, revocable.valueOf(), "holder revocable is not equal");
        }


        const { clout, clc, ico, tokensDistribution } = await deploy();

        const totalCloutTokens = new BigNumber(2000000).mul(precision);
        const totalCLCTokens = new BigNumber(2000000).mul(precision);
        const since = now;
        const period = 30 * 86400;
        
        await tokensDistribution.addHolder(accounts[0],
            totalCloutTokens, totalCLCTokens,
            since, period,
            false
        );

        await tokensDistribution.removeHolder(accounts[0]);

        await checkHolder(tokensDistribution, accounts[0], totalCloutTokens, totalCLCTokens, 0, 0, since, period, false);

        for(let i = 1; i <= 25; i++) {
            await Utils.timeJump(30 * 86400);

            let expectedCloutTokens = totalCloutTokens.div(20).mul(i);
            let expectedCLCTokens = totalCLCTokens.div(20).mul(i);

            if(i > 20) {
                expectedCloutTokens = totalCloutTokens;
                expectedCLCTokens = totalCLCTokens;
            }

            await tokensDistribution.issue({ from: accounts[0] });

            const clcBalance = await clc.balanceOf(account0);

            // first time is minting, next time, claiming + minting
            if(i > 1) {
                assert(clcBalance.gt(expectedCLCTokens), `CLC balance ${clcBalance} is more than distributed ${expectedCLCTokens} because of Clout mining`);
            }

            await checkHolder(tokensDistribution, accounts[0], totalCloutTokens, totalCLCTokens,
                expectedCloutTokens,
                expectedCLCTokens,
                since, period,
                false);

            await Utils.checkState({ clout, clc }, {
                clout: {
                    balanceOf: {
                        [account0]: expectedCloutTokens.valueOf()
                    }
                },
                clc: {
                    balanceOf: {
                        [account0]: clcBalance.valueOf()
                    }
                }
            })
        }

        await tokensDistribution.addHolder(accounts[1],
            totalCloutTokens, totalCLCTokens,
            (await Utils.getCurrentBlock()).timestamp, period,
            false
        );

        // 40 months
        await Utils.timeJump(40 * 30 * 86400);

        await checkHolder(tokensDistribution, accounts[0], totalCloutTokens, totalCLCTokens,
            totalCloutTokens, totalCLCTokens,
            since, period,
            false);

        await Utils.checkState({ clout, clc }, {
            clout: {
                balanceOf: {
                    [account1]: 0
                }
            },
            clc: {
                balanceOf: {
                    [account1]: 0
                }
            }
        });

        await tokensDistribution.issue({ from: accounts[1] });

        await Utils.checkState({ clout, clc }, {
            clout: {
                balanceOf: {
                    [account1]: totalCloutTokens
                }
            },
            clc: {
                balanceOf: {
                    [account1]: totalCLCTokens
                }
            }
        });

        // case when user issued 11 periods, and after will try to issue in 30 months

        await tokensDistribution.addHolder(accounts[2],
            totalCloutTokens, totalCLCTokens,
            (await Utils.getCurrentBlock()).timestamp, period,
            false
        );

        await Utils.timeJump(11 * 30 * 86400);

        await tokensDistribution.issue({ from: accounts[2] });

        await Utils.timeJump(30 * 30 * 86400);

        await tokensDistribution.issue({ from: accounts[2] });

        await Utils.checkState({ clout, clc }, {
            clout: {
                balanceOf: {
                    [account2]: totalCloutTokens.valueOf()
                }
            }
        });

        await Utils.timeJump(30 * 30 * 86400);

        await tokensDistribution.issue({ from: accounts[2] });

        await Utils.checkState({ clout, clc }, {
            clout: {
                balanceOf: {
                    [account2]: totalCloutTokens.valueOf()
                }
            }
        });

        await checkHolder(tokensDistribution, accounts[0], totalCloutTokens, totalCLCTokens,
            totalCloutTokens, totalCLCTokens,
            since, period,
            false);
    });
    
    it("deploy clout, clc, ico; transfer ownership to another address", async function () {
        const { clout, clc, ico, tokensDistribution } = await deploy();

        await Utils.shouldFail(clout.transferOwnership(accounts[10], {from: accounts[9]}));
        await Utils.shouldFail(clc.transferOwnership(accounts[10], {from: accounts[9]}));
        await Utils.shouldFail(ico.transferOwnership(accounts[10], {from: accounts[9]}));
        await Utils.shouldFail(tokensDistribution.transferOwnership(accounts[10], {from: accounts[9]}));

        assert.equal(await clout.owner.call(), accounts[0], "owner is changed");
        assert.equal(await clc.owner.call(), accounts[0], "owner is changed");
        assert.equal(await ico.owner.call(), accounts[0], "owner is changed");
        assert.equal(await tokensDistribution.owner.call(), accounts[0], "owner is changed");

        assert.equal(await clout.newOwner.call(), "0x0000000000000000000000000000000000000000", "newOwner is changed");
        assert.equal(await clc.newOwner.call(), "0x0000000000000000000000000000000000000000", "newOwner is changed");
        assert.equal(await ico.newOwner.call(), "0x0000000000000000000000000000000000000000", "newOwner is changed");
        assert.equal(await tokensDistribution.newOwner.call(), "0x0000000000000000000000000000000000000000", "newOwner is changed");

        await clout.transferOwnership(accounts[9]);
        await clc.transferOwnership(accounts[9]);
        await ico.transferOwnership(accounts[9]);
        await tokensDistribution.transferOwnership(accounts[9]);

        assert.equal(await clout.owner.call(), accounts[0], "owner is changed");
        assert.equal(await clc.owner.call(), accounts[0], "owner is changed");
        assert.equal(await ico.owner.call(), accounts[0], "owner is changed");
        assert.equal(await tokensDistribution.owner.call(), accounts[0], "owner is changed");

        assert.equal(await clout.newOwner.call(), accounts[9], "newOwner is not changed");
        assert.equal(await clc.newOwner.call(), accounts[9], "newOwner is not changed");
        assert.equal(await ico.newOwner.call(), accounts[9], "newOwner is not changed");
        assert.equal(await tokensDistribution.newOwner.call(), accounts[9], "newOwner is not changed");

        await clout.acceptOwnership({from: accounts[8]});
        await clc.acceptOwnership({from: accounts[8]});
        await ico.acceptOwnership({from: accounts[8]});
        await tokensDistribution.acceptOwnership({from: accounts[8]});

        assert.equal(await clout.owner.call(), accounts[0], "owner is changed");
        assert.equal(await clc.owner.call(), accounts[0], "owner is changed");
        assert.equal(await ico.owner.call(), accounts[0], "owner is changed");
        assert.equal(await tokensDistribution.owner.call(), accounts[0], "owner is changed");

        await clout.acceptOwnership({from: accounts[9]});
        await clc.acceptOwnership({from: accounts[9]});
        await ico.acceptOwnership({from: accounts[9]});
        await tokensDistribution.acceptOwnership({from: accounts[9]});

        assert.equal(await clout.owner.call(), accounts[9], "owner is changed");
        assert.equal(await clc.owner.call(), accounts[9], "owner is changed");
        assert.equal(await ico.owner.call(), accounts[9], "owner is changed");
        assert.equal(await tokensDistribution.owner.call(), accounts[9], "owner is changed");

        assert.equal(await clout.newOwner.call(), "0x0000000000000000000000000000000000000000", "newOwner is changed");
        assert.equal(await clc.newOwner.call(), "0x0000000000000000000000000000000000000000", "newOwner is changed");
        assert.equal(await ico.newOwner.call(), "0x0000000000000000000000000000000000000000", "newOwner is changed");
        assert.equal(await tokensDistribution.newOwner.call(), "0x0000000000000000000000000000000000000000", "newOwner is changed");
    });
});