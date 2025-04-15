VOLUMES_FOLDER = /root/ft_transcendence/srcs/volumes

all: up
	@cat ./utils/ascii.txt

up: build
	docker-compose -f ./srcs/docker-compose.yml up -d

down:
	docker-compose -f ./srcs/docker-compose.yml down

stop:
	docker-compose -f ./srcs/docker-compose.yml stop

start:
	docker-compose -f ./srcs/docker-compose.yml up start

build:
	@mkdir -p $(VOLUMES_FOLDER)
	@mkdir -p $(VOLUMES_FOLDER)/truffle_volume
	@mkdir -p $(VOLUMES_FOLDER)/blockchain_volume
	@mkdir -p $(VOLUMES_FOLDER)/postgresql_data
	@mkdir -p $(VOLUMES_FOLDER)/prometheus_data
	@mkdir -p $(VOLUMES_FOLDER)/grafana_data
	@mkdir -p ./srcs/services/nginx/logs
	docker-compose -f ./srcs/docker-compose.yml build

clean: stop
	docker ps -qa | xargs --no-run-if-empty docker rm
	docker images -qa | xargs --no-run-if-empty docker rmi -f
	@rm -rf ./utils/cookies.txt

fclean: stop
	docker-compose -f ./srcs/docker-compose.yml stop
	docker ps -qa | xargs --no-run-if-empty docker rm
	docker images -qa | xargs --no-run-if-empty docker rmi -f
	docker volume ls -q | xargs --no-run-if-empty docker volume rm
	docker network ls | grep "ft_transcendence" && docker network rm ft_transcendence || true

prune:
	docker system prune -a
	@rm -rf $(VOLUMES_FOLDER)
