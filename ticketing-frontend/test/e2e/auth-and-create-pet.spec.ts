import { test, expect } from '@playwright/test';

test('user can register, login, and create a pet', async ({ page }) => {
  const unique = Date.now();
  const username = `alice${unique}`;
  const email = `alice${unique}@example.com`;
  const password = 'Password123!';

  // Register
  await page.goto('/register');

  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  // If your register form has confirm password, this fills it too if present
  const confirmPassword = page.locator('input[name="confirmPassword"]');
  if (await confirmPassword.count()) {
    await confirmPassword.fill(password);
  }

  // Register page shows a blocking alert on success.
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().includes('/auth/register'),
  );
  await page.locator('button[type="submit"]').click();
  const registerResponse = await registerResponsePromise;
  expect(registerResponse.ok()).toBeTruthy();

  await page.waitForURL('**/login');

  // Login
  await page.goto('/login');

  const loginAndWaitForToken = async (loginValue: string) => {
    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().includes('/auth/login'),
    );

    await page.locator('input[name="username"]').fill(loginValue);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    const loginResponse = await loginResponsePromise;
    if (!loginResponse.ok()) {
      return false;
    }

    try {
      await expect
        .poll(
          async () =>
            await page.evaluate(() => Boolean(localStorage.getItem('access_token'))),
          { timeout: 8000 },
        )
        .toBe(true);
      return true;
    } catch {
      return false;
    }
  };

  // First try username login, then fallback to email if backend expects it.
  let loggedIn = await loginAndWaitForToken(username);
  if (!loggedIn) {
    await page.goto('/login');
    loggedIn = await loginAndWaitForToken(email);
  }

  expect(loggedIn).toBeTruthy();
  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

  // Try to get to pet creation screen
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Profile', level: 2 })).toBeVisible();
  await page.getByRole('tab', { name: /my pets/i }).click();
  const addPetButton = page.getByRole('button', { name: /add pet/i });
  await expect(addPetButton).toBeVisible();

  await page.waitForLoadState('networkidle');

  // Fill pet form
  await page.locator('input[name="Name"]').fill('Buddy');
  await page.locator('input[name="Species"]').fill('Dog');
  await page.locator('input[name="Breed"]').fill('Labrador');
  await page.locator('input[name="Age"]').fill('3');

  const descriptionInput = page.locator('textarea[name="Description"], input[name="Description"]');
  await descriptionInput.first().fill('Friendly dog');

  // Submit pet form
  await addPetButton.click();

  // Verify create succeeded and pet appears in list.
  await expect(page.getByText(/pet added successfully/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Buddy', level: 4 })).toBeVisible();
});