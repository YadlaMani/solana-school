"use client";

import React, { useState, useEffect } from "react";
import { getVaultPDA, programID } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolanaProvider } from "@/hooks/solanaProvider";
import { useConnection } from "@solana/wallet-adapter-react";
import { BN, Idl, Program } from "@coral-xyz/anchor";
import { VaultProgram } from "@/utils/anchor_project";
import idl from "@/utils/anchor_project.json";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { toast } from "sonner";
import * as anchor from "@coral-xyz/anchor";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const DepositSide = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [userBalance, setUserBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const provider = useSolanaProvider();

  async function fetchUserBalance() {
    if (!publicKey) return;
    try {
      const balance = await connection.getBalance(publicKey);
      setUserBalance(balance);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }

  async function handleDeposit() {
    if (!provider || !publicKey || !sendTransaction) return;

    try {
      const program = new Program<VaultProgram>(idl as Idl, provider);
      const vaultPDA = await getVaultPDA(new PublicKey(receiver));
      const receiverPk = new PublicKey(receiver);

      const lamports = Math.floor(Number(amount) * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .deposit(new anchor.BN(lamports))
        .accounts({
          signer: publicKey,
          vault: vaultPDA,
          receiver: receiverPk,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      toast.success("Deposit successful!");
      setAmount("");
      setReceiver("");
      await fetchUserBalance();
    } catch (err) {
      console.error(err);
      toast.error("Deposit failed");
    }
  }

  useEffect(() => {
    fetchUserBalance();
  }, [publicKey]);

  return (
    <Card className="w-full shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Deposit to Locker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          User Balance: {(userBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL
        </p>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiver">Receiver Public Key</Label>
          <Input
            id="receiver"
            type="text"
            placeholder="Receiver wallet address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleDeposit}
          disabled={!amount || !receiver || !publicKey}
          className="w-full"
        >
          Send to Receiver Vault
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DepositSide;
