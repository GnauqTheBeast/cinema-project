package rest

import (
	"net/http"

	"payment-service/internal/module/payment/business"
	"payment-service/internal/module/payment/entity"

	"github.com/gin-gonic/gin"
	"github.com/samber/do"
)

type handler struct {
	paymentBiz business.PaymentBiz
}

func NewAPI(i *do.Injector) (*handler, error) {
	paymentBiz, err := do.Invoke[business.PaymentBiz](i)
	if err != nil {
		return nil, err
	}

	return &handler{
		paymentBiz: paymentBiz,
	}, nil
}

func (h *handler) SePayWebhook(c *gin.Context) {
	webhook := new(entity.SePayWebhook)
	if err := c.ShouldBindJSON(webhook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid webhook payload",
		})
		return
	}

	// Validate required fields
	if webhook.Id == 0 || webhook.Gateway == "" || webhook.TransferAmount == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing required fields",
		})
		return
	}

	// Process webhook
	err := h.paymentBiz.ProcessSePayWebhook(c.Request.Context(), webhook)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process webhook",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
	})
}
