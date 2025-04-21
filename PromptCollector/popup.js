// Structure scripts:
// CONSTANTS
// Any constants or configuration values

// INITIALIZATION
// Functions that run when the extension loads
// - initTabs()
// - setupEventListeners()
// - DOMContentLoaded handler

// UI MANIPULATION
// Functions that handle UI changes
// - toggleActiveCollectionEditMode()
// - updateActiveCollectionUI()
// - displaySearchResults()

// ELEMENT CREATORS
// Functions that create DOM elements
// - createPromptItemElement()
// - createCollectionItem()

// DATA LOADERS
// Functions that load data from storage
// - loadBufferItems()
// - loadCollections()
// - performSearch()

// DATA MODIFIERS
// Functions that modify stored data
// - saveToBuffer()
// - saveToCollection()
// - editPrompt()
// - editCollectionPrompt()
// - deletePrompt()
// - deleteCollectionPrompt()
// - renameCollection()
// - createNewCollection()
// - makeCollectionActive()
// - deleteCollection()

// CLIPBOARD OPERATIONS
// Functions that deal with clipboard
// - copyToClipboard()
// - clipboardToActiveCollection()

// IMPORT/EXPORT
// Functions for importing/exporting collections
// - exportCollection()
// - importCollection() (not implemented yet)

// UTILITIES
// Helper functions
// - safeStorageOperation()





document.addEventListener('DOMContentLoaded', () => {
  // Initialize the extension
  initTabs();
  loadBufferItems();
  loadCollections();
  setupEventListeners();

  // Set initial state of toggle button to match hidden input area
  const toggleButton = document.getElementById('toggle-input');
  toggleButton.textContent = '+';
});

// Let active collections be not in edit mode in the start
let activeCollectionEditMode = false;



// Tab functionality
const initTabs = () => {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const contentId = tab.id.replace('-tab', '-content');
      document.getElementById(contentId).classList.add('active');
    });
  });
};

