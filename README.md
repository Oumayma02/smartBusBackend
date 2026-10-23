# SmartBus — Intelligent Public Transport System

SmartBus is an intelligent public transport system designed to manage and track transportation services in real time. It uses modern web technologies, including Node.js, Express.js, MongoDB, and containerization, to provide an efficient and scalable backend.

This repository also implements a DevOps delivery workflow using GitHub Actions, Jenkins, Docker Compose, and Kubernetes (K3s).

## Features

### Application
- **Real-Time Tracking:** Live updates of vehicle locations and trip statuses.
- **Agency Management:** Creation and management of transport agencies.
- **Route and Trip Management:** Management of routes, trips, stops, and schedules.
- **User Management:** Agency-based users and JWT authentication.
- **Superadmin Functionality:** Default superadmin account creation during initialization.
- **Scalable Data Storage:** MongoDB for application data.
- **Web Interface:** Application interface for transport management.

### DevOps
- Automated CI using GitHub Actions.
- Docker image build, validation, and security scanning.
- Container image publication to GitHub Container Registry (GHCR).
- Jenkins-based production deployment with manual approval.
- Docker Compose and Kubernetes deployment targets.
- MongoDB authentication and Kubernetes Secrets.
- Health checks, deployment verification, and rollback support.

## Architecture

```text
Developer
   |
   v
GitHub Repository (main)
   |
   v
GitHub Actions CI
   |-- Tests and validation
   |-- Docker image build and scan
   |-- Publish image to GHCR
   |
   v
Jenkins: SmartBus-Production-Deploy
   |-- Validate main commit
   |-- Verify successful GitHub CI
   |-- Manual deployment approval
   |
   +---------------------+
   |                     |
   v                     v
Docker Compose         Kubernetes (K3s)
   |                     |
Backend + MongoDB      Backend Deployment
                       MongoDB StatefulSet
                       Service + Ingress
   |                     |
   +----------+----------+
              |
              v
        Health verification
```

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Node.js and Express.js |
| Database | MongoDB |
| Containerization | Docker and Docker Compose |
| CI | GitHub Actions |
| CD | Jenkins |
| Container Registry | GitHub Container Registry (GHCR) |
| Orchestration | Kubernetes (K3s) |
| Ingress | Traefik |
| Persistent storage | Kubernetes PersistentVolumeClaim |

## Repository Structure

```text
smartBusBackend/
├── .github/
│   └── workflows/
│       └── ci.yml
├── k8s/
│   ├── README.md
│   ├── backend-config.yaml
│   ├── backend-ingress.yaml
│   ├── backend.yaml
│   └── mongo.yaml
├── docker-compose.yml
├── Dockerfile
├── Jenkinsfile
└── ...
```

The application source code, configuration, and tests are stored in the other repository directories.

## Prerequisites

For local container execution:
- Git
- Docker Engine
- Docker Compose

For the full DevOps workflow:
- A GitHub repository and GitHub Actions access
- A Jenkins instance with Git, SSH, `curl`, and `jq`
- A GHCR package for the backend image
- A Linux deployment host with Docker Compose
- A Kubernetes cluster with `kubectl`, Traefik, and persistent storage
- Configured GitHub and Jenkins credentials

## Installation and Local Development

### 1. Clone the repository

```bash
git clone https://github.com/Oumayma02/smartBusBackend.git
cd smartBusBackend
```

### 2. Configure environment variables

Configure the required application and database settings using your local environment files.

For the production Docker Compose deployment, the deployment script uses:

```text
/home/oumayma/projects/smartBusBackend/.env.mongo
```

The file must contain the required MongoDB application credentials:

- `MONGO_APP_USERNAME`
- `MONGO_APP_PASSWORD`

Keep environment files out of Git. Never commit passwords, access tokens, private keys, or other credentials.

### 3. Validate Docker Compose configuration

From the project directory, run:

```bash
docker compose \
  --project-name smartbusbackend \
  --project-directory "$PWD" \
  --env-file "$PWD/.env.mongo" \
  config --quiet
```

This validates the Compose configuration without starting or recreating containers.

### 4. Start the application

Only after confirming the correct local environment configuration, start the stack:

```bash
docker compose \
  --project-name smartbusbackend \
  --env-file "$PWD/.env.mongo" \
  up -d
```

Check the running containers:

```bash
docker compose ps
```

**Production caution:** The commands above are for an environment where you intentionally manage the Compose stack. On the production host, use the configured deployment workflow rather than manually recreating production services.

## Continuous Integration — GitHub Actions

The workflow is defined in `.github/workflows/ci.yml`.

The CI pipeline is responsible for validating application changes before deployment. Depending on the configured workflow, its steps include:

1. Check out the source code.
2. Set up Node.js.
3. Install dependencies.
4. Run tests and code validation.
5. Validate the Dockerfile.
6. Scan the Docker image with Trivy.
7. Publish the image to GHCR.
8. Start the integration-test stack.
9. Verify MongoDB and the application health endpoint.
10. Stop the temporary integration-test stack.
11. Deploy through the configured self-hosted runner job, when applicable.

The Jenkins pipeline independently verifies that GitHub Actions completed successfully for the exact commit before permitting deployment.

## Continuous Delivery — Jenkins

The Jenkins job is named:

```text
SmartBus-Production-Deploy
```

Its pipeline is defined in the repository's `Jenkinsfile`.

### Pipeline stages

