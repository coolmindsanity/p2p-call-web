import React, { useState } from 'react';
import { CallHistoryEntry } from '../types';
import { formatDate, formatTime } from '../utils/format';

interface CallHistoryProps {
  history: CallHistoryEntry[];
  onRejoin: (id: string) => void;
  onUpdateAlias: (timestamp: number, alias: string) => void;
}

const RejoinIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.092 1.21-.138 2.43-.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7Zm-15.75 0a5.25 5.25 0 0 1 5.25-5.25h3a5.25 5.25 0 0 1 5.25 5.25c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 1-3.7 3.7 48.656 48.656 0 0 1-7.324 0 4.006 4.006 0 0 1-3.7-3.7c-.092-1.21-.138-2.43-.138-3.662Z" />
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

const CallHistory: React.FC<CallHistoryProps> = ({ history, onRejoin, onUpdateAlias }) => {
  const [editingTimestamp, setEditingTimestamp] = useState<number | null>(null);
  const [aliasInput, setAliasInput] = useState('');

  if (history.length === 0) {
    return null; // Don't render anything if history is empty
  }

  const handleEditClick = (entry: CallHistoryEntry) => {
    setEditingTimestamp(entry.timestamp);
    setAliasInput(entry.alias || '');
  };

  const handleSaveClick = (timestamp: number) => {
    onUpdateAlias(timestamp, aliasInput.trim());
    setEditingTimestamp(null);
    setAliasInput('');
  };

  const handleCancelClick = () => {
    setEditingTimestamp(null);
    setAliasInput('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, timestamp: number) => {
    if (event.key === 'Enter') {
      handleSaveClick(timestamp);
    } else if (event.key === 'Escape') {
      handleCancelClick();
    }
  };

  return (
    <div className="w-full max-w-sm mt-8">
      <h2 className="text-lg font-semibold text-center text-gray-300 mb-3">Recent Calls</h2>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar" role="list">
        {history.map((call) => (
          <div 
            key={`${call.id}-${call.timestamp}`} 
            className="bg-gray-800/70 p-3 rounded-lg flex items-center justify-between gap-3 min-h-[70px] hover:bg-gray-700/80 transition-colors"
            role="listitem"
          >
            {editingTimestamp === call.timestamp ? (
              <div className="w-full flex items-center gap-2">
                <input
                  type="text"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, call.timestamp)}
                  placeholder="Enter alias (e.g., Bob)"
                  className="flex-grow px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  autoFocus
                  aria-label="Edit alias for call"
                />
                <button
                  onClick={() => handleSaveClick(call.timestamp)}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors flex-shrink-0"
                  aria-label="Save alias"
                  title="Save"
                >
                  <CheckIcon className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={handleCancelClick}
                  className="p-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors flex-shrink-0"
                  aria-label="Cancel editing alias"
                  title="Cancel"
                >
                  <CancelIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <>
                <div className="truncate flex-grow">
                  <p className="font-semibold text-base text-gray-100 truncate" title={call.alias || call.id}>
                    {call.alias || call.id}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {call.alias && <span className="font-mono">{call.id} &middot; </span>}
                    {formatDate(call.timestamp)} &middot; {formatTime(call.duration)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEditClick(call)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    aria-label={`Edit alias for call with ID ${call.id}`}
                    title="Edit alias"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRejoin(call.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-transform transform hover:scale-105"
                    aria-label={`Rejoin call with ID ${call.id}`}
                  >
                    <RejoinIcon className="w-4 h-4" />
                    Rejoin
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(40, 43, 54, 0.5);
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4f46e5;
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4338ca;
        }
      `}</style>
    </div>
  );
};

export default CallHistory;
