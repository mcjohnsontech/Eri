FROM node:20-alpine
WORKDIR /app
COPY simulators/scenario-generator/package.json package.json
RUN npm install
COPY simulators/scenario-generator/src src/
COPY simulators/scenario-generator/tsconfig.json ./
RUN npx tsc
CMD ["node", "dist/index.js"]
