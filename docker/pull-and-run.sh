docker pull localhost:5000/jpet-care-register-ha-app:latest
docker pull localhost:5000/jpet-care-register-hm-app:latest

docker-compose -f docker-compose.yaml up -d jpet-care-register-app
