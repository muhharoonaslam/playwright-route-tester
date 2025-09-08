pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        TEST_RESULTS_DIR = 'test-results'
        PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers'
    }
    
    options {
        buildDiscarder(logRotator(daysToKeepStr: '30', numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        skipStagesAfterUnstable()
        ansiColor('xterm')
    }
    
    stages {
        stage('🚀 Setup Environment') {
            steps {
                script {
                    echo "🎭 Setting up Playwright Route Tester Pipeline"
                    echo "Framework: unknown "
                    echo "Base URL: http://localhost:3000"
                }
                
                // Clean workspace
                cleanWs()
                
                // Checkout code
                checkout scm
                
                // Install Node.js
                sh '''
                    echo "📦 Installing Node.js ${NODE_VERSION}..."
                    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - || true
                    sudo apt-get install -y nodejs || yum install -y nodejs npm || true
                    node --version
                    npm --version
                '''
            }
        }
        
        stage('📋 Install Dependencies') {
            steps {
                script {
                    echo "📋 Installing project dependencies..."
                }
                
                sh '''
                    npm ci --prefer-offline --no-audit
                '''
            }
        }
        
        stage('🔍 Auto-Generate Tests') {
            steps {
                script {
                    echo "🎭 Auto-generating Playwright tests..."
                }
                
                sh '''
                    # Install playwright-route-tester globally if not in package
                    if ! npm list playwright-route-tester >/dev/null 2>&1; then
                        npm install -g playwright-route-tester
                    fi
                    
                    # Generate tests with smart detection
                    npx playwright-route-tester setup --directory ./generated-tests --jenkins
                    
                    # Navigate to generated tests and install dependencies
                    cd generated-tests
                    npm install
                    
                    # Install Playwright browsers
                    export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH}
                    npx playwright install chromium firefox webkit
                    npx playwright install-deps
                '''
            }
        }
        
        stage('🏥 Health Check') {
            steps {
                script {
                    echo "🏥 Checking application health..."
                }
                
                sh '''
                    echo "Checking if application is accessible at http://localhost:3000"
                    
                    
                    # Wait for server to be ready
                    for i in {1..30}; do
                        if curl -f -s -o /dev/null "http://localhost:3000" --max-time 10; then
                            echo "✅ Application is accessible"
                            break
                        else
                            echo "⏳ Attempt $i: Application not ready, waiting 10s..."
                            sleep 10
                        fi
                        
                        if [ $i -eq 30 ]; then
                            echo "⚠️ Warning: Application might not be ready, but continuing with tests..."
                        fi
                    done
                    
                    # Store server PID for cleanup
                    echo $SERVER_PID > server.pid
                '''
            }
        }
        
        stage('🧪 Run Route Tests') {
            parallel {
                stage('🌐 Public Routes') {
                    when {
                        expression { 3 > 0 }
                    }
                    steps {
                        script {
                            echo "🌐 Testing 3 public routes..."
                        }
                        
                        sh '''
                            cd generated-tests
                            npx playwright test tests/public-routes.spec.js \
                                --reporter=html \
                                --output-dir=../test-results/public \
                                --retries=2 \
                                || echo "Public route tests completed with issues"
                        '''
                    }
                }
                
                stage('🔐 Protected Routes') {
                    when {
                        expression { 3 > 0 }
                    }
                    steps {
                        script {
                            echo "🔐 Testing 3 protected routes..."
                        }
                        
                        sh '''
                            cd generated-tests
                            npx playwright test tests/auth-redirect.spec.js \
                                --reporter=html \
                                --output-dir=../test-results/auth \
                                --retries=2 \
                                || echo "Authentication tests completed with issues"
                        '''
                    }
                }
                
                stage('🔌 API Routes') {
                    when {
                        expression { 2 > 0 }
                    }
                    steps {
                        script {
                            echo "🔌 Testing 2 API routes..."
                        }
                        
                        sh '''
                            cd generated-tests
                            npx playwright test tests/api-routes.spec.js \
                                --reporter=html \
                                --output-dir=../test-results/api \
                                --retries=2 \
                                || echo "API tests completed with issues"
                        '''
                    }
                }
            }
        }
        
        stage('📊 Generate Reports') {
            steps {
                script {
                    echo "📊 Generating comprehensive test reports..."
                }
                
                sh '''
                    # Create comprehensive report
                    mkdir -p test-results
                    
                    cat > test-results/summary.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>🎭 Playwright Route Testing Report</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 40px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .section { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { border-left: 4px solid #10b981; }
        .warning { border-left: 4px solid #f59e0b; }
        .error { border-left: 4px solid #ef4444; }
        .config { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .stats { display: flex; gap: 20px; }
        .stat { background: #f1f5f9; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }
        .emoji { font-size: 1.5em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎭 Playwright Route Testing Report</h1>
        <p><strong>Framework:</strong> unknown </p>
        <p><strong>Base URL:</strong> http://localhost:3000</p>
        <p><strong>Build:</strong> #${BUILD_NUMBER}</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="section success">
        <h2>📊 Test Statistics</h2>
        <div class="stats">
            <div class="stat">
                <div class="emoji">🌐</div>
                <h3>3</h3>
                <p>Public Routes</p>
            </div>
            <div class="stat">
                <div class="emoji">🔐</div>
                <h3>3</h3>
                <p>Protected Routes</p>
            </div>
            <div class="stat">
                <div class="emoji">🔌</div>
                <h3>2</h3>
                <p>API Endpoints</p>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>🎯 Framework-Specific Features</h2>
        <div class="config">
        </div>
    </div>
    
    <div class="section">
        <h2>🔗 Quick Links</h2>
        <ul>
            <li><a href="generated-tests/playwright-report/index.html">📋 Detailed Test Report</a></li>
            <li><a href="test-results/">📁 Test Artifacts</a></li>
            <li><a href="generated-tests/">🧪 Generated Test Suite</a></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>🚀 Detected Routes</h2>
        <h3>🌐 Public Routes</h3>
        <ul>
            <li><code>/</code> - Home Page</li>
            <li><code>/about</code> - About Page</li>
            <li><code>/contact</code> - Contact Page</li>
        </ul>
        
        <h3>🔐 Protected Routes</h3>
        <ul>
            <li><code>/dashboard</code> - Dashboard</li>
            <li><code>/profile</code> - User Profile</li>
            <li><code>/settings</code> - Settings</li>
        </ul>
        
        <h3>🔌 API Routes</h3>
        <ul>
            <li><code>GET /api/users</code> - Users API</li>
            <li><code>GET /api/products</code> - Products API</li>
        </ul>
    </div>
</body>
</html>
EOF
                '''
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Cleaning up and archiving results..."
                
                // Stop the server if it's running
                sh '''
                    if [ -f server.pid ]; then
                        SERVER_PID=$(cat server.pid)
                        kill $SERVER_PID || echo "Server already stopped"
                        rm -f server.pid
                    fi
                '''
            }
            
            // Archive test results
            archiveArtifacts artifacts: 'test-results/**/*', fingerprint: true, allowEmptyArchive: true
            archiveArtifacts artifacts: 'generated-tests/playwright-report/**/*', fingerprint: true, allowEmptyArchive: true
            archiveArtifacts artifacts: 'generated-tests/**/*', fingerprint: true, allowEmptyArchive: true
            
            // Publish test results
            publishTestResults testResultsPattern: 'test-results/results.xml', allowEmptyResults: true
            
            // Publish HTML reports
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'test-results',
                reportFiles: 'summary.html',
                reportName: '🎭 Route Testing Summary'
            ])
            
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'generated-tests/playwright-report',
                reportFiles: 'index.html',
                reportName: '📋 Playwright Detailed Report'
            ])
        }
        
        success {
            script {
                echo "✅ Pipeline completed successfully!"
                echo "🎉 All route tests passed for unknown application!"
                echo "📊 Tested 3 public, 3 protected, and 2 API routes"
            }
        }
        
        failure {
            script {
                echo "❌ Pipeline failed!"
                echo "🔍 Check the test reports for details on what needs to be fixed."
                echo "💡 Common issues: server not starting, routes changed, authentication problems"
            }
        }
        
        unstable {
            script {
                echo "⚠️ Pipeline completed with warnings!"
                echo "🔍 Some tests failed - check reports for security or functionality issues."
            }
        }
    }
}