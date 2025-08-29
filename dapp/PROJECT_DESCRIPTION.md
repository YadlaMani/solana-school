# Project Description

**Deployed Frontend URL:** [TODO: Link to your deployed frontend]

**Solana Program ID:** 4j3ZJxVbhBvwHGHC66Km4bgr6asx3mA8WBom1dJRp2ep

## Project Overview

### Description

This project implements a decentralized vault on Solana, allowing anyone to deposit SOL to a receiver's address. When a deposit is made for the first time to a receiver, a vault is automatically created for that address as a Program Derived Address (PDA). Subsequent deposits to the same receiver are added to their existing PDA vault. The receiver can withdraw funds from their vault at any time. Vaults are uniquely associated with receiver addresses and are managed as PDAs, providing a simple and secure way to manage pooled funds.

### Key Features

- **Decentralized Vault Creation**:
  A vault is automatically created as a PDA for each receiver when the first deposit is made to their address.

- **Pooled Deposits:**
  Anyone can deposit SOL to a receiver’s vault. All deposits to the same receiver are pooled in their unique vault.

- **Secure Withdrawals:**
  Only the receiver can withdraw funds from their vault, ensuring secure access and control.

- **Program-Controlled Accounts:**
  Vaults are managed as PDAs, meaning only the program can authorize transfers, preventing unauthorized access.

- **Rent-Exempt Management:**
  Withdrawals leave enough SOL in the vault to maintain rent exemption, keeping the account valid on-chain.

- **Simple User Experience:**
  Users only need to specify the receiver’s address to deposit; receivers can withdraw at any time.

### How to Use the dApp

- Connect Wallet:
  Open the frontend and connect your Solana wallet.

- Deposit SOL:

  - Enter the receiver’s address.
  - Specify the amount of SOL to deposit.
  - Confirm the transaction.
  - The vault PDA for the receiver will be created automatically if it doesn’t exist, and your deposit will be added to their vault.

- Withdraw SOL (Receiver):

  - Connect with the receiver’s wallet.
  - Navigate to the withdraw section.
  - Confirm the withdrawal transaction.
  - All available funds (minus rent-exempt minimum) will be transferred from the vault PDA to the receiver’s wallet.

## Program Architecture

### Main Instructions

- **Deposit:**
  Allows any user to deposit SOL into a vault PDA associated with a receiver’s address. If the vault does not exist, it is created. The deposited SOL is transferred from the signer (depositor) to the vault PDA.
- **Withdraw:**
  Allows the receiver (as signer) to withdraw SOL from their vault PDA. The program transfers all available funds (minus rent-exempt minimum) from the vault PDA to the receiver’s account.

### Data Flow

- **Deposit Flow:**

User calls the deposit instruction, specifying the receiver and amount.
The program derives the vault PDA using `[b"vault", receiver.key().as_ref()]`.
If the vault does not exist, it is initialized.
SOL is transferred from the signer to the vault PDA.

- **Withdraw Flow:**

Receiver calls the withdraw instruction.
The program verifies the receiver and locates the vault PDA.
All available funds (except rent-exempt minimum) are transferred from the vault PDA to the receiver.

This architecture ensures secure, program-controlled management of vaults for each receiver, using PDAs to prevent unauthorized access and enable pooled deposits and withdrawals.

### PDA Usage

PDA (Program Derived Address) is used to create a unique vault account for each receiver. When someone deposits SOL, the program derives a PDA using the seed [b"vault", receiver.key().as_ref()] and the program ID. This ensures that the vault account is uniquely tied to the receiver’s address and can only be managed by your program.

On deposit, if the vault PDA does not exist, it is created for the receiver.
All deposits to the same receiver go into their PDA vault.
Only the program can sign for and move funds from the PDA vault, ensuring security.
On withdrawal, the receiver (as signer) can instruct the program to transfer funds from their PDA vault to their own account.
This pattern allows your program to securely manage vaults for multiple users without relying on private keys, using Solana’s PDA mechanism.

### Program Instructions

- Deposit

```rust
#[derive(Accounts)]
pub struct Deposit<'info>{
    #[account(mut)]
    pub signer:Signer<'info>,
    #[account(
        init_if_needed,
        payer=signer,
        space=Vault::INIT_SPACE + Vault::DISCRIMINATOR.len(),
        seeds=[b"vault",receiver.key().as_ref()],
        bump,
    )]
    pub vault:Account<'info,Vault>,
    /// CHECK: This is not dangerous because we just care about the account's address
    pub receiver:AccountInfo<'info>,
    pub system_program:Program<'info,System>,
}
```

- Withdraw

```rust
#[derive(Accounts)]
pub struct Withdraw<'info>{
    #[account(mut)]
    pub receiver:Signer<'info>,
    #[account(
    mut,
    seeds=[b"vault",receiver.key().as_ref()],
    bump
    )]
    pub vault:Account<'info,Vault>,
    pub system_program:Program<'info,System>
}
```

**Instructions Implemented:**

- Deposit: The deposit instruction allows any user to deposit SOL into a vault associated with a receiver’s address. If the vault PDA for the receiver does not exist, it is created. The deposited SOL is transferred from the signer (depositor) to the vault PDA. This enables pooled deposits for the receiver, who can later withdraw the funds.
- Withdraw: The withdraw instruction allows the receiver to withdraw SOL from their vault PDA. Only the receiver (as signer) can perform this action. The instruction transfers all available funds (minus rent-exempt minimum) from the vault PDA to the receiver’s account, ensuring the vault remains valid on-chain.

### Account Structure

```rust
#[derive(InitSpace)]
#[account(discriminator=1)]
pub struct Vault {
    pub seed: u64,        // Custom value, can be used for uniqueness or tracking
    pub receiver: Pubkey, // The public key of the receiver who owns this vault
    pub bump: u8,         // PDA bump value for address derivation
}

```

## Testing

### Test Coverage

The testing approach covers both successful and failure scenarios for deposit and withdraw instructions, ensuring correct behavior and error handling.

**Happy Path Tests:**

- Initializes a vault PDA and deposits SOL successfully.
- Allows multiple wallets to deposit into the same vault for a receiver.
- Allows the receiver to withdraw funds from their vault, leaving the rent-exempt minimum.

**Unhappy Path Tests:**

- Deposit fails if the signer has insufficient funds (triggers InsufficientFunds error).
- Withdraw fails if attempted by a non-receiver (unauthorized withdrawal).

### Running Tests

```bash
cd anchor_project
anchor test
```

### Additional Notes for Evaluators
