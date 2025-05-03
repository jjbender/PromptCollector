// test-suite.js
// Comprehensive test suite for Prompt Collector Chrome Extension
// Run this file to verify functionality when upgrading Chrome versions

/*
Run the tests when a new Chrome version is released:

Open your extension's popup in developer mode
Open Chrome DevTools for the popup (right-click > Inspect)
Load the test file by pasting this in the console:

let script = document.createElement('script');
script.src = 'test-suite.js';
document.body.appendChild(script);

Run the test suite by calling:


testPromptCollectorExtension();



Analyze results in the console:

The test output shows which functions work correctly and which need attention
Test categories cover: storage, buffer operations, collections, UI interactions, clipboard, and search



Features Tested
The test suite covers all key functionalities:

Storage Operations: Tests initialization and safe storage operations
Buffer Functionality: Tests adding/removing prompts and loading the UI
Collection Management: Tests creating collections, activating them, and managing prompts
UI Interactions: Tests UI elements like headings, toggle buttons, and prompt items
Clipboard Operations: Tests copying to clipboard and clipboard-to-buffer/collection features
Search: Tests search functionality and results display

The tests automatically mock necessary DOM elements and Chrome APIs, making it reliable across different environments. Each test is isolated and includes error handling to prevent one failure from stopping the entire test suite.

*/

