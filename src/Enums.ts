export enum DepositEvent {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  COLLECTED = 'collected',
  COLLECTED_FAILED = 'collected_failed',
}

export enum WalletEvent {
  CREATED = 'created',
  DEPOSIT = 'deposit',
  WITHDRAW_REQUEST = 'withdraw_request',
  WITHDRAW_COMPLETED = 'withdraw_completed',
  WITHDRAW_FAILED = 'withdraw_failed',
  WITHDRAW_FEE = 'withdraw_fee',
  ERC20_WITHDRAW_FEE = 'erc20_withdraw_fee',
  USDT_WITHDRAW_FEE = 'usdt_withdraw_fee',
  WITHDRAW_ACCEPTED = 'withdraw_accepted',
  WITHDRAW_DECLINED = 'withdraw_declined',
  COLLECT_FEE = 'collect_fee',
  COLLECTED_FAIL = 'collected_fail',
  COLLECTED = 'collected',
  SEEDED_FAIL = 'seeded_fail',
  SEEDED = 'seeded',
  SEED_FEE = 'seed_fee',
}

export enum WebhookType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

export enum InternalTransferType {
  COLLECT = 'collect',
  SEED = 'seed',
}

export enum WithdrawalEvent {
  CREATED = 'created',
  PICKED = 'picked',
  SIGNED = 'signed',
  SENT = 'sent',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum WithdrawalStatus {
  INVALID = 'invalid',
  UNSIGNED = 'unsigned',
  SIGNING = 'signing',
  SIGNED = 'signed',
  SENT = 'sent',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum CollectStatus {
  UNCOLLECTED = 'uncollected',
  COLLECTING = 'collecting',
  COLLECTED = 'collected',
}
