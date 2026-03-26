import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('friendships')
export class Friendship {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    requesterId: string;

    @Column()
    receiverId: string;

    @Column({ default: 'pending' })
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
