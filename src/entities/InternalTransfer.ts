import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';

@Entity('internal_transfer')
export class InternalTransfer {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'wallet_id', nullable: false })
  public walletId: number;

  @Column({ nullable: false })
  public currency: string;

  @Column({ name: 'type', nullable: false })
  public type: string;

  @Column({ name: 'from_address', nullable: false })
  public fromAddress: string;

  @Column({ name: 'to_address', nullable: false })
  public toAddress: string;

  @Column({ nullable: false })
  public txid: string;

  @Column({ type: 'decimal', precision: 32, scale: 0, nullable: false })
  public amount: string;

  @Column({ type: 'decimal', precision: 32, scale: 0, nullable: false })
  public fee: string;

  @Column('varchar', { length: 20, name: 'status', nullable: false })
  public status: string;

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
