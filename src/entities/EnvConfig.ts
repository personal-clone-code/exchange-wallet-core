import { Entity, PrimaryColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Utils } from 'sota-common';

@Entity('env_config')
export class EnvConfig {
  @PrimaryColumn({ name: 'key' })
  public key: string;

  @Column({ name: 'value' })
  public value: string;
}
