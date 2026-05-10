# Makefile - wrapper de pnpm scripts para DX consistente.
# pnpm sigue siendo la fuente de verdad; este Makefile sólo expone los targets
# que esperan los agentes (`make help`, `make lint`, `make test`, ...).

SHELL := /bin/bash

.DEFAULT_GOAL := help

.PHONY: help install dev build test test-coverage test-e2e test-fuzz \
        lint typecheck validate clean secret-scan audit publint

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?##' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}{printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies (frozen lockfile)
	pnpm install --frozen-lockfile

dev: ## Run MCP inspector against build/index.js
	pnpm run dev

build: ## Compile TypeScript to build/
	pnpm run build

test: ## Run unit tests (vitest)
	pnpm run test

test-coverage: ## Run unit tests with coverage report
	pnpm run test:coverage

test-e2e: ## Run end-to-end suite (RUN_E2E=true)
	pnpm run test:e2e

test-fuzz: ## Run fuzz tests
	pnpm run test:fuzz

lint: ## Run ESLint with autofix
	pnpm run lint

typecheck: ## TypeScript type check (no emit)
	pnpm run typecheck

publint: ## Validate package.json publish metadata
	pnpm run publint

validate: ## Full validation: typecheck + lint + publint + test
	pnpm run validate

secret-scan: ## Scan staged changes for secrets (gitleaks)
	pnpm run secret-scan

audit: ## Security audit of dependencies
	pnpm run audit

clean: ## Remove build/ and coverage/ artifacts
	pnpm run clean
