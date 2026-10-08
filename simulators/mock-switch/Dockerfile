FROM node:20-alpine
WORKDIR /app
COPY simulators/mock-switch/package.json package.json
RUN npm install
COPY simulators/mock-switch/src src/
COPY simulators/mock-switch/tsconfig.json ./
RUN npx tsc
EXPOSE 4002
CMD ["node", "dist/index.js"]
