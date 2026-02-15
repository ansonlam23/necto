import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

describe("ComputeRouter", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [agentClient, nonAgentClient] = await viem.getWalletClients();

  // Helper to generate a random bytes32 hash
  const toBytes32 = (value: bigint): `0x${string}` => {
    return `0x${value.toString(16).padStart(64, '0')}` as `0x${string}`;
  };

  // Helper to normalize address for comparison (handles checksum vs non-checksum)
  const normalizeAddress = (addr: string): string => {
    try {
      return getAddress(addr);
    } catch {
      return addr.toLowerCase();
    }
  };

  // Use valid checksummed addresses
  // The Hardhat default accounts are:
  // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (first)
  // 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (second)
  // 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (third)
  const TEST_USER_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as `0x${string}`;
  const TEST_PROVIDER_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as `0x${string}`;
  const TEST_NEW_AGENT_ADDRESS = "0x90F79bf6EB2c4f870365E785982E1f101E93b906" as `0x${string}`;

  const DETAILS_HASH = toBytes32(1n);
  const ROUTING_HASH = toBytes32(2n);

  describe("Deployment", async function () {
    it("Should set the agent address correctly on deployment", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);
      const storedAgent = await computeRouter.read.agent();
      assert.equal(storedAgent.toLowerCase(), agentClient.account.address.toLowerCase());
    });

    it("Should reject deployment with zero address agent", async function () {
      let deploymentFailed = false;
      try {
        await viem.deployContract("ComputeRouter", ["0x0000000000000000000000000000000000000000"]);
      } catch {
        deploymentFailed = true;
      }
      assert.equal(deploymentFailed, true, "Deployment should have failed with zero address agent");
    });
  });

  describe("submitJob", async function () {
    it("Agent can submit a tracked job - verify stored user address", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      const tx = await computeRouter.write.submitJob([TEST_USER_ADDRESS, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const job = await computeRouter.read.getJob([1n]);
      assert.equal(job.user, TEST_USER_ADDRESS);
      assert.equal(job.isTracked, true);
    });

    it("Agent can submit an untracked job - verify user is address(0)", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      const tx = await computeRouter.write.submitJob([TEST_USER_ADDRESS, DETAILS_HASH, false]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const job = await computeRouter.read.getJob([1n]);
      assert.equal(job.user, "0x0000000000000000000000000000000000000000");
      assert.equal(job.isTracked, false);
    });

    it("Should emit JobSubmitted event with correct args", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      await viem.assertions.emitWithArgs(
        computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]),
        computeRouter,
        "JobSubmitted",
        [1n, normalizeAddress(agentClient.account.address), DETAILS_HASH, true],
      );
    });

    it("Job counter increments correctly", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      const tx1 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      const tx2 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      const jobCount = await computeRouter.read.jobCount();
      assert.equal(jobCount, 2n);

      const job1 = await computeRouter.read.getJob([1n]);
      const job2 = await computeRouter.read.getJob([2n]);
      assert.equal(job1.id, 1n);
      assert.equal(job2.id, 2n);
    });

    it("Non-agent cannot submit job", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      let callFailed = false;
      try {
        await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true], { account: nonAgentClient.account });
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Non-agent should not be able to submit job");
    });
  });

  describe("recordRoutingDecision", async function () {
    it("Agent can record routing decision on submitted job", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);
      const amount = 1000n;

      const tx1 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      const tx2 = await computeRouter.write.recordRoutingDecision([1n, TEST_PROVIDER_ADDRESS, amount, ROUTING_HASH]);
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      const job = await computeRouter.read.getJob([1n]);
      assert.equal(job.provider, TEST_PROVIDER_ADDRESS);
      assert.equal(job.amount, amount);
      assert.equal(job.routingHash, ROUTING_HASH);
      assert.notEqual(job.routedAt, 0n);
    });

    it("Should emit RoutingDecision event with correct args", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);
      const amount = 1000n;

      const tx1 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      await viem.assertions.emitWithArgs(
        computeRouter.write.recordRoutingDecision([1n, TEST_PROVIDER_ADDRESS, amount, ROUTING_HASH]),
        computeRouter,
        "RoutingDecision",
        [1n, TEST_PROVIDER_ADDRESS, amount, ROUTING_HASH],
      );
    });

    it("Cannot route non-existent job (jobId 999)", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      let callFailed = false;
      try {
        await computeRouter.write.recordRoutingDecision([999n, TEST_PROVIDER_ADDRESS, 1000n, ROUTING_HASH]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should not be able to route non-existent job");
    });

    it("Cannot double-route a job", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);
      const providerAddress1 = TEST_PROVIDER_ADDRESS;
      const providerAddress2 = TEST_NEW_AGENT_ADDRESS;

      const tx1 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      const tx2 = await computeRouter.write.recordRoutingDecision([1n, providerAddress1, 1000n, ROUTING_HASH]);
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      let callFailed = false;
      try {
        await computeRouter.write.recordRoutingDecision([1n, providerAddress2, 2000n, ROUTING_HASH]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should not be able to double-route a job");
    });

    it("Cannot route with zero address provider", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      const tx1 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      let callFailed = false;
      try {
        await computeRouter.write.recordRoutingDecision([1n, "0x0000000000000000000000000000000000000000", 1000n, ROUTING_HASH]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should not be able to route with zero address provider");
    });

    it("Cannot route with zero bytes32 routingHash", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      const tx1 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      let callFailed = false;
      try {
        await computeRouter.write.recordRoutingDecision([1n, TEST_PROVIDER_ADDRESS, 1000n, "0x0000000000000000000000000000000000000000000000000000000000000000"]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should not be able to route with zero routingHash");
    });

    it("Non-agent cannot record routing decision", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      const tx1 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      let callFailed = false;
      try {
        await computeRouter.write.recordRoutingDecision([1n, TEST_PROVIDER_ADDRESS, 1000n, ROUTING_HASH], { account: nonAgentClient.account });
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Non-agent should not be able to record routing decision");
    });
  });

  describe("getJob", async function () {
    it("Returns correct data for submitted (unrouted) job", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      const tx = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const job = await computeRouter.read.getJob([1n]);
      assert.equal(job.id, 1n);
      assert.equal(normalizeAddress(job.user), normalizeAddress(agentClient.account.address));
      assert.equal(job.detailsHash, DETAILS_HASH);
      assert.equal(job.routingHash, "0x0000000000000000000000000000000000000000000000000000000000000000");
      assert.equal(job.provider, "0x0000000000000000000000000000000000000000");
      assert.equal(job.amount, 0n);
      assert.equal(job.isTracked, true);
      assert.notEqual(job.createdAt, 0n);
      assert.equal(job.routedAt, 0n);
    });

    it("Returns correct data for routed job", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);
      const amount = 5000n;

      const tx1 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      const tx2 = await computeRouter.write.recordRoutingDecision([1n, TEST_PROVIDER_ADDRESS, amount, ROUTING_HASH]);
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      const job = await computeRouter.read.getJob([1n]);
      assert.equal(job.id, 1n);
      assert.equal(job.provider, TEST_PROVIDER_ADDRESS);
      assert.equal(job.amount, amount);
      assert.equal(job.routingHash, ROUTING_HASH);
      assert.notEqual(job.routedAt, 0n);
    });

    it("Reverts for non-existent job ID (jobId 0)", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      let callFailed = false;
      try {
        await computeRouter.read.getJob([0n]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should revert for jobId 0");
    });

    it("Reverts for non-existent job ID (jobId > jobCount)", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      let callFailed = false;
      try {
        await computeRouter.read.getJob([100n]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should revert for jobId > jobCount");
    });
  });

  describe("updateAgent", async function () {
    it("Agent can update to new agent address", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      const tx = await computeRouter.write.updateAgent([TEST_NEW_AGENT_ADDRESS]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const storedAgent = await computeRouter.read.agent();
      assert.equal(storedAgent, TEST_NEW_AGENT_ADDRESS);
    });

    it("Should emit AgentUpdated event", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      await viem.assertions.emitWithArgs(
        computeRouter.write.updateAgent([TEST_NEW_AGENT_ADDRESS]),
        computeRouter,
        "AgentUpdated",
        [normalizeAddress(agentClient.account.address), TEST_NEW_AGENT_ADDRESS],
      );
    });

    it("New agent can call submitJob (old agent cannot)", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);
      const newAgentAddress = nonAgentClient.account.address;

      const tx1 = await computeRouter.write.updateAgent([newAgentAddress]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      // New agent should be able to submit job
      const tx2 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true], { account: nonAgentClient.account });
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      const job = await computeRouter.read.getJob([1n]);
      assert.equal(job.id, 1n);

      // Old agent should not be able to submit job
      let callFailed = false;
      try {
        await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true], { account: agentClient.account });
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Old agent should not be able to submit job after update");
    });

    it("Cannot update to zero address", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);

      let callFailed = false;
      try {
        await computeRouter.write.updateAgent(["0x0000000000000000000000000000000000000000"]);
      } catch {
        callFailed = true;
      }
      assert.equal(callFailed, true, "Should not be able to update to zero address");
    });
  });

  describe("Integration", async function () {
    it("Full lifecycle: deploy -> submit tracked job -> record routing -> verify via getJob", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);
      const amount = 2500n;

      // Submit tracked job
      const tx1 = await computeRouter.write.submitJob([agentClient.account.address, DETAILS_HASH, true]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      let job = await computeRouter.read.getJob([1n]);
      assert.equal(job.id, 1n);
      assert.equal(normalizeAddress(job.user), normalizeAddress(agentClient.account.address));
      assert.equal(job.isTracked, true);
      assert.equal(job.routedAt, 0n);

      // Record routing decision
      const tx2 = await computeRouter.write.recordRoutingDecision([1n, TEST_PROVIDER_ADDRESS, amount, ROUTING_HASH]);
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      // Verify final state
      job = await computeRouter.read.getJob([1n]);
      assert.equal(job.provider, TEST_PROVIDER_ADDRESS);
      assert.equal(job.amount, amount);
      assert.equal(job.routingHash, ROUTING_HASH);
      assert.notEqual(job.routedAt, 0n);
    });

    it("Full lifecycle: deploy -> submit untracked job -> verify user is zero address -> route -> verify", async function () {
      const computeRouter = await viem.deployContract("ComputeRouter", [agentClient.account.address]);
      const amount = 3000n;

      // Submit untracked job
      const tx1 = await computeRouter.write.submitJob([TEST_USER_ADDRESS, DETAILS_HASH, false]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      let job = await computeRouter.read.getJob([1n]);
      assert.equal(job.user, "0x0000000000000000000000000000000000000000");
      assert.equal(job.isTracked, false);

      // Record routing decision
      const tx2 = await computeRouter.write.recordRoutingDecision([1n, TEST_PROVIDER_ADDRESS, amount, ROUTING_HASH]);
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      // Verify final state
      job = await computeRouter.read.getJob([1n]);
      assert.equal(job.provider, TEST_PROVIDER_ADDRESS);
      assert.equal(job.amount, amount);
    });
  });
});
