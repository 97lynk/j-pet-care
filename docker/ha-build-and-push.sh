cd ../

ENV_FILE="docker/.env"
if [ -f "${ENV_FILE}" ]; then
    # shellcheck source=docker/.env
    source "${ENV_FILE}"
fi

if [ -z "${REGISTRY_HOST_HA}" ]; then
    echo "Error: REGISTRY_HOST_HA is not set. Define it in docker/.env or as an environment variable."
    exit 1
fi

export registry_host=${REGISTRY_HOST_HA}
export tenant_id=ha
export image_name=jpet-care-register-${tenant_id}-app:latest

echo "Checking registry connection to ${registry_host}..."
if ! curl --connect-timeout 5 -s "http://${registry_host}/v2/" > /dev/null; then
    echo "Registry ${registry_host} is not reachable. Skipping build and push."
    exit 0
fi

echo "Building Docker image for tenant: ${tenant_id}..."
docker buildx build -f docker/Dockerfile \
--output type=docker \
--platform linux/amd64 \
--build-arg TENANT_ID=${tenant_id} \
-t 97lynk/${image_name} \
.

echo "Tagging image as ${registry_host}/${image_name}..."
docker tag 97lynk/${image_name} ${registry_host}/${image_name}

echo "Pushing image to registry..."
docker push ${registry_host}/${image_name}

echo "Build and push completed successfully."
