import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PublicKey } from "@solana/web3.js";
import idlFile from "@/utils/anchor_project.json";
import { AnchorProvider, Idl, Program, utils } from "@coral-xyz/anchor";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getVaultPDA = (publicKey: PublicKey) => {
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), publicKey.toBuffer()],
    programID
  );
  return vaultPDA;
};

const idl = idlFile as Idl;

export const programID = new PublicKey(idl.address);
