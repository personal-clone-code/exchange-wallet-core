import { EntityManager, In } from 'typeorm';
import { LocalTx, Withdrawal } from '../entities';
import { LocalTxType, LocalTxStatus, WithdrawOutType, WithdrawalStatus } from '../Enums';

export async function hasAnyCollectFromAddressToAddress(manager: EntityManager, currency: string, withdrawalStatuses: WithdrawalStatus[], toAddress: string, fromAddress?: string): Promise<boolean> {
  const collectlRecord = await manager.getRepository(LocalTx).findOne({
    where: !!fromAddress ? {
      fromAddress: fromAddress,
      toAddress: toAddress,
      type: In([LocalTxType.WITHDRAWAL_COLLECT, LocalTxType.COLLECT]),
      status: In([LocalTxStatus.SIGNING, LocalTxStatus.SIGNED, LocalTxStatus.SENT, LocalTxStatus.COMPLETED]),
    } : {
      toAddress: toAddress,
      type: In([LocalTxType.WITHDRAWAL_COLLECT, LocalTxType.COLLECT]),
      status: In([LocalTxStatus.SIGNING, LocalTxStatus.SIGNED, LocalTxStatus.SENT, LocalTxStatus.COMPLETED]),
    },
  });
  if (!!collectlRecord) {
    return true;
  }
  
  const withdrawlRecord = await manager.getRepository(Withdrawal).findOne({
    where: !!fromAddress ? {
      currency: currency,
      fromAddress: fromAddress,
      toAddress: toAddress,
      type: WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS,
      status: In(withdrawalStatuses),
    } : {
      currency: currency,
      toAddress: toAddress,
      type: WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS,
      status: In(withdrawalStatuses),
    },
  });
  if (!!withdrawlRecord) {
    return true;
  }
  return false;
}