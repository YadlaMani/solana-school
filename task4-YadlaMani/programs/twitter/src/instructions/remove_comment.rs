//-------------------------------------------------------------------------------
///
/// TASK: Implement the remove comment functionality for the Twitter program
/// 
/// Requirements:
/// - Close the comment account and return rent to comment author
/// 
/// NOTE: No implementation logic is needed in the function body - this 
/// functionality is achieved entirely through account constraints!
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;
pub trait StringExt {
    fn to_hashed_bytes(&self) -> [u8; 32];
}

impl StringExt for String {
    fn to_hashed_bytes(&self) -> [u8; 32] {
        let hash = hash(self.as_bytes());
        hash.to_bytes()
    }
}
// use anchor_lang::token::{close_account, CloseAccount};

use crate::states::*;

pub fn remove_comment(_ctx: Context<RemoveCommentContext>) -> Result<()> {
   
    Ok(())
}

#[derive(Accounts)]
pub struct RemoveCommentContext<'info> {
    #[account(mut)]
    pub comment_author: Signer<'info>,
    #[account(
        mut,
        has_one=comment_author,
        close=comment_author,
        seeds=[COMMENT_SEED.as_bytes(),comment_author.key().as_ref(),&comment.content.to_hashed_bytes(),comment.parent_tweet.key().as_ref()],
        bump=comment.bump,
    )]
    pub comment: Account<'info, Comment>,
}