// Load buffer items from storage
const loadBufferItems = () => {
  chrome.storage.local.get(['promptBuffer', 'promptCollections', 'activeCollectionIndex', 'collectionToggleState', 'bufferToggleState'], data => {
    const bufferList = document.getElementById('buffer-list');
    const bufferCount = document.getElementById('buffer-count');

    const buffer = data.promptBuffer || [];
    const collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;
    const collectionToggleState = data.collectionToggleState !== undefined ? data.collectionToggleState : true;
    const bufferToggleState = data.bufferToggleState !== undefined ? data.bufferToggleState : true;

    bufferList.innerHTML = '';
    bufferCount.textContent = `(${buffer.length}/10)`;
    // Create a buffer heading with toggle functionality

    const introMessage = document.getElementById('intro-message');
    if (introMessage) {
      const hasBufferItems = buffer.length > 0;
      const hasActivePrompts = typeof activeIndex === 'number' && collections[activeIndex]?.prompts.length > 0;
    
      // Hide the message if there's anything saved
      if (hasBufferItems || hasActivePrompts) {
        introMessage.style.display = 'none';
      } else {
        introMessage.style.display = 'block';
      }
    }

    if (buffer.length > 0) {
      const heading = document.createElement('h2');
      heading.style.cursor = 'pointer';
      heading.style.display = 'flex';
      heading.style.alignItems = 'center';
      heading.style.gap = '8px';
      
      const caret = document.createElement('span');
      caret.textContent = bufferToggleState ? '▼' : '►';
      caret.style.fontSize = '0.75rem';
      
      const headingText = document.createElement('span');
      headingText.textContent = 'Buffer';
      
      const countSpan = document.createElement('span');
      countSpan.textContent = `(${buffer.length}/10)`;

      heading.appendChild(caret);
      heading.appendChild(headingText);
      heading.appendChild(bufferCount);
      
      const bufferContainer = document.createElement('div');
      bufferContainer.className = 'buffer-container';
      bufferContainer.style.display = bufferToggleState ? 'block' : 'none';
      
      if (buffer.length === 0) {
        bufferContainer.innerHTML = '<div class="empty-message">No prompts saved in buffer yet</div>';
      } else {
        buffer.slice().reverse().forEach((item, index) => {
          const promptItem = createPromptItemElement(item, {
            index,
          });
          bufferContainer.appendChild(promptItem);
        });
      }
      
      // Use the saved toggle state
      let isVisible = bufferToggleState;
      
      heading.addEventListener('click', () => {
        isVisible = !isVisible;
        bufferContainer.style.display = isVisible ? 'block' : 'none';
        caret.textContent = isVisible ? '▼' : '►';
        
        // Save the new toggle state
        chrome.storage.local.set({ bufferToggleState: isVisible });
      });
      
      bufferList.appendChild(heading);
      bufferList.appendChild(bufferContainer);
    } else {
      bufferCount.textContent = `(${buffer.length}/10)`;
      bufferList.innerHTML = '<div class="empty-message">No prompts saved in buffer yet</div>';
    }
    
    // Show active collection (if any)
    if (typeof activeIndex === 'number' && collections[activeIndex]) {
      const activeCollection = collections[activeIndex];
    
      const heading = document.createElement('h2');
      heading.style.cursor = 'pointer';
      heading.style.display = 'flex';
      heading.style.alignItems = 'center';
      heading.style.gap = '8px';
    
      const caret = document.createElement('span');
      caret.textContent = collectionToggleState ? '▼' : '►';
      caret.style.fontSize = '0.75rem';
      const headingText = document.createElement('span');
      headingText.textContent = `${activeCollection.name} (${activeCollection.prompts.length})`;

      // Add Edit/Done button for the collection
      const editBtn = document.createElement('button');
      editBtn.className = 'toggle-button';
      editBtn.setAttribute('title', activeCollectionEditMode ? 'Done' : 'Edit');
      editBtn.innerHTML = activeCollectionEditMode ? 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"</path></svg>': 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
      editBtn.style.marginLeft = 'auto';
      editBtn.addEventListener('click', event => {
        event.stopPropagation(); // Prevent triggering the heading click
        toggleActiveCollectionEditMode();
      });
    
      heading.appendChild(caret);
      heading.appendChild(headingText);
      heading.appendChild(editBtn);
    
      const collectionContainer = document.createElement('div');
      collectionContainer.className = 'collection-container';
      collectionContainer.style.display = collectionToggleState ? 'block' : 'none';
    
      activeCollection.prompts.forEach((prompt, promptIndex) => {
        // Get the text from the prompt object
        const promptText = typeof prompt === 'string' ? prompt : prompt.text;
        
        if (activeCollectionEditMode) {
          // Create custom prompt item with edit/delete capabilities for collection
          const promptItem = document.createElement('div');
          promptItem.className = 'prompt-item';
          
          const promptTextDiv = document.createElement('div');
          promptTextDiv.className = 'prompt-text';
          
          // Display text reduced to 50 symbols 
          const displayText = promptText.length > 50 ? promptText.substring(0, 50) + '...' : promptText;
          promptTextDiv.textContent = displayText;
          promptTextDiv.setAttribute('data-full-text', promptText);
          promptTextDiv.setAttribute('data-expanded', 'false');
          
          const actions = document.createElement('div');
          actions.className = 'prompt-actions';
          
          // Copy button
          const copyBtn = document.createElement('button');
          copyBtn.textContent = 'Copy';
          copyBtn.addEventListener('click', () => copyToClipboard(promptText, copyBtn));
          actions.appendChild(copyBtn);
          
          // Edit button
          const editBtn = document.createElement('button');
          editBtn.textContent = 'Edit';
          editBtn.addEventListener('click', () => editCollectionPrompt(activeIndex, promptIndex));
          actions.appendChild(editBtn);
          
          // Delete button
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Delete';
          deleteBtn.addEventListener('click', () => deleteCollectionPrompt(activeIndex, promptIndex));
          actions.appendChild(deleteBtn);
          
          promptItem.appendChild(promptTextDiv);
          promptItem.appendChild(actions);
          
          // Make the prompt text expandable on click
          promptTextDiv.addEventListener('click', function() {
            const isExpanded = this.getAttribute('data-expanded') === 'true';
            if (isExpanded) {
              this.textContent = displayText;
              this.setAttribute('data-expanded', 'false');
            } else {
              this.textContent = this.getAttribute('data-full-text');
              this.setAttribute('data-expanded', 'true');
            }
          });
          
          // Add the double-click listener to copy the text to clipboard
          promptTextDiv.addEventListener('dblclick', () => {
            copyToClipboard(promptText, copyBtn);
          });
          
          collectionContainer.appendChild(promptItem);
        } else {
          // Use the standard function to create prompt items when not in edit mode
          const promptItem = createPromptItemElement(promptText, {
            source: '',
            includeEdit: false,
            includeDelete: false,
            includeSaveToCollection: false,
            includeSaveToBuffer: false // Allow saving to buffer when not in edit mode
          });
          collectionContainer.appendChild(promptItem);
        }
      });
    
      // Use the saved toggle state
      let isVisible = collectionToggleState;
    
      heading.addEventListener('click', () => {
        isVisible = !isVisible;
        collectionContainer.style.display = isVisible ? 'block' : 'none';
        caret.textContent = isVisible ? '▼' : '►';
        
        // Save the new toggle state
        chrome.storage.local.set({ collectionToggleState: isVisible });
      });
    
      bufferList.appendChild(heading);
      bufferList.appendChild(collectionContainer);
    } 
  });
  
};

// Function to edit a prompt within a collection
const editCollectionPrompt = (collectionIndex, promptIndex) => {
  chrome.storage.local.get('promptCollections', data => {
    const collections = data.promptCollections || [];
    if (!collections[collectionIndex] || !collections[collectionIndex].prompts[promptIndex]) {
      alert('Prompt not found.');
      return;
    }
    
    const prompt = collections[collectionIndex].prompts[promptIndex];
    const promptText = typeof prompt === 'string' ? prompt : prompt.text;
    
    // Show dialog to edit the prompt text
    const newText = window.prompt('Edit prompt:', promptText);
    if (newText === null) return; // User clicked Cancel
    
    // Update the prompt
    if (typeof prompt === 'string') {
      collections[collectionIndex].prompts[promptIndex] = newText;
    } else {
      collections[collectionIndex].prompts[promptIndex].text = newText;
    }
    
    // Update the collection's "updated" timestamp
    collections[collectionIndex].updated = Date.now();
    
    // Save back to storage
    chrome.storage.local.set({ promptCollections: collections }, () => {
      loadBufferItems(); // Refresh the display
    });
  });
};

