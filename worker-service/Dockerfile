FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o outbox-worker ./cmd/outbox
RUN go build -o crawl-worker ./cmd/crawl

FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/outbox-worker .
COPY --from=builder /app/crawl-worker .

CMD ["./outbox-worker"]
