.PHONY: help dev build clean start-dev health test lint

PORT ?= 3000

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start the development environment
	./run-dev.sh

build: ## Build the UI and gateway
	npm run build --workspace=qstrike-ui --workspace=qws-gateway

clean: ## Clean build artifacts
	rm -rf ui/dist src/dist

start-dev: ## Start the UI for development
	cd ui && PORT=$(PORT) npm run dev

health: ## Check the health of the services
	@echo "Checking UI health..."
	@curl -s -o /dev/null -w "%{http_code}\n" http://localhost:$(PORT)/__health || echo "UI not running"
	@echo "Checking gateway health..."
	@curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/__health || echo "Gateway not running"

test: ## Run tests
	npm test

lint: ## Run linting
	npm run lint --workspace=qstrike-ui

.DEFAULT_GOAL := help