// Unified function to create prompt item elements
const createPromptItemElement = (text, options = {}) => {
  const { 
    index = null, 
    source = null, 
    includeEdit = true,
    includeDelete = true,
    includeSaveToCollection = true,
    includeSaveToBuffer = false 
  } = options;
  
  const item = document.createElement('div');
  item.className = 'prompt-item';
  
  const promptText = document.createElement('div');
  promptText.className = 'prompt-text';

  // Display text reduced to 50 symbols
  const displayText = text.length > 50 ? text.substring(0, 50) + '...' : text;
  promptText.textContent = displayText;
  promptText.setAttribute('data-full-text', text);
  promptText.setAttribute('data-expanded', 'false');

  // Add source, buffer or collection mainly
  if (source) {
    const sourceElement = document.createElement('div');
    sourceElement.className = 'prompt-source';
    sourceElement.textContent = `${source}`;
    sourceElement.style.fontSize = '12px';
    sourceElement.style.color = '#777';
    sourceElement.style.marginBottom = '8px';
    item.appendChild(sourceElement);
  }
  
  const actions = document.createElement('div');
  actions.className = 'prompt-actions';
  
  // Copy button (always included)
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy to clipboard';
  copyBtn.addEventListener('click', () => copyToClipboard(text, copyBtn));
  actions.appendChild(copyBtn);
  
  // Optional buttons
  if (includeEdit && index !== null) {
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editPrompt(index));
    actions.appendChild(editBtn);
  }
  
  if (includeDelete && index !== null) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deletePrompt(index));
    actions.appendChild(deleteBtn);
  }
  
  if (includeSaveToCollection) {
    const saveToCollectionBtn = document.createElement('button');
    
    saveToCollectionBtn.textContent = 'Save';
    saveToCollectionBtn.addEventListener('click', () => saveToCollection(text));
    actions.appendChild(saveToCollectionBtn);
  }
  
  if (includeSaveToBuffer) {
    const saveToBufferBtn = document.createElement('button');
    saveToBufferBtn.textContent = 'Save to Buffer';
    
    saveToBufferBtn.addEventListener('click', () => saveToBuffer(text));
    actions.appendChild(saveToBufferBtn);
  }
  
  item.appendChild(promptText);
  item.appendChild(actions);
  
  // Make the prompt text expandable on click
  promptText.addEventListener('click', function() {
    const isExpanded = this.getAttribute('data-expanded') === 'true';
    if (isExpanded) {
      this.textContent = displayText;
      this.setAttribute('data-expanded', 'false');
    } else {
      this.textContent = this.getAttribute('data-full-text');
      this.setAttribute('data-expanded', 'true');
    }
  });

  // Add the double-click listener to copy the text to clipboard
  promptText.addEventListener('dblclick', () => {
    copyToClipboard(text, copyBtn);
  });
  
  return item;
};

