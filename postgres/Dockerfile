# PostgreSQL with TimescaleDB and pgvector extension dockerfile
FROM timescale/timescaledb:2.18.0-pg17
# Install build tools, including clang, llvm, make, and other dependencies
RUN apk add --no-cache \
    git \
    build-base \
    clang \
    llvm19 \
    postgresql-dev \
    musl-dev \
    make \
    libxml2-dev \
    && apk add --no-cache --virtual .build-deps gcc libc-dev

# Clone and install pgvector
RUN git clone https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make && make install && \
    cd .. && rm -rf pgvector

# Clean up build dependencies
RUN apk del .build-deps