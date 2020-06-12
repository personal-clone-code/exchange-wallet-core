export enum WebhookType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

export enum DepositEvent {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  COLLECT_SENT = 'collect_sent',
  COLLECTED = 'collected',
  COLLECTED_FAILED = 'collected_failed',
  COLLECT_TXID_CHANGED = 'collect_txid_changed',
  SEED_SENT = 'seed_sent',
  SEEDING = 'seeding',
  SEEDED = 'seeded',
  SEEDED_FAILED = 'seeded_failed',
  SEED_TXID_CHANGED = 'seed_txid_changed',
  NOTCOLLECT = 'notcollect',
}

export enum WalletEvent {
  CREATED = 'created',
  DEPOSIT = 'deposit',
  WITHDRAW_REQUEST = 'withdraw_request',
  WITHDRAW_COMPLETED = 'withdraw_completed',
  WITHDRAW_FAILED = 'withdraw_failed',
  WITHDRAW_FEE = 'withdraw_fee',
  WITHDRAW_ACCEPTED = 'withdraw_accepted',
  WITHDRAW_DECLINED = 'withdraw_declined',
  COLLECT_FEE = 'collect_fee',
  COLLECT_AMOUNT = 'collect_amount',
  COLLECTED_FAIL = 'collected_fail',
  COLLECTED = 'collected',
  SEEDED_FAIL = 'seeded_fail',
  SEEDED = 'seeded',
  SEED_FEE = 'seed_fee',
  SEED_AMOUNT = 'seed_amount',
}

export enum WithdrawOutType {
  WITHDRAW_OUT_COLD_SUFFIX = '_cold_withdrawal',
  WITHDRAW_OUT_NORMAL = 'normal',
  EXPLICIT_FROM_HOT_WALLET = 'explicit_from_hot_wallet',
  EXPLICIT_FROM_DEPOSIT_ADDRESS = 'explicit_from_deposit_address',
  AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS = 'auto_collected_from_deposit_address',
}

export enum WithdrawalEvent {
  CREATED = 'created',
  PICKED = 'picked',
  SIGNED = 'signed',
  SENT = 'sent',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TXID_CHANGED = 'txid_changed',
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
  COLLECTING_FORWARDING = 'forwarding',
  COLLECTING = 'collecting',
  COLLECT_SIGNED = 'collect_signed',
  COLLECT_SENT = 'collect_sent',
  COLLECTED = 'collected',
  NOTCOLLECT = 'notcollect',
  SEED_REQUESTED = 'seed_requested',
  SEEDING = 'seeding',
  SEED_SIGNED = 'seed_signed',
  SEED_SENT = 'seed_sent',
  SEEDED = 'seeded',
}

export enum LocalTxType {
  DEPOSIT = 'deposit',
  WITHDRAWAL_NORMAL = 'withdrawal_normal',
  WITHDRAWAL_COLD = 'withdrawal_cold',
  SEED = 'seed',
  COLLECT = 'collect',
  WITHDRAWAL_COLLECT = 'withdrawal_collect',
}

export enum LocalTxStatus {
  INVALID = 'invalid',
  UNSIGNED = 'unsigned',
  SIGNING = 'signing',
  SIGNED = 'signed',
  SENT = 'sent',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum RefTable {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

// for mail service
// export enum MailType {
//   NORMAL = 'normal',
// }

export enum MailStatus {
  CREATED = 'created',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum CollectType {
  WITHDRAWAL = 'withdrawal',
  INTERNAL_TRANSFER = 'internal_transfer',
}

export enum WithdrawalMode {
  NORMAL = 'normal',
}

export enum SettingKey {
  ETH_FEE_THRESHOLD = 'eth_fee_threshold',
  MAX_FEE_BY_USD = 'max_fee_by_usd',
}
