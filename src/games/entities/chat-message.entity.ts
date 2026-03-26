import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Game } from './game.entity';

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    gameId: string;

    @Column()
    userId: string;

    @Column()
    userName: string;

    @Column({ nullable: true })
    userAvatar: string;

    @Column()
    message: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Game, game => game.chatMessages, { onDelete: 'CASCADE' })
    game: Game;
}
