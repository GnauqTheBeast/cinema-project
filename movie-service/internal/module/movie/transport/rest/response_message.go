package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type responseMessage struct {
	Message    string      `json:"message"`
	StatusCode int         `json:"status_code"`
	Data       interface{} `json:"data"`
}

// 200 OK
func responseSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, responseMessage{
		Message:    http.StatusText(http.StatusOK),
		StatusCode: http.StatusOK,
		Data:       data,
	})
}

// 201 Created
func responseCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, responseMessage{
		Message:    http.StatusText(http.StatusCreated),
		StatusCode: http.StatusCreated,
		Data:       data,
	})
}

// 202 Accepted
func responseAccepted(c *gin.Context, data interface{}) {
	c.JSON(http.StatusAccepted, responseMessage{
		Data:       data,
		StatusCode: http.StatusAccepted,
		Message:    http.StatusText(http.StatusAccepted),
	})
}

// 200 OK with custom message only (no data)
func responseSuccessWithMessage(c *gin.Context, message string) {
	c.JSON(http.StatusOK, responseMessage{
		Data:       nil,
		StatusCode: http.StatusOK,
		Message:    message,
	})
}

// 400 Bad Request
func responseBadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, responseMessage{
		Data:       nil,
		StatusCode: http.StatusBadRequest,
		Message:    message,
	})
}

// 400 Bad Request with error object
func responseBadRequestWithError(c *gin.Context, err error) {
	c.JSON(http.StatusBadRequest, responseMessage{
		Data:       nil,
		StatusCode: http.StatusBadRequest,
		Message:    err.Error(),
	})
}

// 500 Internal Server Error with error object
func responseError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, responseMessage{
		Data:       nil,
		StatusCode: http.StatusInternalServerError,
		Message:    err.Error(),
	})
}

// 500 Internal Server Error with custom message
func responseErrorWithMessage(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, responseMessage{
		Data:       nil,
		StatusCode: http.StatusInternalServerError,
		Message:    message,
	})
}

// 404 Not Found
func responseNotFound(c *gin.Context, err error) {
	c.JSON(http.StatusNotFound, responseMessage{
		Data:       nil,
		StatusCode: http.StatusNotFound,
		Message:    err.Error(),
	})
}

// 401 Unauthorized
func responseUnauthorized(c *gin.Context, err error) {
	c.JSON(http.StatusUnauthorized, responseMessage{
		Data:       nil,
		StatusCode: http.StatusUnauthorized,
		Message:    err.Error(),
	})
}

// 403 Forbidden
func responseForbidden(c *gin.Context, err error) {
	message := "forbidden"
	if err != nil {
		message = err.Error()
	}
	c.JSON(http.StatusForbidden, responseMessage{
		Data:       nil,
		StatusCode: http.StatusForbidden,
		Message:    message,
	})
}
