export interface Chat {
    id: string
    question: string
    answer: string
    embedding_question: string
    created_at?: Date
}

export const CHAT_TABLE = 'chats'
