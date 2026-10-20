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
        JENKINS_PROJECT_DIR = '/workspace/smartbus'
        HOST_PROJECT_DIR = '/home/oumayma/projects/smartBusBackend'
        COMPOSE_PROJECT = 'smartbusbackend'
        HEALTH_URL = 'http://172.17.0.1/api/health'
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
                                script: '''
                                    set -eu
                                    set +x
                                    curl --fail --silent --show-error --get \
                                      -H "Authorization: Bearer $GH_TOKEN" \
                                      -H "Accept: application/vnd.github+json" \
                                      --data-urlencode "head_sha=''' + sha + '''" \
                                      --data-urlencode "per_page=100" \
                                      "https://api.github.com/repos/$GH_OWNER/$GH_REPO/actions/workflows/ci.yml/runs"
                                ''',
                                returnStdout: true
                            ).trim()

                            def data = new groovy.json.JsonSlurperClassic()
                                .parseText(response)

                            if (!(data.workflow_runs instanceof List)) {
                                error('GitHub Actions API returned an unexpected response.')
                            }

                            def matchingRuns = data.workflow_runs.findAll {
                                it.head_sha == sha &&
                                it.event == 'push' &&
                                it.head_branch == 'main'
                            }

                            def run = matchingRuns.max { it.run_number ?: 0 }

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
                        input(
                            message: "Deploy validated commit ${sha} to production?",
                            ok: 'Deploy'
                        )
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

                    if (!(sha ==~ /[a-f0-9]{40}/)) {
                        error('Invalid Git commit SHA; refusing deployment.')
                    }

                    echo "Requesting restricted deployment for ${sha}"

                    sh """
                        set -eu
                        ssh \
                          -i /var/jenkins_home/.ssh/smartbus_deploy \
                          -o BatchMode=yes \
                          -o IdentitiesOnly=yes \
                          -o StrictHostKeyChecking=yes \
                          -o UserKnownHostsFile=/var/jenkins_home/.ssh/known_hosts \
                          smartbus-deploy@172.17.0.1 "deploy ${sha}"
                    """

                    echo "Host deployment script completed for ${sha}"
                }
            }
        }
    }
}
