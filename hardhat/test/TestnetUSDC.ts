import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

describe("TestnetUSDC", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, alice, bob] = await viem.getWalletClients();

  const addr = (a: string) => getAddress(a);

  const FAUCET_AMOUNT = 10_000n * 1_000_000n; // 10,000 tUSDC (6 decimals)
  const ONE_USDC = 1_000_000n;

  describe("Deployment", async function () {
    it("Should have correct name, symbol, and decimals", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      assert.equal(await token.read.name(), "Testnet USDC");
      assert.equal(await token.read.symbol(), "tUSDC");
      assert.equal(await token.read.decimals(), 6);
    });

    it("Should start with zero total supply", async function () {
      const token = await viem.deployContract("TestnetUSDC");
      assert.equal(await token.read.totalSupply(), 0n);
    });
  });

  describe("mint (faucet)", async function () {
    it("Anyone can mint tokens up to faucet limit", async function () {
      const token = await viem.deployContract("TestnetUSDC");
      const amount = 1000n * ONE_USDC;

      const tx = await token.write.mint([alice.account.address, amount]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      assert.equal(await token.read.balanceOf([alice.account.address]), amount);
      assert.equal(await token.read.totalSupply(), amount);
    });

    it("Can mint the exact faucet amount", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      const tx = await token.write.mint([alice.account.address, FAUCET_AMOUNT]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      assert.equal(await token.read.balanceOf([alice.account.address]), FAUCET_AMOUNT);
    });

    it("Cannot mint more than faucet limit in one call", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      let callFailed = false;
      try {
        await token.write.mint([alice.account.address, FAUCET_AMOUNT + 1n]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject amounts exceeding faucet limit");
    });

    it("Cannot mint to zero address", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      let callFailed = false;
      try {
        await token.write.mint(["0x0000000000000000000000000000000000000000", ONE_USDC]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject mint to zero address");
    });

    it("Should emit Transfer event from zero address on mint", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      await viem.assertions.emitWithArgs(
        token.write.mint([alice.account.address, ONE_USDC]),
        token,
        "Transfer",
        ["0x0000000000000000000000000000000000000000", addr(alice.account.address), ONE_USDC],
      );
    });

    it("Multiple mints accumulate balance", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      const tx1 = await token.write.mint([alice.account.address, 500n * ONE_USDC]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      const tx2 = await token.write.mint([alice.account.address, 300n * ONE_USDC]);
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      assert.equal(await token.read.balanceOf([alice.account.address]), 800n * ONE_USDC);
      assert.equal(await token.read.totalSupply(), 800n * ONE_USDC);
    });
  });

  describe("approve", async function () {
    it("Can approve spender", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      const tx = await token.write.approve([bob.account.address, 100n * ONE_USDC], { account: alice.account });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      assert.equal(
        await token.read.allowance([alice.account.address, bob.account.address]),
        100n * ONE_USDC,
      );
    });

    it("Should emit Approval event", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      await viem.assertions.emitWithArgs(
        token.write.approve([bob.account.address, 50n * ONE_USDC], { account: alice.account }),
        token,
        "Approval",
        [addr(alice.account.address), addr(bob.account.address), 50n * ONE_USDC],
      );
    });

    it("Cannot approve zero address spender", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      let callFailed = false;
      try {
        await token.write.approve(["0x0000000000000000000000000000000000000000", ONE_USDC]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject approve to zero address");
    });
  });

  describe("transfer", async function () {
    it("Can transfer tokens between accounts", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      // Mint to alice
      const mintTx = await token.write.mint([alice.account.address, 100n * ONE_USDC]);
      await publicClient.waitForTransactionReceipt({ hash: mintTx });

      // Alice transfers to bob
      const tx = await token.write.transfer([bob.account.address, 40n * ONE_USDC], { account: alice.account });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      assert.equal(await token.read.balanceOf([alice.account.address]), 60n * ONE_USDC);
      assert.equal(await token.read.balanceOf([bob.account.address]), 40n * ONE_USDC);
    });

    it("Cannot transfer more than balance", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      const mintTx = await token.write.mint([alice.account.address, 10n * ONE_USDC]);
      await publicClient.waitForTransactionReceipt({ hash: mintTx });

      let callFailed = false;
      try {
        await token.write.transfer([bob.account.address, 11n * ONE_USDC], { account: alice.account });
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject transfer exceeding balance");
    });

    it("Should emit Transfer event", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      const mintTx = await token.write.mint([alice.account.address, 100n * ONE_USDC]);
      await publicClient.waitForTransactionReceipt({ hash: mintTx });

      await viem.assertions.emitWithArgs(
        token.write.transfer([bob.account.address, 25n * ONE_USDC], { account: alice.account }),
        token,
        "Transfer",
        [addr(alice.account.address), addr(bob.account.address), 25n * ONE_USDC],
      );
    });
  });

  describe("transferFrom", async function () {
    it("Approved spender can transfer on behalf of owner", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      // Mint to alice
      const mintTx = await token.write.mint([alice.account.address, 100n * ONE_USDC]);
      await publicClient.waitForTransactionReceipt({ hash: mintTx });

      // Alice approves bob
      const approveTx = await token.write.approve([bob.account.address, 50n * ONE_USDC], { account: alice.account });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Bob transfers from alice to deployer
      const tx = await token.write.transferFrom(
        [alice.account.address, deployer.account.address, 30n * ONE_USDC],
        { account: bob.account },
      );
      await publicClient.waitForTransactionReceipt({ hash: tx });

      assert.equal(await token.read.balanceOf([alice.account.address]), 70n * ONE_USDC);
      assert.equal(await token.read.balanceOf([deployer.account.address]), 30n * ONE_USDC);
      assert.equal(
        await token.read.allowance([alice.account.address, bob.account.address]),
        20n * ONE_USDC,
      );
    });

    it("Cannot transferFrom without sufficient allowance", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      const mintTx = await token.write.mint([alice.account.address, 100n * ONE_USDC]);
      await publicClient.waitForTransactionReceipt({ hash: mintTx });

      // Alice approves bob for only 10
      const approveTx = await token.write.approve([bob.account.address, 10n * ONE_USDC], { account: alice.account });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      let callFailed = false;
      try {
        await token.write.transferFrom(
          [alice.account.address, deployer.account.address, 50n * ONE_USDC],
          { account: bob.account },
        );
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject transferFrom exceeding allowance");
    });
  });
});
