//-------------------------------------------------------------------------------
///
/// TASK: Implement the deposit functionality for the on-chain vault
/// 
/// Requirements:
/// - Verify that the user has enough balance to deposit
/// - Verify that the vault is not locked
/// - Transfer lamports from user to vault using CPI (Cross-Program Invocation)
/// - Emit a deposit event after successful transfer
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction::transfer;
use crate::state::Vault;
use crate::errors::VaultError;
use crate::events::DepositEvent;

#[derive(Accounts)]
pub struct Deposit<'info> {
   #[account(mut)]
   pub user:Signer<'info>,
   #[account(
    mut,
    seeds = [b"vault", vault.vault_authority.key().as_ref()],
    bump,
)]
   pub vault:Account<'info,Vault>,
    pub system_program: Program<'info, System>,
}

pub fn _deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault=&ctx.accounts.vault;
    if vault.locked{
        return Err(VaultError::VaultLocked.into());
    }
    if amount > ctx.accounts.user.to_account_info().lamports() {
        return Err(VaultError::InsufficientBalance.into());
    }
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer{
                from:ctx.accounts.user.to_account_info(),
                to:ctx.accounts.vault.to_account_info(),
            }
        ),
        amount,
    )?;
    emit!(DepositEvent {
        vault: vault.key(),
        user: ctx.accounts.user.key(),
        amount,
    });
   Ok(())
}