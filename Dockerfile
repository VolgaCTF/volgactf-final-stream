FROM node:18.8-alpine
WORKDIR /app
COPY VERSION package*.json server.js .
COPY lib ./lib
RUN apk add --no-cache --virtual .gyp python3 make g++ postgresql-dev && npm ci --production && apk del .gyp
CMD ["npm", "run", "start"]
