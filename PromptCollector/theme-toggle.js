
// Dark Mode Toggle Functionality
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
  const getCurrentTheme = () => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme; // Return explicitly set theme
    }
    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
  const saveTheme = (theme) => {
    localStorage.setItem(THEME_KEY, theme);
  };

  // Toggle between light and dark themes
  const toggleTheme = (button) => {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    saveTheme(newTheme);
    updateIcon(button, newTheme);
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