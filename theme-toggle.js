
// Dark Mode Toggle Functionality
document.addEventListener('DOMContentLoaded', function () {
  const THEME_KEY = 'theme';

  const createToggleButton = () => {
    const button = document.createElement('button');
    button.id = 'theme-toggle';
    button.className = 'action-button toggle-button';
    button.setAttribute('aria-label', 'Toggle dark mode');

    updateIcon(button, getCurrentTheme());

    const container = document.getElementById('theme-toggle-container');
    if (container) {
      container.appendChild(button);
    } else {
      console.error('Theme toggle container not found');
    }

    return button;
  };

  const getCurrentTheme = () => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'dark' : 'light';
  };

  const setTheme = (mode) => {
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem(THEME_KEY, mode);
    console.log(mode);
  };

  const toggleTheme = (button) => {
    const current = getCurrentTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateIcon(button, newTheme);
  };

  const updateIcon = (button, mode) => {
    const isDark = mode === 'dark';
    button.innerHTML = isDark
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
         </svg>` // Sun
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
         </svg>`; // Moon
  };

  const button = createToggleButton();
  setTheme(getCurrentTheme());
  button.addEventListener('click', () => toggleTheme(button));

  // Optional: react to system preference changes if no stored theme
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      const mode = e.matches ? 'dark' : 'light';
      setTheme(mode);
      updateIcon(button, mode);
    }
  });
});