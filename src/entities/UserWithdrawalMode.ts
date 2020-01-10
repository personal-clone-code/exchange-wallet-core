import { Utils } from 'sota-common';
import { Entity, BeforeInsert, BeforeUpdate, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_withdrawal_mode')
export class UserWithdrawalMode {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'user_id', nullable: false })
  public userId: number;

  @Column({ name: 'withdrawal_mode', nullable: false })
  public withdrawalMode: string;

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
