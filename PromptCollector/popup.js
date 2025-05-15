// dark theme toggle
document.addEventListener('DOMContentLoaded', function () {
  const THEME_KEY = 'theme';

  // Create the theme toggle button
  const createToggleButton = () => {
    const button = document.createElement('button');
    button.id = 'theme-toggle';
    button.className = 'action-button toggle-button';
    button.setAttribute('aria-label', 'Toggle dark mode');

    const container = document.getElementById('theme-toggle-container');
    if (container) {
      container.appendChild(button);
    } else {
      console.error('Theme toggle container not found');
    }

    return button;
  };

  // Get the current theme (explicit or system preference)
  const getCurrentTheme = async () => {
    try {
      const data = await StorageManager.get(StorageManager.keys.THEME);
      const storedTheme = data[StorageManager.keys.THEME];
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme; // Return explicitly set theme
      }
      // Fallback to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'light'; // Safe default
    }
  };

  // Apply the theme to the document
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Save the theme to localStorage
  const saveTheme = async (theme) => {
    try {
      await StorageManager.set({ [StorageManager.keys.THEME]: theme });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Toggle between light and dark themes
  const toggleTheme = async (button) => {
    try {
      const currentTheme = await getCurrentTheme();
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      await saveTheme(newTheme);
      updateIcon(button, newTheme);
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  // Update the button icon based on the theme
  const updateIcon = (button, theme) => {
    const isDark = theme === 'dark';
    button.innerHTML = isDark
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
         </svg>` // Sun icon for light mode
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
         </svg>`; // Moon icon for dark mode
  };

  // React to system theme changes if no explicit theme is set
  const handleSystemThemeChange = (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
      updateIcon(button, newTheme);
    }
  };

  // Initialize the theme toggle functionality
  const button = createToggleButton();
  const initialTheme = getCurrentTheme();
  applyTheme(initialTheme);
  updateIcon(button, initialTheme);

  // Add event listener for the toggle button
  button.addEventListener('click', () => toggleTheme(button));

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleSystemThemeChange);
});


// Initialize the extension 
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the extension
  initializeDefaultsIfFirstTime();
  initTabs();
  loadBufferItems();
  loadCollections();
  setupEventListeners();

  // Set initial state of toggle button to match hidden input area
  const toggleButton = document.getElementById('toggle-input');
  toggleButton.textContent = '+';

  const bufferContainer = document.querySelector('.buffer-container');
  if (bufferContainer) {
    bufferContainer.style.display = 'none'; // Hide the buffer container
  }

  // Update bufferToggleState in storage
  chrome.storage.local.set({ bufferToggleState: false }, () => {
  });
});
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
/* Workplace TAB render headers, buffer, active collection,  prompt items */
// Load buffer items from storage
const loadBufferItems = async () => {
  try {
    const [buffer, collections, activeIndex, toggleStates] = await Promise.all([
      StorageManager.getBuffer(),
      StorageManager.getCollections(),
      StorageManager.getActiveCollectionIndex(),
      StorageManager.getToggleStates()
    ]);

    const bufferList = document.getElementById('buffer-list');
    bufferList.innerHTML = '';

    if (buffer.length > 0) {
      renderBufferItems(buffer, bufferList, toggleStates.bufferToggle !== false);
    } else {
      bufferList.innerHTML = '<div class="empty-message">No prompts saved in buffer yet</div>';
    }
    
    if (typeof activeIndex === 'number' && collections[activeIndex]) {
      renderActiveCollection(collections, activeIndex, bufferList, toggleStates.collectionToggle !== false);
    }
  } catch (error) {
    console.error('Error loading items:', error);
    const bufferList = document.getElementById('buffer-list');
    bufferList.innerHTML = '<div class="error-message">Error loading items. Please try again.</div>';
  }
};
const renderBufferItems = (buffer, bufferList,bufferToggleState) => {
  const heading = createBufferHeading(bufferToggleState);
  const bufferContainer = document.createElement('div');
  bufferContainer.className = 'buffer-container';
  bufferContainer.style.display = bufferToggleState ? 'block' : 'none';

  buffer.slice().reverse().forEach((item, index) => {
    const promptItem = createPromptItemElement(item, {
      index,
      includeDone: false
    });
    bufferContainer.appendChild(promptItem);
  });

  heading.addEventListener('click', () => toggleVisibility(bufferContainer, heading));
  bufferList.appendChild(heading);
  bufferList.appendChild(bufferContainer);
};
const renderActiveCollection = (collections, activeIndex, bufferList, collectionToggleState) => {
  const activeCollection = collections[activeIndex];
  
  // Check if any prompts are marked as done to decide whether to show reset button
  const hasCompletedPrompts = activeCollection.prompts.some(prompt => 
    typeof prompt === 'object' && prompt.done === true
  );
  
  const heading = createCollectionHeading(activeCollection, collectionToggleState, hasCompletedPrompts);
  const collectionContainer = document.createElement('div');
  collectionContainer.className = 'collection-container';
  collectionContainer.style.display = collectionToggleState ? 'block' : 'none';

  activeCollection.prompts.forEach((prompt, promptIndex) => {
    // Skip already done prompts when displaying
    if (typeof prompt === 'object' && prompt.done === true) {
      // For done prompts, create a reset button instead
      const resetContainer = document.createElement('div');
      resetContainer.className = 'reset-container';
      resetContainer.style.textAlign = 'center';
      
      const promptInfo = document.createElement('div');
      promptInfo.style.fontSize = '12px';
      promptInfo.style.color = '#777';
      promptInfo.style.marginBottom = '4px';
      
      const promptText = prompt.text;
      promptInfo.textContent = promptText.length > 30 ? promptText.substring(0, 30) + '...' : promptText;
      
      const resetButton = document.createElement('button');
      resetButton.textContent = 'Reset prompt';
      resetButton.className = 'secondary';
      resetButton.addEventListener('click', () => {
        // Reset this prompt's done status
        prompt.done = false;
        chrome.storage.local.set({ promptCollections: collections }, () => {
          loadBufferItems(); // Refresh the UI
        });
      });
      
      resetContainer.appendChild(resetButton);
      resetContainer.appendChild(promptInfo);
      collectionContainer.appendChild(resetContainer);
    } else {
      // For active prompts, use our new component
      const promptItem = createCollectionPromptItem(prompt, promptIndex, activeIndex);
      collectionContainer.appendChild(promptItem);
    }
  });

  heading.addEventListener('click', () => toggleVisibility(collectionContainer, heading));
  bufferList.appendChild(heading);
  bufferList.appendChild(collectionContainer);
};
const createCollectionPromptItem = (prompt, promptIndex, collectionIndex) => {
  // Get text from prompt (handle both string and object formats)
  const promptText = typeof prompt === 'string' ? prompt : prompt.text;
  const isDone = typeof prompt === 'object' && prompt.done === true;
  
  const item = document.createElement('div');
  item.className = 'prompt-item';
  
  // Display text reduced to 50 symbols (same as in buffer)
  const displayText = promptText.length > 50 ? promptText.substring(0, 50) + '...' : promptText;
  
  // Create prompt text element
  const promptText_element = document.createElement('div');
  promptText_element.className = 'prompt-text';
  promptText_element.textContent = displayText;
  promptText_element.setAttribute('data-full-text', promptText);
  promptText_element.setAttribute('data-expanded', 'false');
  
  if (isDone) {
    // Create reset container
    const resetContainer = document.createElement('div');
resetContainer.className = 'reset-container';

// Create reset button
const resetButton = document.createElement('button');
resetButton.textContent = 'Reset';
resetButton.className = 'reset-button';
resetButton.addEventListener('click', () => {
  // Reset this prompt's done status
  chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
    const collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;

    if (typeof activeIndex !== 'number' || !collections[activeIndex]) return;

    if (typeof collections[activeIndex].prompts[promptIndex] === 'object') {
      collections[activeIndex].prompts[promptIndex].done = false;
    }

    chrome.storage.local.set({ promptCollections: collections }, () => {
      // Reload all items to refresh UI
      loadBufferItems();
    });
  });
});

