import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';
// import { MailType } from '../Enums';

@Entity('mail_job')
export class MailJob {
  @PrimaryGeneratedColumn()
  public id: number;

  // 21/11/2019 un-use now
  // @Column({ name: 'type', type: 'varchar' })
  // public type: MailType;

  @Column({ name: 'sender_name', type: 'varchar' })
  public senderName: string;

  @Column({ name: 'sender_address', type: 'varchar' })
  public senderAddress: string;

  @Column({ name: 'recipient_address', type: 'varchar' })
  public recipientAddress: string;

  @Column({ name: 'title', type: 'varchar' })
  public title: string;

  @Column({ name: 'template_name', type: 'varchar' })
  public templateName: string;

  @Column({ name: 'content', type: 'text' })
  public content: string;

  @Column({ name: 'is_sent', type: 'bool' })
  public isSent: boolean;

  @Column({ name: 'retry_count', type: 'integer' })
  public retryCount: number;

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
