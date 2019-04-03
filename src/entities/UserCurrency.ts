import { Utils } from 'sota-common';
import { Entity, BeforeInsert, BeforeUpdate, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_currency')
export class UserCurrency {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'user_id', nullable: false })
  public userId: number;

  @Column({ name: 'symbol', nullable: false })
  public symbol: string;

  @Column({ name: 'type', nullable: false })
  public type: string;

  @Column({ name: 'contract_address', nullable: false })
  public contractAddress: string;

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
