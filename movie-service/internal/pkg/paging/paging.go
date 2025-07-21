package paging

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

const (
	defaultQueryPage     = "1"
	defaultQueryPageSize = "5"
)

type Paging struct {
	Limit  int
	Offset int
}

func GetQueryPaging(c *gin.Context) *Paging {
	page := stringToInt(c.DefaultQuery("page", defaultQueryPage))
	size := stringToInt(c.DefaultQuery("size", defaultQueryPageSize))
	return &Paging{
		Limit:  size,
		Offset: (page - 1) * size,
	}
}

func stringToInt(s string) int {
	i, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return i
}
