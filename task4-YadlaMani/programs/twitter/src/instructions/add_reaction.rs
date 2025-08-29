//-------------------------------------------------------------------------------
///
/// TASK: Implement the add reaction functionality for the Twitter program
/// 
/// Requirements:
/// - Initialize a new reaction account with proper PDA seeds
/// - Increment the appropriate counter (likes or dislikes) on the tweet
/// - Set reaction fields: type, author, parent tweet, and bump
/// - Handle both Like and Dislike reaction types
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;

use crate::errors::TwitterError;
use crate::states::*;

pub fn add_reaction(ctx: Context<AddReactionContext>, reaction: ReactionType) -> Result<()> {
    // Validate reaction type
    if matches!(reaction, ReactionType::Like) {
        if ctx.accounts.tweet.likes==u64::MAX{
            return Err(TwitterError::MaxLikesReached.into());
        }
        ctx.accounts.tweet.likes += 1;
    } else if matches!(reaction, ReactionType::Dislike) {
        if ctx.accounts.tweet.dislikes==u64::MAX{
            return Err(TwitterError::MaxDislikesReached.into());
        }
        ctx.accounts.tweet.dislikes += 1;
    } 

    // Initialize the reaction account
    *ctx.accounts.tweet_reaction = Reaction {
        reaction_author: ctx.accounts.reaction_author.key(),
        parent_tweet: ctx.accounts.tweet.key(),
        reaction,
        bump: ctx.bumps.tweet_reaction,
    };

    Ok(())
   
    
}

#[derive(Accounts)]
pub struct AddReactionContext<'info> {
    // TODO: Add required account constraints
    #[account(mut)]
    pub reaction_author: Signer<'info>,
    #[account(
        init,
        payer=reaction_author,
        space=8+Reaction::INIT_SPACE,
        seeds=[TWEET_REACTION_SEED.as_bytes(),reaction_author.key().as_ref(),tweet.key().as_ref()],
        bump,

    )]
    pub tweet_reaction: Account<'info, Reaction>,
    #[account(
        mut,
         seeds = [ tweet.topic.as_bytes(),TWEET_SEED.as_bytes(),  tweet.tweet_author.key().as_ref()],
        bump=tweet.bump,
    )]
    pub tweet: Account<'info, Tweet>,
    pub system_program: Program<'info, System>,
}
