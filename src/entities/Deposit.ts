import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';

@Entity('deposit')
export class Deposit {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'wallet_id', nullable: false })
  public walletId: number;

  @Column({ name: 'currency', nullable: false })
  public currency: string;

  @Column({ name: 'from_address', type: 'text', nullable: false })
  public fromAddress: string;

  @Column({ name: 'to_address', nullable: false })
  public toAddress: string;

  @Column({ nullable: false })
  public txid: string;

  @Column({ type: 'decimal', precision: 32, scale: 0, nullable: false })
  public amount: string;

  @Column()
  public memo: string | null;

  @Column({ name: 'block_number', nullable: false })
  public blockNumber: number;

  @Column({ name: 'block_timestamp', nullable: false })
  public blockTimestamp: number;

  @Column({ name: 'collect_status', nullable: false })
  public collectStatus: string;

  @Column({ name: 'collected_txid' })
  public collectedTxid: string;

  @Column({ name: 'collected_timestamp', nullable: false })
  public collectedTimestamp: number;

  @Column({ name: 'collect_local_tx_id' })
  public collectLocalTxId: number;

  @Column({ name: 'seeded_txid' })
  public seededTxid: string;

  @Column({ name: 'seed_local_tx_id' })
  public seedLocalTxId: number;

  @Column({ name: 'collect_withdrawal_id' })
  public collectWithdrawalId: number;

  @Column({ name: 'collect_type', nullable: false })
  public collectType: string;

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
}
