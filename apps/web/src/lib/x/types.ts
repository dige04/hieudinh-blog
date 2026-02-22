/**
 * X (Twitter) API v2 response type definitions.
 *
 * Covers the subset of fields we request via tweet.fields and user.fields
 * when calling /2/tweets/search/recent and /2/lists/{id}/tweets.
 */

/** Public engagement metrics attached to each tweet. */
export interface XTweetPublicMetrics {
  retweet_count: number
  reply_count: number
  like_count: number
  quote_count: number
  impression_count?: number
}

/** URL entity within tweet text. */
export interface XUrlEntity {
  expanded_url: string
  display_url: string
}

/** Hashtag entity within tweet text. */
export interface XHashtagEntity {
  tag: string
}

/** Entities extracted from tweet text. */
export interface XTweetEntities {
  urls?: XUrlEntity[]
  hashtags?: XHashtagEntity[]
}

/** X API v2 tweet object (partial -- fields we request). */
export interface XTweet {
  id: string
  text: string
  author_id: string
  created_at: string
  public_metrics: XTweetPublicMetrics
  entities?: XTweetEntities
}

/** X API v2 user object (partial -- fields we request). */
export interface XUser {
  id: string
  name: string
  username: string
}

/** Response shape for GET /2/tweets/search/recent. */
export interface XSearchResponse {
  data?: XTweet[]
  includes?: { users?: XUser[] }
  meta?: { next_token?: string; result_count: number }
}

/** Response shape for GET /2/lists/{id}/tweets. */
export interface XListResponse {
  data?: XTweet[]
  includes?: { users?: XUser[] }
  meta?: { next_token?: string; result_count: number }
}
