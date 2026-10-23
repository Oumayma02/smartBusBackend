# SmartBus Kubernetes Deployment

This directory contains Kubernetes manifests for the SmartBus application.

Deployment plan:
- Backend Deployment and Service
- MongoDB StatefulSet and persistent storage
- Kubernetes Secrets and ConfigMaps
- Resource requests and limits
- Readiness and liveness probes
- Horizontal Pod Autoscaler
- Ingress and HTTPS

The existing Docker Compose deployment and MongoDB data must remain intact
until the Kubernetes deployment has been validated.
