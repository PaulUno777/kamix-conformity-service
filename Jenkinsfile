pipeline {
  agent any
  stages {
    stage('Checkout Code') {
      steps {
        git(url: 'https://github.com/PaulUno777/kamix-conformity-service.git', branch: 'master')
      }
    }

    stage('Set env variable') {
      environment {
        API_KEY = '\'ba21e71a01f7486cbc73ad5c18e346f9\''
        BASE_MC_URL = '\'https://api.membercheck.com/api/v2\''
        API_PUBLIC_URL = '\'http://sandbox.kamix.io:3800/api/conformity/download/\''
        UPLOAD_LOCATION = '\'./public/\''
      }
      steps {
        sh 'touch .env;'
        sh '''echo API_KEY=${API_KEY} >> .env;
echo BASE_MC_URL=${BASE_MC_URL} >> .env;
echo API_PUBLIC_URL=${API_PUBLIC_URL} >> .env;
echo UPLOAD_LOCATION=${UPLOAD_LOCATION} >> .env;'''
        sh 'ls -la'
        sh 'cat .env'
      }
    }

    stage('Build app') {
      parallel {
        stage('Build app') {
          steps {
            sh 'docker build -t unoteck/kamix-membercheck-service .'
          }
        }

        stage('Log into Dockerhub') {
          environment {
            DOCKER_USER = 'unoteck'
            DOCKER_PASSWORD = 'David.lock#2023'
          }
          steps {
            sh 'docker login -u $DOCKER_USER -p $DOCKER_PASSWORD'
          }
        }

      }
    }

    stage('Deploy app') {
      steps {
        sh 'docker push unoteck/kamix-membercheck-service:latest'
      }
    }

    stage('Start app') {
      steps {
        sh 'docker rm --force --volumes kamix-membercheck-service'
        sh 'docker compose up --wait'
      }
    }

    stage('Get app logs') {
      steps {
        sh 'docker container logs kamix-membercheck-service'
      }
    }

  }
}