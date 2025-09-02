#!/usr/bin/env node

/**
 * sGate Development Startup Script
 * Starts all services in the correct order with proper error handling
 */

const { spawn } = require('child_process');
const path = require('path');

// Colors for output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`${colors.bold}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  log(`${colors.red}✗${colors.reset} ${message}`);
}

function logInfo(message) {
  log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createSpawnOptions(cwd) {
  return {
    cwd: cwd,
    stdio: 'pipe',
    shell: process.platform === 'win32'
  };
}

function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function checkPrerequisites() {
  logStep('1/6', 'Checking prerequisites...');
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
    }
    logSuccess(`Node.js ${nodeVersion}`);
    
    // Check if Docker is running
    const dockerCheck = spawn('docker', ['ps'], { stdio: 'pipe' });
    await new Promise((resolve, reject) => {
      dockerCheck.on('close', (code) => {
        if (code === 0) {
          logSuccess('Docker is running');
          resolve();
        } else {
          reject(new Error('Docker is not running. Please start Docker Desktop.'));
        }
      });
    });
    
  } catch (error) {
    logError(error.message);
    process.exit(1);
  }
}

async function startInfrastructure() {
  logStep('2/6', 'Starting infrastructure (PostgreSQL)...');
  
  const dockerCompose = spawn('docker', ['compose', 'up', '-d', 'postgres'], {
    cwd: path.join(__dirname, 'infra'),
    stdio: 'pipe'
  });
  
  await new Promise((resolve, reject) => {
    let output = '';
    dockerCompose.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    dockerCompose.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    dockerCompose.on('close', (code) => {
      if (code === 0) {
        logSuccess('PostgreSQL started');
        resolve();
      } else {
        logError(`Failed to start infrastructure: ${output}`);
        reject(new Error('Infrastructure startup failed'));
      }
    });
  });
  
  // Wait for PostgreSQL to be ready
  logInfo('Waiting for PostgreSQL to be ready...');
  await sleep(5000);
}

async function buildProject() {
  logStep('3/6', 'Building project...');
  
  try {
    const build = spawn(getNpmCommand(), ['run', 'build'], createSpawnOptions(__dirname));
    
    await new Promise((resolve, reject) => {
      let output = '';
      
      build.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      build.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      build.on('error', (error) => {
        reject(new Error(`Failed to start build process: ${error.message}`));
      });
      
      build.on('close', (code) => {
        if (code === 0) {
          logSuccess('Project built successfully');
          resolve();
        } else {
          logError('Build failed:');
          console.log(output);
          reject(new Error(`Build failed with exit code ${code}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Build process error: ${error.message}`);
  }
}

async function runMigrations() {
  logStep('4/6', 'Running database migrations...');
  
  try {
    const migrate = spawn(getNpmCommand(), ['run', 'migration:run'], 
      createSpawnOptions(path.join(__dirname, 'apps', 'api')));
    
    await new Promise((resolve, reject) => {
      let output = '';
      
      migrate.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      migrate.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      migrate.on('error', (error) => {
        logInfo(`Migration process error: ${error.message}`);
        resolve(); // Continue anyway
      });
      
      migrate.on('close', (code) => {
        if (code === 0) {
          logSuccess('Migrations completed');
          resolve();
        } else {
          logInfo('Migrations may have already been run or failed:');
          console.log(output);
          resolve(); // Continue anyway
        }
      });
    });
  } catch (error) {
    logInfo(`Migration error: ${error.message}`);
    // Continue anyway
  }
}

async function seedDatabase() {
  logStep('5/6', 'Seeding database with demo data...');
  
  try {
    const seed = spawn(getNpmCommand(), ['run', 'seed'], 
      createSpawnOptions(path.join(__dirname, 'apps', 'api')));
    
    await new Promise((resolve, reject) => {
      let output = '';
      
      seed.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      seed.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      seed.on('error', (error) => {
        logInfo(`Seed process error: ${error.message}`);
        resolve(); // Continue anyway
      });
      
      seed.on('close', (code) => {
        if (code === 0) {
          logSuccess('Database seeded successfully');
          logInfo('Demo API key created - check the output above');
          resolve();
        } else {
          logInfo('Seeding may have already been done or failed:');
          console.log(output);
          resolve(); // Continue anyway
        }
      });
    });
  } catch (error) {
    logInfo(`Seed error: ${error.message}`);
    // Continue anyway
  }
}

async function startServices() {
  logStep('6/6', 'Starting development servers...');
  
  // Start API server
  logInfo('Starting API server on http://localhost:4000...');
  const api = spawn(getNpmCommand(), ['run', 'dev'], 
    createSpawnOptions(path.join(__dirname, 'apps', 'api')));
  
  let apiReady = false;
  
  api.on('error', (error) => {
    logError(`Failed to start API server: ${error.message}`);
  });
  
  api.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('sGate API is running on')) {
      if (!apiReady) {
        logSuccess('API server ready at http://localhost:4000');
        logInfo('API Documentation: http://localhost:4000/docs');
        apiReady = true;
      }
    }
  });
  
  api.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('Module not found') && !output.includes('npm error')) {
      process.stderr.write(`${colors.yellow}[API]${colors.reset} ${output}`);
    }
  });
  
  // Wait for API to start
  await sleep(3000);
  
  // Start Checkout server
  logInfo('Starting Checkout server on http://localhost:3000...');
  const checkout = spawn(getNpmCommand(), ['run', 'dev'], 
    createSpawnOptions(path.join(__dirname, 'apps', 'checkout')));
  
  let checkoutReady = false;
  
  checkout.on('error', (error) => {
    logError(`Failed to start Checkout server: ${error.message}`);
  });
  
  checkout.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready') || output.includes('localhost:3000')) {
      if (!checkoutReady) {
        logSuccess('Checkout server ready at http://localhost:3000');
        checkoutReady = true;
      }
    }
  });
  
  checkout.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('npm error')) {
      process.stderr.write(`${colors.blue}[Checkout]${colors.reset} ${output}`);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n\nShutting down gracefully...');
    api.kill('SIGTERM');
    checkout.kill('SIGTERM');
    process.exit(0);
  });
  
  // Keep the script running
  log('\n' + colors.green + colors.bold + '🚀 sGate is running!' + colors.reset);
  log('');
  log('Services:');
  log(`  ${colors.blue}• API:${colors.reset}      http://localhost:4000`);
  log(`  ${colors.blue}• Docs:${colors.reset}     http://localhost:4000/docs`);
  log(`  ${colors.blue}• Checkout:${colors.reset} http://localhost:3000`);
  log('');
  log(`${colors.yellow}Press Ctrl+C to stop all services${colors.reset}`);
  
  // Wait indefinitely
  await new Promise(() => {});
}

async function main() {
  try {
    console.log(`${colors.bold}${colors.green}sGate Development Startup${colors.reset}\n`);
    
    await checkPrerequisites();
    await startInfrastructure();
    await buildProject();
    await runMigrations();
    await seedDatabase();
    await startServices();
    
  } catch (error) {
    logError(`Startup failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}