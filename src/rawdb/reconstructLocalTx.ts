import { ISubmittedTransaction } from 'sota-common';
import { EntityManager } from 'typeorm';
import { LocalTx } from '../entities';
import { updateLocalTxStatus, updateWithdrawalsStatus, updateDepositCollectStatusByCollectTxId, updateDepositCollectStatusBySeedTxId } from '.';
import { LocalTxStatus, WithdrawalStatus, WithdrawalEvent, CollectStatus, CollectType, DepositEvent } from '../Enums';

/**
 * The localTx record is constructed wrongly
 * This correction will:
 * - Mark the localTx status to `failed`
 * - Reset related tables status in order to create a new local tx again
 * And the picker and signer will do the signing flow again
 */
export async function reconstructLocalTx(
  manager: EntityManager,
  localTx: LocalTx,
  txResult?: ISubmittedTransaction
): Promise<void> {
  await updateLocalTxStatus(manager, localTx.id, LocalTxStatus.FAILED);
  if (localTx.isWithdrawal() || localTx.isWithdrawalCollect()) {
    await updateWithdrawalsStatus(
      manager,
      localTx.id,
      WithdrawalStatus.UNSIGNED,
      WithdrawalEvent.TXID_CHANGED,
      txResult
    );
  } else if (localTx.isCollectTx()) {
    await updateDepositCollectStatusByCollectTxId(
      manager,
      localTx,
      CollectStatus.UNCOLLECTED,
      DepositEvent.COLLECT_TXID_CHANGED
    );
  } else if (localTx.isSeedTx()) {
    await updateDepositCollectStatusBySeedTxId(
      manager,
      localTx,
      CollectStatus.SEED_REQUESTED,
      DepositEvent.SEED_TXID_CHANGED
    );
  } else {
    throw new Error(`Not support localTxType: ${localTx.type}`);
  }
}