// Unified Copy text to clipboard function
const copyToClipboard = (text, button) => {
  navigator.clipboard.writeText(text).then(() => {
    // If a button reference was passed, update its appearance
    if (button) {
      button.textContent = 'Copied';
      button.classList.add('copied');
      
      setTimeout(() => {
        button.textContent = 'Copy to clipboard';
        button.classList.remove('copied');
      }, 2000);
    }
    
    console.log('Text copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
};

// Shortcut to save clipboard to active collection
const clipboardToActiveCollection = () => {
  // Get the button for status update
  const clipboardToActiveButton = document.getElementById('clipboard-to-active');
  const originalClassName = clipboardToActiveButton.className;
  
  // First check if there's an active collection
  chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
    const collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;
    
    // Check if there's an active collection
    if (typeof activeIndex !== 'number' || !collections[activeIndex]) {
      // Show temporary message in the button
      alert('No active collection selected. Please create or activate a collection first.');
      return;
    }
    
    // Get text from clipboard
    navigator.clipboard.readText()
      .then(text => {
        if (!text.trim()) {
          // Show empty clipboard message
          clipboardToActiveButton.textContent = 'Empty clipboard';
          clipboardToActiveButton.className = originalClassName + ' error-state';
          
          setTimeout(() => {
            clipboardToActiveButton.textContent = '';
            clipboardToActiveButton.className = originalClassName;
          }, 2000);
          return;
        }
        
        // Add prompt to active collection
        collections[activeIndex].prompts.push({
          text: text,
          added: Date.now()
        });
        collections[activeIndex].updated = Date.now();
        
        // Save back to storage
        chrome.storage.local.set({ promptCollections: collections }, () => {
          // Show saved message
          //clipboardToActiveButton.textContent = 'V';
          //clipboardToActiveButton.className = originalClassName + ' copied';
          
          //setTimeout(() => {
          //  clipboardToActiveButton.textContent = '';
          //  clipboardToActiveButton.className = originalClassName;
         //}, 2000);
          
          loadCollections();
          loadBufferItems();
        });
      })
      .catch(err => {
        console.error('Failed to read clipboard: ', err);
        // Show error message
        clipboardToActiveButton.textContent = 'Error';
        clipboardToActiveButton.className = originalClassName + ' error-state';
        
        setTimeout(() => {
          clipboardToActiveButton.textContent = '';
          clipboardToActiveButton.className = originalClassName;
        }, 2000);
      });
  });
};

const clipboardToBuffer = () => {
  // Get the button for status update
  const clipboardToBufferButton = document.getElementById('clipboard-to-buffer');
  const originalClassName = clipboardToBufferButton.className;

  // Get text from clipboard
  navigator.clipboard.readText()
    .then(text => {
      if (!text.trim()) {
        // Show empty clipboard message
        clipboardToBufferButton.textContent = 'Empty clipboard';
        clipboardToBufferButton.className = originalClassName + ' error-state';

        setTimeout(() => {
          clipboardToBufferButton.textContent = '';
          clipboardToBufferButton.className = originalClassName;
        }, 2000);
        return;
      }

      // Save prompt to buffer
      chrome.storage.local.get('promptBuffer', data => {
        let buffer = data.promptBuffer || [];

        // Check if the exact same text already exists in the buffer
        if (buffer.some(item => item === text)) {
          clipboardToBufferButton.textContent = 'Already in buffer';
          clipboardToBufferButton.className = originalClassName + ' error-state';

          setTimeout(() => {
            clipboardToBufferButton.textContent = '';
            clipboardToBufferButton.className = originalClassName;
          }, 2000);
          return;
        }

        // Add the text to the buffer
        buffer.push(text);

        // Limit buffer size to 10 items
        if (buffer.length > 10) {
          buffer = buffer.slice(buffer.length - 10);
        }

        // Save back to storage
        chrome.storage.local.set({ promptBuffer: buffer }, () => {
          // Show saved message
          clipboardToBufferButton.textContent = 'Saved to buffer';
          clipboardToBufferButton.className = originalClassName + ' success-state';

          setTimeout(() => {
            clipboardToBufferButton.textContent = '';
            clipboardToBufferButton.className = originalClassName;
          }, 2000);

          loadBufferItems(); // Refresh the buffer display
        });
      });
    })
    .catch(err => {
      console.error('Failed to read clipboard: ', err);
      // Show error message
      clipboardToBufferButton.textContent = 'Error';
      clipboardToBufferButton.className = originalClassName + ' error-state';

      setTimeout(() => {
        clipboardToBufferButton.textContent = '';
        clipboardToBufferButton.className = originalClassName;
      }, 2000);
    });
};

// Delete a prompt from buffer
const deletePrompt = (index) => {
  chrome.storage.local.get('promptBuffer', data => {
    let buffer = data.promptBuffer || [];
    // Convert from display index (reversed) to actual index
    const actualIndex = buffer.length - 1 - index;
    
    buffer.splice(actualIndex, 1);
    
    chrome.storage.local.set({ promptBuffer: buffer }, () => {
      loadBufferItems();
    });
  });
};

// Edit a prompt
const editPrompt = (index) => {
  chrome.storage.local.get('promptBuffer', data => {
    let buffer = data.promptBuffer || [];
    const actualIndex = buffer.length - 1 - index;

    const text = buffer[actualIndex];
    const promptInput = document.getElementById('prompt-input');
    const originalValue = promptInput.value; // Store original input value
    
    // Show input area if it's hidden
    const inputContainer = document.getElementById('prompt-input-container');
    const toggleButton = document.getElementById('toggle-input');
    const wasHidden = inputContainer.style.display !== 'block';
    
    if (wasHidden) {
      inputContainer.style.display = 'block';
      toggleButton.textContent = '−';
    }
    
    // Set input value to the prompt being edited
    promptInput.value = text;
    promptInput.focus();
    
    // Create temporary edit controls
    const editControls = document.createElement('div');
    editControls.id = 'edit-controls';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Changes';
    saveButton.className = 'action-button';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'action-button secondary';
    cancelButton.textContent = 'Cancel edit';
    
    editControls.appendChild(cancelButton);
    editControls.appendChild(saveButton);
    
    
    const pasteButton = document.getElementById('paste-from-clipboard');
    pasteButton.insertAdjacentElement('afterend', editControls);
    
    // Define cleanup function
    const cleanup = (restore = false) => {
      // Remove temp controls
      if (document.getElementById('edit-controls')) {
        document.getElementById('edit-controls').remove();
      }
      
      // Reset input if canceling
      if (restore) {
        promptInput.value = originalValue;
      }
      
      // Return to previous input visibility state
      if (wasHidden) {
        inputContainer.style.display = 'none';
        toggleButton.textContent = '+';
      }
      
      // Remove key listener
      promptInput.onkeydown = null;
    };
    
    // Function to save changes
    const saveChanges = () => {
      const newText = promptInput.value.trim();
      
      if (!newText) {
        alert('Prompt cannot be empty.');
        return;
      }
      
      // Remove the prompt being edited
      buffer.splice(actualIndex, 1);
      
      // Save buffer without this item
      chrome.storage.local.set({ promptBuffer: buffer }, () => {
        // Add the new version
        chrome.storage.local.get('promptBuffer', data => {
          let updatedBuffer = data.promptBuffer || [];
          updatedBuffer.push(newText);
          
          chrome.storage.local.set({ promptBuffer: updatedBuffer }, () => {
            cleanup();
            loadBufferItems(); // Refresh display
          });
        });
      });
    };
    
    // Save button handler
    saveButton.addEventListener('click', saveChanges);
    
    // Cancel button handler
    cancelButton.addEventListener('click', () => {
      // Just restore original state
      cleanup(true);
      
      // Re-add the item we removed (nothing changed)
      loadBufferItems();
    });
    
    // Listen for Enter key
    promptInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        saveChanges();
      } else if (e.key === 'Escape') {
        cancelButton.click(); // Trigger cancel
      }
    };
  });
};


const makePromptItemsDraggable = () => {
  const promptItems = document.querySelectorAll('.collection-container .prompt-item');
  
  promptItems.forEach((item, index) => {
    // Add draggable attribute
    item.setAttribute('draggable', 'true');
    item.dataset.index = index; // Store the original index
    
    // Add a visual drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '☰'; // Unicode hamburger icon
    dragHandle.style.cursor = 'grab';
    dragHandle.style.marginRight = '8px';
    
    // Insert drag handle as first child
    item.insertBefore(dragHandle, item.firstChild);
    
    // Add drag event listeners
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
  });
};

// Drag event handlers
let draggedItem = null;
let dragSource = null;

