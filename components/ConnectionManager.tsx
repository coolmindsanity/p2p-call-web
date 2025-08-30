import React, { useState } from 'react';
import { CallState } from '../types';

interface ConnectionManagerProps {
  callState: CallState;
  connectionState: RTCPeerConnectionState;
  callId: string | null;
  onCancel: () => void;
}

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  callState,
  connectionState,
  callId,
  onCancel,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = (text: string | null) => {
    if (!text || copied) return;
    navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, (err) => {
      console.error('Could not copy Call ID: ', err);
    });
  };
  
  const renderTitle = () => {
    switch (callState) {
      case CallState.CREATING_OFFER:
        return 'Preparing Your Call...';
      case CallState.WAITING_FOR_ANSWER:
        return 'Your Call is Ready';
      case CallState.JOINING:
      case CallState.CREATING_ANSWER:
        return 'Joining Call...';
      default:
        return 'Connecting...';
    }
  };

  const renderStatusIndicator = (status: RTCPeerConnectionState) => {
    let color = 'bg-gray-500'; // Default for 'new' or 'closed'
    let text = status.charAt(0).toUpperCase() + status.slice(1);

    switch (status) {
      case 'connecting':
        color = 'bg-yellow-500 animate-pulse';
        text = 'Connecting';
        break;
      case 'connected':
        color = 'bg-green-500';
        text = 'Connected';
        break;
      case 'disconnected':
        color = 'bg-orange-500';
        text = 'Disconnected';
        break;
      case 'failed':
        color = 'bg-red-500';
        text = 'Failed';
        break;
    }

    return (
      <div className="flex items-center justify-center gap-2 mb-4" aria-live="polite">
        <span className={`w-3 h-3 rounded-full ${color}`}></span>
        <span className="text-sm font-medium text-gray-300">
          Status: {text}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full md:w-2/3 bg-gray-800 rounded-lg p-6 space-y-6 flex flex-col justify-between">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-indigo-400">{renderTitle()}</h2>
        {renderStatusIndicator(connectionState)}
      </div>
      
      {callState === CallState.WAITING_FOR_ANSWER && callId && (
        <div className="space-y-4 text-center">
          <p className="text-gray-300">Share this Call ID with your peer:</p>
          <div className="p-4 bg-gray-900 rounded-lg inline-block">
            <p className="font-mono text-2xl tracking-widest text-teal-300">{callId}</p>
          </div>
          <button
              onClick={() => handleCopyToClipboard(callId)}
              className={`w-full max-w-xs mx-auto px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm ${
              copied
                  ? 'bg-green-600 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              aria-live="polite"
          >
              {copied ? (
              <>
                  <CheckIcon className="w-5 h-5" />
                  <span>Copied!</span>
              </>
              ) : (
              'Copy Call ID'
              )}
          </button>
           <p className="text-sm text-gray-400 pt-4">Waiting for peer to join...</p>
        </div>
      )}

      {(callState === CallState.JOINING || callState === CallState.CREATING_ANSWER) && (
        <div className="flex flex-col items-center justify-center gap-4 text-center" role="status" aria-live="polite">
          <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400">Connecting to peer...</p>
        </div>
      )}
      
      <button onClick={onCancel} className="mt-auto w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold">Cancel</button>

    </div>
  );
};

export default ConnectionManager;
