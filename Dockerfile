FROM oven/bun:alpine AS base

WORKDIR /app

COPY package.json bun.lock ./

FROM base AS dependencies

# Install all dependencies (including dev) for building.
RUN bun install --frozen-lockfile

FROM base AS prod-dependencies

# Install production-only dependencies for the release image.
RUN bun install --frozen-lockfile --production

FROM base AS builder

# Copy only the necessary files for building the application.
COPY --from=dependencies /app/node_modules ./node_modules

# Copy the rest of the application source code.
COPY . .

# Build the application (webpack bundles dist/main.js and resolves @ aliases).
RUN bun run build

FROM base AS release

WORKDIR /app

# Copy production dependencies, the webpack bundle, and proto assets.
COPY --from=prod-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

# Use a non-privileged user for security.
# Bun image already includes user "bun", so we switch to it.
USER bun

# Expose the desired port.
EXPOSE ${PORT}

# Start the application.
CMD ["bun", "run", "dist/main.js"]
