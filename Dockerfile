FROM node:21.7.3
WORKDIR /code
COPY package.json .
RUN yarn install
COPY . .
EXPOSE 3000
CMD ['yarn', 'build', '&&', 'yarn', 'serve']