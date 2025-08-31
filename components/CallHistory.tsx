import React, { useState } from 'react';
import { CallHistoryEntry } from '../types';
import { formatDate, formatTime } from '../utils/format';

interface CallHistoryProps {
  history: CallHistoryEntry[];
  onRejoin: (callId: string) => void;
  onUpdateAlias: (timestamp: number, alias: string) => void;
  onTogglePin: (entry: CallHistoryEntry) => void;
  pinnedIds: Set<string>;
  onDelete: (timestamp: number) => void;
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

const PinIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
);

const PinnedIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
    </svg>
);

const UserIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const HistoryIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const DeleteIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const CallHistory: React.FC<CallHistoryProps> = ({ history, onRejoin, onUpdateAlias, onTogglePin, pinnedIds, onDelete }) => {
  const [editingTimestamp, setEditingTimestamp] = useState<number | null>(null);
  const [aliasInput, setAliasInput] = useState('');
  const [animatingPin, setAnimatingPin] = useState<string | null>(null);

  if (history.length === 0) {
    return (
        <div className="w-full text-center py-10 px-4 bg-white/70 dark:bg-gray-800/70 rounded-lg">
            <HistoryIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-4">No Recent Calls</h3>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Your call history will appear here after you make a call.</p>
        </div>
    );
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

  const handlePinClick = (entry: CallHistoryEntry) => {
    if (!pinnedIds.has(entry.callId)) {
        setAnimatingPin(entry.callId);
        setTimeout(() => setAnimatingPin(null), 400);
    }
    onTogglePin(entry);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar" role="list">
        {history.map((call, index) => {
          const isPinned = pinnedIds.has(call.callId);
          return (
            <div 
              key={`${call.callId}-${call.timestamp}`} 
              className="bg-white dark:bg-gray-800/70 p-3 rounded-lg flex items-center justify-between gap-3 min-h-[70px] hover:bg-slate-50 dark:hover:bg-gray-700/80 transition-colors animate-fade-in-down shadow-sm"
              style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
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
                    className="flex-grow px-3 py-1.5 bg-slate-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
                    className="p-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md transition-colors flex-shrink-0"
                    aria-label="Cancel editing alias"
                    title="Cancel"
                  >
                    <CancelIcon className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="truncate flex-grow flex items-center gap-3">
                    {call.peerId && (
                      <div className="flex-shrink-0" title="This contact can be called directly">
                        <UserIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                      </div>
                    )}
                    <div className="truncate flex-grow">
                      <p className="font-semibold text-base text-slate-800 dark:text-gray-100 truncate" title={call.alias || call.callId}>
                        {call.alias || call.callId}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                        {call.alias && <span className="font-mono">{call.callId} &middot; </span>}
                        {formatDate(call.timestamp)} &middot; {formatTime(call.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => handlePinClick(call)}
                        className={`p-2 rounded-md transition-colors ${isPinned ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-slate-800 dark:hover:text-white'} hover:bg-slate-200 dark:hover:bg-gray-700`}
                        aria-label={isPinned ? `Unpin call with ID ${call.callId}` : `Pin call with ID ${call.callId}`}
                        title={isPinned ? 'Unpin' : 'Pin'}
                    >
                        {isPinned ? <PinnedIcon className="w-5 h-5" /> : <PinIcon className={`w-5 h-5 ${animatingPin === call.callId ? 'animate-pop' : ''}`} />}
                    </button>
                    <button
                      onClick={() => handleEditClick(call)}
                      className="p-2 text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                      aria-label={`Edit alias for call with ID ${call.callId}`}
                      title="Edit alias"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(call.timestamp)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                      aria-label={`Delete call with ID ${call.callId} from history`}
                      title="Delete from history"
                    >
                      <DeleteIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onRejoin(call.callId)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-transform transform hover:scale-105"
                      aria-label={`Rejoin call with ID ${call.callId}`}
                    >
                      <RejoinIcon className="w-4 h-4" />
                      Rejoin
                    </button>
                  </div>
                </>
              )}
            </div>
        )}
        )}
      </div>
    </div>
  );
};

export default CallHistory;
