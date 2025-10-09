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

async function launchElectronApp() {
  const electronApp = await electron.launch({
    args: ['.'],
    cwd: PROJECT_ROOT,
    env: baseElectronEnv
  });

  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  return { electronApp, window };
}

const isPlaywrightRunner = Boolean(process.env.PLAYWRIGHT_TEST ?? process.env.PW_TEST ?? process.env.PLAYWRIGHT);

if (isPlaywrightRunner) {
  test.describe.serial('Desktop navigation and theming', () => {
    test('navigates to the projects section via sidebar', async () => {
      const { electronApp, window } = await launchElectronApp();

      try {
        const projectsButton = window.getByRole('button', { name: 'المشاريع' });
        await projectsButton.click();

        await expect(window.getByRole('heading', { name: 'إدارة المشاريع' })).toBeVisible();
      } finally {
        await electronApp.close();
      }
    });

    test('toggles dark mode from the header switch', async () => {
      const { electronApp, window } = await launchElectronApp();

      try {
        await expect.poll(async () => window.evaluate(() => document.documentElement.classList.contains('dark'))).toBeFalsy();

        const enableDarkModeButton = window.getByRole('button', { name: 'التبديل للوضع الليلي' });
        await enableDarkModeButton.click();

        await expect.poll(async () => window.evaluate(() => document.documentElement.classList.contains('dark'))).toBeTruthy();

        const disableDarkModeButton = window.getByRole('button', { name: 'التبديل للوضع النهاري' });
        await disableDarkModeButton.click();

        await expect.poll(async () => window.evaluate(() => document.documentElement.classList.contains('dark'))).toBeFalsy();
      } finally {
        await electronApp.close();
      }
    });
  });
}
