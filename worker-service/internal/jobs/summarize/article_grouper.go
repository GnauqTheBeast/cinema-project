package summarize

import (
	"math"
	"strings"
	"time"
	"unicode"

	"worker-service/internal/models"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// ArticleGroup represents a group of related articles
type ArticleGroup struct {
	Articles []*models.NewsArticle
	Keywords []string
	Category string
	Language string
}

// GroupArticles groups similar articles together using TF-IDF and cosine similarity
func GroupArticles(articles []*models.NewsArticle) []*ArticleGroup {
	if len(articles) == 0 {
		return nil
	}

	groups := make([]*ArticleGroup, 0)
	processed := make(map[string]bool)

	// Build TF-IDF vectors for all articles
	tfidfVectors := buildTFIDFVectors(articles)

	for i, article := range articles {
		if processed[article.Id] {
			continue
		}

		// Create new group with this article
		group := &ArticleGroup{
			Articles: []*models.NewsArticle{article},
			Keywords: extractKeywords(article.Title),
			Category: article.Category,
			Language: article.Language,
		}

		processed[article.Id] = true

		// Find similar articles using cosine similarity
		for j, other := range articles {
			if processed[other.Id] {
				continue
			}

			// Must be same category and language
			if other.Category != article.Category || other.Language != article.Language {
				continue
			}

			// Check time proximity (within 3 days for tighter grouping)
			if !isTimeProximate(article.PublishedAt, other.PublishedAt, 3*24*time.Hour) {
				continue
			}

			// Calculate cosine similarity between article vectors
			similarity := cosineSimilarity(tfidfVectors[i], tfidfVectors[j])

			// Threshold: 0.5 means articles share 50%+ similar content
			if similarity >= 0.5 {
				group.Articles = append(group.Articles, other)
				processed[other.Id] = true
			}
		}

		groups = append(groups, group)
	}

	return groups
}

// truncateContent returns first n characters of content
func truncateContent(content string, n int) string {
	if len(content) <= n {
		return content
	}
	return content[:n]
}

// extractKeywords extracts important keywords from title
func extractKeywords(title string) []string {
	// Normalize text
	normalized := normalizeText(title)

	// Split into words
	words := strings.Fields(normalized)

	// Filter out stop words and short words
	stopWords := getStopWords()
	keywords := make([]string, 0)

	for _, word := range words {
		word = strings.ToLower(word)
		if len(word) < 3 {
			continue
		}
		if stopWords[word] {
			continue
		}
		keywords = append(keywords, word)
	}

	return keywords
}

func isTimeProximate(t1, t2 *time.Time, duration time.Duration) bool {
	if t1 == nil || t2 == nil {
		return true // If we don't have timestamps, assume they're related
	}

	diff := t1.Sub(*t2)
	if diff < 0 {
		diff = -diff
	}

	return diff <= duration
}

func normalizeText(text string) string {
	// Remove accents
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	result, _, _ := transform.String(t, text)

	// Convert to lowercase
	result = strings.ToLower(result)

	return result
}

// getStopWords returns common stop words for Vietnamese and English
func getStopWords() map[string]bool {
	return map[string]bool{
		// English
		"the": true, "a": true, "an": true, "and": true, "or": true,
		"but": true, "in": true, "on": true, "at": true, "to": true,
		"for": true, "of": true, "with": true, "by": true, "from": true,
		"as": true, "is": true, "was": true, "are": true, "were": true,
		"be": true, "been": true, "has": true, "have": true, "had": true,
		"will": true, "would": true, "could": true, "should": true,

		// Vietnamese
		"là": true, "của": true, "và": true, "có": true, "trong": true,
		"được": true, "với": true, "cho": true, "từ": true, "này": true,
		"đã": true, "sẽ": true, "về": true, "tại": true, "như": true,
		"những": true, "các": true, "một": true, "để": true, "khi": true,
		"theo": true, "trên": true, "sau": true, "trước": true,
	}
}

func buildTFIDFVectors(articles []*models.NewsArticle) []map[string]float64 {
	// Step 1: Build vocabulary and document frequency (DF)
	vocabulary := make(map[string]int) // word -> document frequency
	docTerms := make([]map[string]int, len(articles))

	// Count term frequency for each document
	for i, article := range articles {
		text := article.Title + " " + truncateContent(article.Content, 500)
		terms := extractKeywords(text)

		termCount := make(map[string]int)
		for _, term := range terms {
			termCount[term]++
		}
		docTerms[i] = termCount

		// Update document frequency
		for term := range termCount {
			vocabulary[term]++
		}
	}

	// Step 2: Calculate TF-IDF for each document
	numDocs := float64(len(articles))
	tfidfVectors := make([]map[string]float64, len(articles))

	for i, termCount := range docTerms {
		tfidf := make(map[string]float64)
		totalTerms := 0
		for _, count := range termCount {
			totalTerms += count
		}

		for term, count := range termCount {
			// TF: term frequency in document
			tf := float64(count) / float64(totalTerms)

			// IDF: inverse document frequency
			df := float64(vocabulary[term])
			idf := math.Log(numDocs / df)

			// TF-IDF
			tfidf[term] = tf * idf
		}

		tfidfVectors[i] = tfidf
	}

	return tfidfVectors
}

// cosineSimilarity calculates cosine similarity between two TF-IDF vectors
func cosineSimilarity(vec1, vec2 map[string]float64) float64 {
	if len(vec1) == 0 || len(vec2) == 0 {
		return 0.0
	}

	// Calculate dot product and magnitudes
	dotProduct := 0.0
	magnitude1 := 0.0
	magnitude2 := 0.0

	for term, val1 := range vec1 {
		magnitude1 += val1 * val1
		if val2, exists := vec2[term]; exists {
			dotProduct += val1 * val2
		}
	}

	for _, val2 := range vec2 {
		magnitude2 += val2 * val2
	}

	magnitude1 = math.Sqrt(magnitude1)
	magnitude2 = math.Sqrt(magnitude2)

	if magnitude1 == 0 || magnitude2 == 0 {
		return 0.0
	}

	return dotProduct / (magnitude1 * magnitude2)
}
