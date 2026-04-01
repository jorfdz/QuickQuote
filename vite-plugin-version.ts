import type { Plugin } from 'vite';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

function formatDate(d: Date): string {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const yearShort = String(d.getFullYear()).slice(2);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month}/${day}/${yearShort} ${hours}:${minutes}${ampm}`;
}

export function versionPlugin(): Plugin {
  return {
    name: 'vite-plugin-version',
    buildStart() {
      const now = new Date();
      const timestamp = formatDate(now);
      const content = `// AUTO-GENERATED — do not edit manually. Updated by build process.\nexport const APP_VERSION = 'V4';\nexport const BUILD_TIMESTAMP = '${timestamp}';\n`;
      writeFileSync(resolve(process.cwd(), 'src/version.ts'), content);
      console.log(`[version] Updated to V4 ${timestamp}`);
    },
  };
}
