# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install the dependencies
RUN yarn install --production

# Copy the rest of the application code
COPY . .

# Expose the port that the application will run on
EXPOSE 3000

# Command to start the application
CMD ["node", "server.js"]
