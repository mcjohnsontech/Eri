FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm typescript@5.9.3
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/connectors/package.json packages/connectors/
COPY packages/reconstruction/package.json packages/reconstruction/
COPY packages/policy/package.json packages/policy/
COPY packages/ai/package.json packages/ai/
COPY packages/executor/package.json packages/executor/
COPY packages/audit/package.json packages/audit/
COPY apps/gateway/package.json apps/gateway/
RUN pnpm install --frozen-lockfile --prod=false --shamefully-hoist
COPY packages/ packages/
COPY apps/gateway/ apps/gateway/
RUN tsc -p packages/core/tsconfig.json
RUN tsc -p apps/gateway/tsconfig.json
EXPOSE 3000
CMD ["node", "apps/gateway/dist/index.js"]
