package rest

import (
	"github.com/gin-gonic/gin"
	"github.com/samber/do"
)

type Business interface{}

type handler struct {
	biz Business
}

func NewAPI(i *do.Injector) (*handler, error) {
	biz, err := do.Invoke[Business](i)
	if err != nil {
		return nil, err
	}

	return &handler{
		biz: biz,
	}, nil
}

func (*handler) HelloWorld(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Hello World",
	})
}
