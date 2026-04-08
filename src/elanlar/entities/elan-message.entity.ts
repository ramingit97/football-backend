import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('elan_messages')
export class ElanMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    elanId: string;

    @Column()
    userId: string;

    @Column()
    userName: string;

    @Column({ nullable: true })
    userAvatar: string;

    @Column({ type: 'text' })
    message: string;

    @CreateDateColumn()
    createdAt: Date;
}
