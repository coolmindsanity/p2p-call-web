import React, { useState } from 'react';
import { PinnedEntry, PeerStatus } from '../types';

interface PinnedCallsProps {
  pins: PinnedEntry[];
  peerStatus: { [key: string]: PeerStatus };
  onCall: (pin: PinnedEntry) => void;
  onUpdateAlias: (callId: string, alias: string) => void;
  onUnpin: (callId: string) => void;
}

const CallIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
);
const EditIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);
const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);
const CancelIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);
const UnpinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
    </svg>
);
const PinEmptyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
);

const PinnedCalls: React.FC<PinnedCallsProps> = ({ pins, peerStatus, onCall, onUpdateAlias, onUnpin }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aliasInput, setAliasInput] = useState('');

  if (pins.length === 0) {
    return (
        <div className="w-full text-center py-10 px-4 bg-white/70 dark:bg-gray-800/70 rounded-lg">
            <PinEmptyIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-4">No Pinned Calls</h3>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">You can pin calls from your "Recent" list to add them here.</p>
        </div>
    );
  }

  const handleEditClick = (pin: PinnedEntry) => {
    setEditingId(pin.callId);
    setAliasInput(pin.alias || '');
  };

  const handleSaveClick = (callId: string) => {
    onUpdateAlias(callId, aliasInput.trim());
    setEditingId(null);
    setAliasInput('');
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setAliasInput('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, callId: string) => {
    if (event.key === 'Enter') {
      handleSaveClick(callId);
    } else if (event.key === 'Escape') {
      handleCancelClick();
    }
  };

  return (
    <div className="w-full max-w-sm space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar" role="list">
        {pins.map((pin, index) => {
          const status = pin.peerId ? peerStatus[pin.peerId] : null;
          const isOnline = status?.isOnline === true;
          const canCallDirectly = !!pin.peerId;
          const isButtonDisabled = canCallDirectly && !isOnline;

          return (
            <div 
              key={pin.callId} 
              className="bg-white dark:bg-gray-800/70 p-3 rounded-lg flex items-center justify-between gap-3 min-h-[70px] hover:bg-slate-50 dark:hover:bg-gray-700/80 transition-colors animate-fade-in-down shadow-sm"
              style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
              role="listitem"
            >
              {editingId === pin.callId ? (
                <div className="w-full flex items-center gap-2">
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, pin.callId)}
                    placeholder="Enter alias..."
                    className="flex-grow px-3 py-1.5 bg-slate-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    autoFocus
                    aria-label="Edit alias for pinned call"
                  />
                  <button
                    onClick={() => handleSaveClick(pin.callId)}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors flex-shrink-0"
                    aria-label="Save alias"
                    title="Save"
                  >
                    <CheckIcon className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={handleCancelClick}
                    className="p-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md transition-colors flex-shrink-0"
                    aria-label="Cancel editing alias"
                    title="Cancel"
                  >
                    <CancelIcon className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="truncate flex-grow">
                    <p className="font-semibold text-base text-slate-800 dark:text-gray-100 truncate" title={pin.alias || pin.callId}>
                        {pin.alias || pin.callId}
                    </p>
                    {canCallDirectly ? (
                        <div className="text-xs flex items-center gap-2 mt-1" title={isOnline ? `Online` : `Offline`}>
                            <span className="relative flex h-2.5 w-2.5">
                                {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                            </span>
                            <span className={`font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-mono truncate mt-1" title={`Call ID: ${pin.callId}`}>
                            ID: {pin.callId}
                        </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onUnpin(pin.callId)}
                      className="p-2 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                      aria-label={`Unpin call with ID ${pin.callId}`}
                      title="Unpin"
                    >
                      <UnpinIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditClick(pin)}
                      className="p-2 text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                      aria-label={`Edit alias for pinned call with ID ${pin.callId}`}
                      title="Edit alias"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onCall(pin)}
                      disabled={isButtonDisabled}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-semibold text-white whitespace-nowrap flex items-center gap-1.5 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:text-gray-300 dark:disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                      aria-label={`Call ${pin.alias || pin.callId}`}
                      title={isButtonDisabled ? "User is offline" : (pin.peerId ? `Call ${pin.alias || 'user'}`: `Rejoin call room`)}
                    >
                      <CallIcon className="w-4 h-4" />
                      {pin.peerId ? 'Call' : 'Rejoin'}
                    </button>
                  </div>
                </>
              )}
            </div>
        )})}
    </div>
  );
};

export default PinnedCalls;