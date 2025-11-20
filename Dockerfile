
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY env .env
# COPY .env .env
##rename .env to env for deployment since not visible by windows

RUN npm install  

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["node", "dist/index.js"]