// Create small toggled prompt text
const promptInfo = document.createElement('div');
promptInfo.className = 'prompt-info';
promptInfo.textContent = promptText.length > 30 ? promptText.substring(0, 30) + '...' : promptText;

// Add reset button and prompt text to the container
resetContainer.appendChild(resetButton);
resetContainer.appendChild(promptInfo);

// Append reset container to the collection container
collectionContainer.appendChild(resetContainer);
  }
  
  // Create flex container for text and toggle button (same as buffer)
  const textContainer = document.createElement('div');
  textContainer.className = 'text-container';
  textContainer.style.display = 'flex';
  textContainer.style.alignItems = 'center';
  textContainer.style.justifyContent = 'space-between';
  textContainer.style.width = '100%';
  
  // Add text to container
  textContainer.appendChild(promptText_element);
  
  // Create toggle button (outside of text)
  const toggleButton = document.createElement('button');
  toggleButton.className = 'toggle-text-button';
  toggleButton.innerHTML = '⤢'; // Expand icon
  toggleButton.style.marginLeft = '8px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.background = 'none';
  toggleButton.style.border = 'none';
  toggleButton.style.padding = '0 4px';
  toggleButton.style.fontSize = '14px';
  toggleButton.setAttribute('title', 'Expand/Collapse text');
  
  // Add toggle button to container

  
  // Add text container to item
  item.appendChild(textContainer);
  
  const actions = document.createElement('div');
  actions.className = 'prompt-actions';
  
  // Copy & Done button (this is the new functionality)
  const copyDoneBtn = document.createElement('button');
