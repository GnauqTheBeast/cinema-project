package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

const (
	GeminiAPIBaseURL = "https://generativelanguage.googleapis.com/v1beta"
)

// Client is a client for the Gemini API with round-robin support for multiple API keys
type Client struct {
	apiKeys    []string
	httpClient *http.Client
	model      string
	index      int // Current index for round-robin
	mu         sync.Mutex
}

// NewClient creates a new Gemini API client with multiple API keys
func NewClient(apiKeys []string) *Client {
	if len(apiKeys) == 0 {
		panic("at least one API key is required")
	}

	return &Client{
		apiKeys: apiKeys,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		model: "gemini-1.5-flash", // Using flash model for faster responses
		index: 0,
	}
}

// getNextAPIKey returns the next API key using round-robin (thread-safe)
func (c *Client) getNextAPIKey() string {
	c.mu.Lock()
	defer c.mu.Unlock()

	key := c.apiKeys[c.index]
	c.index = (c.index + 1) % len(c.apiKeys)
	return key
}

// GenerateContentRequest represents a request to generate content
type GenerateContentRequest struct {
	Contents []Content `json:"contents"`
}

// Content represents a content item
type Content struct {
	Parts []Part `json:"parts"`
}

// Part represents a text part
type Part struct {
	Text string `json:"text"`
}

// GenerateContentResponse represents the API response
type GenerateContentResponse struct {
	Candidates []Candidate `json:"candidates"`
}

// Candidate represents a response candidate
type Candidate struct {
	Content       Content `json:"content"`
	FinishReason  string  `json:"finishReason"`
	SafetyRatings []struct {
		Category    string `json:"category"`
		Probability string `json:"probability"`
	} `json:"safetyRatings"`
}

// GenerateContent generates content using Gemini API with round-robin API key selection
func (c *Client) GenerateContent(ctx context.Context, prompt string) (string, error) {
	apiKey := c.getNextAPIKey()
	url := fmt.Sprintf("%s/models/%s:generateContent?key=%s", GeminiAPIBaseURL, c.model, apiKey)

	reqBody := GenerateContentRequest{
		Contents: []Content{
			{
				Parts: []Part{
					{Text: prompt},
				},
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var response GenerateContentResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if len(response.Candidates) == 0 || len(response.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no content generated")
	}

	return response.Candidates[0].Content.Parts[0].Text, nil
}

// SummarizeArticles generates a summary for multiple related articles
func (c *Client) SummarizeArticles(ctx context.Context, titles []string, language string) (string, error) {
	var prompt string

	if language == "vi" {
		prompt = fmt.Sprintf(`Bạn là một biên tập viên chuyên về tin tức điện ảnh.
Dưới đây là danh sách các tiêu đề bài báo cùng đề cập về một sự kiện/chủ đề trong lĩnh vực phim ảnh:

%s

Hãy viết một đoạn tóm tắt ngắn gọn (2-3 câu) về nội dung chính mà các bài báo này đang đề cập.
Tập trung vào sự kiện/thông tin chính, không cần liệt kê nguồn tin.`, formatTitles(titles))
	} else {
		prompt = fmt.Sprintf(`You are a film news editor.
Below are news article titles about the same film industry event/topic:

%s

Write a concise summary (2-3 sentences) of the main content these articles are covering.
Focus on the main event/information, don't list the sources.`, formatTitles(titles))
	}

	return c.GenerateContent(ctx, prompt)
}

// GenerateTopicTitle generates a title for a group of articles
func (c *Client) GenerateTopicTitle(ctx context.Context, titles []string, language string) (string, error) {
	var prompt string

	if language == "vi" {
		prompt = fmt.Sprintf(`Dựa trên các tiêu đề bài báo sau:

%s

Hãy tạo một tiêu đề ngắn gọn (tối đa 10 từ) tóm tắt chủ đề chính.`, formatTitles(titles))
	} else {
		prompt = fmt.Sprintf(`Based on these article titles:

%s

Create a concise title (max 10 words) summarizing the main topic.`, formatTitles(titles))
	}

	return c.GenerateContent(ctx, prompt)
}

// formatTitles formats a list of titles for the prompt
func formatTitles(titles []string) string {
	result := ""
	for i, title := range titles {
		result += fmt.Sprintf("%d. %s\n", i+1, title)
	}
	return result
}
