import {
  getLogger,
  ICurrency,
  BaseGateway,
  CurrencyRegistry,
  GatewayRegistry,
  BasePlatformWorker,
  ISignedRawTransaction,
} from 'sota-common';
import { LocalTx } from '../../../entities';
import { EntityManager } from 'typeorm';
import { LocalTxStatus } from '../../../Enums';
import * as rawdb from '../../../rawdb';

const logger = getLogger('BaseSigner');

export abstract class BaseSigner {
  protected localTx: LocalTx;
  protected currency: ICurrency;
  protected gateway: BaseGateway;
  protected manager: EntityManager;
  protected signedTx: ISignedRawTransaction;

  public constructor(localTx: LocalTx) {
    this.localTx = localTx;
    this.currency = CurrencyRegistry.getOneCurrency(localTx.currency);
    this.gateway = GatewayRegistry.getGatewayInstance(this.currency);
  }

  public async proceed(manager: EntityManager, failedCounter: number) {
    this.manager = manager;

    await this.prepare();

    if (await this.isBusy()) {
      const newFailedCounter = failedCounter + 1;
      if (newFailedCounter % 50 === 0) {
        // Raise issue if the hot wallet is not available for too long...
        logger.error(
          `No available hot wallet walletId=${this.localTx.walletId} currency=${
            this.currency
          } failedCounter=${newFailedCounter}`
        );
      } else {
        // Else just print info and continue to wait
        logger.info(
          `No available hot wallet at the moment: walletId=${this.localTx.walletId} currency=${this.currency.symbol}`
        );
      }
      await rawdb.updateRecordsTimestamp(manager, LocalTx, [this.localTx.id]);
      return newFailedCounter;
    }

    await this.signTx();
    await this.saveSignedTx();

    logger.info(`Signed localTx id=${this.localTx.id}, platform=${this.currency.platform}, txid=${this.localTx.txid}`);
    return 0; // Reset failedCounter
  }

  protected abstract async prepare(): Promise<void>;
  protected abstract async isBusy(): Promise<boolean>;
  protected abstract async signTx(): Promise<void>;

  protected async saveSignedTx(): Promise<void> {
    this.localTx.status = LocalTxStatus.SIGNED;
    this.localTx.txid = this.signedTx.txid;
    this.localTx.signedRaw = this.signedTx.signedRaw;
    await this.manager.getRepository(LocalTx).save(this.localTx);

    this.updateRelatedTables();
  }

  protected abstract async updateRelatedTables(): Promise<void>;
}
