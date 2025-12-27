FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./

# Install dependencies.
RUN bun install --frozen-lockfile

COPY . .

# Build the application.
RUN bun run build

FROM oven/bun:1-alpine

WORKDIR /app

# Copy only production dependencies.
COPY --from=builder /app/node_modules ./node_modules

# Copy built JavaScript files.
COPY --from=builder /app/dist ./dist

# Use a non-privileged user for security.
# Bun image already includes user "bun", so we switch to it.
USER bun

# Environment configuration.
ENV NODE_ENV=production

# Expose the desired port.
EXPOSE 3000

# Start the application.
CMD ["bun", "run", "start:prod"]
