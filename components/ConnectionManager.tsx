
import React, { useState } from 'react';
import { CallState } from '../types';

interface ConnectionManagerProps {
  callState: CallState;
  connectionState: RTCPeerConnectionState;
  offer: string | null;
  answer: string | null;
  onAcceptAnswer: (answer: string) => void;
  onCancel: () => void;
}

const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  callState,
  connectionState,
  offer,
  answer,
  onAcceptAnswer,
  onCancel
}) => {
  const [peerAnswer, setPeerAnswer] = useState('');
  const [copiedItem, setCopiedItem] = useState<'offer' | 'answer' | null>(null);

  const handleCopyToClipboard = (text: string | null, type: 'offer' | 'answer') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        setCopiedItem(type);
        setTimeout(() => setCopiedItem(null), 2000);
    }, (err) => {
      console.error(`Could not copy ${type}: `, err);
    });
  };
  
  const renderTitle = () => {
    switch (callState) {
      case CallState.CREATING_OFFER:
        return 'Preparing Your Call...';
      case CallState.WAITING_FOR_ANSWER:
      case CallState.CREATING_ANSWER:
        return 'Ready to Connect';
      default:
        return 'Connecting...';
    }
  };

  const getStatusIndicator = (status: RTCPeerConnectionState) => {
    let color = 'bg-gray-500'; // default for new, closed
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
      <div className="flex items-center justify-center gap-2 mb-4 -mt-2" aria-live="polite">
        <span className={`w-3 h-3 rounded-full ${color}`}></span>
        <span className="text-sm font-medium text-gray-300">
          Status: {text}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full md:w-2/3 bg-gray-800 rounded-lg p-6 space-y-6 flex flex-col">
      <h2 className="text-xl font-semibold text-center text-indigo-400">{renderTitle()}</h2>
      
      {getStatusIndicator(connectionState)}
      
      {callState === CallState.WAITING_FOR_ANSWER && offer && (
        <>
          <div className="space-y-2">
            <label className="font-medium">1. Send this Call Info to your peer</label>
            <textarea readOnly value={offer} rows={5} className="w-full p-2 bg-gray-900 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs" />
            <div className="relative">
              <button onClick={() => handleCopyToClipboard(offer, 'offer')} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold">Copy Call Info</button>
              {copiedItem === 'offer' && (
                 <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap pointer-events-none"
                    aria-live="polite"
                 >
                    Copied!
                 </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="answerInput" className="font-medium">2. Paste Peer's Connection Info</label>
            <textarea id="answerInput" value={peerAnswer} onChange={e => setPeerAnswer(e.target.value)} rows={5} className="w-full p-2 bg-gray-900 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs" placeholder="Paste the connection info from your peer here..."/>
            <button onClick={() => onAcceptAnswer(peerAnswer)} disabled={!peerAnswer.trim()} className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed">Connect</button>
          </div>
        </>
      )}

      {callState === CallState.CREATING_ANSWER && answer && (
        <div className="space-y-2">
            <label className="font-medium">1. Send this Connection Info back to your peer</label>
            <textarea readOnly value={answer} rows={5} className="w-full p-2 bg-gray-900 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs" />
            <div className="relative">
              <button onClick={() => handleCopyToClipboard(answer, 'answer')} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold">Copy Connection Info</button>
              {copiedItem === 'answer' && (
                 <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap pointer-events-none"
                    aria-live="polite"
                 >
                    Copied!
                 </div>
              )}
            </div>
            <p className="text-sm text-gray-400 text-center pt-2">Waiting for peer to connect...</p>
        </div>
      )}
      
      {(callState === CallState.WAITING_FOR_ANSWER || callState === CallState.CREATING_ANSWER) && (
          <button onClick={onCancel} className="mt-auto px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold">Cancel</button>
      )}

    </div>
  );
};

export default ConnectionManager;
