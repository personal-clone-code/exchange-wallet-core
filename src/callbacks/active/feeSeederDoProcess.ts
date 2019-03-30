import { IWithdrawalProcessingResult, getLogger, BaseFeeSeeder, getFamily } from 'sota-common';
import { getConnection, EntityManager } from 'typeorm';
import * as rawdb from '../../rawdb';
import { InternalTransferType, WithdrawalStatus } from '../../Enums';
import { Address, WalletBalance } from '../../entities';
import BigNumber from 'bignumber.js';
import { InternalTransfer } from '../../entities/InternalTransfer';
import { hotWalletToPrivateKey } from './signerDoProcess';

const logger = getLogger('feeSeederDoProcess');

const emptyResult: IWithdrawalProcessingResult = {
  needNextProcess: false,
  withdrawalTxId: 0,
};

export async function feeSeederDoProcess(seeder: BaseFeeSeeder): Promise<IWithdrawalProcessingResult> {
  let result: IWithdrawalProcessingResult = null;
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

  const feeAmount = amount;
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
    [{ toAddress, amount: feeAmount } as any],
    feeSeederCurrency,
    false,
    seeder.getGateway()
  );
  if (!hotWallet) {
    logger.error(`No transferable internal hot wallet walletId=${walletId} currency=${feeSeederCurrency}`);
    return emptyResult;
  }

  const walletBalance = await manager.getRepository(WalletBalance).findOne({ walletId, coin: feeSeederCurrency });
  if (!walletBalance) {
    logger.error(`Wallet ${walletId} is missed wallet balance record`);
    return emptyResult;
  }

  const feeWalletBalance = walletBalance.balance;
  if (new BigNumber(feeWalletBalance).lt(feeAmount)) {
    logger.error(
      `Wallet ${walletId} has not enough ${feeSeederCurrency.toUpperCase()} fund to seed fee for address=${
        address.address
      }`
    );
    return emptyResult;
  }

  const rawPrivateKey = await hotWalletToPrivateKey(hotWallet);
  const tx = await seeder.getGateway().seedFee(rawPrivateKey, hotWallet.address, toAddress, feeAmount);

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
