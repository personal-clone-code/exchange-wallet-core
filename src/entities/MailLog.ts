import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';
import { MailStatus } from '../Enums';

@Entity('mail_log')
export class MailLog {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'job_id', type: 'integer' })
  public jobId: number;

  @Column({ name: 'status', type: 'varchar' })
  public status: MailStatus;

  @Column({ name: 'msg', type: 'varchar' })
  public msg: string;

  @Column({ name: 'created_at', type: 'bigint' })
  public createdAt: number;

  @BeforeInsert()
  public updateCreateDates() {
    this.createdAt = Utils.nowInMillis();
  }
}
