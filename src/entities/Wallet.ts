import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';

@Entity('wallet')
export class Wallet {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'user_id', nullable: false })
  public userId: number;

  @Column({ name: 'label', nullable: true })
  public label: string;

  @Column({ name: 'currency', nullable: false })
  public currency: string;

  @Column({ name: 'withdrawal_mode', nullable: false })
  public withdrawalMode: string;

  @Column({ name: 'secret', nullable: false })
  public secret: string;

  @Column({ name: 'is_hd', nullable: false })
  public isHd: boolean;

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
