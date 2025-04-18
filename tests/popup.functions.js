// Export state variables that need to be shared across functions
let activeCollectionEditMode = false;

// UI Functions
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

// Element creator functions
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

// Data loading functions
const loadBufferItems = () => {
  chrome.storage.local.get(['promptBuffer', 'promptCollections', 'activeCollectionIndex', 'collectionToggleState'], data => {
    const bufferList = document.getElementById('buffer-list');
    const bufferCount = document.getElementById('buffer-count');

    const buffer = data.promptBuffer || [];
    const collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;
    // Get the saved toggle state (default to true/expanded if not set)
    const collectionToggleState = data.collectionToggleState !== undefined ? data.collectionToggleState : true;

    bufferList.innerHTML = '';

    bufferCount.textContent = `(${buffer.length}/10)`;
    const hasActiveCollection = typeof activeIndex === 'number' && collections[activeIndex];
    if (buffer.length === 0 && !hasActiveCollection) {
      bufferList.innerHTML += '<div class="empty-message">No prompts saved in buffer yet</div>';
    } else if (buffer.length > 0) {
      buffer.slice().reverse().forEach((item, index) => {
        const promptItem = createPromptItemElement(item, {
          index,
        });
        bufferList.appendChild(promptItem);
      });
    }
    
    // Show active collection (if any)
    if (hasActiveCollection) {
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
      headingText.textContent = `${activeCollection.name}`;
      
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

const displaySearchResults = (results) => {
  const resultsContainer = document.getElementById('search-results');
  
  if (results.length === 0) {
    // Hide the results container if no results
    resultsContainer.style.display = 'none';
    return;
  }

  // Show the results container and populate it
  resultsContainer.style.display = 'block';
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

// UI Manipulation functions
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
      newBtn.classList.remove('active-collection-button');
      newBtn.disabled = false;
      
      // Add the event listener to make it active
      newBtn.addEventListener('click', () => makeCollectionActive(index));
    }
  });
};

// Data modifiers
const saveToBuffer = (text) => {
  safeStorageOperation(
    callback => chrome.storage.local.get('promptBuffer', callback),
    data => {
      let buffer = data.promptBuffer || [];
      buffer = buffer.filter(item => item !== text);
      buffer.push(text);
      
      if (buffer.length > 10) {
        buffer = buffer.slice(buffer.length - 10);
      }
      
      safeStorageOperation(
        callback => chrome.storage.local.set({ promptBuffer: buffer }, callback),
        () => loadBufferItems()
      );
    }
  );
};

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

const createNewCollection = (name) => {
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
};

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

const editPrompt = (index) => {
  chrome.storage.local.get('promptBuffer', data => {
    let buffer = data.promptBuffer || [];
    const actualIndex = buffer.length - 1 - index;

    const text = buffer[actualIndex];
    const promptInput = document.getElementById('prompt-input');
    promptInput.value = text;
    promptInput.focus();

    // Remove old entry
    buffer.splice(actualIndex, 1);

    // Save updated buffer without the old item
    chrome.storage.local.set({ promptBuffer: buffer }, () => {
      loadBufferItems();
    });

    // Define helper function inside
    const completeEdit = (newText) => {
      chrome.storage.local.get('promptBuffer', data => {
        let buffer = data.promptBuffer || [];
        buffer.push(newText); // Add updated text to buffer
        chrome.storage.local.set({ promptBuffer: buffer }, () => {
          loadBufferItems();
        });
      });

      promptInput.value = '';
    };

    // Listen for Enter key
    promptInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        completeEdit(promptInput.value);
      }
    };
  });
};

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

// Clipboard operations
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