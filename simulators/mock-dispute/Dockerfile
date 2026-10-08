FROM node:20-alpine
WORKDIR /app
COPY simulators/mock-dispute/package.json package.json
RUN npm install
COPY simulators/mock-dispute/src src/
COPY simulators/mock-dispute/tsconfig.json ./
RUN npx tsc
EXPOSE 4004
CMD ["node", "dist/index.js"]
