import axios from 'axios'
import { KeyManager } from '../pkg/keyManager/index.js'
import { GeminiEmbeddingRequest, GeminiEmbeddingResponse } from '../types/index.js'

export class EmbeddingService {
    private keyManager: KeyManager

    constructor({ keyManager }: { keyManager: KeyManager }) {
        this.keyManager = keyManager
    }

    async embeddingText(text: string): Promise<number[]> {
        const reqBody: GeminiEmbeddingRequest = {
            model: 'models/text-embedding-004',
            content: {
                parts: [{ text }],
            },
        }

        const apiKey = this.keyManager.getNextKey()
        if (!apiKey) {
            throw new Error('No Gemini API key available')
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`

        try {
            const response = await axios.post<GeminiEmbeddingResponse>(url, reqBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.data.embedding?.values || response.data.embedding.values.length === 0) {
                throw new Error('No embedding returned')
            }

            return response.data.embedding.values
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Embedding API error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`,
                )
            }
            throw error
        }
    }
}
