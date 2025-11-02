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

FROM alpine:latest
RUN apk add ca-certificates multirun
WORKDIR /app
COPY --from=builder /app/outbox ./
COPY --from=builder /app/subscriber ./

EXPOSE 8087
# Run both outbox worker and payment subscriber using multirun
CMD ["multirun", "./outbox", "./subscriber"]