copyDoneBtn.textContent = 'Copy & hide';
copyDoneBtn.addEventListener('click', () => {
  // Copy text to clipboard
  navigator.clipboard.writeText(promptText).then(() => {
    console.log('Text copied to clipboard');

    // Mark prompt as done in storage
    chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
      const collections = data.promptCollections || [];
      const activeIndex = data.activeCollectionIndex;

      if (typeof activeIndex !== 'number' || !collections[activeIndex]) return;

      // Update the prompt's done status
      if (typeof collections[activeIndex].prompts[promptIndex] === 'string') {
        // Convert string prompt to object with done property
        collections[activeIndex].prompts[promptIndex] = {
          text: collections[activeIndex].prompts[promptIndex],
          added: Date.now(),
          done: true
        };
      } else {
        // Update existing object
        collections[activeIndex].prompts[promptIndex].done = true;
      }

      // Save back to storage
      chrome.storage.local.set({ promptCollections: collections }, () => {
        // Update the UI to reflect the "done" state
        item.classList.add('done'); // Add a CSS class for "done" styling
        promptText_element.style.textDecoration = 'line-through'; // Strikethrough text
        copyDoneBtn.disabled = true; // Disable the button after marking as done
        loadBufferItems(); // Refresh buffer
        loadCollections(); // Refresh collections
      });
    });
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
});
actions.appendChild(copyDoneBtn);
  
  // Keep the other action buttons
  // Regular Copy button
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => copyToClipboard(promptText, copyBtn));
  actions.appendChild(copyBtn);
  
  // Edit button
  if (collectionIndex !== null && promptIndex !== null) {
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      editCollectionPrompt(collectionIndex, promptIndex);
    });
    actions.appendChild(editBtn);
  }
  
  // Delete button
  if (collectionIndex !== null && promptIndex !== null) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      deleteCollectionPrompt(collectionIndex, promptIndex);
    });
    actions.appendChild(deleteBtn);
  }
  
  item.appendChild(actions);
  
  // Functions for expanding/collapsing text (same as buffer)
  const toggleTextDisplay = () => {
    const isExpanded = promptText_element.getAttribute('data-expanded') === 'true';
    promptText_element.textContent = isExpanded ? displayText : promptText_element.getAttribute('data-full-text');
    promptText_element.setAttribute('data-expanded', (!isExpanded).toString());
    toggleButton.innerHTML = isExpanded ? '⤢' : '⤡'; // Change icon based on state
  };
  
  // Click on prompt text to toggle expansion
  promptText_element.addEventListener('click', toggleTextDisplay);
  
  // Click on toggle button to expand/collapse
  toggleButton.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event from bubbling up
    toggleTextDisplay();
  });
  
  // Double-click to copy
  promptText_element.addEventListener('dblclick', (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event from bubbling up
    copyToClipboard(promptText, copyBtn);
  });
  
  return item;
};
const createBufferHeading = (bufferToggleState) => {
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

  heading.appendChild(caret);
  heading.appendChild(headingText);

  return heading;
};
const createCollectionHeading = (activeCollection, collectionToggleState, hasCompletedPrompts) => {
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

  heading.appendChild(caret);
  heading.appendChild(headingText);

  // Only show reset button if there are completed prompts
  if (hasCompletedPrompts) {
    const resetButton = document.createElement('button');
    resetButton.textContent = '';
    resetButton.id = "reset-collection-button";
    resetButton.className = "toggle-button secondary tooltip";

    const tooltipText = document.createElement('span');
    tooltipText.className = 'tooltip-text'; // Use the existing tooltip-text class
    tooltipText.textContent = 'Show hidden prompts'; 
    resetButton.appendChild(tooltipText);
    
    resetButton.addEventListener('click', resetCollectionPrompts);
    heading.appendChild(resetButton);
  }

  return heading;
};
const toggleVisibility = (container, heading) => {
  const isVisible = container.style.display === 'block';
  container.style.display = isVisible ? 'none' : 'block';
  heading.querySelector('span').textContent = isVisible ? '►' : '▼';
};
// Unified function to create prompt item elements
const createPromptItemElement = (text, options = {}) => {
  const { 
    index = null, 
    source = null, 
    includeEdit = true,
    includeDelete = true,
    includeSaveToCollection = true,
    includeSaveToBuffer = false,
    includeEditCollection = false,
    includeDeleteFromCollection = false, 
    collectionIndex = null, 
    includeDone = false, 
    done = false 
  } = options;

  const item = document.createElement('div');
  item.className = 'prompt-item';

  // Display text reduced to 50 symbols
  const displayText = text.length > 50 ? text.substring(0, 50) + '...' : text;
  
  // Create prompt text element
  const promptText = document.createElement('div');
  promptText.className = 'prompt-text';
  promptText.textContent = displayText;
  promptText.setAttribute('data-full-text', text);
  promptText.setAttribute('data-expanded', 'false');

  // Create flex container for text and toggle button
  const textContainer = document.createElement('div');
  textContainer.className = 'text-container';
  textContainer.style.display = 'flex';
  textContainer.style.alignItems = 'center';
  textContainer.style.justifyContent = 'space-between';
  textContainer.style.width = '100%';

  // Add text to container
  textContainer.appendChild(promptText);

  if (done) {
    promptText.style.textDecoration = 'line-through'; // Strikethrough for done prompts
  }

  // Add "done" checkbox only if includeDone is true
  if (includeDone) {
    const checkboxId = `prompt-checkbox-${collectionIndex}-${index}`;
  
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.checked = done;
    checkbox.style.display = 'none'; // Hide actual checkbox for CSS styling
  
    checkbox.addEventListener('change', () => {
      markPromptAsDone(index, checkbox.checked);
    });
  
    const label = document.createElement('label');
    label.setAttribute('for', checkboxId);
    label.appendChild(textContainer); // Add the text container to the label
  
    item.appendChild(checkbox);
    item.appendChild(label);
  } else {
    // If not including done checkbox, just add the text container directly
    item.appendChild(textContainer);
  }

  // Add source, buffer, or collection mainly
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

  if (includeEditCollection && collectionIndex !== null && index !== null) {
    const editCollectionBtn = document.createElement('button');
    editCollectionBtn.textContent = 'Edit';
    editCollectionBtn.addEventListener('click', () => {
      editCollectionPrompt(collectionIndex, index); 
    });
    actions.appendChild(editCollectionBtn);
  }

  if (includeDeleteFromCollection && collectionIndex !== null && index !== null) {
    const deleteFromCollectionBtn = document.createElement('button');
    deleteFromCollectionBtn.textContent = 'Delete';
    deleteFromCollectionBtn.addEventListener('click', () => {
      deleteCollectionPrompt(collectionIndex, index); 
    });
    actions.appendChild(deleteFromCollectionBtn);
  }

  item.appendChild(actions);

  // Functions for expanding/collapsing text
  const toggleTextDisplay = () => {
    const isExpanded = promptText.getAttribute('data-expanded') === 'true';
    promptText.textContent = isExpanded ? displayText : promptText.getAttribute('data-full-text');
    promptText.setAttribute('data-expanded', (!isExpanded).toString());
    toggleButton.innerHTML = isExpanded ? '⤢' : '⤡'; // Change icon based on state
  };

  // Click on prompt text to toggle expansion
  promptText.addEventListener('click', toggleTextDisplay);
  
  // Click on toggle button to expand/collapse
 
  // Double-click to copy
  promptText.addEventListener('dblclick', (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event from bubbling up
    copyToClipboard(text, copyBtn);
  });

  return item;
};
/* WORKPLACE TAB - TO DO LIST FUNCTIONALITY */
const updateCollectionHeading =(collection, collectionIndex)=> {
  // Check if any prompts are marked as done
  const hasCompletedPrompts = collection.prompts.some(prompt => 
    typeof prompt === 'object' && prompt.done === true
  );
  
  // Find the existing heading element
  const existingHeading = document.querySelector(`h2:nth-of-type(${collectionIndex + 2})`); // +2 because of buffer heading
  
  if (existingHeading) {
    // Check if we already have a reset button
    const existingResetButton = existingHeading.querySelector('#reset-collection-button');
    
    if (hasCompletedPrompts && !existingResetButton) {
      // Add reset button if not present
      const resetButton = document.createElement('button');
      resetButton.textContent = '';
      resetButton.id = "reset-collection-button";
      resetButton.className = "toggle-button secondary";
      
      resetButton.addEventListener('click', resetCollectionPrompts);
      existingHeading.appendChild(resetButton);
    } else if (!hasCompletedPrompts && existingResetButton) {
      // Remove reset button if no completed prompts
      existingHeading.removeChild(existingResetButton);
    }
  }
}
const markPromptAsDone = (index, isDone) => {
  chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
    const collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;

    if (typeof activeIndex !== 'number' || !collections[activeIndex]) return;

    collections[activeIndex].prompts[index].done = isDone;

    chrome.storage.local.set({ promptCollections: collections }, () => {
      loadBufferItems(); // Refresh the UI
    });
  });
};
const resetCollectionPrompts = () => {
  chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
    const collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;

    if (typeof activeIndex !== 'number' || !collections[activeIndex]) return;

    collections[activeIndex].prompts.forEach(prompt => {
      prompt.done = false;
    });

    chrome.storage.local.set({ promptCollections: collections }, () => {
      loadBufferItems(); // Refresh the UI
      loadCollections();
    });
  });
};
/* WORKPLACE TAB - BUTTON FUNCTIONS */

