import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('setting')
export class Setting {
  @PrimaryColumn({ name: 'key', type: 'varchar', length: 255, nullable: false })
  public key: string;

  @Column({ name: 'value', type: 'varchar', length: '255', nullable: false })
  public value: string;

  @Column({ name: 'created_at', type: 'bigint', nullable: true })
  public createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint', nullable: true })
  public updated_at: number;
}