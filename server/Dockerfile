# Use an official lightweight Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
# This leverages Docker cache to avoid re-installing dependencies if code changes
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port your Express app runs on
EXPOSE 3002

# Command to start the server
CMD ["npm", "start"]
