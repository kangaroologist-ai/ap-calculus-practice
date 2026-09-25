import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { freshProgress, stateFor } from '../src/progress';
import { makePortableProgress, encodeProgress, splitIntoQrFrames } from '../src/transfer';

function link() {
  const now=Date.now();
  const p=freshProgress({schemaVersion:1,revision:'link-test',initialUnlockedLevel:1,disabledFamilies:[],sessionLength:12},now);
  p.streak=7;p.sequence=7;
  stateFor(p,'constant',now);
  const url=new URL(splitIntoQrFrames(encodeProgress(makePortableProgress(p,now)))[0]);
  return { path:url.pathname+url.hash, card:p.skills.constant.card };
}

test('camera link restores progress on a fresh device and starts practice',async({page})=>{
  const source=link();const requests:string[]=[];
  page.on('request',request=>requests.push(request.url()));
  await page.goto(source.path);
  await expect(page.locator('math-field')).toBeVisible();
  await expect(page.locator('#streak')).toContainText('7 in a row');
  expect(new URL(page.url()).hash).toBe('');
  expect(requests.every(url=>!url.includes('DSP2.')&&!url.includes('DSA2.'))).toBe(true);
  const card=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('derivative-studio',1);r.onsuccess=()=>{const db=r.result;const g=db.transaction('state').objectStore('state').get('current');g.onsuccess=()=>{resolve(g.result.progress.skills.constant.card);db.close()}}}));
  expect(card).toEqual(source.card);
});

test('camera link asks before replacing existing practice and resumes after confirmation',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:/Start practicing|Continue practicing/}).click();
  await expect(page.locator('math-field')).toBeVisible();
  await page.goto(link().path);
  await expect(page.locator('#import-preview')).toContainText('7 in a row');
  await expect(page.locator('#confirm-import')).toBeVisible();
  await page.locator('#confirm-import').click();
  await expect(page.locator('#dialog')).toHaveCount(0);
  await expect(page.locator('math-field')).toBeVisible();
  await expect(page.locator('#streak')).toContainText('7 in a row');
});

test('damaged camera link does not overwrite existing progress',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:/Start practicing|Continue practicing/}).click();
  await expect(page.locator('math-field')).toBeVisible();
  await page.goto('/#progress=DSP2.00000000.AAAA');
  await expect(page.locator('#dialog')).toContainText('damaged');
  await expect(page.locator('#confirm-import')).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe('');
});

test('full curriculum fits one square URL QR and opens on another device',async({page,browser})=>{
  const raw=JSON.parse(readFileSync(new URL('./fixtures/compact-full-snapshot.json',import.meta.url),'utf8')); 
  const snapshot=makePortableProgress(raw as Parameters<typeof makePortableProgress>[0]);
  const frames=splitIntoQrFrames(encodeProgress(snapshot));expect(frames).toHaveLength(1);
  const url=new URL(frames[0]);await page.goto(url.pathname+url.hash);
  await page.getByRole('button',{name:'Move progress'}).click();
  await page.getByRole('button',{name:'Export progress'}).click();
  await expect(page.locator('#qr-label')).toHaveText('Scan to move your progress');
  await page.setViewportSize({width:390,height:844});
  const box=await page.locator('#qr').boundingBox();expect(Math.abs(box!.width-box!.height)).toBeLessThan(1);expect(box!.width).toBeLessThan(390);
  const png=await page.locator('#save-qr').getAttribute('href');expect(png).toMatch(/^data:image\/png/);
  await page.screenshot({path:`artifacts/compact-full-${test.info().project.name}.png`,fullPage:true});
  const context=await browser.newContext();const other=await context.newPage();
  try{
    await other.goto('http://127.0.0.1:5173'+url.pathname+url.hash);
    await expect(other.getByRole('button',{name:'Move progress'})).toBeVisible();
    await expect.poll(()=>other.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('derivative-studio',1);r.onsuccess=()=>{const db=r.result;const g=db.transaction('state').objectStore('state').get('current');g.onsuccess=()=>{resolve(g.result?.progress?.streak);db.close()}}}))).toBe(snapshot.streak);
  }finally{await context.close()}
});
