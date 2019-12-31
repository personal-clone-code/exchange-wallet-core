import { EntityManager } from 'typeorm';
import { LocalTx, Withdrawal } from '../entities';
import { getUserCurrency } from '.';
import { Utils, CurrencyRegistry } from 'sota-common';
import { LocalTxType, WithdrawalEvent, LocalTxStatus } from '../Enums';

export interface ILocalTxProps {
  readonly fromAddress: string;
  readonly toAddress: string;
  readonly userId: number;
  readonly walletId: number;
  readonly currency: string;
  readonly amount: string;
  readonly type: LocalTxType;
  readonly refTable: string;
  readonly refId: number;
  readonly memo?: string;
  readonly unsignedRaw: string;
  readonly txid?: string;
  readonly status: LocalTxStatus;
  readonly unsignedTxid: string;
}

export async function insertLocalTx(manager: EntityManager, localTxProps: ILocalTxProps) {
  const userId = localTxProps.userId;
  const currency = CurrencyRegistry.getOneCurrency(localTxProps.currency);
  const nativeCurrency = CurrencyRegistry.getOneCurrency(currency.platform);
  const [userCurrency, userRefCurrency] = await Promise.all([
    getUserCurrency(userId, currency.platform, manager),
    getUserCurrency(userId, currency.symbol, manager),
  ]);
  const localTx = new LocalTx();
  localTx.unsignedTxid = localTxProps.unsignedTxid;
  localTx.userId = localTxProps.userId;
  localTx.walletId = localTxProps.walletId;
  localTx.fromAddress = localTxProps.fromAddress;
  localTx.toAddress = localTxProps.toAddress;
  localTx.amount = localTxProps.amount;
  localTx.type = localTxProps.type;
  localTx.refCurrency = localTxProps.currency;
  localTx.refTable = localTxProps.refTable;
  localTx.refId = localTxProps.refId;
  localTx.memo = localTxProps.memo;
  localTx.unsignedRaw = localTxProps.unsignedRaw;
  localTx.txid = localTxProps.txid;
  localTx.status = localTxProps.status;
  localTx.feeCurrency = nativeCurrency.symbol;
  localTx.createdAt = Utils.nowInMillis();
  localTx.updatedAt = Utils.nowInMillis();
  localTx.currency = currency.symbol;
  localTx.currencySymbol = userCurrency ? userCurrency.customSymbol : localTxProps.currency;
  localTx.refCurrencySymbol = userRefCurrency ? userRefCurrency.customSymbol : localTxProps.currency;
  await manager.getRepository(LocalTx).save(localTx);
  return localTx;
}
