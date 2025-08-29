"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useSolanaProvider } from "@/hooks/solanaProvider";
import { BN, Program, Idl } from "@coral-xyz/anchor";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import idl from "@/utils/anchor_project.json";
import { VaultProgram } from "@/utils/anchor_project";
import { getVaultPDA } from "@/lib/utils";

const WithdrawSide: React.FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const provider = useSolanaProvider();

  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchVaultBalance = useCallback(async () => {
    if (!publicKey) return;

    try {
      const vaultPDA = await getVaultPDA(publicKey);
      const balance = await connection.getBalance(vaultPDA);
      setVaultBalance(balance);
    } catch (err) {
      setVaultBalance(0);
      toast.error("Vault not created. No deposits yet.");
    }
  }, [connection, publicKey]);

  const withdrawFunds = useCallback(async () => {
    if (!provider || !publicKey || !sendTransaction) return;

    setLoading(true);
    try {
      const program = new Program<VaultProgram>(idl as Idl, provider);
      const vaultPDA = await getVaultPDA(publicKey);

      const tx = await program.methods
        .withdraw()
        .accounts({
          receiver: publicKey,
          vault: vaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      toast.success("Withdraw successful!");
      await fetchVaultBalance();
    } catch (err) {
      console.error(err);
      toast.error("Withdraw failed!");
    } finally {
      setLoading(false);
    }
  }, [provider, publicKey, sendTransaction, connection, fetchVaultBalance]);

  useEffect(() => {
    fetchVaultBalance();
  }, [fetchVaultBalance]);

  return (
    <Card className="w-full shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Withdraw from your Locker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Vault Balance: {(vaultBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL
        </p>
        <Button
          disabled={vaultBalance <= 0.0012 * LAMPORTS_PER_SOL || loading}
          onClick={withdrawFunds}
          className="w-full"
        >
          {loading ? "Processing..." : "Withdraw Funds"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WithdrawSide;
