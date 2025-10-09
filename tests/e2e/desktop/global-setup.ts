import { execSync } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';

async function ensureBuildArtifacts() {
  const projectRoot = path.resolve(__dirname, '../../..');
  const distIndex = path.join(projectRoot, 'dist', 'index.html');
  const buildIndex = path.join(projectRoot, 'build', 'index.html');

  if (existsSync(distIndex) || existsSync(buildIndex)) {
    return;
  }

  execSync('npm run build', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
}

export default async function globalSetup() {
  await ensureBuildArtifacts();
}
