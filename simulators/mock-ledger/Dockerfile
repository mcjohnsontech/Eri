FROM node:20-alpine
WORKDIR /app
COPY simulators/mock-ledger/package.json package.json
RUN npm install
COPY simulators/mock-ledger/src src/
COPY simulators/mock-ledger/tsconfig.json ./
RUN npx tsc
EXPOSE 4001
CMD ["node", "dist/index.js"]
