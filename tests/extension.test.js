// tests/extension.test.js
const path = require('path');
const puppeteer = require('puppeteer');

describe('PromptKeeper Extension Tests', () => {
  let browser;
  let page;
  const extensionPath = path.join(__dirname, '..');
  
  beforeAll(async () => {
    // Launch browser with extension loaded
    browser = await puppeteer.launch({
      headless: false, // Extensions require non-headless mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox'
      ]
    });
    
    // Get the extension ID
    const targets = await browser.targets();
    const extensionTarget = targets.find(target => 
      target.type() === 'background_page' && 
      target.url().includes('chrome-extension://')
    );
    const extensionUrl = extensionTarget.url();
    const extensionId = extensionUrl.split('/')[2];
    
    // Open a new page with extension popup
    page = await browser.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
  });
  
  afterAll(async () => {
    await browser.close();
  });

  // Test 1: Check if popup loads correctly
  test('popup should load without errors', async () => {
    const title = await page.title();
    expect(title).toBe('PromptKeeper'); // Adjust to match your popup title
  });

  // Test 2: Test buffer functionality
  test('should save prompt to buffer', async () => {
    // Type in the prompt input
    await page.waitForSelector('#prompt-input');
    await page.type('#prompt-input', 'Test prompt');
    
    // Click save to buffer button
    await page.click('#save-to-buffer');
    
    // Check if prompt appears in buffer list
    await page.waitForTimeout(500); // Wait for DOM to update
    const promptText = await page.evaluate(() => {
      const firstPrompt = document.querySelector('#buffer-list .prompt-text');
      return firstPrompt ? firstPrompt.getAttribute('data-full-text') : '';
    });
    
    expect(promptText).toBe('Test prompt');
  });

  // Test 3: Test collection creation
  test('should create a new collection', async () => {
    // Click on Collections tab
    await page.click('#collections-tab');
    
    // Create new collection
    const collectionName = 'Test Collection';
    
    // Mock the prompt function
    await page.exposeFunction('prompt', () => collectionName);
    
    // Click create collection button
    await page.click('#create-collection');
    
    // Wait for collections to load
    await page.waitForTimeout(500);
    
    // Check if collection was created
    const collectionExists = await page.evaluate((name) => {
      const collections = document.querySelectorAll('.collection-name');
      for (let i = 0; i < collections.length; i++) {
        if (collections[i].textContent === name) return true;
      }
      return false;
    }, collectionName);
    
    expect(collectionExists).toBe(true);
  });

  // Test 4: Test copy to clipboard
  test('should copy text to clipboard', async () => {
    // Go to buffer tab
    await page.click('#buffer-tab');
    
    // Click copy button on first prompt
    await page.waitForSelector('.prompt-actions button');
    await page.click('.prompt-actions button:first-child');
    
    // Check if button text changed to "Copied"
    const buttonText = await page.evaluate(() => {
      return document.querySelector('.prompt-actions button:first-child').textContent;
    });
    
    expect(buttonText).toBe('Copied');
  });

  // Test 5: Test search functionality
  test('should search across buffer and collections', async () => {
    // Go to search tab
    await page.click('#search-tab');
    
    // Type in search input
    await page.type('#search-input', 'Test');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check if results are displayed
    const hasResults = await page.evaluate(() => {
      const results = document.querySelectorAll('#search-results .prompt-item');
      return results.length > 0;
    });
    
    expect(hasResults).toBe(true);
  });
});