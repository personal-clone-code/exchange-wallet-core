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

  public async proceed(manager: EntityManager) {
    this.manager = manager;

    await this.prepare();
    if (await this.isBusy()) {
      logger.info(`Cannot sign txid=${this.localTx.unsignedTxid} because hotwallet or address is busy`);
      return;
    }
    await this.signTx();
    await this.saveSignedTx();

    logger.info(`Signed localTx id=${this.localTx.id}, platform=${this.currency.platform}, txid=${this.localTx.txid}`);
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
