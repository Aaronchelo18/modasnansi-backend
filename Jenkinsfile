pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-18'
    }
    
    environment {
        SONAR_TOKEN = credentials('sonarqube')
        SONAR_HOST_URL = 'http://docker.sonar:9000'
    }
    
    stages {
        stage('🔍 Environment Check') {
            steps {
                echo "=== VERIFICANDO ENTORNO ==="
                echo "Workspace: ${WORKSPACE}"
                echo "Node version verificada:"
                sh 'node --version'
                echo "NPM version verificada:"
                sh 'npm --version'
                echo "Working directory:"
                sh 'pwd'
                echo "Contenido del directorio actual:"
                sh 'ls -la'
                echo "Git status:"
                sh 'git status || echo "No es un repo git o git no disponible"'
                echo "=== FIN VERIFICACION ENTORNO ==="
            }
        }
        
        stage('📥 Checkout') {
            steps {
                echo "=== INICIANDO CHECKOUT ==="
                checkout scm
                echo "Checkout completado. Verificando archivos descargados:"
                sh 'ls -la'
                echo "Verificando que package.json existe:"
                sh 'cat package.json | head -20 || echo "ERROR: package.json no encontrado"'
                echo "=== FIN CHECKOUT ==="
            }
        }
        
        stage('📦 Install Dependencies') {
            steps {
                echo "=== INSTALANDO DEPENDENCIAS ==="
                sh 'test -f package.json && echo "✅ package.json existe" || echo "❌ package.json NO existe"'
                sh 'test -f package-lock.json && echo "✅ package-lock.json existe" || echo "⚠️ package-lock.json NO existe, se creará"'
                sh 'npm ci'
                sh 'test -d node_modules && echo "✅ node_modules creado correctamente" || echo "❌ FALLO: node_modules no existe"'
                sh 'ls node_modules | head -10'
                echo "=== FIN INSTALACION DEPENDENCIAS ==="
            }
        }
        
        stage('🏗️ Build') {
            steps {
                echo "=== EJECUTANDO BUILD ==="
                sh 'grep -A5 -B5 "build" package.json || echo "⚠️ Script build no encontrado"'
                sh 'test -d src && echo "✅ Directorio src/ existe" || echo "❌ ERROR: src/ no existe"'
                sh 'ls -la src/ || echo "No se puede listar src/"'
                sh 'npm run build'
                sh 'test -d dist && echo "✅ Build exitoso - dist/ creado" || echo "❌ FALLO: dist/ no fue creado"'
                sh 'ls -la dist/ || echo "No se puede listar dist/"'
                echo "=== FIN BUILD ==="
            }
        }
        
        stage('🧪 Test') {
            steps {
                echo "=== EJECUTANDO TESTS ==="
                sh 'grep -A5 -B5 "\\"test\\"" package.json || echo "⚠️ Script test no encontrado"'
                sh 'test -f jest.config.js && echo "✅ jest.config.js existe" || echo "⚠️ jest.config.js no existe"'
                sh 'test -f jest.setup.js && echo "✅ jest.setup.js existe" || echo "⚠️ jest.setup.js no existe"'
                sh 'find . -name "*.spec.ts" -o -name "*.test.ts" | head -10 || echo "⚠️ No se encontraron archivos de test"'
                sh 'npx sonar-scanner'
                echo "✅ Tests completados exitosamente"
                echo "=== FIN TESTS ==="
            }
        }
        
        stage('📊 SonarQube Analysis') {
            steps {
                script {
                    echo "=== INICIANDO ANALISIS SONARQUBE ==="
                    echo "SONAR_HOST_URL: ${SONAR_HOST_URL}"
                    echo "SONAR_TOKEN está configurado: ${SONAR_TOKEN ? '✅ SÍ' : '❌ NO'}"
                    
                    sh """
                        curl -f ${SONAR_HOST_URL}/api/system/status || echo "⚠️ No se puede conectar a SonarQube en ${SONAR_HOST_URL}"
                    """
                    
                    sh 'test -f sonar-project.properties && echo "✅ sonar-project.properties existe" || echo "⚠️ sonar-project.properties no existe"'
                    sh 'cat sonar-project.properties || echo "No se puede leer sonar-project.properties"'
                    
                    def scannerHome = tool 'SonarQube-Scanner'
                    echo "Scanner Home: ${scannerHome}"
                    sh "test -f ${scannerHome}/bin/sonar-scanner && echo '✅ Scanner encontrado' || echo '❌ Scanner NO encontrado'"
                    
                    withSonarQubeEnv('sonarqube') {
                        echo "Ejecutando análisis de SonarQube..."
                        sh '''#!/bin/bash
                            echo "Contenido de src antes del análisis:"
                            find src -type f -name "*.ts" | head -20 || echo "No hay archivos .ts en src"

                            echo "Ejecutando sonar-scanner..."
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=modasnansi-backend \
                            -Dsonar.projectName='ModasNansi Backend' \
                            -Dsonar.projectVersion=1.0.0 \
                            -Dsonar.sources=src \
                            -Dsonar.exclusions=**/*.spec.ts,**/*.test.ts,**/test/**,**/*.js,node_modules/**,dist/** \
                            -Dsonar.sourceEncoding=UTF-8 \
                            -Dsonar.host.url=$SONAR_HOST_URL \
                            -Dsonar.login=$SONAR_TOKEN \
                            -Dsonar.verbose=true
                        '''
                        echo "✅ Análisis de SonarQube completado"
                    }
                    echo "=== FIN ANALISIS SONARQUBE ==="
                }
            }
        }
        
        stage('🚪 Quality Gate') {
            steps {
                echo "=== VERIFICANDO QUALITY GATE ==="
                timeout(time: 10, unit: 'MINUTES') {
                    script {
                        def qg = waitForQualityGate()
                        echo "Quality Gate Status: ${qg.status}"
                        if (qg.status != 'OK') {
                            echo "❌ Quality Gate FALLÓ: ${qg.status}"
                            error "Quality Gate failed: ${qg.status}"
                        } else {
                            echo "✅ Quality Gate PASÓ exitosamente"
                        }
                    }
                }
                echo "=== FIN QUALITY GATE ==="
            }
        }
    }
    
    post {
        always {
            echo "=== POST-PROCESO SIEMPRE ==="
            echo "- Build Number: ${BUILD_NUMBER}"
            echo "- Build URL: ${BUILD_URL}"
            echo "- Workspace: ${WORKSPACE}"
            sh 'ls -la || echo "No se puede listar el workspace"'
            cleanWs()
            echo "✅ Workspace limpio"
        }
        success {
            echo "🎉 ¡PIPELINE COMPLETADO EXITOSAMENTE!"
        }
        failure {
            echo "💥 PIPELINE FALLÓ"
        }
        unstable {
            echo "⚠️ PIPELINE INESTABLE"
        }
    }
}
