FROM node:20-slim

WORKDIR /app

# Setup build tools for native dependencies (e.g., better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package.json files first to leverage Docker cache
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy the rest of the source code
COPY . .

# Build the React client
RUN cd client && npm run build

# Expose the server port that will be used
EXPOSE 3001

# Run the user's requested script
CMD ["node", "server/src/index.js"]
