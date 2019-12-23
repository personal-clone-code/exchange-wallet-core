export * from './doCheckKmsConfig';
export * from './doCheckKmsDataKey';
export * from './doCheckUserWallet';
export * from './doCheckWalletBalance';
export * from './doCheckCurrencyConfig';
export * from './doCheckUserCurrency';
export * from './doCheckHotWallet';
export * from './doCheckColdWallet';
export * from './doCheckRallyWallet';
export * from './doCheckWebhook';
export * from './doCheckWithdrawal';
export * from './doCheckCrawler';

export function getOverTime(seconds: number): string {
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  hours = hours - days * 24;
  minutes = minutes - days * 24 * 60 - hours * 60;
  return `${days} days ${hours} hours ${minutes} minutes`;
}