// Permission check utility
const checkPermission = async (permission) => {
  try {
    const result = await navigator.permissions.query({ name: permission });
    return result.state === 'granted';
  } catch (error) {
    console.error(`Permission check failed for ${permission}:`, error);
    return false;
  }
};

// Unified Copy text to clipboard function with permission check
const copyToClipboard = async (text, button) => {
  if (!document.hasFocus()) {
    console.warn('Document is not focused. Attempting to focus...');
    window.focus();
    setTimeout(() => copyToClipboard(text, button), 100);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    if (button) {
      button.textContent = 'Copied';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('copied');
      }, 2000);
    }
    console.log('Text copied to clipboard');
  } catch (err) {
    console.error('Failed to copy text:', err);
    if (button) {
      button.textContent = 'Error';
      button.classList.add('error');
      setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('error');
      }, 2000);
    }
  }
};

// Enhanced clipboard to buffer with permission check
const clipboardToBuffer = async () => {
  const clipboardToBufferButton = document.getElementById('clipboard-to-buffer');
  const originalClassName = clipboardToBufferButton.className;

  try {
    const text = await navigator.clipboard.readText();
    
    if (!text.trim()) {
      updateButtonState(clipboardToBufferButton, 'Empty clipboard', 'error-state');
      return;
    }

    await StorageManager.addToBuffer(text);
    updateButtonState(clipboardToBufferButton, 'Saved to buffer', 'success-state');
    loadBufferItems();
  } catch (error) {
    console.error('Failed to handle clipboard:', error);
    updateButtonState(clipboardToBufferButton, 'Error', 'error-state');
  }
};

