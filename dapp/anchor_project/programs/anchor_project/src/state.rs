use anchor_lang::prelude::*;
#[derive(InitSpace)]
#[account(discriminator=1)]
pub struct Vault{
    pub seed:u64,
    pub receiver:Pubkey,
    pub bump:u8,
}