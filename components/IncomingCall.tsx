import React from 'react';
import { IncomingCall } from '../types';

interface IncomingCallProps {
  callInfo: IncomingCall;
  callerDisplayName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const AcceptIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M6.54 12.25a16.82 16.82 0 0 0 6.21 6.21l2.55-2.55a1 1 0 0 1 1.18-.21 12.12 12.12 0 0 0 4.41.86 1 1 0 0 1 1 1v3.44a1 1 0 0 1-1 1C9.64 22 2 14.36 2 5a1 1 0 0 1 1-1h3.44a1 1 0 0 1 1 1 12.12 12.12 0 0 0 .86 4.41 1 1 0 0 1-.21 1.18l-2.55 2.55z" />
    </svg>
);

const DeclineIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M6.54 12.25a16.82 16.82 0 0 0 6.21 6.21l2.55-2.55a1 1 0 0 1 1.18-.21 12.12 12.12 0 0 0 4.41.86 1 1 0 0 1 1 1v3.44a1 1 0 0 1-1 1C9.64 22 2 14.36 2 5a1 1 0 0 1 1-1h3.44a1 1 0 0 1 1 1 12.12 12.12 0 0 0 .86 4.41 1 1 0 0 1-.21 1.18l-2.55 2.55z" transform="rotate(135 12 12)" />
  </svg>
);


const IncomingCall: React.FC<IncomingCallProps> = ({ callInfo, callerDisplayName, onAccept, onDecline }) => {
  return (
    <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 z-50 animate-fade-in" role="alertdialog" aria-labelledby="incoming-call-title">
        <div className="text-center">
            <h2 id="incoming-call-title" className="text-3xl font-bold text-indigo-400">Incoming Call</h2>
            <p className="text-xl text-gray-300 mt-2">{callerDisplayName}</p>
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
                <span className="font-semibold text-white">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <button
                    onClick={onAccept}
                    className="w-20 h-20 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-transform transform hover:scale-110"
                    aria-label="Accept call"
                >
                    <AcceptIcon className="w-10 h-10 text-white" />
                </button>
                <span className="font-semibold text-white">Accept</span>
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