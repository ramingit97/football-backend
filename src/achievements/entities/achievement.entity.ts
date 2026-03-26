import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('achievements')
export class Achievement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, (user) => user.achievements)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    type: string;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column({ nullable: true })
    gameId: string;

    @CreateDateColumn()
    createdAt: Date;
}
