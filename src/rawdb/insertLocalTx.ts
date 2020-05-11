import { EntityManager } from 'typeorm';
import { LocalTx } from '../entities';
import { getUserCurrency } from '.';
import { Utils, CurrencyRegistry } from 'sota-common';
import { LocalTxType, LocalTxStatus } from '../Enums';

export interface ILocalTxProps {
  readonly fromAddress: string;
  readonly toAddress: string;
  readonly userId: number;
  readonly walletId: number;
  readonly currency: string;
  readonly refCurrency: string;
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
  const refCurrency = CurrencyRegistry.getOneCurrency(localTxProps.refCurrency);
  const nativeCurrency = CurrencyRegistry.getOneCurrency(currency.platform);

  const userCurrency = await getUserCurrency(manager, userId, currency.symbol);
  const userRefCurrency = await getUserCurrency(manager, userId, refCurrency.symbol);

  const localTx = new LocalTx();
  localTx.unsignedTxid = localTxProps.unsignedTxid;
  localTx.userId = localTxProps.userId;
  localTx.walletId = localTxProps.walletId;
  localTx.fromAddress = localTxProps.fromAddress;
  localTx.toAddress = localTxProps.toAddress;
  localTx.amount = localTxProps.amount;
  localTx.type = localTxProps.type;
  localTx.currency = currency.symbol;
  localTx.refCurrency = refCurrency.symbol;
  localTx.refTable = localTxProps.refTable;
  localTx.refId = localTxProps.refId;
  localTx.memo = localTxProps.memo;
  localTx.unsignedRaw = localTxProps.unsignedRaw;
  localTx.txid = localTxProps.txid;
  localTx.status = localTxProps.status;
  localTx.feeCurrency = nativeCurrency.symbol;
  localTx.createdAt = Utils.nowInMillis();
  localTx.updatedAt = Utils.nowInMillis();
  localTx.currencySymbol = userCurrency ? userCurrency.customSymbol : localTxProps.currency;
  localTx.refCurrencySymbol = userRefCurrency ? userRefCurrency.customSymbol : localTxProps.currency;

  await manager.getRepository(LocalTx).save(localTx);
  return localTx;
}
