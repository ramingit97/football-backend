import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    senderId: string;

    @Column()
    receiverId: string;

    @Column('float')
    amount: number;

    @Column({ default: 'transfer' })
    type: string;

    @Column({ default: 'completed' })
    status: string;

    @Column({ nullable: true })
    note: string;

    @CreateDateColumn()
    createdAt: Date;
}
