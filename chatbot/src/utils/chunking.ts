import crypto from 'crypto'

export interface ChunkConfig {
    maxSize: number
    overlap: number
    method: 'fixed' | 'sentence' | 'paragraph'
    minSize: number
    separators: string[]
}

export interface TextChunk {
    content: string
    startPos: number
    endPos: number
    tokenCount: number
}

export function defaultChunkConfig(): ChunkConfig {
    return {
        maxSize: 800,
        overlap: 100,
        method: 'sentence',
        minSize: 50,
        separators: ['\n\n', '\n', '. ', '! ', '? '],
    }
}

export function splitIntoChunks(text: string, config: ChunkConfig): TextChunk[] {
    switch (config.method) {
        case 'fixed':
            return chunkByFixedSize(text, config)
        case 'sentence':
            return chunkBySentence(text, config)
        case 'paragraph':
            return chunkByParagraph(text, config)
        default:
            return chunkBySentence(text, config)
    }
}

function chunkByFixedSize(text: string, config: ChunkConfig): TextChunk[] {
    const chunks: TextChunk[] = []
    const textLen = text.length
    let start = 0

    while (start < textLen) {
        let end = start + config.maxSize
        if (end > textLen) {
            end = textLen
        }

        // Try to break at word boundary
        if (end < textLen) {
            for (let i = end - 1; i > start && i > end - 50; i--) {
                if (text[i] === ' ' || text[i] === '\n') {
                    end = i
                    break
                }
            }
        }

        const chunkContent = text.substring(start, end).trim()
        if (chunkContent.length >= config.minSize) {
            chunks.push({
                content: chunkContent,
                startPos: start,
                endPos: end,
                tokenCount: estimateTokenCount(chunkContent),
            })
        }

        start = end - config.overlap
        if (start < 0) {
            start = 0
        }
    }

    return chunks
}

function chunkBySentence(text: string, config: ChunkConfig): TextChunk[] {
    const sentences = splitSentences(text)
    const chunks: TextChunk[] = []
    let currentChunk = ''
    let currentStart = 0
    let sentenceStart = 0

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim()
        if (!sentence) {
            continue
        }

        // Calculate position in original text
        if (i === 0) {
            sentenceStart = 0
            currentStart = 0
        } else {
            const index = text.indexOf(sentence, sentenceStart)
            if (index !== -1) {
                sentenceStart = index
            }
        }

        // Check if adding sentence exceeds max size
        if (currentChunk.length > 0 && currentChunk.length + sentence.length + 1 > config.maxSize) {
            // Save current chunk
            const chunkContent = currentChunk.trim()
            if (chunkContent.length >= config.minSize) {
                chunks.push({
                    content: chunkContent,
                    startPos: currentStart,
                    endPos: sentenceStart,
                    tokenCount: estimateTokenCount(chunkContent),
                })
            }

            // Start new chunk with overlap
            currentChunk = ''
            if (config.overlap > 0 && chunks.length > 0) {
                // Add last few sentences as overlap
                const overlapText = getOverlapText(sentences, i, config.overlap)
                if (overlapText) {
                    currentChunk = overlapText + ' '
                }
            }
            currentStart = sentenceStart
        }

        currentChunk += sentence + ' '
        sentenceStart += sentence.length
    }

    // Add final chunk
    if (currentChunk.length > 0) {
        const chunkContent = currentChunk.trim()
        if (chunkContent.length >= config.minSize) {
            chunks.push({
                content: chunkContent,
                startPos: currentStart,
                endPos: text.length,
                tokenCount: estimateTokenCount(chunkContent),
            })
        }
    }

    return chunks
}

function chunkByParagraph(text: string, config: ChunkConfig): TextChunk[] {
    const paragraphs = text.split('\n\n')
    const chunks: TextChunk[] = []
    let currentChunk = ''
    let currentStart = 0
    let paragraphStart = 0

    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim()
        if (!paragraph) {
            continue
        }

        // Calculate position in original text
        if (i === 0) {
            paragraphStart = 0
            currentStart = 0
        } else {
            const index = text.indexOf(paragraph, paragraphStart)
            if (index !== -1) {
                paragraphStart = index
            }
        }

        // Check if adding paragraph exceeds max size
        if (
            currentChunk.length > 0 &&
            currentChunk.length + paragraph.length + 2 > config.maxSize
        ) {
            // Save current chunk
            const chunkContent = currentChunk.trim()
            if (chunkContent.length >= config.minSize) {
                chunks.push({
                    content: chunkContent,
                    startPos: currentStart,
                    endPos: paragraphStart,
                    tokenCount: estimateTokenCount(chunkContent),
                })
            }

            // Start new chunk
            currentChunk = ''
            currentStart = paragraphStart
        }

        currentChunk += paragraph + '\n\n'
        paragraphStart += paragraph.length + 2
    }

    // Add final chunk
    if (currentChunk.length > 0) {
        const chunkContent = currentChunk.trim()
        if (chunkContent.length >= config.minSize) {
            chunks.push({
                content: chunkContent,
                startPos: currentStart,
                endPos: text.length,
                tokenCount: estimateTokenCount(chunkContent),
            })
        }
    }

    return chunks
}

function splitSentences(text: string): string[] {
    const re = /[.!?]+\s+/g
    const sentences = text.split(re)

    const result: string[] = []
    for (const sentence of sentences) {
        const trimmed = sentence.trim()
        if (trimmed) {
            result.push(trimmed)
        }
    }

    return result
}

function getOverlapText(
    sentences: string[],
    currentIndex: number,
    maxOverlapChars: number,
): string {
    if (currentIndex === 0) {
        return ''
    }

    let overlap = ''
    let chars = 0

    for (let i = currentIndex - 1; i >= 0 && chars < maxOverlapChars; i--) {
        const sentence = sentences[i]
        if (chars + sentence.length > maxOverlapChars) {
            break
        }

        if (overlap) {
            overlap = sentence + ' ' + overlap
        } else {
            overlap = sentence
        }
        chars += sentence.length + 1
    }

    return overlap
}

function estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for Vietnamese/English
    return Math.ceil([...text].length / 4)
}

export function generateTextHash(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex')
}
