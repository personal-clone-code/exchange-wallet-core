import { IWithdrawalProcessingResult, getLogger, BaseFeeSeeder, getFamily } from 'sota-common';
import { getConnection, EntityManager } from 'typeorm';
import * as rawdb from '../../rawdb';
import { InternalTransferType, WithdrawalStatus } from '../../Enums';
import { Address, WalletBalance, Wallet } from '../../entities';
import BigNumber from 'bignumber.js';
import { InternalTransfer } from '../../entities/InternalTransfer';
import { raw } from 'mysql';

const logger = getLogger('feeSeederDoProcess');

const emptyResult: IWithdrawalProcessingResult = {
  needNextProcess: false,
  withdrawalTxId: 0,
};

export async function feeSeederDoProcess(seeder: BaseFeeSeeder): Promise<IWithdrawalProcessingResult> {
  let result: IWithdrawalProcessingResult;
  await getConnection().transaction(async manager => {
    result = await _feeSeederDoProcess(manager, seeder);
  });
  return result;
}

async function _feeSeederDoProcess(
  manager: EntityManager,
  seeder: BaseFeeSeeder
): Promise<IWithdrawalProcessingResult> {
  if (seeder.requests.length === 0) {
    logger.info('No Seed Request');
    return emptyResult;
  }
  const feeSeederCurrency = getFamily();
  const request = seeder.requests.shift();
  const { toAddress, amount, depositId } = request;

  const seeded = await manager.getRepository(InternalTransfer).findOne({
    toAddress,
    status: WithdrawalStatus.SENT,
    type: InternalTransferType.SEED,
    currency: feeSeederCurrency,
  });

  if (seeded) {
    logger.info(`${depositId} is seeded previously`);
    return emptyResult;
  }

  const address = await manager.getRepository(Address).findOne({ address: toAddress });
  if (!address) {
    logger.error(`${toAddress} is not a deposit address`);
    return emptyResult;
  }

  const walletId = address.walletId;

  // Find internal hot wallet to seed fee for funds collector
  const hotWallet = await rawdb.findTransferableHotWallet(
    manager,
    walletId,
    [{ toAddress, amount } as any],
    feeSeederCurrency,
    false,
    seeder.getGateway()
  );
  if (!hotWallet) {
    logger.error(`No transferable internal hot wallet walletId=${walletId} currency=${feeSeederCurrency}`);
    return emptyResult;
  }

  const walletBalance = await manager.getRepository(WalletBalance).findOne({ walletId: address.walletId });
  if (!walletBalance) {
    logger.error(`${address.address} has empty wallet balance`);
    return emptyResult;
  }

  const balance = walletBalance.balance;
  if (new BigNumber(balance).lt(amount)) {
    logger.error(`${address.address} has not enough fund to get seed`);
    return emptyResult;
  }

  const tx = await seeder.getGateway().seedFee(hotWallet.coinKeys, hotWallet.address, toAddress, amount);

  const internalTransferRecord = new InternalTransfer();
  internalTransferRecord.currency = feeSeederCurrency;
  internalTransferRecord.walletId = hotWallet.walletId;
  internalTransferRecord.fromAddress = 'will remove this field'; // remove
  internalTransferRecord.toAddress = 'will remove this field'; // remove
  internalTransferRecord.type = InternalTransferType.SEED;
  internalTransferRecord.txid = tx.txid;
  internalTransferRecord.status = WithdrawalStatus.SENT;

  await rawdb.insertInternalTransfer(manager, internalTransferRecord);

  logger.info(`Seed Successfully address=${toAddress}`);

  return emptyResult;
}
