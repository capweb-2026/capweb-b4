import { test, expect } from '@playwright/test';
import { persona } from '../public/js/persona.js';
/* global localStorage -- callbacks exécutés dans la page */

// Identité de TriMalin dans un vrai navigateur, critères 1 à 5 de SPEC.md.
async function pageNeuve(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function envoyer(page, texte) {
  await page.locator('#message').fill(texte);
  await page.getByRole('button', { name: /envoyer/i }).click();
}

const lignes = (page) => page.locator('#messages li');

test.describe('Critères 1 et 2 — nom et emoji', () => {
  test('le titre principal affiche le nom et un seul emoji', async ({ page }) => {
    await pageNeuve(page);
    const titre = page.locator('h1');
    await expect(titre).toContainText(persona.nom);
    await expect(page.locator('#nom')).toHaveText(persona.nom);
    await expect(page.locator('#emoji')).toHaveText(persona.emoji);
    await expect(page.locator('h1 #emoji')).toHaveCount(1);
    const emojis = await page.locator('#emoji').evaluate((el) => el.textContent.match(/\p{Extended_Pictographic}/gu)?.length ?? 0);
    expect(emojis).toBe(1);
  });
});

test.describe('Critère 3 — accueil', () => {
  test('l’accueil s’affiche quand la conversation est vide, hors de #messages', async ({ page }) => {
    await pageNeuve(page);
    await expect(page.locator('#accueil')).toBeVisible();
    await expect(page.locator('#accueil')).toContainText(persona.nom);
    await expect(page.locator('#messages #accueil')).toHaveCount(0);
    await expect(lignes(page)).toHaveCount(0);
  });

  test('l’accueil disparaît au premier message et reste caché après rechargement', async ({ page }) => {
    await pageNeuve(page);
    await envoyer(page, 'salut');
    await expect(lignes(page)).toHaveCount(2);
    await expect(page.locator('#accueil')).toBeHidden();
    await page.reload();
    await expect(lignes(page)).toHaveCount(2);
    await expect(page.locator('#accueil')).toBeHidden();
  });

  test('l’accueil revient quand la conversation est effacée', async ({ page }) => {
    await pageNeuve(page);
    await envoyer(page, 'salut');
    await expect(page.locator('#accueil')).toBeHidden();
    page.once('dialog', (d) => d.accept());
    await page.locator('#effacer').click();
    await expect(lignes(page)).toHaveCount(0);
    await expect(page.locator('#accueil')).toBeVisible();
  });
});

test.describe('Critère 4 — suggestions', () => {
  test('exactement trois suggestions, dans l’ordre de la spec', async ({ page }) => {
    await pageNeuve(page);
    const boutons = page.locator('#suggestions button');
    await expect(boutons).toHaveCount(3);
    for (const [index, question] of persona.suggestions.entries()) {
      await expect(boutons.nth(index)).toHaveText(question);
    }
  });

  test('cliquer une suggestion la place dans le champ sans l’envoyer', async ({ page }) => {
    await pageNeuve(page);
    await page.locator('#suggestions button').nth(1).click();
    await expect(page.locator('#message')).toHaveValue(persona.suggestions[1]);
    await expect(lignes(page)).toHaveCount(0);
    await expect(page.locator('#message')).toBeFocused();
  });
});

test.describe('Critère 5 — réponses signées', () => {
  test('la réponse est signée du nom, le message reste signé « Vous »', async ({ page }) => {
    await pageNeuve(page);
    await envoyer(page, 'salut');
    await expect(lignes(page)).toHaveCount(2);
    await expect(lignes(page).nth(0)).toHaveText(`Vous : salut`);
    await expect(lignes(page).nth(1)).toContainText(`${persona.nom} : `);
    await expect(lignes(page).nth(1)).not.toContainText('Assistant : ');
  });
});
