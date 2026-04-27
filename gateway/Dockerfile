# syntax=docker/dockerfile:1.6
# ─────────────────────────────────────────────────────────────
# DITO Gateway — multi-stage Rust build
# Stage 1 builds a release binary with cached dependencies.
# Stage 2 ships only the binary + certs on a slim runtime image.
# ─────────────────────────────────────────────────────────────

FROM rust:1.85-slim-bookworm AS builder
WORKDIR /build

# System deps required for reqwest (rustls / native-tls)
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Pre-cache dependency build
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs \
  && cargo build --release \
  && rm -rf src target/release/deps/dito_gateway*

# Real build
COPY src ./src
RUN cargo build --release

# ─────────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/release/dito-gateway /usr/local/bin/dito-gateway

ENV RUST_LOG=info
ENV PORT=8080
EXPOSE 8080

CMD ["/usr/local/bin/dito-gateway"]
