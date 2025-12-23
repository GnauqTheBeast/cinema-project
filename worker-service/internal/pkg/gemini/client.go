package gemini

import (
	"context"
	"fmt"
	"sync"

	"google.golang.org/genai"
)

type Client struct {
	clients []*genai.Client
	model   string
	index   int
	mu      sync.Mutex
}

func NewClient(apiKeys []string) *Client {
	if len(apiKeys) == 0 {
		panic("at least one API key is required")
	}

	clients := make([]*genai.Client, len(apiKeys))
	for i, apiKey := range apiKeys {
		client, err := genai.NewClient(context.Background(), &genai.ClientConfig{
			APIKey: apiKey,
		})
		if err != nil {
			panic(fmt.Sprintf("failed to create genai client: %v", err))
		}
		clients[i] = client
	}

	return &Client{
		clients: clients,
		model:   "gemini-2.5-flash",
		index:   0,
	}
}

func (c *Client) getNextClient() *genai.Client {
	c.mu.Lock()
	defer c.mu.Unlock()

	client := c.clients[c.index]
	c.index = (c.index + 1) % len(c.clients)
	return client
}

func (c *Client) GenerateContent(ctx context.Context, prompt string) (string, error) {
	client := c.getNextClient()

	result, err := client.Models.GenerateContent(
		ctx,
		c.model,
		genai.Text(prompt),
		nil,
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	text := result.Text()
	if text == "" {
		return "", fmt.Errorf("no content generated")
	}

	return text, nil
}

func (c *Client) SummarizeArticles(ctx context.Context, titles []string, language string) (string, error) {
	var prompt string

	if len(titles) == 1 {
		// Single article summary
		if language == "vi" {
			prompt = fmt.Sprintf(`Bạn là một biên tập viên chuyên về tin tức điện ảnh.
Dưới đây là tiêu đề bài báo về phim ảnh:

%s

Hãy viết một đoạn tóm tắt ngắn gọn (2-3 câu) về nội dung chính của bài báo này dựa trên tiêu đề.
Tập trung vào thông tin quan trọng nhất.`, titles[0])
		} else {
			prompt = fmt.Sprintf(`You are a film news editor.
Here is a film industry news article title:

%s

Write a concise summary (2-3 sentences) of what this article is likely about based on the title.
Focus on the most important information.`, titles[0])
		}
	} else {
		// Multiple articles summary
		if language == "vi" {
			prompt = fmt.Sprintf(`Bạn là một biên tập viên chuyên về tin tức điện ảnh.
Dưới đây là %d tiêu đề bài báo cùng đề cập về một sự kiện/chủ đề trong lĩnh vực phim ảnh:

%s

Hãy viết một đoạn tóm tắt ngắn gọn (2-3 câu) về nội dung chính mà các bài báo này đang đề cập.
Tập trung vào sự kiện/thông tin chính, không cần liệt kê nguồn tin.`, len(titles), formatTitles(titles))
		} else {
			prompt = fmt.Sprintf(`You are a film news editor.
Below are %d news article titles about the same film industry event/topic:

%s

Write a concise summary (2-3 sentences) of the main content these articles are covering.
Focus on the main event/information, don't list the sources.`, len(titles), formatTitles(titles))
		}
	}

	return c.GenerateContent(ctx, prompt)
}

func (c *Client) GenerateTopicTitle(ctx context.Context, titles []string, language string) (string, error) {
	var prompt string

	if len(titles) == 1 {
		if language == "vi" {
			prompt = fmt.Sprintf(`Dựa trên tiêu đề bài báo sau:

%s

Tạo một tiêu đề ngắn gọn hơn (tối đa 10 từ) giữ nguyên nội dung chính.

CHỈ trả về tiêu đề, KHÔNG thêm bất kỳ văn bản giải thích, gợi ý hay phần mở đầu nào khác.`, titles[0])
		} else {
			prompt = fmt.Sprintf(`Based on this article title:

%s

Create a shorter, concise title (max 10 words) keeping the main content.

ONLY return the title itself, NO explanations, suggestions, or introductory text.`, titles[0])
		}
	} else {
		if language == "vi" {
			prompt = fmt.Sprintf(`Dựa trên %d tiêu đề bài báo sau:

%s

Tạo một tiêu đề ngắn gọn (tối đa 10 từ) tóm tắt chủ đề chung.

CHỈ trả về tiêu đề, KHÔNG thêm bất kỳ văn bản giải thích, gợi ý hay phần mở đầu nào khác.`, len(titles), formatTitles(titles))
		} else {
			prompt = fmt.Sprintf(`Based on these %d article titles:

%s

Create a concise title (max 10 words) summarizing the main topic.

ONLY return the title itself, NO explanations, suggestions, or introductory text.`, len(titles), formatTitles(titles))
		}
	}

	return c.GenerateContent(ctx, prompt)
}

func formatTitles(titles []string) string {
	result := ""
	for i, title := range titles {
		result += fmt.Sprintf("%d. %s\n", i+1, title)
	}
	return result
}
