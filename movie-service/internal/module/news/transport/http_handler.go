package transport

import (
	"net/http"
	"strconv"

	"movie-service/internal/module/news/business"

	"github.com/labstack/echo/v4"
)

type HTTPHandler struct {
	biz business.NewsBusiness
}

func NewHTTPHandler(biz business.NewsBusiness) *HTTPHandler {
	return &HTTPHandler{biz: biz}
}

// GetNewsSummaries godoc
// @Summary Get news summaries
// @Description Get paginated list of news summaries with their source articles
// @Tags news
// @Accept json
// @Produce json
// @Param category query string false "Category filter (domestic, international, all)" default(all)
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /news/summaries [get]
func (h *HTTPHandler) GetNewsSummaries(c echo.Context) error {
	category := c.QueryParam("category")
	if category == "" {
		category = "all"
	}

	page, err := strconv.Atoi(c.QueryParam("page"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.QueryParam("page_size"))
	if err != nil || pageSize < 1 || pageSize > 50 {
		pageSize = 10
	}

	summaries, total, err := h.biz.GetNewsSummaries(c.Request().Context(), category, page, pageSize)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error": "Failed to fetch news summaries",
		})
	}

	totalPages := (total + pageSize - 1) / pageSize

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": summaries,
		"pagination": map[string]interface{}{
			"current_page": page,
			"page_size":    pageSize,
			"total":        total,
			"total_pages":  totalPages,
		},
	})
}

// GetNewsSummaryByID godoc
// @Summary Get news summary by ID
// @Description Get a single news summary with its source articles
// @Tags news
// @Accept json
// @Produce json
// @Param id path string true "Summary ID"
// @Success 200 {object} entity.NewsSummaryWithSources
// @Router /news/summaries/{id} [get]
func (h *HTTPHandler) GetNewsSummaryByID(c echo.Context) error {
	id := c.Param("id")

	summary, err := h.biz.GetNewsSummaryByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": "News summary not found",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": summary,
	})
}

// RegisterRoutes registers all news routes
func (h *HTTPHandler) RegisterRoutes(g *echo.Group) {
	news := g.Group("/news")
	{
		news.GET("/summaries", h.GetNewsSummaries)
		news.GET("/summaries/:id", h.GetNewsSummaryByID)
	}
}