1. **Validate branch:** Ensure the checked-out commit matches the current `origin/main` commit.
2. **Wait for successful GitHub CI:** Query the GitHub Actions API and wait for a successful CI run for the exact commit.
3. **Deployment approval:** Require manual approval before production deployment.
4. **Deploy target:** Execute the restricted deployment command for the selected target.
5. **Post actions:** Report the pipeline result.

### Select a deployment target

Use **Build with Parameters** in Jenkins and select `DEPLOY_TARGET`.

| Parameter | Deployment target |
|---|---|
| `compose` | Docker Compose production deployment |
| `kubernetes` | Kubernetes backend deployment |

The pipeline connects to the deployment host over SSH using a dedicated restricted deployment account. The SSH wrapper accepts only the approved deployment commands and validates the commit SHA.

### Security controls

- Jenkins credentials store the GitHub Actions read token.
- SSH uses a dedicated deployment key and strict host-key checking.
- The remote deployment account is restricted to approved deployment commands.
- MongoDB credentials are supplied through environment configuration or Kubernetes Secrets.
- Deployment approval is required before the deployment stage.

Do not store credentials directly in the Jenkinsfile or commit secret files.

## Docker Compose Deployment

The production deployment script is located at:

```text
/opt/smartbus-deploy/deploy.sh
```

It accepts a full 40-character Git commit SHA and performs validation before deploying the corresponding image from GHCR.

The script:
- Validates the requested commit SHA.
- Loads the configured `.env.mongo` file.
- Validates the resolved Compose configuration.
- Pulls the requested image.
- Recreates the backend container.
- Checks application health.
- Attempts to restore the previous image if deployment verification fails.

The deployment script and its environment file are managed on the deployment host, not committed as part of this repository.

## Kubernetes Deployment

The Kubernetes manifests are stored in `k8s/`.

| File | Purpose |
|---|---|
| `backend-config.yaml` | Backend runtime configuration |
| `backend.yaml` | Backend Deployment and Service |
| `backend-ingress.yaml` | Traefik ingress and HTTPS routing |
| `mongo.yaml` | MongoDB StatefulSet, headless Service, and persistent storage |
| `README.md` | Kubernetes-specific documentation |

The application is deployed in the `smartbus` namespace.

The backend uses a Kubernetes Secret named `smartbus-backend-mongo-uri` for its MongoDB connection URI. MongoDB uses `smartbus-mongo-auth` for its initialization credentials. HTTPS ingress uses the `smartbus-tls` Secret.

These Secrets must be provisioned securely in the cluster before deploying the workloads. Their values must not be stored in Git.

### Validate manifests

```bash
kubectl apply --dry-run=client -f k8s/
```

This performs client-side validation. It does not replace testing against the cluster.

### Check deployment status

```bash
kubectl -n smartbus get deployment,service,statefulset,ingress
```

Check the backend rollout:

```bash
kubectl -n smartbus rollout status deployment/smartbus-backend
```

Check the MongoDB StatefulSet:

```bash
kubectl -n smartbus rollout status statefulset/smartbus-mongo
```

### Verify application health

From a machine that can resolve `smartbus.local` to the Kubernetes host:

```bash
curl -k -sS https://smartbus.local/api/health
```

Expected response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

The `-k` option bypasses TLS certificate verification and is appropriate only for this configured self-signed certificate test. For normal production clients, configure a trusted certificate and validate it.

### Kubernetes rollback

The restricted deployment command is:

```text
deploy-k8s <40-character-commit-sha>
```

The host-side deployment script updates the backend image, waits for rollout completion, verifies application health, and attempts to restore the previous image if verification fails.

The Compose and Kubernetes environments have separate runtime resources. Do not delete Compose volumes or MongoDB data when testing Kubernetes deployments.

## Monitoring and Troubleshooting

### GitHub Actions fails

- Inspect the failed workflow step.
- Check dependency installation, tests, image build, and image scanning.
- Confirm GHCR authentication and package permissions.

### Jenkins waits for CI

- Confirm that the exact commit has a successful push-triggered run for `main`.
- Check the Jenkins credential `github-actions-read-token`.
- Inspect the Jenkins console output for GitHub API errors.

### Docker Compose cannot resolve MongoDB variables

Validate using the deployment environment file:

```bash
docker compose \
  --project-name smartbusbackend \
  --env-file /home/oumayma/projects/smartBusBackend/.env.mongo \
  config --quiet
```

Do not print or publish the environment file when troubleshooting.

### Kubernetes rollout fails

```bash
kubectl -n smartbus get pods
kubectl -n smartbus describe deployment smartbus-backend
kubectl -n smartbus logs deployment/smartbus-backend
```

Check pod events, Secret references, image availability, resource limits, database connectivity, and readiness probes.

### Health check fails

Check the backend logs and database connectivity first. The deployment script should report whether it was able to restore the previous image after a failed deployment.

## Verified Deployment Status

The following deployment checks were completed during project development:

- GitHub Actions CI succeeded for the deployed commit.
- Jenkins validated the `main` branch commit and enforced manual approval.
- Docker Compose deployment completed successfully and returned a healthy application response.
- Kubernetes deployment completed successfully.
- The Kubernetes backend rollout reported success.
- The application health endpoint returned `status: ok` and `database: connected`.
- The Kubernetes manifests passed a client-side dry run.

These results describe the tested configuration at the time of validation; future changes should be tested again before production deployment.

## License

Add the project's applicable license and attribution information here.
