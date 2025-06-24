package handlers

import (
	"net/http"

	"github.com/labstack/echo-contrib/pprof"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/samber/do"
)

type Config struct {
	Container *do.Injector
	Mode      string
	Origins   []string
}

func New(cfg *Config) (http.Handler, error) {
	r := echo.New()
	r.Pre(middleware.RemoveTrailingSlash())
	if cfg.Mode == "debug" {
		r.Debug = true
		pprof.Register(r)
	}

	r.IPExtractor = echo.ExtractIPFromXFFHeader()

	// TODO: check if JSONSerializer needed on http request
	/// r.JSONSerializer = httpx.SegmentJSONSerializer{}
	r.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "${time_rfc3339}\t${method}\t${uri}\t${status}\t${latency_human}\n",
	}))
	r.Use(middleware.Recover())
	cors := middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.Origins,
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
		MaxAge:           60 * 60,
	})
	r.Use(cors)

	r.GET("", Hello)

	routesAPIv1 := r.Group("/api/v1")
	{
		routesAPIv1.GET("", Hello)
		routesPool := routesAPIv1.Group("/pool")
		{
			p := groupPool{cfg.Container}
			routesPool.GET("/details/:chain/:pool", p.GetPool)
			routesPool.GET("/list", p.GetPoolsByFilters)

			c := groupCandle{cfg.Container}
			routesPool.GET("/candles/:dex/:chain/:pool/:interval/latest", c.GetLatestCandles)
			routesPool.GET("/candles/:dex/:chain/:pool/:interval/:timeframe", c.GetCandlesByTimeFrame)

			e := groupEvents{cfg.Container}
			routesPool.GET("/events/:chain/:pool", e.ShowEvents)
		}
	}

	groupWebSocket := NewGroupWebSocket(cfg.Container)
	r.GET("/ws", groupWebSocket.WebSocketHandler)

	return r, nil
}

func Hello(c echo.Context) error {
	return httpx.RestAbort(c, "Hello, world!", nil)
}
