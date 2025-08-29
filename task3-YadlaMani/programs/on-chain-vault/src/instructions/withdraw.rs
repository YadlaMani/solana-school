use anchor_lang::prelude::*;
use crate::state::Vault;
use crate::errors::VaultError;
use crate::events::WithdrawEvent;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault_authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault_authority.key().as_ref()],
        bump,
        constraint = !vault.locked @ VaultError::VaultLocked
    )]
    pub vault: Account<'info, Vault>,
}

pub fn _withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let vault_authority = &ctx.accounts.vault_authority;
    let vault = &ctx.accounts.vault;
   
    let vault_balance = vault.to_account_info().lamports();
    if vault_balance < amount {
        return Err(VaultError::InsufficientBalance.into());
    }
    
   
    **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **vault_authority.to_account_info().try_borrow_mut_lamports()? += amount;
    
   
    emit!(WithdrawEvent {
        vault_authority: vault_authority.key(),
        vault: vault.key(),
        amount,
    });
    
    Ok(())
}