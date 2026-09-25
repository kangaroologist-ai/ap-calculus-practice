import {test, expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const output = 'artifacts/ux-refresh';
mkdirSync(output, {recursive:true});

for (const width of [390, 1280]) {
  test(`help and integrated path at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await page.locator('.progress-summary').click();
    await expect(page.locator('.path-level')).toHaveCount(6);
    await expect(page.locator('.skills-details')).toHaveCount(0);
    const foundation = page.locator('.path-level[data-level="1"]');
    await foundation.locator('summary').click();
    await expect(foundation.locator('.path-skill')).toHaveCount(4);
    await expect(foundation.getByText('Power rule', {exact:true})).toBeVisible();
    const locked = page.locator('.path-level[data-level="2"]');
    await locked.locator('summary').click();
    await expect(locked.getByText('Sine', {exact:true})).toBeVisible();
    await locked.locator('summary').click();
    await page.getByRole('button', {name:/Start practicing|Continue practicing/}).click();
    await expect(page.locator('math-field').first()).toBeVisible();
    await expect(foundation).toHaveAttribute('open','');
    await foundation.scrollIntoViewIfNeeded();
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`${output}/verified-path-${width}.png`});
    await page.getByRole('link', {name:'How to use', exact:true}).click();
    await expect(page).toHaveURL(/help\.html$/);
    await expect(page.getByRole('heading',{name:'How to use',exact:true})).toBeVisible();
    await page.getByText('Typing formulas',{exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`${output}/verified-help-${width}.png`});
    await page.getByRole('link',{name:'Back to practice',exact:true}).click();
    await expect(page.locator('math-field').first()).toBeVisible();
  });
}