// Helper function for button state updates
const updateButtonState = (button, text, className, duration = 2000) => {
  const originalClassName = button.className;
  button.textContent = text;
  button.className = originalClassName + ' ' + className;
  setTimeout(() => {
    button.textContent = '';
    button.className = originalClassName;
  }, duration);
};

// Shortcut to save clipboard to active collection
const clipboardToActiveCollection = () => {
  if (!document.hasFocus()) {
    console.warn('Document is not focused. Attempting to focus...');
    window.focus();
    setTimeout(clipboardToActiveCollection, 100); // Retry after focusing
    return;
  }

  const clipboardToActiveButton = document.getElementById('clipboard-to-active');
  const originalClassName = clipboardToActiveButton.className;

  navigator.clipboard.readText().then(text => {
    if (!text.trim()) {
      clipboardToActiveButton.textContent = 'Empty clipboard';
      clipboardToActiveButton.className = originalClassName + ' error-state';
      setTimeout(() => {
        clipboardToActiveButton.textContent = '';
        clipboardToActiveButton.className = originalClassName;
      }, 2000);
      return;
    }

    chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], data => {
      const collections = data.promptCollections || [];
      const activeIndex = data.activeCollectionIndex;

      if (typeof activeIndex !== 'number' || !collections[activeIndex]) {
        alert('No active collection selected. Please create or activate a collection first.');
        return;
      }

      collections[activeIndex].prompts.push({
        text: text,
        added: Date.now()
      });
      collections[activeIndex].updated = Date.now();

      chrome.storage.local.set({ promptCollections: collections }, () => {
        loadCollections();
        loadBufferItems();
      });
    });
  }).catch(err => {
    console.error('Failed to read clipboard:', err);
    clipboardToActiveButton.textContent = 'Error';
    clipboardToActiveButton.className = originalClassName + ' error-state';
    setTimeout(() => {
      clipboardToActiveButton.textContent = '';
      clipboardToActiveButton.className = originalClassName;
    }, 2000);
  });
};

