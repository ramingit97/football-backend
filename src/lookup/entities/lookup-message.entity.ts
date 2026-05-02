import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('lookup_messages')
export class LookupMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    lookupId: string;

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
