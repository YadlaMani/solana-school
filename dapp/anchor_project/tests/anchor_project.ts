import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorProject } from "../target/types/anchor_project";
import { assert, expect } from "chai";

describe("AnchorProject Program Tests", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const program = anchor.workspace.AnchorProject as Program<AnchorProject>;

  let payer1: anchor.web3.Keypair;
  let payer2: anchor.web3.Keypair;
  let receiver: anchor.web3.Keypair;
  let vaultPDA: anchor.web3.PublicKey;

  const getVaultPDA = (vaultAuthority: anchor.web3.PublicKey) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), vaultAuthority.toBuffer()],
      program.programId
    );
  };

  before(async () => {
    payer1 = anchor.web3.Keypair.generate();
    payer2 = anchor.web3.Keypair.generate();
    receiver = anchor.web3.Keypair.generate();
    [vaultPDA] = getVaultPDA(receiver.publicKey);

    await airdrop(provider.connection, payer1.publicKey);
    await airdrop(provider.connection, payer2.publicKey);
    await airdrop(provider.connection, receiver.publicKey);
  });

  describe("Deposit Instruction", () => {
    it("Should initialize vault and deposit successfully", async () => {
      const vaultBalanceBefore = await provider.connection.getBalance(vaultPDA);
      const tx = await program.methods
        .deposit(new anchor.BN(1))
        .accounts({
          signer: payer1.publicKey,
          vault: vaultPDA,
          receiver: receiver.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([payer1])
        .rpc({ commitment: "confirmed" });

      const vaultBalanceAfter = await provider.connection.getBalance(vaultPDA);
      const rentExempt =
        await provider.connection.getMinimumBalanceForRentExemption(
          program.account.vault.size
        );

      assert(
        vaultBalanceAfter - rentExempt === 1,
        "Vault balance should increase by 1 lamport after deposit"
      );
    });

    it("Should allow multiple wallets to deposit into the same vault", async () => {
      const balanceBefore = await provider.connection.getBalance(vaultPDA);
      await program.methods
        .deposit(new anchor.BN(1))
        .accounts({
          signer: payer1.publicKey,
          vault: vaultPDA,
          receiver: receiver.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([payer1])
        .rpc({ commitment: "confirmed" });

      const balanceAfterFirstDeposit = await provider.connection.getBalance(
        vaultPDA
      );
      assert(
        balanceAfterFirstDeposit - balanceBefore === 1,
        "First deposit should succeed"
      );
      await program.methods
        .deposit(new anchor.BN(1))
        .accounts({
          signer: payer2.publicKey,
          vault: vaultPDA,
          receiver: receiver.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([payer2])
        .rpc({ commitment: "confirmed" });

      const balanceAfterSecondDeposit = await provider.connection.getBalance(
        vaultPDA
      );
      assert(
        balanceAfterSecondDeposit - balanceAfterFirstDeposit === 1,
        "Second deposit should succeed"
      );
    });

    it("Cannot deposit with insufficient balance", async () => {
      const poorSigner = anchor.web3.Keypair.generate();
      const depositAmount = 1;

      let flag = "This should fail";
      try {
        await program.methods
          .deposit(new anchor.BN(depositAmount))
          .accounts({
            signer: poorSigner.publicKey,
            vault: vaultPDA,
            receiver: receiver.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([poorSigner])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        flag = "Failed";
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InsufficientFunds",
          "Should fail with InsufficientFunds error"
        );
      }
      assert.strictEqual(
        flag,
        "Failed",
        "Deposit should fail due to insufficient funds"
      );
    });
  });

  describe("Withdraw Instruction", () => {
    it("Should allow receiver to withdraw from vault", async () => {
      const receiverBalanceBefore = await provider.connection.getBalance(
        receiver.publicKey
      );
      const vaultBalanceBefore = await provider.connection.getBalance(vaultPDA);

      await program.methods
        .withdraw()
        .accounts({
          receiver: receiver.publicKey,
          vault: vaultPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([receiver])
        .rpc({ commitment: "confirmed" });

      const receiverBalanceAfter = await provider.connection.getBalance(
        receiver.publicKey
      );
      const vaultBalanceAfter = await provider.connection.getBalance(vaultPDA);
      const rentExempt =
        await provider.connection.getMinimumBalanceForRentExemption(
          program.account.vault.size
        );

      assert(
        vaultBalanceAfter === rentExempt,
        "Vault should retain rent-exempt minimum"
      );
      assert(
        receiverBalanceAfter - receiverBalanceBefore ===
          vaultBalanceBefore - vaultBalanceAfter,
        "Receiver should receive withdrawn funds correctly"
      );
    });

    it("Cannot withdraw from vault by non-receiver", async () => {
      let flag = "This should fail";
      try {
        await program.methods
          .withdraw()
          .accounts({
            receiver: receiver.publicKey,
            vault: vaultPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([payer1])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        flag = "Failed";
      }
      assert.strictEqual(
        flag,
        "Failed",
        "Withdrawal by non-receiver should fail"
      );
    });
  });
});

async function airdrop(
  connection: anchor.web3.Connection,
  address: anchor.web3.PublicKey,
  amount = 100 * anchor.web3.LAMPORTS_PER_SOL
) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}
