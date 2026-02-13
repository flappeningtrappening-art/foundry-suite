import { threadGeneratorFlow } from './flows/threadGeneratorFlow';
import { realEstateFlow } from './flows/realEstateFlow';
import { coldEmailFlow } from './flows/coldEmailFlow';
import { visualForgeFlow } from './flows/visualForgeFlow';
import { ai } from './genkit';

console.log('--- [GENKIT SERVER STARTUP] ---');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function startServer() {
  try {
    console.log('--- [GENKIT SERVER STARTUP] ---');
    console.log(`Using API Key: ${process.env.GOOGLE_GENAI_API_KEY ? 'FOUND (starts with ' + process.env.GOOGLE_GENAI_API_KEY.substring(0, 8) + ')' : 'MISSING'}`);
    console.log('Initializing Flow Server on port 3400...');
    
    await ai.startFlowServer({
      flows: [threadGeneratorFlow, realEstateFlow, coldEmailFlow, visualForgeFlow],
      port: 3400
    });
    
    console.log('SUCCESS: Flow Server is running on port 3400.');
  } catch (error) {
    console.error('CRITICAL ERROR during Flow Server startup:', error);
    process.exit(1);
  }
}

startServer();

// Keep the process alive indefinitely
console.log('Starting persistence loop...');
setInterval(() => {
  // Silent heartbeat
}, 30000);