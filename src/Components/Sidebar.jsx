import React from 'react';

export default function Sidebar({ 
  chats, 
  currentChatId, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat, 
  isOpen,         // Mobile ke liye drawer open state
  onClose         // Mobile drawer close handler
}) {
  return (
    <>
      {/* Mobile Backdrop Overlay (Jab sidebar mobile par khuli ho) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 text-white flex flex-col h-[100dvh] border-r border-gray-800 
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:h-full md:w-64
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        
        {/* Top Header / New Chat & Mobile Close Button */}
        <div className="p-3 flex items-center justify-between gap-2 border-b border-gray-800/60">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768 && onClose) onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2.5 px-4 rounded-xl transition text-sm font-medium shadow-lg shadow-blue-600/20"
          >
            <span>+ New Chat</span>
          </button>

          {/* Mobile Close Button */}
          {isOpen && (
            <button
              onClick={onClose}
              className="md:hidden text-gray-400 hover:text-white p-2.5 rounded-xl bg-gray-800 transition flex items-center justify-center shrink-0"
              title="Close Sidebar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
          {chats.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-500 text-center italic">
              No conversations yet.
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  if (window.innerWidth < 768 && onClose) onClose();
                }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm transition ${
                  currentChatId === chat.id 
                    ? 'bg-gray-800 text-white font-medium shadow-sm' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <span className="truncate flex-1 pr-2">{chat.title || 'New Conversation'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-100 md:opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1.5 rounded-md hover:bg-gray-700/50 transition"
                  title="Delete Chat"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}