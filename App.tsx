
import React, { useState, useEffect, useCallback } from 'react';
import { AIMode, ChatMessage, ActiveChat } from './types';
import { MODE_CONFIGS } from './constants';
import * as geminiService from './services/geminiService';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import { Content } from '@google/genai';


const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AIMode>(AIMode.Chat);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    const initError = geminiService.initializeGemini();
    setApiKeyError(initError);
    if (!initError) {
        // Pre-load with a welcome message or instructions based on the initial mode
        const initialModeConfig = MODE_CONFIGS[currentMode];
        setMessages([{
            id: 'welcome-msg',
            role: 'model',
            content: `Welcome to EduTutor AI! I'm in **${initialModeConfig.displayName}** mode. ${initialModeConfig.placeholderText}`,
        }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const initializeChatForMode = useCallback((mode: AIMode, history?: Content[]) => {
    if (apiKeyError) return;
    const chatInstance = geminiService.createChatSession(mode, history);
    if (chatInstance) {
      setActiveChat({ chat: chatInstance, mode });
    } else {
      setApiKeyError(apiKeyError || "Failed to create chat session. API key might be missing or invalid.");
    }
  }, [apiKeyError]);

  useEffect(() => {
    // Initialize chat when component mounts or API key status changes (and is valid)
    if (!apiKeyError) {
      initializeChatForMode(currentMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeyError]); // Deliberately not including initializeChatForMode or currentMode to avoid loops, only run on API key status change

  const handleModeChange = (newMode: AIMode) => {
    setCurrentMode(newMode);
    setMessages([]); // Clear messages for the new mode context
    const modeConfig = MODE_CONFIGS[newMode];
     setMessages([{
        id: `mode-intro-${newMode}-${Date.now()}`,
        role: 'model',
        content: `Switched to **${modeConfig.displayName}** mode. ${modeConfig.placeholderText}`,
    }]);
    initializeChatForMode(newMode); // Re-initialize chat with new system prompt
  };

  const handleSendMessage = async (userInput: string) => {
    if (!activeChat || activeChat.mode !== currentMode) {
      console.warn("Chat not initialized or mode mismatch, re-initializing.");
      initializeChatForMode(currentMode, messages.map(m => ({role: m.role, parts: [{text: m.content}]}))); // Pass current messages as history
      // Need to wait for activeChat to be set, this might need a slight refactor or just proceed and hope it's fast.
      // For now, let's assume initializeChatForMode is synchronous enough or the next call will use the new chat.
      // A robust solution might involve a state to track chat readiness.
      if(!geminiService.getApiKeyError() && !activeChat) { // if activeChat is STILL null after attempt
         const tempChat = geminiService.createChatSession(currentMode, messages.map(m => ({role: m.role, parts: [{text: m.content}]})));
         if(tempChat) setActiveChat({chat: tempChat, mode: currentMode});
         else {
            setMessages(prev => [...prev, {id: Date.now().toString(), role: 'model', content: "Error: Could not re-initialize chat. Please check API key or try changing modes."}]);
            return;
         }
      }
    }
    
    // Use a temporary variable for activeChat if it was just set
    const chatToUse = activeChat?.chat || (geminiService.createChatSession(currentMode, messages.map(m => ({role: m.role, parts: [{text: m.content}]}))));
    if(!chatToUse) {
        setMessages(prev => [...prev, {id: Date.now().toString(), role: 'model', content: "Error: Chat session is not available."}]);
        return;
    }


    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: userInput };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);

    const modelMessageId = `model-${Date.now()}`;
    // Add a placeholder for the model's response
    setMessages(prevMessages => [...prevMessages, { id: modelMessageId, role: 'model', content: '', isLoading: true, sources: [] }]);
    
    let fullModelResponse = "";
    let sourcesReceived: any[] = [];

    try {
      // Ensure activeChat.chat is used for sending messages.
      const currentActiveChat = activeChat?.chat || chatToUse;

      for await (const chunk of geminiService.sendMessageStream(currentActiveChat, userInput, currentMode)) {
        if (chunk.error) {
          setMessages(prevMessages => prevMessages.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: chunk.error || "An error occurred.", isLoading: false } : msg
          ));
          setIsLoading(false);
          return;
        }
        if (chunk.textChunk) {
          fullModelResponse += chunk.textChunk;
        }
        if (chunk.sources && chunk.sources.length > 0) {
          sourcesReceived = [...new Set([...sourcesReceived, ...chunk.sources])]; // Simple deduplication
        }
        setMessages(prevMessages => prevMessages.map(msg => 
          msg.id === modelMessageId ? { ...msg, content: fullModelResponse, isLoading: true, sources: sourcesReceived } : msg
        ));
      }
    } catch (e: any) {
        console.error("Error during streaming:", e);
        setMessages(prevMessages => prevMessages.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: `Stream error: ${e.message}`, isLoading: false } : msg
        ));
    } finally {
        setIsLoading(false);
        setMessages(prevMessages => prevMessages.map(msg => 
          msg.id === modelMessageId ? { ...msg, isLoading: false } : msg
        ));
    }
  };

  return (
    <div className="flex h-screen font-sans">
      <Sidebar currentMode={currentMode} onModeChange={handleModeChange} apiKeyError={apiKeyError} />
      <main className="flex-grow ml-64 h-screen"> {/* ml-64 to offset sidebar width */}
        <ChatView
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          currentMode={currentMode}
          apiKeyError={apiKeyError}
        />
      </main>
    </div>
  );
};

export default App;
