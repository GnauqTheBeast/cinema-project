FROM golang:1.24-alpine AS builder
RUN apk update && apk add openssh-client gcc g++ musl-dev git
WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/root/go/pkg/mod go mod download
COPY . ./
RUN --mount=type=cache,target=/root/.cache/go-build go build -ldflags "-s -w" -trimpath -o main ./cmd/*.go

FROM alpine:latest
RUN apk add ca-certificates multirun
WORKDIR /app
COPY --from=builder /app/. ./
EXPOSE 8083
EXPOSE 50051
CMD ["multirun", "./main api", "./main rpc"]