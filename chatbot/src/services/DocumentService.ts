import { Pool } from 'pg'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Document, DocumentStatus, DocumentChunk } from '../models/index.js'
import { DocumentDatastore, ChunkDatastore } from '../datastore/index.js'
import { CacheManager } from '../pkg/caching/index.js'
import { TextExtractor, splitIntoChunks, ChunkConfig } from '../utils/index.js'
import { EmbeddingService } from './EmbeddingService.js'

export class DocumentService {
    private cacheManager: CacheManager
    private embeddingService: EmbeddingService
    private documentDatastore: DocumentDatastore
    private chunkDatastore: ChunkDatastore
    private extractor: TextExtractor

    constructor({
        pool,
        cacheManager,
        embeddingService,
    }: {
        pool: Pool
        cacheManager: CacheManager
        embeddingService: EmbeddingService
    }) {
        this.cacheManager = cacheManager
        this.embeddingService = embeddingService
        this.documentDatastore = new DocumentDatastore(pool)
        this.chunkDatastore = new ChunkDatastore(pool)
        this.extractor = new TextExtractor()
    }

    async processDocument(filePath: string, title: string): Promise<Document> {
        await this.extractor.validateFile(filePath)

        const content = await this.extractor.extractText(filePath)

        let size = 0
        try {
            const fileInfo = await this.extractor.getFileInfo(filePath)
            size = fileInfo.size as number
        } catch (error) {
            // Ignore file info errors
        }

        const doc: Document = {
            id: uuidv4(),
            title,
            file_path: filePath,
            file_type: path.extname(filePath).toLowerCase(),
            size,
            status: DocumentStatus.PROCESSING,
            created_at: new Date(),
        }

        await this.documentDatastore.createDocument(doc)

        this.processChunks(doc, content).catch(() => {
            this.documentDatastore
                .updateDocumentStatus(doc.id, DocumentStatus.FAILED)
                .catch(() => {
                    // Ignore status update errors
                })
        })

        return doc
    }

    private async processChunks(doc: Document, content: string): Promise<void> {
        const config: ChunkConfig = {
            maxSize: 800,
            overlap: 100,
            method: 'sentence',
            minSize: 50,
            separators: ['\n\n', '\n', '. ', '! ', '? '],
        }

        const chunks = splitIntoChunks(content, config)

        const docChunks: DocumentChunk[] = []

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]

            try {
                const embedding = await this.embeddingService.embeddingText(chunk.content)

                docChunks.push({
                    id: uuidv4(),
                    document_id: doc.id,
                    chunk_index: i,
                    content: chunk.content,
                    embedding: embedding,
                    start_pos: chunk.startPos,
                    end_pos: chunk.endPos,
                    token_count: chunk.tokenCount,
                    created_at: new Date(),
                })
            } catch (error) {
                throw error
            }
        }

        // Save all chunks
        await this.chunkDatastore.batchCreateChunks(docChunks)

        // Invalidate chunks cache
        await this.cacheManager.invalidatePattern('document_chunks').catch(() => {
            // Ignore cache invalidation errors
        })

        // Update document status to completed
        await this.documentDatastore.updateDocumentStatus(doc.id, DocumentStatus.COMPLETED)
    }

    async getDocument(docID: string): Promise<Document | null> {
        return this.documentDatastore.getDocument(docID)
    }

    async listDocuments(limit: number, offset: number): Promise<Document[]> {
        return this.documentDatastore.getAllDocuments(limit, offset)
    }

    async deleteDocument(docID: string): Promise<void> {
        // Delete chunks first
        await this.chunkDatastore.deleteChunksByDocumentId(docID)

        // Delete document
        await this.documentDatastore.deleteDocument(docID)

        // Invalidate cache
        await this.cacheManager.invalidatePattern('document_chunks').catch(() => {
            // Ignore cache invalidation errors
        })
    }

    async getDocumentChunks(docID: string): Promise<DocumentChunk[]> {
        return this.chunkDatastore.getChunksByDocumentId(docID)
    }
}
