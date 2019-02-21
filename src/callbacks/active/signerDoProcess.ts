import {
  Const,
  getLogger,
  BaseWithdrawalSigner,
  IWithdrawalProcessingResult,
  HotWalletType,
  Utils,
  BaseGateway,
  getListTokenSymbols,
} from 'sota-common';
import { EntityManager, getConnection } from 'typeorm';
import { WithdrawalTx, HotWallet, Withdrawal } from '../../entities';
import { WithdrawalStatus } from '../../Enums';
import * as rawdb from '../../rawdb';

const logger = getLogger('signerDoProcess');
const emptyResult: IWithdrawalProcessingResult = {
  needNextProcess: false,
  withdrawalTxId: 0,
};

export async function signerDoProcess(signer: BaseWithdrawalSigner): Promise<IWithdrawalProcessingResult> {
  let result: IWithdrawalProcessingResult = null;
  await getConnection().transaction(async manager => {
    result = await _signerDoProcess(manager, signer);
  });
  return result;
}

async function _signerDoProcess(
  manager: EntityManager,
  signer: BaseWithdrawalSigner
): Promise<IWithdrawalProcessingResult> {
  const nextCurrency = await rawdb.getNextCurrencyByStatus(manager, getListTokenSymbols().tokenSymbols, [
    WithdrawalStatus.SIGNING,
  ]);

  if (!nextCurrency) {
    logger.info(
      `There are not signing ${getListTokenSymbols().tokenSymbolsBuilder.toUpperCase()} withdrawals to process`
    );
    return emptyResult;
  }

  const currency = nextCurrency;
  const gateway = signer.getGateway(currency);
  return _signerSubDoProcess(manager, currency, gateway);
}

async function _signerSubDoProcess(manager: EntityManager, currency: string, gateway: BaseGateway) {
  const withdrawalTx = await manager.findOne(WithdrawalTx, {
    currency,
    status: Const.WITHDRAWAL_STATUS.SIGNING,
  });

  if (!withdrawalTx) {
    logger.info(`No more record is needed to sign. Will wait for the next tick...`);
    return emptyResult;
  }

  const withdrawalTxId = withdrawalTx.id;
  const walletDef = {
    address: withdrawalTx.hotWalletAddress,
    currency,
  };

  const hotWallet = await manager.findOne(HotWallet, walletDef);
  if (!hotWallet) {
    throw new Error(
      `Could not find hot wallet information to sign tx: currency=${currency}, address=${withdrawalTx.hotWalletAddress}`
    );
  }

  // TODO: handle multisig hot wallet
  if (hotWallet.type !== HotWalletType.Normal) {
    throw new Error(`Only support normal hot wallet at the moment.`);
  }

  const signedTx = await gateway.signRawTxBySinglePrivateKey(withdrawalTx.unsignedRaw, hotWallet.coinKeys);
  const status = WithdrawalStatus.SIGNED;
  const txid = signedTx.txid;

  withdrawalTx.status = status;
  withdrawalTx.txid = txid;
  withdrawalTx.signedRaw = signedTx.signedRaw;

  await Utils.PromiseAll([
    manager.getRepository(WithdrawalTx).save(withdrawalTx),
    manager.getRepository(Withdrawal).update({ withdrawalTxId }, { status, txid }),
  ]);

  return {
    needNextProcess: true,
    withdrawalTxId: withdrawalTx.id,
  };
}
