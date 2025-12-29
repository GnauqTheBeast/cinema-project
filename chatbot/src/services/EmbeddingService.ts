import { GoogleGenAI } from '@google/genai'
import { KeyManager } from '../pkg/keyManager/index.js'

export class EmbeddingService {
    private keyManager: KeyManager

    constructor({ keyManager }: { keyManager: KeyManager }) {
        this.keyManager = keyManager
    }

    async embeddingText(text: string): Promise<number[]> {
        const apiKey = this.keyManager.getNextKey()
        if (!apiKey) {
            throw new Error('No Gemini API key available')
        }

        try {
            const ai = new GoogleGenAI({ apiKey })

            const response = await ai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: text,
            })

            if (!response.embeddings || response.embeddings.length === 0) {
                throw new Error('No embedding returned')
            }

            const values = response.embeddings[0].values
            if (!values || values.length === 0) {
                throw new Error('No embedding values returned')
            }

            return values
        } catch (error) {
            throw new Error(`Embedding API error: ${error}`)
        }
    }
}
