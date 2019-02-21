import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';

@Entity('deposit')
export class Deposit {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'wallet_id', nullable: false })
  public walletId: number;

  /**
   * @deprecated this column will be deprecated
   */
  @Column({ name: 'type_currency', nullable: false })
  public typeCurrency: string;

  @Column({ name: 'currency', nullable: false })
  public currency: string;

  @Column({ name: 'to_address', nullable: false })
  public toAddress: string;

  @Column({ nullable: false })
  public txid: string;

  @Column({ name: 'collect_status', nullable: false })
  public collectStatus: string;

  @Column({ name: 'collected_txid' })
  public collectedTxid: string;

  @Column({ name: 'collected_timestamp', nullable: false })
  public collectedTimestamp: number;

  @Column({ type: 'bigint', name: 'next_check_at', nullable: false })
  public nextCheckAt: number;

  @Column({ type: 'decimal', precision: 32, scale: 0, nullable: false })
  public amount: string;

  @Column({ name: 'block_number', nullable: false })
  public blockNumber: number;

  @Column({ name: 'block_timestamp', nullable: false })
  public blockTimestamp: number;

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
