import { threadGeneratorFlow } from './flows/threadGeneratorFlow';
import { realEstateFlow } from './flows/realEstateFlow';
import { coldEmailFlow } from './flows/coldEmailFlow';
import { visualForgeFlow } from './flows/visualForgeFlow';
import { ai } from './genkit';
import { ReflectionServer } from 'genkit';

console.log('--- [GENKIT 1.x PRODUCTION SERVER] ---');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function startServer() {
  try {
    console.log(`Using API Key: ${process.env.GOOGLE_GENAI_API_KEY ? 'FOUND' : 'MISSING'}`);
    
    // Formal 1.x server initialization
    const server = new ReflectionServer(ai, {
      port: 3400,
    });

    await server.start();
    
    console.log('SUCCESS: Genkit 1.x Flow Server is running on port 3400.');
  } catch (error) {
    console.error('CRITICAL ERROR during Flow Server startup:', error);
    process.exit(1);
  }
}

startServer();

// Persist
setInterval(() => {}, 60000);
