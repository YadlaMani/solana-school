//-------------------------------------------------------------------------------
///
/// TASK: Implement the add comment functionality for the Twitter program
/// 
/// Requirements:
/// - Validate that comment content doesn't exceed maximum length
/// - Initialize a new comment account with proper PDA seeds
/// - Set comment fields: content, author, parent tweet, and bump
/// - Use content hash in PDA seeds for unique comment identification
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;
use crate::errors::TwitterError;
use crate::states::*;


pub trait StringExt {
    fn to_hashed_bytes(&self) -> [u8; 32];
}

impl StringExt for String {
    fn to_hashed_bytes(&self) -> [u8; 32] {
        let hash = hash(self.as_bytes());
        hash.to_bytes()
    }
}
pub fn add_comment(ctx: Context<AddCommentContext>, comment_content: String) -> Result<()> {
    if comment_content.as_bytes().len()>COMMENT_LENGTH {
        return Err(TwitterError::CommentTooLong.into());
    }
    *ctx.accounts.comment=Comment{
        comment_author: ctx.accounts.comment_author.key(),
        parent_tweet: ctx.accounts.tweet.key(),
        content: comment_content.clone(),
        bump: ctx.bumps.comment,
    };
  Ok(())
}

#[derive(Accounts)]
#[instruction(comment_content: String)]
pub struct AddCommentContext<'info> {
    #[account(mut)]
    pub comment_author: Signer<'info>,
    #[account(
        init,
        payer=comment_author,
        space=8+Comment::INIT_SPACE,
        seeds=[COMMENT_SEED.as_bytes(),comment_author.key().as_ref(),&comment_content.to_hashed_bytes(),tweet.key().as_ref()],
        bump,

    )]
    pub comment: Account<'info, Comment>,
    #[
        account(
          
             seeds = [ tweet.topic.as_bytes(),TWEET_SEED.as_bytes(),  tweet.tweet_author.key().as_ref()],
            bump,
        )
    ]
    pub tweet: Account<'info, Tweet>,
    pub system_program: Program<'info, System>,
}
