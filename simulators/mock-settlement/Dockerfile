FROM node:20-alpine
WORKDIR /app
COPY simulators/mock-settlement/package.json package.json
RUN npm install
COPY simulators/mock-settlement/src src/
COPY simulators/mock-settlement/tsconfig.json ./
RUN npx tsc
EXPOSE 4003
CMD ["node", "dist/index.js"]
