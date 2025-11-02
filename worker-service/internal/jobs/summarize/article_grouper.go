package summarize

import (
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

// GroupArticles groups similar articles together based on title similarity and time proximity
func GroupArticles(articles []*models.NewsArticle) []*ArticleGroup {
	if len(articles) == 0 {
		return nil
	}

	groups := make([]*ArticleGroup, 0)
	processed := make(map[string]bool)

	for _, article := range articles {
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

		// Find similar articles
		for _, other := range articles {
			if processed[other.Id] {
				continue
			}

			// Must be same category and language
			if other.Category != article.Category || other.Language != article.Language {
				continue
			}

			// Check time proximity (within 48 hours)
			if !isTimeProximate(article.PublishedAt, other.PublishedAt, 48*time.Hour) {
				continue
			}

			// Check title similarity
			if isSimilarTitle(article.Title, other.Title, 0.5) {
				group.Articles = append(group.Articles, other)
				processed[other.Id] = true
			}
		}

		groups = append(groups, group)
	}

	return groups
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

// isSimilarTitle checks if two titles are similar based on keyword overlap
func isSimilarTitle(title1, title2 string, threshold float64) bool {
	keywords1 := extractKeywords(title1)
	keywords2 := extractKeywords(title2)

	if len(keywords1) == 0 || len(keywords2) == 0 {
		return false
	}

	// Calculate Jaccard similarity
	intersection := 0
	keyword1Map := make(map[string]bool)
	for _, kw := range keywords1 {
		keyword1Map[kw] = true
	}

	for _, kw := range keywords2 {
		if keyword1Map[kw] {
			intersection++
		}
	}

	union := len(keywords1) + len(keywords2) - intersection
	if union == 0 {
		return false
	}

	similarity := float64(intersection) / float64(union)
	return similarity >= threshold
}

// isTimeProximate checks if two timestamps are within the given duration
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

// normalizeText removes accents and normalizes text for comparison
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
