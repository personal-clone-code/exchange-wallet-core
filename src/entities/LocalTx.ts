import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';
import { LocalTxType } from '../Enums';

@Entity('local_tx')
export class LocalTx {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column('int', { name: 'user_id', nullable: false })
  public userId: number;

  @Column('int', { name: 'wallet_id', nullable: false })
  public walletId: number;

  @Column('varchar', { name: 'from_address', nullable: true })
  public fromAddress: string;

  @Column('varchar', { name: 'to_address', nullable: true })
  public toAddress: string;

  @Column('varchar', { name: 'txid', nullable: true })
  public txid: string | null;

  @Column('varchar', { length: 200, name: 'currency', nullable: false })
  public currency: string;

  @Column('varchar', { length: 40, name: 'currency_symbol', nullable: false })
  public currencySymbol: string;

  @Column('varchar', { length: 200, name: 'ref_currency', nullable: false })
  public refCurrency: string;

  @Column('varchar', { length: 200, name: 'ref_currency_symbol', nullable: false })
  public refCurrencySymbol: string;

  @Column('varchar', { length: 40, name: 'type', nullable: false })
  public type: LocalTxType;

  @Column('varchar', { length: 100, name: 'ref_table', nullable: false })
  public refTable: string;

  @Column('int', { name: 'ref_id', nullable: false })
  public refId: number;

  @Column('varchar', { name: 'memo', nullable: true })
  public memo: string | null;

  @Column('varchar', { length: 20, name: 'status', nullable: false })
  public status: string;

  @Column('varchar', { name: 'unsigned_txid', nullable: false, unique: true })
  public unsignedTxid: string;

  @Column({ name: 'block_number', nullable: false })
  public blockNumber: number;

  @Column({ name: 'block_hash', nullable: false })
  public blockHash: string;

  @Column({ name: 'block_timestamp', nullable: false })
  public blockTimestamp: number;

  @Column({ name: 'amount' })
  public amount: string;

  @Column({ name: 'fee_amount', nullable: false })
  public feeAmount: string;

  @Column({ name: 'fee_currency', nullable: false })
  public feeCurrency: string;

  @Column('text', { name: 'unsigned_raw', nullable: true })
  public unsignedRaw: string | null;

  @Column('text', { name: 'signed_raw', nullable: true })
  public signedRaw: string | null;

  @Column({ name: 'created_at', type: 'bigint' })
  public createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint' })
  public updatedAt: number;

  @BeforeInsert()
  public updateCreateDates() {
    this.createdAt = Utils.nowInMillis();
    this.updatedAt = Utils.nowInMillis();
  }

  @BeforeUpdate()
  public updateUpdateDates() {
    this.updatedAt = Utils.nowInMillis();
  }

  public isTemporaryTransaction(): boolean {
    if (!this.txid) {
      return true;
    }

    if (this.txid.startsWith('TMP_')) {
      return true;
    }

    return false;
  }

  public isWithdrawal(): boolean {
    return this.type === LocalTxType.WITHDRAWAL_NORMAL || this.type === LocalTxType.WITHDRAWAL_COLD;
  }

  public isSeedTx(): boolean {
    return this.type === LocalTxType.SEED;
  }

  public isCollectTx(): boolean {
    return this.type === LocalTxType.COLLECT;
  }
}
