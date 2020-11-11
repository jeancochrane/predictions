FROM nikolaik/python-nodejs:latest

RUN mkdir /app
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . /app
