import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      value = value.replace(/^["']|["']$/g, '');
      value = value.replace(/\\r\\n/g, '').replace(/\r\n/g, '').replace(/\n/g, '');
      env[key.trim()] = value;
    }
  });
  
  return env;
}

function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  
  const payload = Buffer.from(parts[1], 'base64').toString('utf8');
  return JSON.parse(payload);
}

const envPath = join(__dirname, '..', '.env.production');
const env = parseEnvFile(envPath);

console.log('\n🔑 JWT Token Analysis\n');

console.log('ANON KEY:');
const anonPayload = decodeJWT(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log(JSON.stringify(anonPayload, null, 2));

console.log('\nSERVICE ROLE KEY:');
const servicePayload = decodeJWT(env.SUPABASE_SERVICE_ROLE_KEY);
console.log(JSON.stringify(servicePayload, null, 2));

console.log('\n📋 Key findings:');
console.log(`Anon role: ${anonPayload.role}`);
console.log(`Service role: ${servicePayload.role}`);
console.log(`\nIf anon role is not 'anon', that's the problem!`);
