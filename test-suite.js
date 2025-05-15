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

  if (!document.getElementById('theme-toggle-container')) {
    const themeContainer = document.createElement('div');
    themeContainer.id = 'theme-toggle-container';
    document.body.appendChild(themeContainer);
  }

  if (!document.getElementById('clipboard-to-active')) {
    const clipboardToActive = document.createElement('button');
    clipboardToActive.id = 'clipboard-to-active';
    clipboardToActive.className = 'action-button';
    document.body.appendChild(clipboardToActive);
  }

  if (!document.getElementById('clipboard-to-buffer')) {
    const clipboardToBuffer = document.createElement('button');
    clipboardToBuffer.id = 'clipboard-to-buffer';
    clipboardToBuffer.className = 'action-button';
    document.body.appendChild(clipboardToBuffer);
  }

  if (!document.getElementById('save-to-buffer')) {
    const saveToBuffer = document.createElement('button');
    saveToBuffer.id = 'save-to-buffer';
    document.body.appendChild(saveToBuffer);
  }

  if (!document.getElementById('saveToCollection')) {
    const saveToCollection = document.createElement('button');
    saveToCollection.id = 'saveToCollection';
    document.body.appendChild(saveToCollection);
  }

  if (!document.getElementById('paste-from-clipboard')) {
    const pasteFromClipboard = document.createElement('button');
    pasteFromClipboard.id = 'paste-from-clipboard';
    document.body.appendChild(pasteFromClipboard);
  }

  if (!document.getElementById('help-link')) {
    const helpLink = document.createElement('a');
    helpLink.id = 'help-link';
    helpLink.href = '#';
    document.body.appendChild(helpLink);
  }

  if (!document.getElementById('prompt-link')) {
    const promptLink = document.createElement('a');
    promptLink.id = 'prompt-link';
    promptLink.href = '#';
    document.body.appendChild(promptLink);
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
    const data = await StorageManager.get([StorageManager.keys.COLLECTIONS, StorageManager.keys.ACTIVE_INDEX]);
    const collections = data[StorageManager.keys.COLLECTIONS] || [];
    const activeIndex = data[StorageManager.keys.ACTIVE_INDEX];
    
    if (collections.length > 0 && collections[0].name === 'First Prompt Collection' && activeIndex === 0) {
      return true;
    } else {
      console.error('Default collection not initialized correctly:', { collections, activeIndex });
      return false;
    }
  });
  
  await testCase('Storage Manager Buffer Operations', async () => {
    try {
      // Test adding to buffer
      const testText = "Test buffer text " + Date.now();
      await StorageManager.addToBuffer(testText);
      
      // Verify text was added
      const buffer = await StorageManager.getBuffer();
      if (!buffer.includes(testText)) {
        console.error('Text not found in buffer');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Buffer operation failed:', error);
      return false;
    }
  });

  await testCase('Storage Manager Collection Operations', async () => {
    try {
      const testCollection = {
        name: 'Test Collection ' + Date.now(),
        created: Date.now(),
        updated: Date.now(),
        prompts: []
      };
      
      // Test adding collection
      await StorageManager.addCollection(testCollection);
      
      // Verify collection was added
      const collections = await StorageManager.getCollections();
      const found = collections.some(c => c.name === testCollection.name);
      
      if (!found) {
        console.error('Collection not found after adding');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Collection operation failed:', error);
      return false;
    }
  });

  await testCase('Storage Manager Toggle States', async () => {
    try {
      // Test setting toggle states
      await StorageManager.setToggleState(StorageManager.keys.BUFFER_TOGGLE, true);
      await StorageManager.setToggleState(StorageManager.keys.COLLECTION_TOGGLE, false);
      
      // Verify states were set
      const toggleStates = await StorageManager.getToggleStates();
      
      if (toggleStates.bufferToggle !== true || toggleStates.collectionToggle !== false) {
        console.error('Toggle states not set correctly:', toggleStates);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Toggle state operation failed:', error);
      return false;
    }
  });
}

// Test buffer functionality
async function testBufferFunctionality() {
  console.log('\n📋 Testing Buffer Functionality...');
  
  await testCase('Save To Buffer', async () => {
    const testText = "Test prompt for buffer " + Date.now();
    await saveToBuffer(testText);
    
    // Verify prompt was added to buffer
    const buffer = await StorageManager.getBuffer();
    if (!buffer.includes(testText)) {
      console.error('Text not saved to buffer:', { buffer, testText });
      return false;
    }
    return true;
  });
  
  await testCase('Delete From Buffer', async () => {
    // First add test items to buffer
    const testItems = ["Delete test 1", "Delete test 2", "Delete test 3"];
    
    // Add test items to buffer
    const buffer = await StorageManager.getBuffer();
    const updatedBuffer = [...buffer, ...testItems];
    await StorageManager.set({ [StorageManager.keys.BUFFER]: updatedBuffer });
    
    const bufferLength = updatedBuffer.length;
    
    // Delete the second-to-last item (in display order)
    await deletePrompt(1);
    
    // Verify item was deleted
    const newBuffer = await StorageManager.getBuffer();
    if (newBuffer.length !== bufferLength - 1) {
      console.error('Item not deleted from buffer:', { 
        originalLength: bufferLength,
        newLength: newBuffer.length
      });
      return false;
    }
    return true;
  });
  
  await testCase('Load Buffer Items', async () => {
    // Add some test items first
    const testItems = ["Test buffer item 1", "Test buffer item 2"];
    const buffer = await StorageManager.getBuffer();
    const updatedBuffer = [...buffer, ...testItems];
    await StorageManager.set({ [StorageManager.keys.BUFFER]: updatedBuffer });
    
    // Manually trigger loadBufferItems
    await loadBufferItems();
    
    // Check if buffer list is populated
    const bufferList = document.getElementById('buffer-list');
    if (!bufferList || !bufferList.innerHTML || bufferList.innerHTML === '<div class="empty-message">No prompts saved in buffer yet</div>') {
      console.error('Buffer list not populated correctly');
      return false;
    }
    return true;
  });

  await testCase('Edit Buffer Prompt', async () => {
    // First add a test item
    const originalText = "Original buffer text " + Date.now();
    await saveToBuffer(originalText);
    
    const buffer = await StorageManager.getBuffer();
    const index = buffer.length - 1; // Last item
    
    // Mock prompt for editing
    const originalPrompt = window.prompt;
    const editedText = "Edited buffer text " + Date.now();
    window.prompt = () => editedText;
    
    // Edit the prompt
    editPrompt(0); // Edit first item in display order (last in buffer)
    
    // Restore original prompt
    window.prompt = originalPrompt;
    
    // Allow time for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify text was updated
    const updatedBuffer = await StorageManager.getBuffer();
    const found = updatedBuffer.includes(editedText);
    
    if (!found) {
      console.error('Buffer item not edited:', {
        original: originalText,
        edited: editedText,
        buffer: updatedBuffer
      });
      return false;
    }
    return true;
  });
}

// Test collection functionality
async function testCollectionFunctionality() {
  console.log('\n📚 Testing Collection Functionality...');
  
  await testCase('Create New Collection', async () => {
    const testCollectionName = "Test Collection " + Date.now();
    await createNewCollection(testCollectionName);
    
    // Verify collection was created
    const collections = await StorageManager.getCollections();
    const found = collections.some(c => c.name === testCollectionName);
    
    if (!found) {
      console.error('Collection not created:', { collections, testName: testCollectionName });
      return false;
    }
    return true;
  });
  
  await testCase('Make Collection Active', async () => {
    const collections = await StorageManager.getCollections();
    
    if (collections.length < 2) {
      console.log('Not enough collections to test activation');
      return 'skipped';
    }
    
    // Make the second collection active
    await makeCollectionActive(1);
    
    // Verify active collection was updated
    const activeIndex = await StorageManager.getActiveCollectionIndex();
    if (activeIndex !== 1) {
      console.error('Collection not activated:', { 
        expectedIndex: 1, 
        actualIndex: activeIndex 
      });
      return false;
    }
    return true;
  });
  
  await testCase('Save To Collection', async () => {
    // Mock window.prompt to return a collection name
    const originalPrompt = window.prompt;
    const testText = "Test prompt for collection " + Date.now();
    
    // Get initial state
    const collections = await StorageManager.getCollections();
    if (collections.length === 0) {
      window.prompt = () => "New Test Collection";
    } else {
      window.prompt = () => collections[0].name;
    }
    
    // Save to collection
    await new Promise(resolve => {
      saveToCollection(testText);
      setTimeout(resolve, 500); // Allow time for storage operations
    });
    
    // Restore original prompt
    window.prompt = originalPrompt;
    
    // Verify prompt was added
    const updatedCollections = await StorageManager.getCollections();
    const collection = updatedCollections.find(c => 
      c.prompts.some(p => {
        const promptText = typeof p === 'string' ? p : p.text;
        return promptText === testText;
      })
    );
    
    if (!collection) {
      console.error('Prompt not added to collection:', { updatedCollections, testText });
      return false;
    }
    return true;
  });

  await testCase('Mark Collection Prompt as Done', async () => {
    // Mock clipboard API and focus
    const originalClipboard = navigator.clipboard;
    const originalHasFocus = document.hasFocus;
    const originalWindowFocus = window.focus;
    
    navigator.clipboard = {
      writeText: () => Promise.resolve()
    };
    document.hasFocus = () => true;
    window.focus = () => {};
    
    // Get a collection with prompts
    const collections = await StorageManager.getCollections();
    const activeIndex = await StorageManager.getActiveCollectionIndex();
    
    if (!collections[activeIndex] || collections[activeIndex].prompts.length === 0) {
      // Add a test prompt if none exists
      const testPrompt = {
        text: "Test prompt for marking done " + Date.now(),
        added: Date.now()
      };
      collections[activeIndex].prompts.push(testPrompt);
      await StorageManager.set({ [StorageManager.keys.COLLECTIONS]: collections });
    }
    
    // Create test prompt item
    const promptIndex = 0;
    const prompt = collections[activeIndex].prompts[promptIndex];
    const promptItem = createCollectionPromptItem(prompt, promptIndex, activeIndex);
    document.body.appendChild(promptItem);
    
    // Find and click the "Copy & hide" button
    const copyDoneBtn = promptItem.querySelector('button');
    copyDoneBtn.click();
    
    // Allow time for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Restore original clipboard and focus
    navigator.clipboard = originalClipboard;
    document.hasFocus = originalHasFocus;
    window.focus = originalWindowFocus;
    
    // Clean up
    document.body.removeChild(promptItem);
    
    // Verify prompt was marked as done
    const updatedCollections = await StorageManager.getCollections();
    const updatedPrompt = updatedCollections[activeIndex].prompts[promptIndex];
    
    if (typeof updatedPrompt !== 'object' || !updatedPrompt.done) {
      console.error('Prompt not marked as done:', updatedPrompt);
      return false;
    }
    return true;
  });

  await testCase('Reset Collection Prompts', async () => {
    const [collections, activeIndex] = await Promise.all([
      StorageManager.getCollections(),
      StorageManager.getActiveCollectionIndex()
    ]);
    
    if (typeof activeIndex !== 'number' || !collections[activeIndex]) {
      return 'skipped';
    }
    
    // Mark a prompt as done first
    const collection = collections[activeIndex];
    if (collection.prompts.length === 0) {
      console.log('No prompts to test reset');
      return 'skipped';
    }
    
    collection.prompts[0] = {
      text: typeof collection.prompts[0] === 'string' ? collection.prompts[0] : collection.prompts[0].text,
      added: Date.now(),
      done: true
    };
    
    await StorageManager.set({ [StorageManager.keys.COLLECTIONS]: collections });
    
    // Call reset function
    resetCollectionPrompts();
    
    // Allow time for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify prompts were reset
    const updatedCollections = await StorageManager.getCollections();
    const hasCompletedPrompts = updatedCollections[activeIndex].prompts.some(
      prompt => typeof prompt === 'object' && prompt.done === true
    );
    
    if (hasCompletedPrompts) {
      console.error('Not all prompts were reset');
      return false;
    }
    return true;
  });
  
  await testCase('Delete Collection Prompt', async () => {
    const [collections, activeIndex] = await Promise.all([
      StorageManager.getCollections(),
      StorageManager.getActiveCollectionIndex()
    ]);
    
    if (typeof activeIndex !== 'number' || !collections[activeIndex] || collections[activeIndex].prompts.length === 0) {
      return 'skipped';
    }
    
    const initialPromptCount = collections[activeIndex].prompts.length;
    
    // Mock confirm dialog
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    
    // Delete the first prompt
    deleteCollectionPrompt(activeIndex, 0);
    
    // Restore original confirm
    window.confirm = originalConfirm;
    
    // Allow time for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify prompt was deleted
    const updatedCollections = await StorageManager.getCollections();
    const newPromptCount = updatedCollections[activeIndex].prompts.length;
    
    if (newPromptCount !== initialPromptCount - 1) {
      console.error('Prompt not deleted from collection:', { 
        initialCount: initialPromptCount,
        newCount: newPromptCount
      });
      return false;
    }
    return true;
  });
}

// Test UI interactions
async function testUIInteractions() {
  console.log('\n🖥️ Testing UI Interactions...');
  
  await testCase('Theme Toggle', async () => {
    // Create theme toggle button if not exists
    if (!document.getElementById('theme-toggle')) {
      const button = document.createElement('button');
      button.id = 'theme-toggle';
      button.className = 'action-button toggle-button';
      document.getElementById('theme-toggle-container').appendChild(button);
    }
    
    // Get initial theme
    const initialTheme = await StorageManager.get(StorageManager.keys.THEME);
    const initialIsDark = document.body.classList.contains('dark-mode');
    
    // Click the toggle button
    const toggleButton = document.getElementById('theme-toggle');
    toggleButton.click();
    
    // Allow time for theme change
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify theme was toggled
    const newIsDark = document.body.classList.contains('dark-mode');
    if (newIsDark === initialIsDark) {
      console.error('Theme did not toggle:', { initialIsDark, newIsDark });
      return false;
    }
    
    // Verify theme was saved
    const savedTheme = await StorageManager.get(StorageManager.keys.THEME);
    if (savedTheme[StorageManager.keys.THEME] !== (newIsDark ? 'dark' : 'light')) {
      console.error('Theme not saved correctly:', savedTheme);
      return false;
    }
    
    return true;
  });

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
    const heading = createBufferHeading(true);
    
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
    
    // Mock document.hasFocus and window.focus
    const originalHasFocus = document.hasFocus;
    const originalWindowFocus = window.focus;
    document.hasFocus = () => true;
    window.focus = () => {};
    
    // Create a test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Copy';
    document.body.appendChild(testButton);
    
    // Test copy function
    await copyToClipboard('Test clipboard text', testButton);
    
    // Restore original clipboard and focus
    navigator.clipboard = originalClipboard;
    document.hasFocus = originalHasFocus;
    window.focus = originalWindowFocus;
    
    // Check if button text changed to "Copied"
    const buttonTextChanged = testButton.textContent === 'Copied';
    
    // Clean up
    document.body.removeChild(testButton);
    
    return clipboardWriteCalled && buttonTextChanged;
  });
  
  await testCase('Clipboard To Active Collection', async () => {
    // Mock clipboard API and focus
    const originalClipboard = navigator.clipboard;
    const originalHasFocus = document.hasFocus;
    const originalWindowFocus = window.focus;
    
    navigator.clipboard = {
      readText: () => Promise.resolve('Test text from clipboard')
    };
    document.hasFocus = () => true;
    window.focus = () => {};
    
    // Create button for test
    if (!document.getElementById('clipboard-to-active')) {
      const button = document.createElement('button');
      button.id = 'clipboard-to-active';
      button.className = 'action-button';
      document.body.appendChild(button);
    }
    
    // Ensure there's an active collection
    const collections = await StorageManager.getCollections();
    const activeIndex = await StorageManager.getActiveCollectionIndex();
    
    if (typeof activeIndex !== 'number' && collections.length > 0) {
      await StorageManager.setActiveCollectionIndex(0);
    }
    
    // Execute the function
    await clipboardToActiveCollection();
    
    // Allow time for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Restore original clipboard and focus
    navigator.clipboard = originalClipboard;
    document.hasFocus = originalHasFocus;
    window.focus = originalWindowFocus;
    
    // Verify prompt was added to active collection
    const updatedCollections = await StorageManager.getCollections();
    const currentActiveIndex = await StorageManager.getActiveCollectionIndex();
    
    if (typeof currentActiveIndex !== 'number' || !updatedCollections[currentActiveIndex]) {
      return false;
    }
    
    const prompts = updatedCollections[currentActiveIndex].prompts || [];
    return prompts.some(prompt => {
      const promptText = typeof prompt === 'string' ? prompt : prompt.text;
      return promptText === 'Test text from clipboard';
    });
  });
  
  await testCase('Clipboard To Buffer', async () => {
    // Mock clipboard API and focus
    const originalClipboard = navigator.clipboard;
    const originalHasFocus = document.hasFocus;
    const originalWindowFocus = window.focus;
    
    navigator.clipboard = {
      readText: () => Promise.resolve('Test buffer text from clipboard')
    };
    document.hasFocus = () => true;
    window.focus = () => {};
    
    // Create button for test
    if (!document.getElementById('clipboard-to-buffer')) {
      const button = document.createElement('button');
      button.id = 'clipboard-to-buffer';
      button.className = 'action-button';
      document.body.appendChild(button);
    }
    
    // Execute the function
    await clipboardToBuffer();
    
    // Allow time for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Restore original clipboard and focus
    navigator.clipboard = originalClipboard;
    document.hasFocus = originalHasFocus;
    window.focus = originalWindowFocus;
    
    // Verify prompt was added to buffer
    const buffer = await StorageManager.getBuffer();
    return buffer.includes('Test buffer text from clipboard');
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