// Edit a buffer prompt via clipboard window
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
// Edit collection prompt - via chrome window
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
// Delete a prompt from buffer
const deletePrompt = async (index) => {
  try {
    const buffer = await StorageManager.getBuffer();
    // Convert from display index (reversed) to actual index
    const actualIndex = buffer.length - 1 - index;
    
    buffer.splice(actualIndex, 1);
    await StorageManager.set({ [StorageManager.keys.BUFFER]: buffer });
    loadBufferItems();
  } catch (error) {
    console.error('Error deleting prompt:', error);
    alert('Failed to delete prompt. Please try again.');
  }
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
// Save text to buffer
const saveToBuffer = async (text) => {
  try {
    await StorageManager.addToBuffer(text);
    loadBufferItems(); // Refresh display
  } catch (error) {
    console.error('Error saving to buffer:', error);
    alert(error.message);
  }
};
// Save a prompt to an existing or new collection
const saveToCollection = (text) => {
  chrome.storage.local.get('promptCollections', data => {
    let collections = data.promptCollections || [];

    // If no collections exist, prompt to create one
    if (collections.length === 0) {
      const newCollectionName = prompt('No collections exist yet. Enter a name for your new collection:');
      if (!newCollectionName) return;

      const newCollection = {
        name: newCollectionName,
        created: Date.now(),
        updated: Date.now(),
        prompts: [{
          text: text,
          added: Date.now(),
          done:false
        }]
      };

      chrome.storage.local.set({
        promptCollections: [newCollection],
        activeCollectionIndex: 0,
        collectionToggleState: true
      }, () => {
        alert(`Created new collection "${newCollectionName}" and saved prompt.`);
        loadCollections();
        loadBufferItems();
      });

      return;
    }

    // Prompt to select or enter a collection name
    const collectionNames = collections.map(c => c.name);
    const selectedName = prompt('Type new collection name or copy one of existing collection names:\n' + collectionNames.join('\n'));
    if (!selectedName) return;

    const collectionIndex = collections.findIndex(c => c.name === selectedName);

    // Create a new collection if name not found
    if (collectionIndex === -1) {
      const createNew = confirm(`Collection "${selectedName}" doesn't exist. Create it?`);
      if (!createNew) return;

      const newCollection = {
        name: selectedName,
        created: Date.now(),
        updated: Date.now(),
        prompts: [{
          text: text,
          added: Date.now()
        }]
      };

      collections.push(newCollection);
      const newIndex = collections.length - 1;

      chrome.storage.local.set({
        promptCollections: collections,
        activeCollectionIndex: newIndex,
        collectionToggleState: true
      }, () => {
        alert(`Created new collection "${selectedName}" and saved prompt.`);
        loadBufferItems();
        loadCollections();
      });

      return;
    }

    // If collection exists, just add to it
    collections[collectionIndex].prompts.push({
      text: text,
      added: Date.now()
    });
    collections[collectionIndex].updated = Date.now();

    chrome.storage.local.set({ promptCollections: collections }, () => {
      alert(`Prompt saved to "${selectedName}" collection.`);
      loadCollections();
      loadBufferItems();
    });
  });
};

/* COLLECTION MANAGER TAB FUNCTIONS */
// Load collections from storage
const loadCollections = async () => {
  try {
    const [collections, activeIndex] = await Promise.all([
      StorageManager.getCollections(),
      StorageManager.getActiveCollectionIndex()
    ]);
    
    const collectionsList = document.getElementById('collections-list');
    
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
  } catch (error) {
    console.error('Error loading collections:', error);
    const collectionsList = document.getElementById('collections-list');
    collectionsList.innerHTML = '<div class="error-message">Error loading collections. Please try again.</div>';
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
// Create a new collection
const createNewCollection = async (name) => {
  try {
    const newCollection = {
      name: name,
      created: Date.now(),
      updated: Date.now(),
      prompts: []
    };

    await StorageManager.addCollection(newCollection);
    loadCollections();
  } catch (error) {
    console.error('Error creating collection:', error);
    alert('Failed to create collection: ' + error.message);
  }
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
const makeCollectionActive = async (index) => {
  try {
    await StorageManager.setActiveCollectionIndex(index);
    await StorageManager.setToggleState(StorageManager.keys.COLLECTION_TOGGLE, true);
    updateActiveCollectionUI(index);
    loadBufferItems();
  } catch (error) {
    console.error('Error activating collection:', error);
    alert('Failed to activate collection. Please try again.');
  }
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
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length === 0) {
      document.body.removeChild(fileInput);
      return;
    }

    const file = fileInput.files[0];
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.');
      document.body.removeChild(fileInput);
      return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const collection = JSON.parse(event.target.result);

        // Validate the collection structure
        if (!validateCollectionStructure(collection)) {
          throw new Error('Invalid collection format');
        }

        // Add timestamps if they don't exist
        const now = Date.now();
        collection.created = collection.created || now;
        collection.updated = collection.updated || now;

        // Validate and sanitize prompts
        collection.prompts = collection.prompts.map(prompt => {
          if (typeof prompt === 'string') {
            return {
              text: prompt.trim(),
              added: now,
              done: false
            };
          } else if (typeof prompt === 'object' && prompt !== null) {
            return {
              text: (prompt.text || '').trim(),
              added: prompt.added || now,
              done: !!prompt.done // Convert to boolean
            };
          }
          throw new Error('Invalid prompt format');
        });

        // Save the imported collection
        chrome.storage.local.get('promptCollections', function (data) {
          if (chrome.runtime.lastError) {
            throw new Error('Storage error: ' + chrome.runtime.lastError.message);
          }

          try {
            let collections = data.promptCollections || [];

            // Check if a collection with the same name already exists
            const existingCollectionIndex = collections.findIndex(
              (c) => c.name === collection.name
            );

            if (existingCollectionIndex !== -1) {
              const overwrite = confirm(
                `A collection named "${collection.name}" already exists. Do you want to overwrite the collection or import wit a different name?\n` +
                '- Overwrite(deletes existing collection)\n' +
                '- Import as new collection'
              );

              if (overwrite) {
                collections[existingCollectionIndex] = collection;
              } else {
                // Ask for a new name
                let newName = collection.name;
                let counter = 1;
                while (collections.some(c => c.name === newName)) {
                  newName = `${collection.name} (${counter})`;
                  counter++;
                }
                collection.name = newName;
                collections.push(collection);
              }
            } else {
              collections.push(collection);
            }

            chrome.storage.local.set({ promptCollections: collections }, function () {
              if (chrome.runtime.lastError) {
                throw new Error('Storage error: ' + chrome.runtime.lastError.message);
              }
              alert(
                `Collection "${collection.name}" imported successfully with ${collection.prompts.length} prompts.`
              );
              loadCollections();
              document.body.removeChild(fileInput);
            });
          } catch (error) {
            console.error('Error saving imported collection:', error);
            alert('Error saving collection: ' + error.message);
            document.body.removeChild(fileInput);
          }
        });
      } catch (error) {
        console.error('Error importing collection:', error);
        alert('Error importing collection: ' + error.message);
        document.body.removeChild(fileInput);
      }
    };

    reader.onerror = function (error) {
      console.error('File reading error:', error);
      alert('Error reading the file. Please try again.');
      document.body.removeChild(fileInput);
    };

    try {
      reader.readAsText(file);
    } catch (error) {
      console.error('Error initializing file reading:', error);
      alert('Error reading file. Please try again.');
      document.body.removeChild(fileInput);
    }
  });
};

