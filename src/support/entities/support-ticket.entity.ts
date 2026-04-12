import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('support_tickets')
export class SupportTicket {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    userName: string;

    @Column({ nullable: true })
    userEmail: string;

    @Column('text')
    message: string;

    @Column({ type: 'text', nullable: true })
    reply: string;

    @Column({ default: 'open' }) // open | replied
    status: string;

    @Column({ default: false })
    seenByUser: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
