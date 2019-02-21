import { Index, Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';

@Entity('withdrawal')
@Index('withdrawal_user_id_index', ['userId'])
@Index('withdrawal_wallet_id_index', ['walletId'])
@Index('withdrawal_from_address_index', ['fromAddress'])
@Index('withdrawal_to_address_index', ['toAddress'])
export class Withdrawal {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  public id: number;

  @Column('int', { name: 'user_id', nullable: false })
  public userId: number;

  @Column('int', { name: 'wallet_id', nullable: false })
  public walletId: number;

  @Column('int', { name: 'withdrawal_tx_id', nullable: false })
  public withdrawalTxId: number;

  @Column('varchar', { length: 100, name: 'txid', nullable: false })
  public txid: string;

  @Column('varchar', { length: 10, name: 'currency', nullable: false })
  public currency: string;

  @Column('varchar', { length: 100, name: 'from_address', nullable: false })
  public fromAddress: string;

  @Column('varchar', { length: 100, name: 'to_address', nullable: false })
  public toAddress: string;

  @Column('decimal', { name: 'amount', nullable: false })
  public amount: string;

  @Column('varchar', { length: 20, name: 'status', nullable: false })
  public status: string;

  @Column('varchar', { length: 255, name: 'hash_check', nullable: false })
  public hashCheck: string;

  @Column('int', { name: 'kms_data_key_id', nullable: true })
  public kmsDataKeyId: number | null;

  @Column({ name: 'created_at', type: 'bigint' })
  public createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint' })
  public updatedAt: number;

  public getAmount(): string {
    return Utils.handleAmountPrecision(this.amount, this.currency);
  }

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
