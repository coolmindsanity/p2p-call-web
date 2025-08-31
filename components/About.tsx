import React from 'react';

interface AboutProps {
  isDevMode: boolean;
  onToggleDevMode: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const SunIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
);

const MoonIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
);

const ThemeToggle: React.FC<{ theme: 'light' | 'dark'; onToggle: () => void }> = ({ theme, onToggle }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-gray-300">Theme</span>
        <button
            onClick={onToggle}
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
            role="switch"
            aria-checked={theme === 'dark'}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <span
                className={`${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                } inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white transition-transform`}
            >
              {theme === 'dark' 
                ? <MoonIcon className="w-3 h-3 text-indigo-600"/> 
                : <SunIcon className="w-3 h-3 text-yellow-500" />
              }
            </span>
        </button>
    </div>
);


const About: React.FC<AboutProps> = ({ isDevMode, onToggleDevMode, theme, onToggleTheme }) => {
  return (
    <div className="w-full max-w-sm p-6 bg-white/50 dark:bg-gray-800/50 rounded-lg space-y-6 text-center shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">P2P Video Call</h2>
        <p className="text-sm font-mono text-gray-400 dark:text-gray-500 mt-1">Version 1.3.0</p>
      </div>

      <p className="text-slate-600 dark:text-gray-300">
        A secure, serverless video calling application that connects users directly through their web browsers using WebRTC. No sign-ups, no servers—just simple and private conversations.
      </p>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200 mb-3">Powered By</h3>
        <ul className="space-y-2 text-slate-500 dark:text-gray-400">
          <li>
            <a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              React
            </a>
          </li>
          <li>
            <a href="https://webrtc.org/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              WebRTC
            </a>
          </li>
          <li>
            <a href="https://firebase.google.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Firebase Realtime Database
            </a>
          </li>
          <li>
            <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Tailwind CSS
            </a>
          </li>
        </ul>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-gray-700/50 space-y-4">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button
          onClick={onToggleDevMode}
          className="w-full px-4 py-2 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 rounded-lg font-semibold text-sm text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-white transition-colors"
          aria-live="polite"
        >
          {isDevMode ? 'Disable' : 'Enable'} Developer Mode
        </button>
      </div>
    </div>
  );
};

export default About;