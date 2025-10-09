import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

const baseElectronEnv = {
  ...process.env,
  NODE_ENV: 'production',
  E2E_TEST: '1',
  ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
  PLAYWRIGHT: '1'
};

test.describe.serial('Desktop bootstrap smoke', () => {
  test('renders the dashboard shell successfully', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: PROJECT_ROOT,
      env: baseElectronEnv
    });

    try {
      const window = await electronApp.firstWindow();
      await window.waitForLoadState('domcontentloaded');

  await expect(window).toHaveTitle(/نظام إدارة شركة المقاولات/);

      const heading = window.getByRole('heading', { name: 'شركة المقاولات المتطورة' });
      await expect(heading).toBeVisible();

      const projectsNav = window.getByRole('button', { name: 'المشاريع' });
      await expect(projectsNav).toBeVisible();
    } finally {
      await electronApp.close();
    }
  });
});