// Validate collection structure
const validateCollectionStructure = (collection) => {
  // Check if collection is an object
  if (!collection || typeof collection !== 'object') {
    throw new Error('Collection must be a valid object');
  }

  // Check required fields
  if (!collection.name || typeof collection.name !== 'string' || collection.name.trim().length === 0) {
    throw new Error('Collection must have a valid name');
  }

  // Validate prompts array
  if (!Array.isArray(collection.prompts)) {
    throw new Error('Collection must have a prompts array');
  }

  // Check if prompts array is not too large (e.g., max 1000 prompts)
  if (collection.prompts.length > 1000) {
    throw new Error('Collection has too many prompts (maximum 1000)');
  }

  // Validate each prompt
  collection.prompts.forEach((prompt, index) => {
    if (typeof prompt === 'string') {
      if (prompt.trim().length === 0) {
        throw new Error(`Empty prompt at index ${index}`);
      }
    } else if (typeof prompt === 'object' && prompt !== null) {
      if (!prompt.text || typeof prompt.text !== 'string' || prompt.text.trim().length === 0) {
        throw new Error(`Invalid prompt format at index ${index}`);
      }
    } else {
      throw new Error(`Invalid prompt type at index ${index}`);
    }
  });

  return true;
};

// Export collection to JSON / TXT file
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

//make backup for all collections, console only

const exportAllCollections = () => {
  chrome.storage.local.get('promptCollections', (data) => {
    const collections = data.promptCollections || [];

    if (collections.length === 0) {
      console.log('No collections found to export.');
      return;
    }
    collections.forEach((collection) => {
      const jsonDataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection));
      const jsonDownloadAnchorNode = document.createElement('a');
      jsonDownloadAnchorNode.setAttribute("href", jsonDataStr);
      jsonDownloadAnchorNode.setAttribute("download", `${collection.name}.json`);
      document.body.appendChild(jsonDownloadAnchorNode); // Required for Firefox
      jsonDownloadAnchorNode.click();
      jsonDownloadAnchorNode.remove();
    });

    console.log(`${collections.length} collections exported successfully.`);
  });
};

