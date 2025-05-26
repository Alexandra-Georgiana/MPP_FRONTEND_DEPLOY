import fetch from 'node-fetch';

console.log('Checking server status...');

async function checkNodeServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const ok = response.ok;
    console.log('Node.js server status:', ok ? 'Running ✅' : 'Not responding ❌');
    return ok;
  } catch (e) {
    console.log('Node.js server status: Not running ❌');
    return false;
  }
}

async function checkFlaskServer() {
  try {
    const response = await fetch('http://localhost:5000/health');
    const ok = response.ok;
    console.log('Flask server status:', ok ? 'Running ✅' : 'Not responding ❌');
    return ok;
  } catch (e) {
    console.log('Flask server status: Not running ❌');
    return false;
  }
}

async function main() {
  const nodeOk = await checkNodeServer();
  const flaskOk = await checkFlaskServer();
  
  if (!nodeOk) {
    console.log('\nNode.js server is not running. Start it with:');
    console.log('cd backend && npm start');
  }
  
  if (!flaskOk) {
    console.log('\nFlask server is not running. Start it with:');
    console.log('cd backend && python app.py');
  }
  
  if (nodeOk && flaskOk) {
    console.log('\nBoth servers are running correctly ✅');
  }
}

main().catch(console.error);
