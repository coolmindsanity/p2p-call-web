import React from 'react';
import { IncomingCall } from '../types';

interface IncomingCallProps {
  callInfo: IncomingCall;
  onAccept: () => void;
  onDecline: () => void;
}

const AcceptIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a11.942 11.942 0 0 0 6.105 6.105c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.819V19.5a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-1.5a.75.75 0 0 0-1.5 0v1.5a4.5 4.5 0 0 0 4.5 4.5h2.25a4.5 4.5 0 0 0 4.5-4.5v-6.253c0-1.42-1.04-2.626-2.435-2.884l-4.423-1.105a.375.375 0 0 0-.39.139l-.97 1.293a.375.375 0 0 1-.523.016a9.942 9.942 0 0 0-4.636-4.636a.375.375 0 0 1 .016-.523l1.293-.97a.375.375 0 0 0 .139-.39L6.353 3.42A2.85 2.85 0 0 0 4.872 1.5H3.5a1.5 1.5 0 0 0-1.5 1.5v1.5Z" clipRule="evenodd" />
    </svg>
);

const DeclineIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a11.942 11.942 0 0 0 6.105 6.105c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.819V19.5a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-1.5a.75.75 0 0 0-1.5 0v1.5a4.5 4.5 0 0 0 4.5 4.5h2.25a4.5 4.5 0 0 0 4.5-4.5v-6.253c0-1.42-1.04-2.626-2.435-2.884l-4.423-1.105a.375.375 0 0 0-.39.139l-.97 1.293a.375.375 0 0 1-.523.016a9.942 9.942 0 0 0-4.636-4.636a.375.375 0 0 1 .016-.523l1.293-.97a.375.375 0 0 0 .139-.39L6.353 3.42A2.85 2.85 0 0 0 4.872 1.5H3.5a1.5 1.5 0 0 0-1.5 1.5v1.5Z" clipRule="evenodd" transform="rotate(135 12 12)" />
  </svg>
);


const IncomingCall: React.FC<IncomingCallProps> = ({ callInfo, onAccept, onDecline }) => {
  const callerDisplayName = callInfo.callerAlias || callInfo.from.substring(0, 8) + '...';

  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center gap-8 z-50 animate-fade-in" role="alertdialog" aria-labelledby="incoming-call-title">
        <div className="text-center">
            <h2 id="incoming-call-title" className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Incoming Call</h2>
            <p className="text-xl text-slate-700 dark:text-gray-300 mt-2">{callerDisplayName}</p>
        </div>

        <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
                <button
                    onClick={onDecline}
                    className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-transform transform hover:scale-110"
                    aria-label="Decline call"
                >
                    <DeclineIcon className="w-10 h-10 text-white" />
                </button>
                <span className="font-semibold text-slate-800 dark:text-white">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <button
                    onClick={onAccept}
                    className="w-20 h-20 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-transform transform hover:scale-110"
                    aria-label="Accept call"
                >
                    <AcceptIcon className="w-10 h-10 text-white" />
                </button>
                <span className="font-semibold text-slate-800 dark:text-white">Accept</span>
            </div>
        </div>
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default IncomingCall;