import { EntityManager } from 'typeorm';
import { LocalTx, WithdrawalTx, InternalTransfer, Wallet, Deposit, UserCurrency, DepositLog } from '../entities';
import { Utils, BigNumber, CurrencyRegistry, getLogger, Transaction } from 'sota-common';
import { LocalTxType, WithdrawalStatus, InternalTransferType } from '../Enums';

const logger = getLogger('insertLocalTxDirty');

export async function insertLocalTxDirty(manager: EntityManager, data: any): Promise<void> {
  data.createdAt = Utils.nowInMillis();
  data.updatedAt = Utils.nowInMillis();
  await manager.getRepository(LocalTx).insert(data);
  return;
}

export async function insertLocalTxDirtyFromWithdrawalTx(
  manager: EntityManager,
  withdrawalTx: WithdrawalTx,
  verifiedStatus: WithdrawalStatus,
  fee: BigNumber
): Promise<void> {
  // check txid existed in local tx
  const existedLocalTx = await manager.getRepository(LocalTx).findOne({
    txid: withdrawalTx.txid,
  });
  if (existedLocalTx) {
    logger.warn(`Txid=${withdrawalTx.txid} has already existed in local tx.`);
    return;
  }

  const currency = CurrencyRegistry.getOneCurrency(withdrawalTx.currency);
  const nativeCurrency = CurrencyRegistry.getOneCurrency(currency.platform);

  const userCurrency = await manager.findOne(UserCurrency, {
    userId: withdrawalTx.userId,
    systemSymbol: withdrawalTx.currency,
  });

  const localTx = new LocalTx();
  localTx.userId = withdrawalTx.userId;
  localTx.walletId = withdrawalTx.walletId;
  localTx.fromAddress = withdrawalTx.hotWalletAddress;
  localTx.toAddress = '';
  localTx.currency = withdrawalTx.currency;
  localTx.currencySymbol = userCurrency ? userCurrency.customSymbol : withdrawalTx.currency;
  localTx.amount = '0';
  localTx.type = LocalTxType.WITHDRAWAL_NORMAL;
  localTx.refCurrency = withdrawalTx.currency;
  localTx.refCurrencySymbol = userCurrency ? userCurrency.customSymbol : withdrawalTx.currency;
  localTx.refTable = 'withdrawal';
  localTx.refId = 0;
  localTx.note = '';
  localTx.status = verifiedStatus;
  localTx.txid = withdrawalTx.txid;
  localTx.unsignedRaw = withdrawalTx.unsignedRaw;
  localTx.unsignedTxid = withdrawalTx.unsignedTxid;
  localTx.feeAmount = fee.toFixed(nativeCurrency.nativeScale);
  localTx.feeCurrency = nativeCurrency.symbol;
  localTx.createdAt = Utils.nowInMillis();
  localTx.updatedAt = Utils.nowInMillis();

  await manager.getRepository(LocalTx).insert(localTx);
  return;
}

export async function insertLocalTxDirtyFromInternalTransfer(
  manager: EntityManager,
  internalTransfer: InternalTransfer,
  verifiedStatus: WithdrawalStatus,
  fee: BigNumber,
  depositId?: number
): Promise<void> {
  // check txid existed in local tx
  const existedLocalTx = await manager.getRepository(LocalTx).findOne({
    txid: internalTransfer.txid,
  });
  if (existedLocalTx) {
    logger.warn(`Txid=${internalTransfer.txid} has already existed in local tx.`);
    return;
  }

  const currency = CurrencyRegistry.getOneCurrency(internalTransfer.currency);
  const nativeCurrency = CurrencyRegistry.getOneCurrency(currency.platform);

  const walletId = internalTransfer.walletId;
  const wallet = await manager.findOne(Wallet, { id: walletId });

  let deposit: Deposit = null;
  if (!depositId) {
    const deposits = await manager.find(Deposit, {
      collectedTxid: internalTransfer.txid,
    });
    deposit = deposits[0];
  } else {
    deposit = await manager.findOne(Deposit, { id: depositId });
  }

  const refCurrency = deposit.currency;

  let localTxType;
  if (internalTransfer.type === InternalTransferType.COLLECT) {
    localTxType = LocalTxType.COLLECT;
  } else if (internalTransfer.type === InternalTransferType.SEED) {
    localTxType = LocalTxType.SEED;
  }

  const userCurrency = await manager.findOne(UserCurrency, {
    userId: wallet.userId,
    systemSymbol: internalTransfer.currency,
  });

  const userRefCurrency = await manager.findOne(UserCurrency, {
    userId: wallet.userId,
    systemSymbol: refCurrency,
  });

  const localTx = new LocalTx();
  localTx.userId = wallet.userId;
  localTx.walletId = internalTransfer.walletId;
  localTx.fromAddress = internalTransfer.fromAddress;
  localTx.toAddress = internalTransfer.toAddress;
  localTx.currency = internalTransfer.currency;
  localTx.currencySymbol = userCurrency ? userCurrency.customSymbol : internalTransfer.currency;
  localTx.amount = internalTransfer.amount;
  localTx.type = localTxType;
  localTx.refCurrency = refCurrency;
  localTx.refCurrencySymbol = userRefCurrency ? userRefCurrency.customSymbol : refCurrency;
  localTx.refTable = 'deposit';
  localTx.refId = deposit.id;
  localTx.note = '';
  localTx.status = verifiedStatus;
  localTx.unsignedRaw = '';
  localTx.unsignedTxid = internalTransfer.txid;
  localTx.txid = internalTransfer.txid;
  localTx.feeAmount = fee.toFixed(nativeCurrency.nativeScale);
  localTx.feeCurrency = nativeCurrency.symbol;
  localTx.createdAt = Utils.nowInMillis();
  localTx.updatedAt = Utils.nowInMillis();

  await manager.getRepository(LocalTx).insert(localTx);
  return;
}

export async function restoreLocalTxDirtyFromDeposit(manager: EntityManager, tx: Transaction): Promise<void> {
  // check transaction has existsed in local tx table
  const localTx = await manager.getRepository(LocalTx).findOne({
    txid: tx.txid,
  });
  if (localTx) {
    logger.debug(`Tx ${tx.txid} has already existsed in local tx, will not write to db.`);
    return;
  }

  // get transaction fee & status
  const fee = tx.getNetworkFee();
  const verifiedStatus = !tx.isFailed ? WithdrawalStatus.COMPLETED : WithdrawalStatus.FAILED;

  // check internal transfer
  const internalTransfer = await manager.getRepository(InternalTransfer).findOne({
    txid: tx.txid,
  });
  if (!internalTransfer) {
    logger.debug(`Tx ${tx.txid} not exist in internal tx. So, ignore it.`);
    return;
  }
  const seeding = await manager.getRepository(DepositLog).findOne({
    data: internalTransfer.txid,
  });
  const depositId = seeding ? seeding.depositId : null;
  return insertLocalTxDirtyFromInternalTransfer(manager, internalTransfer, verifiedStatus, fee, depositId);
}
