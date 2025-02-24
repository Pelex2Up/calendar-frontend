FROM node:21.7.3 AS build
WORKDIR /code
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
EXPOSE 3000
CMD ['yarn', 'build', '&&', 'yarn', 'serve']