pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 35, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        GH_OWNER = 'Oumayma02'
        GH_REPO = 'smartBusBackend'
        IMAGE = 'ghcr.io/oumayma02/smartbusbackend'
        PROJECT_DIR = '/workspace/smartbus'
        COMPOSE_PROJECT = 'smartbusbackend'
    }

    stages {
        stage('Validate branch') {
            steps {
                sh '''
                    set -eu
                    git fetch origin main
                    HEAD_SHA=$(git rev-parse HEAD)
                    MAIN_SHA=$(git rev-parse FETCH_HEAD)

                    if [ "$HEAD_SHA" != "$MAIN_SHA" ]; then
                      echo "Refusing deployment: checkout is not the current origin/main commit."
                      exit 1
                    fi

                    echo "Validated main commit: $HEAD_SHA"
                '''
            }
        }

        stage('Wait for successful GitHub CI') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'github-actions-read-token',
                        variable: 'GH_TOKEN'
                    )
                ]) {
                    script {
                        def sha = sh(
                            script: 'git rev-parse HEAD',
                            returnStdout: true
                        ).trim()

                        def passed = false

                        for (int attempt = 0; attempt < 80; attempt++) {
                            def response = sh(
                                script: 'set -eu; set +x; curl --fail --silent --show-error --get -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" --data-urlencode "head_sha=' + sha + '" --data-urlencode "per_page=10" "https://api.github.com/repos/$GH_OWNER/$GH_REPO/actions/workflows/ci.yml/runs"',
                                returnStdout: true
                            ).trim()

                            def data = new groovy.json.JsonSlurperClassic()
                                .parseText(response)

                            if (!(data.workflow_runs instanceof List)) {
                                error('GitHub Actions API returned an unexpected response.')
                            }

                            def run = data.workflow_runs.find {
                                it.head_sha == sha &&
                                it.event == 'push' &&
                                it.head_branch == 'main'
                            }

                            if (run && run.status == 'completed') {
                                if (run.conclusion != 'success') {
                                    error("GitHub CI did not succeed for ${sha}.")
                                }

                                passed = true
                                echo "GitHub CI succeeded for ${sha}"
                                break
                            }

                            echo "Waiting for GitHub CI for ${sha} (attempt ${attempt + 1}/80)"
                            sleep(time: 15, unit: 'SECONDS')
                        }

                        if (!passed) {
                            error('Timed out waiting for successful GitHub CI.')
                        }
                    }
                }
            }
        }
        stage('Production approval') {
            steps {
                script {
                    def sha = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()

                    timeout(time: 10, unit: 'MINUTES') {
                        input message: "Deploy validated commit ${sha} to production?",
                              ok: 'Deploy'
                    }
                }
            }
        }

        stage('Deploy and verify') {
            steps {
                script {
                    def sha = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()

                    def previousImage = sh(
                        script: "docker inspect smartbusbackend-web-1 --format='{{.Config.Image}}'",
                        returnStdout: true
                    ).trim()

                    def previousTag = previousImage.substring(
                        previousImage.lastIndexOf(':') + 1
                    )

                    try {
                        sh """
                            set -eu
                            cd '${PROJECT_DIR}'

                            IMAGE_TAG='${sha}' docker compose \
                              --project-name '${COMPOSE_PROJECT}' \
                              --project-directory '${PROJECT_DIR}' \
                              --env-file '${PROJECT_DIR}/.env.mongo' \
                              pull web

                            IMAGE_TAG='${sha}' docker compose \
                              --project-name '${COMPOSE_PROJECT}' \
                              --project-directory '${PROJECT_DIR}' \
                              --env-file '${PROJECT_DIR}/.env.mongo' \
                              up -d --no-deps web
                        """

                        sh '''
                            set -eu
                            for attempt in $(seq 1 15); do
                              if curl --fail --silent --show-error \
                                  http://172.17.0.1/api/health; then
                                echo
                                exit 0
                              fi
                              sleep 4
                            done
                            echo "Application health check failed."
                            exit 1
                        '''

                        echo "Deployment succeeded for ${sha}"
                    } catch (err) {
                        echo "Deployment failed. Attempting rollback to ${previousTag}"

                        sh """
                            set -eu
                            IMAGE_TAG='${previousTag}' docker compose \
                              --project-name '${COMPOSE_PROJECT}' \
                              --project-directory '${PROJECT_DIR}' \
                              --env-file '${PROJECT_DIR}/.env.mongo' \
                              up -d --no-deps web
                        """

                        sh '''
                            curl --fail --silent --show-error \
                              --retry 10 --retry-delay 3 \
                              http://172.17.0.1/api/health
                        '''

                        error("Deployment failed; rollback was attempted. Original error: ${err}")
                    }
                }
            }
        }
    }
}
