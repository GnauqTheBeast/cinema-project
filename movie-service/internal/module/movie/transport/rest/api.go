package rest

import (
	"github.com/gin-gonic/gin"
	"github.com/samber/do"
)

type Business interface{}

type api struct {
	biz Business
}

func NewAPI(i *do.Injector) (*api, error) {
	biz, err := do.Invoke[Business](i)
	if err != nil {
		return nil, err
	}

	return &api{
		biz: biz,
	}, nil
}

func (a *api) HelloWorld(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Hello World",
	})
}
