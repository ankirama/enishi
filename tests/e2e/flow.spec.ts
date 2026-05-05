import { test, expect } from '@playwright/test';

test('home form → result → share link round-trip', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /concordance des prénoms/i })).toBeVisible();

  await page.getByLabel('Premier prénom').fill('Hélène');
  await page.getByLabel('Second prénom').fill('Julien');

  await page.getByRole('button', { name: /Calculer/ }).click();

  // Hero must appear with the percentage rendered immediately (math is sync)
  await expect(page.getByText(/concordance révélée/i)).toBeVisible();
  await expect(page.getByText('Hélène', { exact: true })).toBeVisible();
  await expect(page.getByText('Julien', { exact: true })).toBeVisible();

  // Sub-scores section is server-rendered too
  await expect(page.getByText(/la décomposition/i)).toBeVisible();
  await expect(page.getByText('Résonance des lettres')).toBeVisible();

  // URL has the params
  expect(page.url()).toContain('a=H%C3%A9l%C3%A8ne');
  expect(page.url()).toContain('b=Julien');
});

test('empty inputs disable submit', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: /Calculer/ });
  await expect(button).toBeDisabled();
  await page.getByLabel('Premier prénom').fill('Marie');
  await expect(button).toBeDisabled();
  await page.getByLabel('Second prénom').fill('Paul');
  await expect(button).toBeEnabled();
});
