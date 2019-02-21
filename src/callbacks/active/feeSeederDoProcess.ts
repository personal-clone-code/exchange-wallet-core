import { IWithdrawalProcessingResult, getLogger, BaseFeeSeeder, getFamily } from 'sota-common';
import { getConnection, EntityManager } from 'typeorm';
import * as rawdb from '../../rawdb';
import { InternalTransferType, WithdrawalStatus } from '../../Enums';
import { Address, WalletBalance } from '../../entities';
import BigNumber from 'bignumber.js';
import { InternalTransfer } from '../../entities/InternalTransfer';

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

  const [hotWallet, address] = await Promise.all([
    rawdb.findAvailableHotWallet(manager, feeSeederCurrency, false),
    manager.getRepository(Address).findOne({ address: toAddress }),
  ]);

  if (!hotWallet) {
    logger.error('No internal hot wallet');
    return emptyResult;
  }

  if (!address) {
    logger.error(`${toAddress} is not a deposit address`);
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

  await rawdb.insertInternalTransfer(manager, {
    currency: feeSeederCurrency,
    fromAddress: hotWallet.address,
    toAddress,
    type: InternalTransferType.SEED,
    txid: tx.txid,
    status: WithdrawalStatus.SENT,
  });

  logger.info(`Seed Successfully address=${toAddress}`);

  return emptyResult;
}