function handleDragStart(e) {
  draggedItem = this;
  dragSource = parseInt(this.dataset.index);
  
  // Set data for drag operation (required for Firefox)
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
  
  // Add styling to show item is being dragged
  this.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault(); // Allow drop
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.stopPropagation(); // Stop browser from redirecting
  
  // Only process drop if we're not dropping onto the same item
  if (draggedItem !== this) {
    const dragTarget = parseInt(this.dataset.index);
    
    // Update the collection's prompt order
    chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
      const collections = data.promptCollections || [];
      const activeIndex = data.activeCollectionIndex;
      
      if (typeof activeIndex === 'number' && collections[activeIndex]) {
        // Get the collection's prompts
        const prompts = collections[activeIndex].prompts;
        
        // Remove the dragged item from its original position
        const draggedPrompt = prompts.splice(dragSource, 1)[0];
        
        // Insert at the new position
        prompts.splice(dragTarget, 0, draggedPrompt);
        
        // Update the collection's "updated" timestamp
        collections[activeIndex].updated = Date.now();
        
        // Save back to storage
        chrome.storage.local.set({ promptCollections: collections }, () => {
          loadBufferItems(); // Refresh the display
        });
      }
    });
  }
  
  this.classList.remove('drag-over');
  return false;
}

function handleDragEnd(e) {
  // Remove styling
  this.classList.remove('dragging');
  
  // Reset drag state
  draggedItem = null;
  dragSource = null;
  
  // Remove drag-over class from all items
  const items = document.querySelectorAll('.collection-container .prompt-item');
  items.forEach(item => {
    item.classList.remove('drag-over');
  });
}


//////////////////////////
// COLLECTION FUNCTIONS //
/////////////////////////


const saveToCollection = (text) => {
  chrome.storage.local.get('promptCollections', data => {
    const collections = data.promptCollections || [];
    
    if (collections.length === 0) {
      // No collections exist yet, create one
      const newCollectionName = prompt('No collections exist yet. Enter a name for your new collection:');
      if (!newCollectionName) return; // User cancelled
      
      // Create new collection
      const newCollection = {
        name: newCollectionName,
        created: Date.now(),
        updated: Date.now(),
        prompts: [{
          text: text,
          added: Date.now()
        }]
      };
      
      // Save new collection
      chrome.storage.local.set({ 
        promptCollections: [newCollection] 
      }, () => {
        alert(`Created new collection "${newCollectionName}" and saved prompt.`);
        loadCollections();
        loadBufferItems();
      });
      return;
    }
    
    // Create a simple dialog to select a collection
    const collectionNames = collections.map(c => c.name);
    const selectedName = prompt('Select or enter a collection name to save to:\n' + collectionNames.join('\n'));
    
    if (!selectedName) return; // User cancelled
    
    // Find the selected collection with exact case-sensitive match
    const collectionIndex = collections.findIndex(c => c.name === selectedName);
    
    if (collectionIndex === -1) {
      // Collection not found - create new collection with this name
      const createNew = confirm(`Collection "${selectedName}" doesn't exist. Create it?`);
      
      if (createNew) {
        // Create new collection
        const newCollection = {
          name: selectedName,
          created: Date.now(),
          updated: Date.now(),
          prompts: [{
            text: text,
            added: Date.now()
          }]
        };
        
        // Add to existing collections
        collections.push(newCollection);
        
        // Save updated collections
        chrome.storage.local.set({ 
          promptCollections: collections 
        }, () => {
          alert(`Created new collection "${selectedName}" and saved prompt.`);
          loadCollections();
          loadBufferItems();
        });
      }
      return;
    }
    
    // Add prompt to existing collection
    collections[collectionIndex].prompts.push({
      text: text,
      added: Date.now()
    });
    collections[collectionIndex].updated = Date.now();
    
    // Save back to storage
    chrome.storage.local.set({ promptCollections: collections }, () => {
      alert(`Prompt saved to "${selectedName}" collection.`);
      loadCollections();
      loadBufferItems();
    });
  });
};

// Load collections from storage
const loadCollections = () => {
  chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
    const collectionsList = document.getElementById('collections-list');
    const collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;
    
    // Clear current list
    collectionsList.innerHTML = '';
    
    if (collections.length === 0) {
      collectionsList.innerHTML = '<div class="empty-message">No collections created yet</div>';
      return;
    }
    
    // Add collections to the list
    collections.forEach((collection, index) => {
      const collectionItem = createCollectionItem(collection, index);
      collectionsList.appendChild(collectionItem);
    });
    
    // Update active state after all items are added
    if (typeof activeIndex === 'number') {
      updateActiveCollectionUI(activeIndex);
    }
  });
};

// Updated Active Collection Function
const toggleActiveCollectionEditMode = () => {
  activeCollectionEditMode = !activeCollectionEditMode;
  
  // Update the edit button appearance if it exists
  const editBtn = document.querySelector('.collection-container').previousSibling.querySelector('.toggle-button');
  if (editBtn) {
    editBtn.setAttribute('title', activeCollectionEditMode ? 'Done' : 'Edit');
    editBtn.innerHTML = activeCollectionEditMode ? 
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"</path></svg>' : 
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
  }
  
  loadBufferItems(); // Reload the buffer display with edit controls

  if (activeCollectionEditMode) {
    setTimeout(makePromptItemsDraggable, 100);
  }
};

