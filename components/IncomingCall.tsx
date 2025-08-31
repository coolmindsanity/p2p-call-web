import React from 'react';
import { IncomingCall } from '../types';

interface IncomingCallProps {
  callInfo: IncomingCall;
  onAccept: () => void;
  onDecline: () => void;
}

const AcceptIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
);

const DeclineIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75M19.5 9.75v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75" transform="rotate(-45 12 12)" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 2.25v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75M19.5 9.75v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75" transform="rotate(45 12 12)" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 2.25v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75M2.25 9.75v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75" />
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