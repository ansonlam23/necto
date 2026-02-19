import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

describe("USDCEscrow", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  // owner = deployer = agent wallet (same account deploys router + escrow)
  const [owner, depositor, other] = await viem.getWalletClients();

  const ONE_USDC = 1_000_000n;
  const DEFAULT_DEPOSIT = 5n * ONE_USDC; // $5 USDC
  const DETAILS_HASH = `0x${"0".repeat(63)}1` as `0x${string}`;
  const ROUTING_HASH = `0x${"0".repeat(63)}2` as `0x${string}`;
  const PROVIDER_ADDRESS = other.account.address;

  const addr = (a: string) => getAddress(a);

  /**
   * Deploy full stack: TestnetUSDC + ComputeRouter + USDCEscrow
   * Owner is the agent for ComputeRouter and the owner of USDCEscrow.
   * Mints tokens to depositor and approves escrow.
   */
  async function deployFixture(mintAmount: bigint = 100n * ONE_USDC) {
    const token = await viem.deployContract("TestnetUSDC");
    const router = await viem.deployContract("ComputeRouter", [owner.account.address]);
    const escrow = await viem.deployContract("USDCEscrow", [token.address, router.address]);

    // Mint to depositor
    const mintTx = await token.write.mint([depositor.account.address, mintAmount]);
    await publicClient.waitForTransactionReceipt({ hash: mintTx });

    // Depositor approves escrow contract
    const approveTx = await token.write.approve([escrow.address, mintAmount], { account: depositor.account });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    return { token, router, escrow };
  }

  /**
   * Helper: submit a job in the router (agent = owner) and return the jobId
   */
  async function submitJob(router: Awaited<ReturnType<typeof viem.deployContract>>, isTracked = true): Promise<bigint> {
    const tx = await router.write.submitJob([depositor.account.address, DETAILS_HASH, isTracked]);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    return await router.read.jobCount() as bigint;
  }

  /**
   * Helper: route a job in the router (agent = owner)
   */
  async function routeJob(router: Awaited<ReturnType<typeof viem.deployContract>>, jobId: bigint) {
    const tx = await router.write.recordRoutingDecision([jobId, PROVIDER_ADDRESS, DEFAULT_DEPOSIT, ROUTING_HASH]);
    await publicClient.waitForTransactionReceipt({ hash: tx });
  }

  describe("Deployment", async function () {
    it("Should set the USDC token address", async function () {
      const { token, escrow } = await deployFixture();
      const storedToken = await escrow.read.usdcToken();
      assert.equal(storedToken.toLowerCase(), token.address.toLowerCase());
    });

    it("Should set the ComputeRouter address", async function () {
      const { router, escrow } = await deployFixture();
      const storedRouter = await escrow.read.computeRouter();
      assert.equal(storedRouter.toLowerCase(), router.address.toLowerCase());
    });

    it("Should set deployer as owner", async function () {
      const { escrow } = await deployFixture();
      const storedOwner = await escrow.read.owner();
      assert.equal(storedOwner.toLowerCase(), owner.account.address.toLowerCase());
    });

    it("DEFAULT_DEPOSIT should be 5 USDC", async function () {
      const { escrow } = await deployFixture();
      assert.equal(await escrow.read.DEFAULT_DEPOSIT(), DEFAULT_DEPOSIT);
    });

    it("Should reject zero address token", async function () {
      const router = await viem.deployContract("ComputeRouter", [owner.account.address]);
      let callFailed = false;
      try {
        await viem.deployContract("USDCEscrow", ["0x0000000000000000000000000000000000000000", router.address]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject zero address token");
    });

    it("Should reject zero address router", async function () {
      const token = await viem.deployContract("TestnetUSDC");
      let callFailed = false;
      try {
        await viem.deployContract("USDCEscrow", [token.address, "0x0000000000000000000000000000000000000000"]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject zero address router");
    });
  });

  describe("deposit", async function () {
    it("Depositor can deposit USDC for a valid router job", async function () {
      const { token, router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const tx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const escrowData = await escrow.read.getEscrow([jobId]);
      assert.equal(escrowData.depositor.toLowerCase(), depositor.account.address.toLowerCase());
      assert.equal(escrowData.amount, DEFAULT_DEPOSIT);
      assert.equal(escrowData.status, 0); // Active
      assert.notEqual(escrowData.createdAt, 0n);

      // Token transferred to escrow contract
      assert.equal(await token.read.balanceOf([escrow.address]), DEFAULT_DEPOSIT);
    });

    it("Should emit Deposited event", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      await viem.assertions.emitWithArgs(
        escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account }),
        escrow,
        "Deposited",
        [jobId, addr(depositor.account.address), DEFAULT_DEPOSIT],
      );
    });

    it("Cannot deposit for a job that doesn't exist in router", async function () {
      const { escrow } = await deployFixture();

      let callFailed = false;
      try {
        await escrow.write.deposit([999n, DEFAULT_DEPOSIT], { account: depositor.account });
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject deposit for non-existent router job");
    });

    it("Cannot deposit zero amount", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      let callFailed = false;
      try {
        await escrow.write.deposit([jobId, 0n], { account: depositor.account });
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject zero deposit");
    });

    it("Cannot deposit for same jobId twice", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const tx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      let callFailed = false;
      try {
        await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should reject duplicate deposit for same jobId");
    });

    it("Can deposit for different jobIds", async function () {
      const { router, escrow } = await deployFixture();
      const jobId1 = await submitJob(router);
      const jobId2 = await submitJob(router);

      const tx1 = await escrow.write.deposit([jobId1, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      const tx2 = await escrow.write.deposit([jobId2, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      const escrow1 = await escrow.read.getEscrow([jobId1]);
      const escrow2 = await escrow.read.getEscrow([jobId2]);
      assert.equal(escrow1.amount, DEFAULT_DEPOSIT);
      assert.equal(escrow2.amount, DEFAULT_DEPOSIT);
    });

    it("Can deposit custom amount (not just default)", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);
      const customAmount = 20n * ONE_USDC;

      const tx = await escrow.write.deposit([jobId, customAmount], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const escrowData = await escrow.read.getEscrow([jobId]);
      assert.equal(escrowData.amount, customAmount);
    });
  });

  describe("release", async function () {
    it("Owner can release after job is routed — funds go to owner", async function () {
      const { token, router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      // Route the job in the router first
      await routeJob(router, jobId);

      const ownerBalanceBefore = await token.read.balanceOf([owner.account.address]);

      const releaseTx = await escrow.write.release([jobId]);
      await publicClient.waitForTransactionReceipt({ hash: releaseTx });

      const escrowData = await escrow.read.getEscrow([jobId]);
      assert.equal(escrowData.status, 1); // Released

      // Funds transferred to owner
      const ownerBalanceAfter = await token.read.balanceOf([owner.account.address]);
      assert.equal(ownerBalanceAfter - ownerBalanceBefore, DEFAULT_DEPOSIT);

      // Escrow contract balance drained
      assert.equal(await token.read.balanceOf([escrow.address]), 0n);
    });

    it("Should emit Released event with amount", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      await routeJob(router, jobId);

      await viem.assertions.emitWithArgs(
        escrow.write.release([jobId]),
        escrow,
        "Released",
        [jobId, DEFAULT_DEPOSIT],
      );
    });

    it("Cannot release if job not yet routed", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      // Job submitted but NOT routed
      let callFailed = false;
      try {
        await escrow.write.release([jobId]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should not release before job is routed");
    });

    it("Non-owner cannot release", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      await routeJob(router, jobId);

      let callFailed = false;
      try {
        await escrow.write.release([jobId], { account: other.account });
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Non-owner should not be able to release");
    });

    it("Cannot release non-existent escrow", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);
      await routeJob(router, jobId);

      let callFailed = false;
      try {
        await escrow.write.release([jobId]); // no deposit was made
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should not release non-existent escrow");
    });

    it("Cannot release already released escrow", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      await routeJob(router, jobId);

      const releaseTx = await escrow.write.release([jobId]);
      await publicClient.waitForTransactionReceipt({ hash: releaseTx });

      let callFailed = false;
      try {
        await escrow.write.release([jobId]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should not release already released escrow");
    });
  });

  describe("refund", async function () {
    it("Owner can refund an active escrow back to depositor", async function () {
      const { token, router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      const balanceBefore = await token.read.balanceOf([depositor.account.address]);

      const refundTx = await escrow.write.refund([jobId]);
      await publicClient.waitForTransactionReceipt({ hash: refundTx });

      const escrowData = await escrow.read.getEscrow([jobId]);
      assert.equal(escrowData.status, 2); // Refunded

      const balanceAfter = await token.read.balanceOf([depositor.account.address]);
      assert.equal(balanceAfter - balanceBefore, DEFAULT_DEPOSIT);
    });

    it("Should emit Refunded event with amount", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      await viem.assertions.emitWithArgs(
        escrow.write.refund([jobId]),
        escrow,
        "Refunded",
        [jobId, DEFAULT_DEPOSIT],
      );
    });

    it("Non-owner cannot refund", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      let callFailed = false;
      try {
        await escrow.write.refund([jobId], { account: other.account });
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Non-owner should not be able to refund");
    });

    it("Cannot refund already released escrow", async function () {
      const { router, escrow } = await deployFixture();
      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      await routeJob(router, jobId);

      const releaseTx = await escrow.write.release([jobId]);
      await publicClient.waitForTransactionReceipt({ hash: releaseTx });

      let callFailed = false;
      try {
        await escrow.write.refund([jobId]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should not refund already released escrow");
    });
  });

  describe("Integration: full lifecycle with ComputeRouter", async function () {
    it("Submit job -> deposit $5 -> route job -> release to owner", async function () {
      const { token, router, escrow } = await deployFixture();

      // 1. Agent submits job in router
      const jobId = await submitJob(router);

      // 2. Buyer deposits $5 USDC into escrow
      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      let escrowData = await escrow.read.getEscrow([jobId]);
      assert.equal(escrowData.status, 0); // Active
      assert.equal(await token.read.balanceOf([escrow.address]), DEFAULT_DEPOSIT);

      // 3. Agent routes the job to a provider
      await routeJob(router, jobId);

      // 4. Agent releases escrow — funds go to owner (agent wallet)
      const ownerBalanceBefore = await token.read.balanceOf([owner.account.address]);

      const releaseTx = await escrow.write.release([jobId]);
      await publicClient.waitForTransactionReceipt({ hash: releaseTx });

      escrowData = await escrow.read.getEscrow([jobId]);
      assert.equal(escrowData.status, 1); // Released

      const ownerBalanceAfter = await token.read.balanceOf([owner.account.address]);
      assert.equal(ownerBalanceAfter - ownerBalanceBefore, DEFAULT_DEPOSIT);
      assert.equal(await token.read.balanceOf([escrow.address]), 0n);
    });

    it("Submit job -> deposit -> refund (job cancelled)", async function () {
      const { token, router, escrow } = await deployFixture();

      // 1. Agent submits job
      const jobId = await submitJob(router);

      // 2. Buyer deposits
      const depositorBalanceBefore = await token.read.balanceOf([depositor.account.address]);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      assert.equal(
        await token.read.balanceOf([depositor.account.address]),
        depositorBalanceBefore - DEFAULT_DEPOSIT,
      );

      // 3. Job cancelled — agent refunds
      const refundTx = await escrow.write.refund([jobId]);
      await publicClient.waitForTransactionReceipt({ hash: refundTx });

      // Depositor balance fully restored
      assert.equal(
        await token.read.balanceOf([depositor.account.address]),
        depositorBalanceBefore,
      );

      const escrowData = await escrow.read.getEscrow([jobId]);
      assert.equal(escrowData.status, 2); // Refunded
    });

    it("Cannot release before routing (enforces router state)", async function () {
      const { router, escrow } = await deployFixture();

      const jobId = await submitJob(router);

      const depositTx = await escrow.write.deposit([jobId, DEFAULT_DEPOSIT], { account: depositor.account });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      // Try to release without routing — should fail
      let callFailed = false;
      try {
        await escrow.write.release([jobId]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Escrow enforces that job must be routed before release");
    });
  });
});
