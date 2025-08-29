use anchor_lang::prelude::*;
use anchor_lang::system_program;
mod state;
mod errors;
use state::Vault;

declare_id!("4j3ZJxVbhBvwHGHC66Km4bgr6asx3mA8WBom1dJRp2ep");

#[program]
pub mod anchor_project {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>,amount:u64) -> Result<()> {
        let lamports = ctx.accounts.signer.lamports();
        require!(lamports >= amount, VaultError::InsufficientFunds);
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer{
                    from:ctx.accounts.signer.to_account_info(),
                    to:ctx.accounts.vault.to_account_info(),

                }
            ),
            amount
        )?;
        Ok(())
    }
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
    let receiver_key = ctx.accounts.receiver.key();
    let signer_seeds = &[b"vault", receiver_key.as_ref(), &[ctx.bumps.vault]];

    let vault_info = ctx.accounts.vault.to_account_info();
    let vault_lamports = vault_info.lamports();

    // rent exemption so the account is still valid after transfer
    let rent_exempt = Rent::get()?.minimum_balance(Vault::INIT_SPACE + Vault::DISCRIMINATOR.len());
    let amount = vault_lamports.saturating_sub(rent_exempt);

    require!(amount > 0, VaultError::InsufficientFunds);

    // manually transfer lamports
    **vault_info.try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.receiver.to_account_info().try_borrow_mut_lamports()? += amount;

    Ok(())
}


}

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

#[error_code]
pub enum VaultError {
    #[msg("Insufficient Funds")]
    InsufficientFunds,
}