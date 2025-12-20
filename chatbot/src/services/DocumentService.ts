import { Pool } from 'pg'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Document, DocumentStatus, DocumentChunk } from '../models/index.js'
import { DocumentDatastore, ChunkDatastore } from '../datastore/index.js'
import { CacheManager } from '../pkg/caching/index.js'
import { TextExtractor, splitIntoChunks, ChunkConfig } from '../utils/index.js'
import { EmbeddingService } from './EmbeddingService.js'
import { logger } from '../utils/index.js'

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
            logger.warn('Could not get file info', { error })
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
                .catch((err) => {
                    logger.error('Failed to update document status to failed', {
                        docId: doc.id,
                        error: err,
                    })
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
                // Generate embedding for chunk
                const embedding = await this.embeddingService.embeddingText(chunk.content)
                const embeddingJSON = JSON.stringify(embedding)

                docChunks.push({
                    id: uuidv4(),
                    document_id: doc.id,
                    chunk_index: i,
                    content: chunk.content,
                    embedding: embeddingJSON,
                    start_pos: chunk.startPos,
                    end_pos: chunk.endPos,
                    token_count: chunk.tokenCount,
                    created_at: new Date(),
                })
            } catch (error) {
                logger.error('Failed to generate embedding for chunk', {
                    docId: doc.id,
                    chunkIndex: i,
                    error,
                })
                throw error
            }
        }

        // Save all chunks
        await this.chunkDatastore.batchCreateChunks(docChunks)

        // Invalidate chunks cache
        await this.cacheManager.invalidatePattern('document_chunks').catch((err) => {
            logger.error('Failed to invalidate cache', { error: err })
        })

        // Update document status to completed
        await this.documentDatastore.updateDocumentStatus(doc.id, DocumentStatus.COMPLETED)

        logger.info('Document processing completed', {
            docId: doc.id,
            chunksCount: docChunks.length,
        })
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
        await this.cacheManager.invalidatePattern('document_chunks').catch((err) => {
            logger.error('Failed to invalidate cache after delete', { error: err })
        })
    }

    async getDocumentChunks(docID: string): Promise<DocumentChunk[]> {
        return this.chunkDatastore.getChunksByDocumentId(docID)
    }
}
