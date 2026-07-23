import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import MessageItem from './MessageItem';

export default function ChatDashboard({ onLogout }) {
  const { darkMode, toggleTheme } = useTheme();
  
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  
  // Chat Rename / Options menu states
  const [activeMenuChatId, setActiveMenuChatId] = useState(null);
  const [renamingChatId, setRenamingChatId] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState('');

  // File previews ke liye state
  const [selectedFiles, setSelectedFiles] = useState([]);

  const messagesEndRef = useRef(null);
  const userId = 1; 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  useEffect(() => {
    fetch(`https://nvortex-backend-production.up.railway.app/api/chats/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChats(data);
          if (data.length > 0 && !activeChatId) {
            setActiveChatId(data[0].id);
          }
        }
      })
      .catch(err => console.error('Error fetching chats:', err));
  }, [userId]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([{ role: 'assistant', text: 'Hello Abdullah! How can I help you today with N-Vortex AI?' }]);
      return;
    }

fetch(`https://nvortex-backend-production.up.railway.app/api/chats/messages/${activeChatId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data);
        } else {
          setMessages([{ role: 'assistant', text: 'Hello Abdullah! How can I help you today with N-Vortex AI?' }]);
        }
      })
      .catch(err => console.error('Error fetching messages:', err));
  }, [activeChatId]);

  // Rename Chat Handler
  const handleRenameChat = async (chatId) => {
    if (!newChatTitle.trim()) return;
    try {
      const res = await fetch(`https://nvortex-backend-production.up.railway.app/api/chats/rename/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChatTitle })
      });
      if (res.ok) {
        setChats(chats.map(c => c.id === chatId ? { ...c, title: newChatTitle } : c));
        setRenamingChatId(null);
        setNewChatTitle('');
        setActiveMenuChatId(null);
      }
    } catch (err) {
      console.error('Error renaming chat:', err);
    }
  };

  // Delete Chat Handler
  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Kya aap waqai is chat ko delete karna chahte hain?')) return;
    try {
    const res = await fetch(`https://nvortex-backend-production.up.railway.app/api/chats/${chatId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updatedChats = chats.filter(c => c.id !== chatId);
        setChats(updatedChats);
        setActiveMenuChatId(null);
        if (activeChatId === chatId) {
          if (updatedChats.length > 0) {
            setActiveChatId(updatedChats[0].id);
          } else {
            handleNewChat();
          }
        }
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  // Text-to-Speech
  const toggleSpeech = (text, index) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speakingMessageId === index) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.4;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(index);
    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' + speechText : speechText));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // File Upload with Object URLs for Preview
  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map(file => ({
        file,
        name: file.name,
        type: type,
        preview: URL.createObjectURL(file)
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    setShowMenu(false);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGoogleDriveSelect = () => {
    const fileName = prompt("Enter file name from Google Drive:");
    if (fileName) {
      setInput(prev => prev + ` [GOOGLE DRIVE: ${fileName}] `);
    }
    setShowMenu(false);
  };

  // Helper Function to convert file to Base64 string
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Typewriter effect (Word-by-word streaming)
  const typeMessageWordByWord = (fullText) => {
    return new Promise((resolve) => {
      let currentText = '';
      const words = fullText.split(' ');
      let i = 0;

      setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

      const interval = setInterval(() => {
        if (i < words.length) {
          currentText += (i === 0 ? '' : ' ') + words[i];
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: 'assistant', text: currentText };
            return newMsgs;
          });
          i++;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 25);
    });
  };

  // Updated handleSend with Base64 Image/Vision support
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0) || isGenerating) return;

    let imageBase64 = null;
    let mimeType = null;
    let finalInput = input;

    const mediaFile = selectedFiles.find(f => f.type === 'media');
    if (mediaFile && mediaFile.file) {
      try {
        imageBase64 = await convertFileToBase64(mediaFile.file);
        mimeType = mediaFile.file.type;
      } catch (err) {
        console.error('Base64 conversion error:', err);
      }
    }

    if (selectedFiles.length > 0 && !mediaFile) {
      const fileDescriptions = selectedFiles.map(f => `[${f.type.toUpperCase()}: ${f.name}]`).join(' ');
      finalInput = finalInput ? `${finalInput} ${fileDescriptions}` : fileDescriptions;
    }

    const currentInput = finalInput;
    setInput('');
    setSelectedFiles([]); 
    setIsGenerating(true);

    let currentChatId = activeChatId;

    try {
      if (!currentChatId) {
      const chatRes = await fetch('https://nvortex-backend-production.up.railway.app/api/chats/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, title: currentInput ? currentInput.slice(0, 30) + '...' : 'Image Chat' })
        });
        const chatData = await chatRes.json();
        if (chatData.chatId) {
          currentChatId = chatData.chatId;
          setActiveChatId(currentChatId);
          
const updatedChatsRes = await fetch(`https://nvortex-backend-production.up.railway.app/api/chats/${userId}`);
          const updatedChats = await updatedChatsRes.json();
          setChats(updatedChats);
        }
      }

      setMessages(prev => [...prev, { role: 'user', text: currentInput || '[Image Uploaded]' }]);

const response = await fetch('https://nvortex-backend-production.up.railway.app/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: currentChatId, 
          text: currentInput, 
          imageBase64: imageBase64, 
          mimeType: mimeType 
        })
      });

      const data = await response.json();

      if (data.reply) {
        await typeMessageWordByWord(data.reply);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + data.error }]);
      }

    } catch (err) {
      console.error('Network Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Failed to connect to backend server.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setActiveChatId(null);
    setMessages([{ role: 'assistant', text: 'Hello Abdullah! How can I help you today with N-Vortex AI?' }]);
    setInput('');
    setSelectedFiles([]);
  };

  const activeChat = chats.find(c => c.id === activeChatId) || {
    title: 'New Conversation'
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 select-none">
      
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-all duration-300 shrink-0`}>
        <div className="p-3 flex flex-col gap-1 overflow-y-auto">
          
          {/* N-Vortex AI Sidebar Header */}
          <div className="flex items-center justify-between px-2 py-2 mb-2">
            {isSidebarOpen && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 animate-pulse">
                  ⚡
                </div>
                <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  N-Vortex AI
                </span>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          <button 
            onClick={handleNewChat}
            className={`flex items-center gap-3 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 px-3 rounded-xl transition duration-200 shadow-md shadow-blue-600/20 ${!isSidebarOpen && 'justify-center'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {isSidebarOpen && <span className="text-sm">New chat</span>}
          </button>

          {isSidebarOpen && (
            <div className="mt-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Recent</div>
              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-340px)] pr-1">
                {chats.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-gray-400 italic">
                    No recent chats found.
                  </div>
                ) : (
                  chats.map(chat => (
                    <div
                      key={chat.id}
                      className={`group relative flex items-center justify-between p-2.5 text-sm rounded-xl cursor-pointer transition font-medium ${
                        chat.id === activeChatId 
                          ? 'bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {renamingChatId === chat.id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            value={newChatTitle}
                            onChange={(e) => setNewChatTitle(e.target.value)}
                            className="bg-white dark:bg-gray-900 border border-blue-500 rounded px-2 py-1 text-xs w-full focus:outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleRenameChat(chat.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Save</button>
                        </div>
                      ) : (
                        <>
                          <div 
                            onClick={() => {
                              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                              setSpeakingMessageId(null);
                              setActiveChatId(chat.id);
                            }}
                            className="truncate flex-1"
                          >
                            {chat.title}
                          </div>
                          
                          {/* 3-dot Menu Toggle */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 transition"
                            >
                              ⋮
                            </button>

                            {activeMenuChatId === chat.id && (
                              <div className="absolute right-0 top-6 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingChatId(chat.id);
                                    setNewChatTitle(chat.title);
                                    setActiveMenuChatId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                >
                                  ✏️ Rename
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChat(chat.id);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
          <div className={`flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-800 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-inner">
                AQ
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold truncate">Abdullah Qureshi</span>
                  <span className="text-xs text-gray-400 truncate">N-Vortex Pro</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition"
                title="Settings & Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .555c-.007.379.138.751.43.992l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.332.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.941l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.555c.007-.379-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="font-semibold text-base bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">{activeChat.title}</div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
        </header>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed relative group ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200/50 dark:border-gray-700/50'
                }`}
              >
                <MessageItem role={msg.role} text={msg.text} />

                {/* Speaker Toggle Button */}
                {msg.role === 'assistant' && msg.text && (
                  <button
                    onClick={() => toggleSpeech(msg.text, index)}
                    className={`absolute -right-10 top-2 p-1.5 rounded-lg transition shadow-sm ${
                      speakingMessageId === index 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-500 hover:text-white opacity-80 hover:opacity-100'
                    }`}
                    title={speakingMessageId === index ? "Stop speaking" : "Listen to speech"}
                  >
                    {speakingMessageId === index ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator Dots */}
          {isGenerating && messages[messages.length - 1]?.text !== '' && (
            <div className="flex justify-start items-center">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
          
          {selectedFiles.length > 0 && (
            <div className="max-w-4xl mx-auto w-full flex gap-2 overflow-x-auto py-1">
              {selectedFiles.map((f, idx) => (
                <div key={idx} className="relative bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2 flex items-center gap-3 shrink-0">
                  {f.type === 'media' && f.file.type.startsWith('image/') ? (
                    <img src={f.preview} alt={f.name} className="w-12 h-12 object-cover rounded-lg" />
                  ) : f.type === 'media' && f.file.type.startsWith('video/') ? (
                    <video src={f.preview} className="w-12 h-12 object-cover rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">📄</div>
                  )}
                  <div className="flex flex-col text-xs max-w-[120px] truncate">
                    <span className="font-semibold truncate">{f.name}</span>
                    <span className="text-gray-400 capitalize">{f.type}</span>
                  </div>
                  <button 
                    onClick={() => removeSelectedFile(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow-md"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="max-w-4xl mx-auto w-full flex gap-2 items-center bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl px-3 py-2 shadow-inner relative">
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                disabled={isGenerating}
                className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute bottom-12 left-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-2 z-50">
                  <label className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition">
                    <span>📷</span> Upload Photos / Videos
                    <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'media')} />
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition">
                    <span>📄</span> Upload Documents
                    <input type="file" accept=".pdf,.doc,.docx,.txt,.csv" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />
                  </label>
                  <button
                    type="button"
                    onClick={handleGoogleDriveSelect}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition text-left"
                  >
                    <span>📁</span> Select from Google Drive
                  </button>
                </div>
              )}
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating}
              placeholder={isListening ? "Listening... Speak now..." : isGenerating ? "AI is typing..." : "Type your message, or upload files..."}
              className="flex-1 bg-transparent border-none px-2 py-2 text-sm focus:outline-none text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isGenerating}
              className={`p-2.5 rounded-xl transition shadow-sm flex items-center justify-center shrink-0 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500'
              }`}
              title={isListening ? "Stop listening" : "Voice typing (Microphone)"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-12 7.5a6 6 0 016-6v-1.5m6-7.5a3 3 0 11-6 0 3 3 0 016 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>

            <button
              type="submit"
              disabled={isGenerating || (!input.trim() && selectedFiles.length === 0)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:bg-gray-400 text-white p-2.5 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center shrink-0 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold">Account Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-200 text-xl font-bold">&times;</button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium mb-1">Display Name</label>
                <input type="text" defaultValue="Abdullah Qureshi" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => {
                    localStorage.clear();
                    if (onLogout) onLogout();
                    else window.location.reload();
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition shadow-md flex items-center justify-center gap-2"
                >
                  🚪 Logout Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}