// Global test state tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// Test runner function
async function runAllTests() {
  console.log('🧪 Starting Prompt Collector Extension Tests...');
  
  try {
    // Initialize test environment
    await setupTestEnvironment();
    
    // Run test groups
    await testStorageOperations();
    await testBufferFunctionality();
    await testCollectionFunctionality();
    await testUIInteractions();
    await testClipboardOperations();
    await testSearchFunctionality();
    
    // Report results
    logTestSummary();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Helper function to set up test environment
async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  // Clear storage for clean testing
  await clearStorage();
  
  // Mock DOM elements if needed for tests
  mockDOMElements();
  
  console.log('✅ Test environment ready');
}

// Clear all extension storage
function clearStorage() {
  return new Promise(resolve => {
    chrome.storage.local.clear(() => {
      console.log('🗑️ Storage cleared for testing');
      resolve();
    });
  });
}

// Mock required DOM elements for testing
function mockDOMElements() {
  // Create test DOM elements that mimic the extension's popup structure
  if (!document.getElementById('buffer-list')) {
    const bufferList = document.createElement('div');
    bufferList.id = 'buffer-list';
    document.body.appendChild(bufferList);
  }
  
  if (!document.getElementById('collections-list')) {
    const collectionsList = document.createElement('div');
    collectionsList.id = 'collections-list';
    document.body.appendChild(collectionsList);
  }
  
  if (!document.getElementById('buffer-count')) {
    const bufferCount = document.createElement('span');
    bufferCount.id = 'buffer-count';
    document.body.appendChild(bufferCount);
  }
  
  if (!document.getElementById('search-results')) {
    const searchResults = document.createElement('div');
    searchResults.id = 'search-results';
    document.body.appendChild(searchResults);
  }
  
  if (!document.getElementById('prompt-input')) {
    const promptInput = document.createElement('textarea');
    promptInput.id = 'prompt-input';
    document.body.appendChild(promptInput);
  }
  
  if (!document.getElementById('prompt-input-container')) {
    const promptInputContainer = document.createElement('div');
    promptInputContainer.id = 'prompt-input-container';
    document.body.appendChild(promptInputContainer);
  }
  
  if (!document.getElementById('intro-message')) {
    const introMessage = document.createElement('div');
    introMessage.id = 'intro-message';
    document.body.appendChild(introMessage);
  }
  
  if (!document.getElementById('toggle-input')) {
    const toggleInput = document.createElement('button');
    toggleInput.id = 'toggle-input';
    toggleInput.textContent = '+';
    document.body.appendChild(toggleInput);
  }
}

// Test individual function and track result
async function testCase(name, testFunction) {
  testResults.total++;
  console.log(`⏳ Testing: ${name}`);
  
  try {
    const result = await testFunction();
    if (result === false) {
      console.log(`❌ FAILED: ${name}`);
      testResults.failed++;
      return false;
    } else if (result === 'skipped') {
      console.log(`⏭️ SKIPPED: ${name}`);
      testResults.skipped++;
      return 'skipped';
    } else {
      console.log(`✅ PASSED: ${name}`);
      testResults.passed++;
      return true;
    }
  } catch (error) {
    console.error(`❌ TEST ERROR in ${name}:`, error);
    testResults.failed++;
    return false;
  }
}

// Log complete test results
function logTestSummary() {
  console.log('\n📊 TEST SUMMARY:');
  console.log(`Total tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  
  const passRate = (testResults.passed / (testResults.total - testResults.skipped)) * 100;
  console.log(`Pass rate: ${passRate.toFixed(2)}%`);
  
  if (testResults.failed === 0) {
    console.log('🎉 All tests passed successfully!');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues.');
  }
}

// Test storage operations
async function testStorageOperations() {
  console.log('\n📦 Testing Storage Operations...');
  
  await testCase('Initialize Default Collection', async () => {
    initializeDefaultsIfFirstTime();
    
    // Allow time for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify default collection was created
    return new Promise(resolve => {
      chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
        const collections = data.promptCollections || [];
        const activeIndex = data.activeCollectionIndex;
        
        if (collections.length > 0 && collections[0].name === 'First Prompt Collection' && activeIndex === 0) {
          resolve(true);
        } else {
          console.error('Default collection not initialized correctly:', { collections, activeIndex });
          resolve(false);
        }
      });
    });
  });
  
  await testCase('Safe Storage Operation', async () => {
    let testPassed = false;
    
    safeStorageOperation(
      callback => chrome.storage.local.get('testKey', callback),
      result => {
        testPassed = true;
      }
    );
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 300));
    return testPassed;
  });
}

// Test buffer functionality
async function testBufferFunctionality() {
  console.log('\n📋 Testing Buffer Functionality...');
  
  await testCase('Save To Buffer', async () => {
    const testText = "Test prompt for buffer " + Date.now();
    saveToBuffer(testText);
    
    // Allow time for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify prompt was added to buffer
    return new Promise(resolve => {
      chrome.storage.local.get('promptBuffer', data => {
        const buffer = data.promptBuffer || [];
        if (buffer.includes(testText)) {
          resolve(true);
        } else {
          console.error('Text not saved to buffer:', { buffer, testText });
          resolve(false);
        }
      });
    });
  });
  
  await testCase('Delete From Buffer', async () => {
    // First add test items to buffer
    const testItems = ["Delete test 1", "Delete test 2", "Delete test 3"];
    
    await new Promise(resolve => {
      chrome.storage.local.get('promptBuffer', data => {
        let buffer = data.promptBuffer || [];
        buffer = buffer.concat(testItems);
        chrome.storage.local.set({ promptBuffer: buffer }, resolve);
      });
    });
    
    // Now delete one item (index 1 in displayed order, which is reversed)
    const bufferLength = await new Promise(resolve => {
      chrome.storage.local.get('promptBuffer', data => {
        resolve(data.promptBuffer.length);
      });
    });
    
    // Delete the second-to-last item (in display order)
    deletePrompt(1);
    
    // Allow time for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify item was deleted
    return new Promise(resolve => {
      chrome.storage.local.get('promptBuffer', data => {
        const newBuffer = data.promptBuffer || [];
        if (newBuffer.length === bufferLength - 1) {
          resolve(true);
        } else {
          console.error('Item not deleted from buffer:', { 
            originalLength: bufferLength,
            newLength: newBuffer.length
          });
          resolve(false);
        }
      });
    });
  });
  
  await testCase('Load Buffer Items', async () => {
    // Manually trigger loadBufferItems
    loadBufferItems();
    
    // Allow time for DOM updates
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if buffer list is populated
    const bufferList = document.getElementById('buffer-list');
    return bufferList && bufferList.innerHTML !== '';
  });
}

// Test collection functionality
async function testCollectionFunctionality() {
  console.log('\n📚 Testing Collection Functionality...');
  
  await testCase('Create New Collection', async () => {
    const testCollectionName = "Test Collection " + Date.now();
    createNewCollection(testCollectionName);
    
    // Allow time for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify collection was created
    return new Promise(resolve => {
      chrome.storage.local.get('promptCollections', data => {
        const collections = data.promptCollections || [];
        const found = collections.some(c => c.name === testCollectionName);
        
        if (found) {
          resolve(true);
        } else {
          console.error('Collection not created:', { collections, testName: testCollectionName });
          resolve(false);
        }
      });
    });
  });
  
  await testCase('Make Collection Active', async () => {
    // First get current collections
    const collections = await new Promise(resolve => {
      chrome.storage.local.get('promptCollections', data => {
        resolve(data.promptCollections || []);
      });
    });
    
    if (collections.length < 2) {
      console.log('Not enough collections to test activation');
      return 'skipped';
    }
    
    // Make the second collection active
    makeCollectionActive(1);
    
    // Allow time for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify active collection was updated
    return new Promise(resolve => {
      chrome.storage.local.get('activeCollectionIndex', data => {
        if (data.activeCollectionIndex === 1) {
          resolve(true);
        } else {
          console.error('Collection not activated:', { 
            expectedIndex: 1, 
            actualIndex: data.activeCollectionIndex 
          });
          resolve(false);
        }
      });
    });
  });
  
  await testCase('Save To Collection', async () => {
    const testPrompt = "Test prompt for collection " + Date.now();
    
    // First get active collection for verification
    const initialState = await new Promise(resolve => {
      chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
        resolve({
          collections: data.promptCollections || [],
          activeIndex: data.activeCollectionIndex
        });
      });
    });
    
    // If there's no active collection, we can't proceed
    if (typeof initialState.activeIndex !== 'number') {
      return 'skipped';
    }
    
    // Count initial prompts
    const initialPromptCount = initialState.collections[initialState.activeIndex].prompts.length;
    
    // Mock prompt dialog to automatically confirm
    const originalPrompt = window.prompt;
    window.prompt = () => initialState.collections[initialState.activeIndex].name;
    
    // Save to collection
    saveToCollection(testPrompt);
    
    // Restore original prompt
    window.prompt = originalPrompt;
    
    // Allow time for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify prompt was added to collection
    return new Promise(resolve => {
      chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
        const collections = data.promptCollections || [];
        const activeIndex = data.activeCollectionIndex;
        
        if (typeof activeIndex !== 'number') {
          console.error('No active collection after save');
          resolve(false);
          return;
        }
        
        const collection = collections[activeIndex];
        if (!collection) {
          console.error('Active collection not found');
          resolve(false);
          return;
        }
        
        const prompts = collection.prompts || [];
        const newPromptCount = prompts.length;
        
        if (newPromptCount > initialPromptCount) {
          resolve(true);
        } else {
          console.error('Prompt not added to collection:', { 
            initialCount: initialPromptCount,
            newCount: newPromptCount
          });
          resolve(false);
        }
      });
    });
  });
  
  await testCase('Delete Collection Prompt', async () => {
    // First get active collection for testing
    const initialState = await new Promise(resolve => {
      chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
        resolve({
          collections: data.promptCollections || [],
          activeIndex: data.activeCollectionIndex
        });
      });
    });
    
    // If there's no active collection or it has no prompts, we can't proceed
    if (typeof initialState.activeIndex !== 'number' || 
        !initialState.collections[initialState.activeIndex] ||
        initialState.collections[initialState.activeIndex].prompts.length === 0) {
      return 'skipped';
    }
    
    const collectionIndex = initialState.activeIndex;
    const promptIndex = 0; // Delete the first prompt
    const initialPromptCount = initialState.collections[collectionIndex].prompts.length;
    
    // Mock confirm dialog to automatically confirm deletion
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    
    // Delete the prompt
    deleteCollectionPrompt(collectionIndex, promptIndex);
    
    // Restore original confirm
    window.confirm = originalConfirm;
    
    // Allow time for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify prompt was deleted
    return new Promise(resolve => {
      chrome.storage.local.get('promptCollections', data => {
        const collections = data.promptCollections || [];
        if (!collections[collectionIndex]) {
          console.error('Collection not found after deletion');
          resolve(false);
          return;
        }
        
        const newPromptCount = collections[collectionIndex].prompts.length;
        
        if (newPromptCount === initialPromptCount - 1) {
          resolve(true);
        } else {
          console.error('Prompt not deleted from collection:', { 
            initialCount: initialPromptCount,
            newCount: newPromptCount
          });
          resolve(false);
        }
      });
    });
  });
  
  await testCase('Export Collection', async () => {
    // This is harder to test automatically since it triggers a download
    // We'll mock the necessary DOM elements and check if they're created
    
    const originalCreateElement = document.createElement;
    let anchorCreated = false;
    
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(document, tagName);
      if (tagName.toLowerCase() === 'a') {
        anchorCreated = true;
        // Mock the click method to prevent actual download
        element.click = function() {};
      }
      return element;
    };
    
    // Get a collection to export
    const collections = await new Promise(resolve => {
      chrome.storage.local.get('promptCollections', data => {
        resolve(data.promptCollections || []);
      });
    });
    
    if (collections.length === 0) {
      document.createElement = originalCreateElement;
      return 'skipped';
    }
    
    // Try to export the first collection
    exportCollection(collections[0], 'json');
    
    // Restore original createElement
    document.createElement = originalCreateElement;
    
    return anchorCreated;
  });
  
  await testCase('Import Collection', async () => {
    // This is hard to test since it involves file selection
    // We'll skip this test for automated testing
    return 'skipped';
  });
}

// Test UI interactions
async function testUIInteractions() {
  console.log('\n🖥️ Testing UI Interactions...');
  
  await testCase('Toggle Input Visibility', async () => {
    // Get initial visibility state
    const inputContainer = document.getElementById('prompt-input-container');
    const toggleButton = document.getElementById('toggle-input');
    
    if (!inputContainer || !toggleButton) {
      console.error('Required DOM elements not found');
      return false;
    }
    
    const initialDisplay = inputContainer.style.display;
    const initialButtonText = toggleButton.textContent;
    
    // Create event object
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    // Dispatch click event
    toggleButton.dispatchEvent(clickEvent);
    
    // Allow time for event handling
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if state changed as expected
    const newDisplay = inputContainer.style.display;
    const newButtonText = toggleButton.textContent;
    
    return (initialDisplay === 'block' && newDisplay === 'none' && newButtonText === '+') ||
           (initialDisplay !== 'block' && newDisplay === 'block' && newButtonText === '−');
  });
  
  await testCase('Create Buffer Heading', async () => {
    const bufferCount = document.createElement('span');
    bufferCount.textContent = '(5/10)';
    
    const heading = createBufferHeading(bufferCount, true);
    
    return heading && 
           heading.tagName === 'H2' && 
           heading.querySelector('span').textContent === '▼';
  });
  
  await testCase('Create Collection Heading', async () => {
    const testCollection = {
      name: 'Test Collection',
      prompts: [
        { text: 'Test prompt 1', added: Date.now() },
        { text: 'Test prompt 2', added: Date.now(), done: true }
      ]
    };
    
    const heading = createCollectionHeading(testCollection, true, true);
    
    return heading && 
           heading.tagName === 'H2' && 
           heading.querySelector('span:nth-child(2)').textContent.includes('Test Collection') &&
           heading.querySelector('#reset-collection-button') !== null;
  });
  
  await testCase('Create Prompt Item Element', async () => {
    const testText = 'Test prompt item text';
    const promptItem = createPromptItemElement(testText, {
      index: 0,
      source: 'Test Source',
      includeEdit: true,
      includeDelete: true
    });
    
    return promptItem && 
           promptItem.classList.contains('prompt-item') &&
           promptItem.querySelector('.prompt-text').getAttribute('data-full-text') === testText &&
           promptItem.querySelector('.prompt-source').textContent.includes('Test Source') &&
           promptItem.querySelectorAll('button').length >= 3; // Copy, Edit, Delete buttons
  });
}

// Test clipboard operations
async function testClipboardOperations() {
  console.log('\n📎 Testing Clipboard Operations...');
  
  await testCase('Copy To Clipboard', async () => {
    // Mock clipboard API
    const originalClipboard = navigator.clipboard;
    let clipboardWriteCalled = false;
    
    navigator.clipboard = {
      writeText: (text) => {
        clipboardWriteCalled = true;
        return Promise.resolve();
      }
    };
    
    // Create a test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Copy';
    document.body.appendChild(testButton);
    
    // Test copy function
    copyToClipboard('Test clipboard text', testButton);
    
    // Allow time for async operations
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Restore original clipboard
    navigator.clipboard = originalClipboard;
    
    // Check if button text changed to "Copied"
    const buttonTextChanged = testButton.textContent === 'Copied';
    
    // Clean up
    document.body.removeChild(testButton);
    
    return clipboardWriteCalled && buttonTextChanged;
  });
  
  await testCase('Clipboard To Active Collection', async () => {
    // Mock clipboard API
    const originalClipboard = navigator.clipboard;
    
    navigator.clipboard = {
      readText: () => Promise.resolve('Test text from clipboard')
    };
    
    // Create button for test
    if (!document.getElementById('clipboard-to-active')) {
      const button = document.createElement('button');
      button.id = 'clipboard-to-active';
      button.className = 'action-button';
      document.body.appendChild(button);
    }
    
    // Ensure there's an active collection
    await new Promise(resolve => {
      chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
        const collections = data.promptCollections || [];
        let activeIndex = data.activeCollectionIndex;
        
        if (typeof activeIndex !== 'number' && collections.length > 0) {
          // Set first collection as active
          chrome.storage.local.set({ activeCollectionIndex: 0 }, resolve);
        } else {
          resolve();
        }
      });
    });
    
    // Execute the function
    clipboardToActiveCollection();
    
    // Allow time for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Restore original clipboard
    navigator.clipboard = originalClipboard;
    
    // Verify prompt was added to active collection
    return new Promise(resolve => {
      chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
        const collections = data.promptCollections || [];
        const activeIndex = data.activeCollectionIndex;
        
        if (typeof activeIndex !== 'number' || !collections[activeIndex]) {
          resolve(false);
          return;
        }
        
        const prompts = collections[activeIndex].prompts || [];
        const found = prompts.some(prompt => {
          const promptText = typeof prompt === 'string' ? prompt : prompt.text;
          return promptText === 'Test text from clipboard';
        });
        
        resolve(found);
      });
    });
  });
  
  await testCase('Clipboard To Buffer', async () => {
    // Mock clipboard API
    const originalClipboard = navigator.clipboard;
    
    navigator.clipboard = {
      readText: () => Promise.resolve('Test buffer text from clipboard')
    };
    
    // Create button for test
    if (!document.getElementById('clipboard-to-buffer')) {
      const button = document.createElement('button');
      button.id = 'clipboard-to-buffer';
      button.className = 'action-button';
      document.body.appendChild(button);
    }
    
    // Execute the function
    clipboardToBuffer();
    
    // Allow time for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Restore original clipboard
    navigator.clipboard = originalClipboard;
    
    // Verify prompt was added to buffer
    return new Promise(resolve => {
      chrome.storage.local.get('promptBuffer', data => {
        const buffer = data.promptBuffer || [];
        const found = buffer.includes('Test buffer text from clipboard');
        resolve(found);
      });
    });
  });
}

// Test search functionality
async function testSearchFunctionality() {
  console.log('\n🔍 Testing Search Functionality...');
  
  await testCase('Perform Search', async () => {
    // Set up test data
    await new Promise(resolve => {
      chrome.storage.local.get(['promptBuffer', 'promptCollections'], data => {
        const buffer = data.promptBuffer || [];
        const collections = data.promptCollections || [];
        
        // Add searchable items to buffer
        const updatedBuffer = [...buffer, 'SEARCHABLE unique test prompt'];
        
        // Add searchable items to collections
        let updatedCollections = collections;
        if (collections.length > 0) {
          updatedCollections = [...collections];
          updatedCollections[0].prompts.push({
            text: 'Another SEARCHABLE unique test prompt',
            added: Date.now()
          });
        }
        
        chrome.storage.local.set({
          promptBuffer: updatedBuffer,
          promptCollections: updatedCollections
        }, resolve);
      });
    });
    
    // Set up search input
    if (!document.getElementById('search-input')) {
      const searchInput = document.createElement('input');
      searchInput.id = 'search-input';
      document.body.appendChild(searchInput);
    }
    
    // Perform search
    performSearch('SEARCHABLE');
    
    // Allow time for async operations and rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check search results
    const searchResults = document.getElementById('search-results');
    
    return searchResults && 
           searchResults.innerHTML !== '' && 
           !searchResults.innerHTML.includes('Searching...') &&
           !searchResults.innerHTML.includes('Enter search terms above');
  });
  
  await testCase('Display Search Results', async () => {
    const testResults = [
      { text: 'Test result 1', source: 'Buffer' },
      { text: 'Test result 2', source: 'Collection: Test' }
    ];
    
    // Display results
    displaySearchResults(testResults);
    
    // Allow time for rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if results were displayed
    const searchResults = document.getElementById('search-results');
    
    return searchResults && 
           searchResults.querySelectorAll('.prompt-item').length === 2 &&
           searchResults.classList.contains('show');
  });
}

// Function to manually trigger the test suite
function testPromptCollectorExtension() {
  console.clear();
  console.log('='.repeat(50));
  console.log('PROMPT COLLECTOR EXTENSION TEST SUITE');
  console.log('='.repeat(50));
  
  // Start tests
  runAllTests().then(() => {
    console.log('\nTest suite complete!');
  });
}

// Export the test function
if (typeof module !== 'undefined') {
  module.exports = { testPromptCollectorExtension };
} else {
  // Make it available globally when run in browser
  window.testPromptCollectorExtension = testPromptCollectorExtension;
}