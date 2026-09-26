FROM node:18-alpine

WORKDIR /app

# نصب dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy app
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