const updateActiveCollectionUI = (activeIndex) => {
  // Get all collection items
  const collectionItems = document.querySelectorAll('.collection-item');
  
  collectionItems.forEach((item, index) => {
    const activateBtn = item.querySelector('button:first-child');
    if (!activateBtn) return;
    
    // Remove existing event listeners by cloning the button
    const newBtn = activateBtn.cloneNode(true);
    activateBtn.parentNode.replaceChild(newBtn, activateBtn);
    
    if (index === activeIndex) {
      // This is now the active collection
      newBtn.textContent = 'Active';
      
      newBtn.classList.add('active-collection-button');
      newBtn.disabled = true;
    } else {
      // This is not the active collection
      newBtn.textContent = 'Activate';
      newBtn.classList.remove('active-collection-button');;
      newBtn.disabled = false;
      
      // Add the event listener to make it active
      newBtn.addEventListener('click', () => makeCollectionActive(index));
    }
  });
};

// Автор Николай Третьяков

const createCollectionItem = (collection, index) => {
  const item = document.createElement('div');
  item.className = 'collection-item';
  
  const name = document.createElement('div');
  name.className = 'collection-name';
  name.textContent = collection.name;
  
  const meta = document.createElement('div');
  meta.className = 'collection-meta';
  meta.textContent = `${collection.prompts.length} prompts · Created: ${new Date(collection.created).toLocaleDateString()}`;
  
  const actions = document.createElement('div');
  actions.className = 'prompt-actions';
  
  // Create a generic activate button (will be updated by updateActiveCollectionUI)
  const activateBtn = document.createElement('button');
  activateBtn.textContent = 'Activate';
  activateBtn.addEventListener('click', () => makeCollectionActive(index));
  actions.appendChild(activateBtn);

  const renameBtn = document.createElement('button');
  renameBtn.textContent = 'Rename';
  renameBtn.addEventListener('click', () => renameCollection(index));
  actions.appendChild(renameBtn);

  const exportBtnTXT = document.createElement('button');
  exportBtnTXT.textContent = 'to .txt';
  exportBtnTXT.addEventListener('click', () => exportCollection(collection, 'txt'));

  const exportBtnJSON = document.createElement('button');
  exportBtnJSON.textContent = 'to .json';
  exportBtnJSON.addEventListener('click', () => exportCollection(collection, 'json'));
  
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteCollection(index));
  
  actions.appendChild(exportBtnTXT);
  actions.appendChild(exportBtnJSON);
  actions.appendChild(deleteBtn);
  
  item.appendChild(name);
  item.appendChild(meta);
  item.appendChild(actions);
  
  return item;
};

// Rename Collection
const renameCollection = (index) => {
  chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
    const collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;
    
    if (!collections[index]) {
      alert('Collection not found.');
      return;
    }
    
    const currentName = collections[index].name;
    const newName = prompt('Enter a new name for the collection:', currentName);
    
    if (!newName || newName === currentName) {
      // User cancelled or didn't change the name
      return;
    }
    
    // Check if the new name already exists in other collections
    const nameExists = collections.some((c, i) => i !== index && c.name === newName);
    if (nameExists) {
      alert('A collection with this name already exists. Please choose a different name.');
      return;
    }
    
    // Update the collection name
    collections[index].name = newName;
    collections[index].updated = Date.now();
    
    // Save back to storage
    chrome.storage.local.set({ promptCollections: collections }, () => {
      // Refresh the collections list
      loadCollections();
      
      // Also refresh buffer items if this was the active collection
      if (activeIndex === index) {
        loadBufferItems();
      }
      
      // Show confirmation
      alert(`Collection renamed to "${newName}"`);
    });
  });
};


