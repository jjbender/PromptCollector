
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


//////////////////////////
// COLLECTION FUNCTIONS //
/////////////////////////

// Implemented saveToCollection function
const saveToCollection = (text) => {
  chrome.storage.local.get('promptCollections', data => {
    const collections = data.promptCollections || [];
    
    if (collections.length === 0) {
      // No collections exist yet
      alert('Please create a collection first.');
      return;
    }
    
    // Create a simple dialog to select a collection
    const collectionNames = collections.map(c => c.name);
    const selectedName = prompt('Select a collection to save to:\n' + collectionNames.join('\n'));
    
    if (!selectedName) return;
    
    // Find the selected collection
    const collectionIndex = collections.findIndex(c => c.name === selectedName);
    if (collectionIndex === -1) {
      alert('Collection not found.');
      return;
    }
    
    // Add prompt to collection
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
      newBtn.classList.add('active-button');
      newBtn.disabled = true;
    } else {
      // This is not the active collection
      newBtn.textContent = 'Make Active';
      newBtn.classList.remove('active-button');
      newBtn.disabled = false;
      
      // Add the event listener to make it active
      newBtn.addEventListener('click', () => makeCollectionActive(index));
    }
  });
};

// Create a collection item element with updated Active button
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
  activateBtn.textContent = 'Make Active';
  activateBtn.addEventListener('click', () => makeCollectionActive(index));
  actions.appendChild(activateBtn);

  const renameBtn = document.createElement('button');
  renameBtn.textContent = 'Rename';
  renameBtn.addEventListener('click', () => renameCollection(index));
  actions.appendChild(renameBtn);

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export';
  exportBtn.addEventListener('click', () => exportCollection(collection));
  
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteCollection(index));
  
  actions.appendChild(exportBtn);
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

// Implemented viewCollection function
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
const importCollection = () => {
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
    
    reader.onload = (event) => {
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
        chrome.storage.local.get('promptCollections', data => {
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
          
          chrome.storage.local.set({ promptCollections: collections }, () => {
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
};

// Export collection to JSON
const exportCollection = (collection) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", collection.name + ".json");
  document.body.appendChild(downloadAnchorNode); // Required for Firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
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
      const helpUrl = "https://balsam-copper-ded.notion.site/CopyPastePrompt-1d2537cd5c798057b425f886d2e59271";
      chrome.tabs.create({ url: helpUrl });
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
    const searchScope = document.getElementById('search-scope').value;
    
    if (searchTerm) {
      performSearch(searchTerm, searchScope);
    } else {
      document.getElementById('search-results').innerHTML = 
        '<div class="empty-message">Enter search terms above</div>';
    }
  });
}

// Save text to buffer
function saveToBuffer(text) {
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



// Perform search
function performSearch(term, scope) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '<div class="empty-message">Searching...</div>';
  
  // Search in buffer and collections
  chrome.storage.local.get(['promptBuffer', 'promptCollections'], function(data) {
    let results = [];
    
    if (scope === 'all' || scope === 'buffer') {
      const buffer = data.promptBuffer || [];
      const bufferResults = buffer.filter(item => 
        item.toLowerCase().includes(term.toLowerCase())  // Case-insensitive search
      ).map(item => ({ text: item, source: 'Buffer' }));
      
      results = results.concat(bufferResults);
    }
    
    if ((scope === 'all' || scope === 'collections') && data.promptCollections) {
      data.promptCollections.forEach(collection => {
        const collectionResults = collection.prompts
          .filter(item => {
            // Make sure we handle both string and object formats for prompts
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
    
    displaySearchResults(results);
  });
}

// Display search results using the unified item creation function
function displaySearchResults(results) {
  const resultsContainer = document.getElementById('search-results');
  
  if (results.length === 0) {
    // To show the search results
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = '<div class="empty-message">No matching prompts found</div>';
    return;
  }
  
  resultsContainer.innerHTML = '';
  
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
}

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