.PHONY: restart logs test test-e2e

restart:
	sudo env ENVIRONMENT=sandbox DOCKER_SUFFIX=dev docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

logs:
	sudo env ENVIRONMENT=sandbox DOCKER_SUFFIX=dev docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f --tail 1000

test:
	sudo env ENVIRONMENT=sandbox DOCKER_SUFFIX=dev docker compose run --rm api npm run test

test-e2e:
	sudo env ENVIRONMENT=sandbox DOCKER_SUFFIX=dev docker compose run --rm api npm run test:e2e