const viewCollection = (index) => {
  chrome.storage.local.get('promptCollections', data => {
    const collections = data.promptCollections || [];
    if (!collections[index]) return;

    const collection = collections[index];

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'collection-dialog';
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3>${collection.name}</h3>
        <button id="close-dialog">×</button>
      </div>
      <div class="dialog-content" id="collection-prompts"></div>
    `;

    document.body.appendChild(dialog);

    const promptsContainer = document.getElementById('collection-prompts');

    const renderPrompts = () => {
      promptsContainer.innerHTML = ''; // Clear existing content

      if (collection.prompts.length === 0) {
        promptsContainer.innerHTML = '<div class="empty-message">No prompts in this collection</div>';
        return;
      }

      collection.prompts.forEach((prompt, promptIndex) => {
        const promptElement = createPromptItemElement(
          typeof prompt === 'string' ? prompt : prompt.text, 
          {
            includeSaveToCollection: false,
            includeEdit: false,
            includeDelete: true
          }
        );

        const deleteBtn = promptElement.querySelector('button:nth-child(2)');
        if (deleteBtn) {
          const newDeleteBtn = deleteBtn.cloneNode(true); // Remove any old listeners
          deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

          newDeleteBtn.addEventListener('click', () => {
            collection.prompts.splice(promptIndex, 1);
            chrome.storage.local.set({ promptCollections: collections }, () => {
              renderPrompts(); // Re-render everything
            });
          });
        }

        promptsContainer.appendChild(promptElement);
      });
    };

    renderPrompts();

    document.getElementById('close-dialog').addEventListener('click', () => {
      dialog.remove();
    });
  });
};

const makeCollectionActive = (index) => {
  // Reset edit mode
  activeCollectionEditMode = false;
  
  // When making a collection active, we'll default to expanded state
  chrome.storage.local.set({ 
    activeCollectionIndex: index,
    collectionToggleState: true  // Default to expanded when changing collections
  }, () => {
    // Update the UI to reflect the change immediately
    updateActiveCollectionUI(index);
    loadBufferItems(); // Re-render Buffer tab
  });
};

// Function to delete a prompt within a collection
const deleteCollectionPrompt = (collectionIndex, promptIndex) => {
  chrome.storage.local.get('promptCollections', data => {
    const collections = data.promptCollections || [];
    if (!collections[collectionIndex]) return;
    
    const confirmDelete = confirm('Delete this prompt from the collection?');
    if (!confirmDelete) return;
    
    // Remove the prompt
    collections[collectionIndex].prompts.splice(promptIndex, 1);
    
    // Update the collection's "updated" timestamp
    collections[collectionIndex].updated = Date.now();
    
    // Save back to storage
    chrome.storage.local.set({ promptCollections: collections }, () => {
      loadBufferItems(); // Refresh the display
    });
  });
};

// Import collection from JSON file
function importCollection() {
  // Create a hidden file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // Trigger the file selection dialog
  fileInput.click();
  
  // Handle file selection
  fileInput.addEventListener('change', function() {
    if (fileInput.files.length === 0) {
      document.body.removeChild(fileInput);
      return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        const collection = JSON.parse(event.target.result);
        
        // Validate the collection structure
        if (!collection.name || !Array.isArray(collection.prompts)) {
          alert('Invalid collection format. Collection must have a name and prompts array.');
          document.body.removeChild(fileInput);
          return;
        }
        
        // Add timestamps if they don't exist
        if (!collection.created) {
          collection.created = Date.now();
        }
        if (!collection.updated) {
          collection.updated = Date.now();
        }
        
        // Save the imported collection
        chrome.storage.local.get('promptCollections', function(data) {
          let collections = data.promptCollections || [];
          
          // Check if a collection with the same name already exists
          const existingCollectionIndex = collections.findIndex(c => c.name === collection.name);
          
          if (existingCollectionIndex !== -1) {
            const overwrite = confirm(`A collection named "${collection.name}" already exists. Overwrite it?`);
            
            if (overwrite) {
              collections[existingCollectionIndex] = collection;
            } else {
              // Ask for a new name
              const newName = prompt('Enter a new name for the imported collection:');
              if (!newName) {
                document.body.removeChild(fileInput);
                return;
              }
              collection.name = newName;
              collections.push(collection);
            }
          } else {
            collections.push(collection);
          }
          
          chrome.storage.local.set({ promptCollections: collections }, function() {
            alert(`Collection "${collection.name}" imported successfully with ${collection.prompts.length} prompts.`);
            loadCollections();
            document.body.removeChild(fileInput);
          });
        });
      } catch (error) {
        alert('Error importing collection: ' + error.message);
        document.body.removeChild(fileInput);
      }
    };
    
    reader.readAsText(file);
  });
}

// Import collection from JSON file
const exportCollection = (collection, type) => {
  if (type === 'json') {
    // Export as JSON
    const jsonDataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection));
    const jsonDownloadAnchorNode = document.createElement('a');
    jsonDownloadAnchorNode.setAttribute("href", jsonDataStr);
    jsonDownloadAnchorNode.setAttribute("download", collection.name + ".json");
    document.body.appendChild(jsonDownloadAnchorNode); // Required for Firefox
    jsonDownloadAnchorNode.click();
    jsonDownloadAnchorNode.remove();
  } else if (type === 'txt') {
    // Export as TXT
    const txtData = [collection.name, ...collection.prompts.map(prompt => 
      typeof prompt === 'string' ? prompt : prompt.text)].join('\n');
    const txtDataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(txtData);
    const txtDownloadAnchorNode = document.createElement('a');
    txtDownloadAnchorNode.setAttribute("href", txtDataStr);
    txtDownloadAnchorNode.setAttribute("download", collection.name + ".txt");
    document.body.appendChild(txtDownloadAnchorNode); // Required for Firefox
    txtDownloadAnchorNode.click();
    txtDownloadAnchorNode.remove();
  } else {
    console.error('Unsupported export type:', type);
  }
};

// Delete collection
const deleteCollection = (index) => {
  chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
    let collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;
    
    // Get collection name and prompt count for the alert message
    const collectionToDelete = collections[index];
    if (!collectionToDelete) return;
    
    const promptCount = collectionToDelete.prompts.length;
    const warningMessage = `You are about to delete "${collectionToDelete.name}" collection with ${promptCount} prompts. This action cannot be undone.\n\nDo you want to continue?`;
    
    const confirmDelete = confirm(warningMessage);
    if (!confirmDelete) return;
    
    collections.splice(index, 1);
    
    // Update storage with new data
    const updates = { promptCollections: collections };
    
    // If the deleted collection was active, remove the active index
    if (activeIndex === index) {
      updates.activeCollectionIndex = null;
    } else if (activeIndex > index) {
      // If the active collection is after the deleted one, adjust its index
      updates.activeCollectionIndex = activeIndex - 1;
    }
    
    chrome.storage.local.set(updates, () => {
      loadCollections();
      loadBufferItems(); // Refresh buffer view if active collection changed
    });
  });
};
///////////////////////////////////////////
// BUTTON (event listener FUNCTIONS     //
/////////////////////////////////////////

// Set up event listeners
function setupEventListeners() {
  
  
      // JS-powered external help URL
    document.getElementById('help-link').addEventListener('click', function(event) {
      event.preventDefault(); // Prevent the default anchor behavior
      const helpUrl = "https://balsam-copper-ded.notion.site/Prompt-Collector-1d6537cd5c7980f888a3d7a02b3d8205";
      chrome.tabs.create({ url: helpUrl });
    });

    document.getElementById('prompt-link').addEventListener('click', function(event) {
      event.preventDefault(); // Prevent the default anchor behavior
      const promptUrl = "https://balsam-copper-ded.notion.site/Prompt-Collections-1d9537cd5c7980339dc5dbbe14258ed2";
      chrome.tabs.create({ url: promptpUrl });
    });
  
  // Save to buffer button for NEW PROMPT ONLY
  document.getElementById('save-to-buffer').addEventListener('click', function() {
    const promptInput = document.getElementById('prompt-input');
    const text = promptInput.value.trim();
    
    if (text) {
      saveToBuffer(text);
      promptInput.value = '';
    }
  });
   // Save to collection button for NEW PROMPT ONLY

  document.getElementById('saveToCollection').addEventListener('click', function() {
    const promptInput = document.getElementById('prompt-input');
    const text = promptInput.value.trim();
    
    if (text) {
      saveToCollection(text);
      promptInput.value = ''; // Clear the input field after saving
    }
  });
  
  // Toggle input area visibility
  document.getElementById('toggle-input').addEventListener('click', function() {
    const inputContainer = document.getElementById('prompt-input-container');
    const isVisible = inputContainer.style.display === 'block';
    
    if (isVisible) {
      inputContainer.style.display = 'none';
      this.textContent = '+';
    } else {
      inputContainer.style.display = 'block';
      this.textContent = '−'; // This is a minus sign
    }
  });

 
  // Add shortcut button
  document.getElementById('clipboard-to-active').addEventListener('click', clipboardToActiveCollection);

  // Paste from clipboard button
  document.getElementById('paste-from-clipboard').addEventListener('click', function() {
    navigator.clipboard.readText().then(text => {
      document.getElementById('prompt-input').value = text;
    }).catch(err => {
      console.error('Failed to read clipboard: ', err);
    });
  });
  
  // Create collection button
  document.getElementById('create-collection').addEventListener('click', function() {
    const name = prompt('Enter collection name:');
    if (name) {
      createNewCollection(name);
    }
  });
  
  // Import collection button
  document.getElementById('import-collection').addEventListener('click', function() {
    // Would normally open a file picker
    importCollection();
  });
  
  // Search functionality
  document.getElementById('search-input').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
        
    if (searchTerm) {
      performSearch(searchTerm);
    } else {
      document.getElementById('search-results').innerHTML = 
        '<div class="empty-message">Enter search terms above</div>';
    }
  });
}

// Save text to buffer
const saveToBuffer =(text) => {
  safeStorageOperation(
    callback => chrome.storage.local.get('promptBuffer', callback),
    data => {
      let buffer = data.promptBuffer || [];
      
      // Check if the exact same text already exists in the buffer
      if (buffer.some(item => item === text)) {
        alert('This text already exists in the buffer.');
        return;
      }
      
      buffer.push(text);
      
      if (buffer.length > 10) {
        buffer = buffer.slice(buffer.length - 10);
      }
      
      safeStorageOperation(
        callback => chrome.storage.local.set({ promptBuffer: buffer }, callback),
        () => {
          // Explicitly call loadBufferItems here to ensure the UI updates
          loadBufferItems();
        }
      );
    }
  );
}

// Create a new collection
function createNewCollection(name) {
  chrome.storage.local.get('promptCollections', function(data) {
    let collections = data.promptCollections || [];
    
    const newCollection = {
      name: name,
      created: Date.now(),
      updated: Date.now(),
      prompts: []
    };
    
    collections.push(newCollection);
    
    chrome.storage.local.set({ promptCollections: collections }, function() {
      loadCollections();
    });
  });
}

//////////////////////////
// SEARCH FUNCTIONS     //
/////////////////////////




const performSearch = (term) => {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '<div class="empty-message">Searching...</div>';

  chrome.storage.local.get(['promptBuffer', 'promptCollections'], function(data) {
    let results = [];

    // Search in buffer
    const buffer = data.promptBuffer || [];
    const bufferResults = buffer.filter(item =>
      item.toLowerCase().includes(term.toLowerCase()) // Case-insensitive search
    ).map(item => ({ text: item, source: 'Buffer' }));

    results = results.concat(bufferResults);

    // Search in collections
    if (data.promptCollections) {
      data.promptCollections.forEach(collection => {
        const collectionResults = collection.prompts
          .filter(item => {
            const promptText = typeof item === 'string' ? item : item.text;
            return promptText.toLowerCase().includes(term.toLowerCase());
          })
          .map(item => ({
            text: typeof item === 'string' ? item : item.text,
            source: `Collection: ${collection.name}`
          }));

        results = results.concat(collectionResults);
      });
    }
    // Display results
    displaySearchResults(results);
  });
};

// Display search results using the unified item creation function
const displaySearchResults = (results) => {
  const resultsContainer = document.getElementById('search-results');

  if (results.length === 0) {
    // Smoothly hide with a short delay
    resultsContainer.classList.remove('show');
    
    // Optional: Wait for transition to end before clearing (cleaner for large UIs)
    setTimeout(() => {
      resultsContainer.innerHTML = ''; // Clear content after fade-out
    }, 400); // Match transition duration
    return;
  }

  // Show with transition
  resultsContainer.classList.add('show');
  resultsContainer.innerHTML = ''; // Clear previous results

  results.forEach(item => {
    const resultItem = createPromptItemElement(item.text, {
      source: item.source,
      includeEdit: false,
      includeDelete: false,
      includeSaveToCollection: false,
      includeSaveToBuffer: false
    });

    resultsContainer.appendChild(resultItem);
  });
};
// Enhanced error handling for storage operations
function safeStorageOperation(operation, callback) {
  try {
    operation(result => {
      if (chrome.runtime.lastError) {
        console.error('Chrome storage error:', chrome.runtime.lastError);
        alert('Error: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (callback) callback(result);
    });
  } catch (error) {
    console.error('Error in storage operation:', error);
    alert('An error occurred. Please try again.');
  }
}


//Created by Nikolay Tretyakov