// Delete collection
const deleteCollection = async (index) => {
  try {
    const [collections, activeIndex] = await Promise.all([
      StorageManager.getCollections(),
      StorageManager.getActiveCollectionIndex()
    ]);

    const collectionToDelete = collections[index];
    if (!collectionToDelete) return;

    const promptCount = collectionToDelete.prompts.length;
    const warningMessage = `You are about to delete "${collectionToDelete.name}" collection with ${promptCount} prompts. This action cannot be undone.\n\nDo you want to continue?`;

    const confirmDelete = confirm(warningMessage);
    if (!confirmDelete) return;

    collections.splice(index, 1);

    // Update storage with new data
    const updates = { [StorageManager.keys.COLLECTIONS]: collections };

    // Handle active collection index
    if (activeIndex === index) {
      updates[StorageManager.keys.ACTIVE_INDEX] = null;
    } else if (activeIndex > index) {
      updates[StorageManager.keys.ACTIVE_INDEX] = activeIndex - 1;
    }

    await StorageManager.set(updates);
    loadCollections();
    loadBufferItems();
  } catch (error) {
    console.error('Error deleting collection:', error);
    alert('Failed to delete collection. Please try again.');
  }
};
/* BUTTON (event listener FUNCTIONS */
// Set up event listeners
function setupEventListeners() {
  
  
      // JS-powered external help URL
    document.getElementById('help-link').addEventListener('click', function(event) {
      event.preventDefault(); // Prevent the default anchor behavior
      const helpUrl = "https://balsam-copper-ded.notion.site/Prompt-Collector-1d6537cd5c7980f888a3d7a02b3d8205";
      window.open(helpUrl, '_blank');
    });

    document.getElementById('prompt-link').addEventListener('click', function(event) {
      event.preventDefault(); // Prevent the default anchor behavior
      const promptUrl = "https://balsam-copper-ded.notion.site/Prompt-Collections-1d9537cd5c7980339dc5dbbe14258ed2";
      window.open(promptUrl, '_blank');
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
/* SEARCH FUNCTIONS */
// Perform search in buffer and collections
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
/* Local Storage and Defaults */
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
function initializeDefaultsIfFirstTime() {
  chrome.storage.local.get(['promptCollections', 'activeCollectionIndex'], (data) => {
    const collections = data.promptCollections || [];
    const activeIndex = data.activeCollectionIndex;

    // If no collections exist, it's the first time
    if (collections.length === 0 || typeof activeIndex !== 'number') {
      const defaultCollection = {
        name: 'First Prompt Collection',
        created: Date.now(),
        updated: Date.now(),
        prompts: [
          { text: "Explain [quantum physics] like I'm five years old.", added: Date.now() },
          { text: "Give me a pros and cons list of [moving to Berlin, Germany].", added: Date.now() },
          { text: "Make this email more professional: ['Hey, just checking if you got a chance to look at the thing I sent?]'", added: Date.now() },
          { text: "Brainstorm YouTube video ideas about [personal finance for beginners].", added: Date.now() },
          { text: "Summarize the following article in bullet points: [paste article here]", added: Date.now() }

        ]
      };

      chrome.storage.local.set({
        promptCollections: [defaultCollection],
        activeCollectionIndex: 0,
        collectionToggleState: true
      }, () => {
        console.log("Beginner collection created.");
        loadCollections();    // Refresh UI
        loadBufferItems();    // Refresh UI
      });
    }
  });
}

// Storage Manager for safer operations
const StorageManager = {
  // Storage keys
  keys: {
    BUFFER: 'promptBuffer',
    COLLECTIONS: 'promptCollections',
    ACTIVE_INDEX: 'activeCollectionIndex',
    COLLECTION_TOGGLE: 'collectionToggleState',
    BUFFER_TOGGLE: 'bufferToggleState',
    THEME: 'theme'
  },

  // Storage limits
  limits: {
    MAX_BUFFER_SIZE: 10,
    MAX_COLLECTION_SIZE: 1000,
    MAX_COLLECTION_NAME_LENGTH: 100
  },

  async get(keys) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error('Storage error: ' + chrome.runtime.lastError.message));
            return;
          }
          resolve(result);
        });
      } catch (error) {
        reject(new Error('Storage operation failed: ' + error.message));
      }
    });
  },

  async set(data) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(new Error('Storage error: ' + chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      } catch (error) {
        reject(new Error('Storage operation failed: ' + error.message));
      }
    });
  },

  // Buffer operations
  async getBuffer() {
    const data = await this.get(this.keys.BUFFER);
    return data[this.keys.BUFFER] || [];
  },

  async addToBuffer(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text for buffer');
    }

    let buffer = await this.getBuffer();
    
    // Check if text already exists
    if (buffer.includes(text)) {
      throw new Error('Text already exists in buffer');
    }

    buffer.push(text);
    
    // Maintain buffer size limit
    if (buffer.length > this.limits.MAX_BUFFER_SIZE) {
      buffer = buffer.slice(-this.limits.MAX_BUFFER_SIZE);
    }

    await this.set({ [this.keys.BUFFER]: buffer });
    return buffer;
  },

  // Collection operations
  async getCollections() {
    const data = await this.get(this.keys.COLLECTIONS);
    return data[this.keys.COLLECTIONS] || [];
  },

  async addCollection(collection) {
    if (!this.validateCollection(collection)) {
      throw new Error('Invalid collection format');
    }

    const collections = await this.getCollections();
    collections.push(collection);
    await this.set({ [this.keys.COLLECTIONS]: collections });
    return collections;
  },

  validateCollection(collection) {
    if (!collection || typeof collection !== 'object') {
      return false;
    }

    if (!collection.name || 
        typeof collection.name !== 'string' || 
        collection.name.length > this.limits.MAX_COLLECTION_NAME_LENGTH) {
      return false;
    }

    if (!Array.isArray(collection.prompts) || 
        collection.prompts.length > this.limits.MAX_COLLECTION_SIZE) {
      return false;
    }

    return true;
  },

  // Active collection management
  async getActiveCollectionIndex() {
    const data = await this.get(this.keys.ACTIVE_INDEX);
    return data[this.keys.ACTIVE_INDEX];
  },

  async setActiveCollectionIndex(index) {
    const collections = await this.getCollections();
    if (index !== null && (index < 0 || index >= collections.length)) {
      throw new Error('Invalid collection index');
    }
    await this.set({ [this.keys.ACTIVE_INDEX]: index });
  },

  // Toggle states
  async getToggleStates() {
    const data = await this.get([this.keys.COLLECTION_TOGGLE, this.keys.BUFFER_TOGGLE]);
    return {
      collectionToggle: data[this.keys.COLLECTION_TOGGLE],
      bufferToggle: data[this.keys.BUFFER_TOGGLE]
    };
  },

  async setToggleState(key, state) {
    if (![this.keys.COLLECTION_TOGGLE, this.keys.BUFFER_TOGGLE].includes(key)) {
      throw new Error('Invalid toggle key');
    }
    await this.set({ [key]: state });
  }
};

// Prompt Collector. Created by Nikolay Tretyakov May 2025