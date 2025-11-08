package rest

import (
	"net/http"
	"strconv"

	"movie-service/internal/module/news/business"
	"movie-service/internal/module/news/repository"

	"github.com/gin-gonic/gin"
	"github.com/samber/do"
	"github.com/uptrace/bun"
)

type API struct {
	biz business.NewsBusiness
}

func NewAPI(i *do.Injector) (*API, error) {
	db, err := do.Invoke[*bun.DB](i)
	if err != nil {
		return nil, err
	}

	repo := repository.NewNewsRepository(db)
	biz := business.NewNewsBusiness(repo)

	return &API{biz: biz}, nil
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
func (a *API) GetNewsSummaries(c *gin.Context) {
	category := c.DefaultQuery("category", "all")

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if err != nil || pageSize < 1 || pageSize > 50 {
		pageSize = 10
	}

	summaries, total, err := a.biz.GetNewsSummaries(c.Request.Context(), category, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch news summaries",
		})
		return
	}

	totalPages := (total + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, gin.H{
		"data": summaries,
		"pagination": gin.H{
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
// @Success 200 {object} map[string]interface{}
// @Router /news/summaries/{id} [get]
func (a *API) GetNewsSummaryByID(c *gin.Context) {
	id := c.Param("id")

	summary, err := a.biz.GetNewsSummaryByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "News summary not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": summary,
	})
}
