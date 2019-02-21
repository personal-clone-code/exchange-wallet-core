import { Utils } from 'sota-common';
import { Entity, Column, PrimaryColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('ada_hot_wallet')
export class AdaHotWallet {
  @PrimaryColumn('varchar', {
    length: 200,
    name: 'address',
    nullable: false,
    primary: true,
  })
  public address: string;

  @Column('varchar', {
    length: 100,
    name: 'wallet_address',
    nullable: false,
  })
  public walletAddress: string;

  @Column('varchar', {
    length: 50,
    name: 'account_id',
    nullable: false,
  })
  public accountId: string;

  @Column('varchar', {
    length: 255,
    name: 'spending_password',
    nullable: false,
  })
  public spendingPassword: string;

  @Column('int', {
    default: '0',
    name: 'kms_data_key_id',
    nullable: false,
  })
  public kms_data_key_id: number;

  @Column('varchar', {
    length: 150,
    name: 'backup_phrase',
    nullable: false,
  })
  public backupPhrase: string;

  @Column({ type: 'tinyint', name: 'is_external', nullable: false })
  public isExternal: boolean;

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
