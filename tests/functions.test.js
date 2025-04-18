require('./chrome-mock');

// Import functions from your popup.js file
// Note: You'll need to refactor popup.js to export these functions
const {
  saveToBuffer,
  createNewCollection,
  renameCollection,
  makeCollectionActive,
  deleteCollection,
  copyToClipboard
} = require('../popup.functions.js');

// Mock DOM elements and navigator
document.getElementById = jest.fn().mockImplementation((id) => {
  return {
    addEventListener: jest.fn(),
    appendChild: jest.fn(),
    innerHTML: '',
    style: {},
    className: '',
    textContent: ''
  };
});

navigator.clipboard = {
  writeText: jest.fn().mockResolvedValue(undefined),
  readText: jest.fn().mockResolvedValue('Clipboard text')
};

// Reset mocks and chrome storage before each test
beforeEach(() => {
  jest.clearAllMocks();
  chrome.storage.local._reset();
});

describe('Buffer Functions', () => {
  test('saveToBuffer should add text to buffer', async () => {
    // Set up initial buffer state
    await new Promise(resolve => {
      chrome.storage.local.set({ promptBuffer: ['existing prompt'] }, resolve);
    });
    
    // Call function
    saveToBuffer('new prompt');
    
    // Check if storage was updated correctly
    await new Promise(resolve => {
      setTimeout(() => {
        chrome.storage.local.get('promptBuffer', (data) => {
          expect(data.promptBuffer).toEqual(['existing prompt', 'new prompt']);
          resolve();
        });
      }, 100);
    });
  });
  
  test('saveToBuffer should limit buffer to 10 items', async () => {
    // Set up a buffer with 10 items
    const initialBuffer = Array.from({ length: 10 }, (_, i) => `prompt ${i}`);
    await new Promise(resolve => {
      chrome.storage.local.set({ promptBuffer: initialBuffer }, resolve);
    });
    
    // Add one more
    saveToBuffer('new prompt');
    
    // Check that buffer is still 10 items and oldest was removed
    await new Promise(resolve => {
      setTimeout(() => {
        chrome.storage.local.get('promptBuffer', (data) => {
          expect(data.promptBuffer.length).toBe(10);
          expect(data.promptBuffer).not.toContain('prompt 0');
          expect(data.promptBuffer).toContain('new prompt');
          resolve();
        });
      }, 100);
    });
  });
});

describe('Collection Functions', () => {
  test('createNewCollection should add a collection', async () => {
    createNewCollection('Test Collection');
    
    await new Promise(resolve => {
      setTimeout(() => {
        chrome.storage.local.get('promptCollections', (data) => {
          expect(data.promptCollections.length).toBe(1);
          expect(data.promptCollections[0].name).toBe('Test Collection');
          expect(data.promptCollections[0].prompts).toEqual([]);
          resolve();
        });
      }, 100);
    });
  });
  
  test('makeCollectionActive should set the active collection', async () => {
    // Create two collections first
    await new Promise(resolve => {
      chrome.storage.local.set({
        promptCollections: [
          { name: 'Collection 1', prompts: [] },
          { name: 'Collection 2', prompts: [] }
        ]
      }, resolve);
    });
    
    // Set second collection as active
    makeCollectionActive(1);
    
    // Check if active index was updated
    await new Promise(resolve => {
      setTimeout(() => {
        chrome.storage.local.get('activeCollectionIndex', (data) => {
          expect(data.activeCollectionIndex).toBe(1);
          resolve();
        });
      }, 100);
    });
  });
});