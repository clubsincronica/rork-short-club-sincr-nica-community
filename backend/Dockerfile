FROM node:18-alpine

WORKDIR /app

# Copy only backend package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy only backend source
COPY ./src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/server.js"]
