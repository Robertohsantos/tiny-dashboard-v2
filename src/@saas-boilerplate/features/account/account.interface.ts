export type AccountProvider =
  | 'github'
  | 'apple'
  | 'discord'
  | 'facebook'
  | 'microsoft'
  | 'google'
  | 'spotify'
  | 'twitch'
  | 'twitter'
  | 'dropbox'
  | 'linkedin'
  | 'gitlab'
  | 'reddit'

/**
 * Represents a Account entity.
 */
export interface Account {
  // Id's id property
  id: string
  // ProviderId's providerId property
  provider: string
  // UserId's userId property
  createdAt: Date
  // AccessToken's accessToken property
  updatedAt: Date
  // RefreshToken's refreshToken property
  accountId: string
}

/**
 * Data transfer object for creating a new Account.
 */
export interface LinkAccountDTO {
  provider: AccountProvider
  callbackURL: string
}

export interface LinkAccountResponse {
  url: string
  redirect: boolean
}

/**
 * Data transfer object for creating a new Account.
 */
export interface UnlinkAccountDTO {
  provider: AccountProvider
}
