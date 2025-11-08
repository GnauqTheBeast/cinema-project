FROM golang:1.24-alpine AS builder
RUN apk update && apk add openssh-client gcc g++ musl-dev git
WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/root/go/pkg/mod go mod download
COPY . ./
# Build outbox worker
RUN --mount=type=cache,target=/root/.cache/go-build go build -ldflags "-s -w" -trimpath -o outbox cmd/outbox/*.go
# Build payment subscriber
RUN --mount=type=cache,target=/root/.cache/go-build go build -ldflags "-s -w" -trimpath -o subscriber cmd/subscriber/*.go
# Build news crawler
RUN --mount=type=cache,target=/root/.cache/go-build go build -ldflags "-s -w" -trimpath -o crawl cmd/crawl/*.go
# Build news summarization worker
RUN --mount=type=cache,target=/root/.cache/go-build go build -ldflags "-s -w" -trimpath -o summarize cmd/summarize/*.go

FROM alpine:latest
RUN apk add ca-certificates multirun
WORKDIR /app
COPY --from=builder /app/outbox ./
COPY --from=builder /app/subscriber ./
COPY --from=builder /app/crawl ./
COPY --from=builder /app/summarize ./

EXPOSE 8087
# Run all workers using multirun
# outbox: Process outbox events
# subscriber: Subscribe to payment events
# crawl: Crawl news articles from RSS feeds
# summarize: Summarize news articles using Gemini AI
CMD ["multirun", "./outbox", "./subscriber", "./crawl", "./summarize"]