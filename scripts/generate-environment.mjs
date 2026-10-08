import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('src/environments/environment.generated.ts');
const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() ?? '';
const contents = `// Generated at build time. Do not commit this file.\nexport const generatedGoogleMapsApiKey = ${JSON.stringify(apiKey)};\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, contents, 'utf8');

console.log(
  apiKey
    ? 'Generated Google Maps browser-key configuration.'
    : 'Generated empty Google Maps configuration. Map requests will show the missing-key message.',
);
