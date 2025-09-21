import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComingSoonOverlay } from '@/components/ui/coming-soon-overlay';
import { API_CONFIG } from '@/config/api';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou seu assistente IA inteligente. Posso ajudá-lo a analisar dados, responder dúvidas sobre seus clientes e muito mais. Como posso ajudar hoje?',
      type: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendToWebhook = async (message: string, timestamp: Date) => {
    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.error('VITE_WEBHOOK_URL não está definida no arquivo .env');
        return;
      }
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensagem: message,
          horario: timestamp.toISOString(),
        }),
      });
    } catch (error) {
      // Silently fail as requested - don't show errors to user
      console.error('Webhook call failed:', error);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BACKEND_API}/messages/chat/messages`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          // Processar apenas mensagens novas
          const newMessages = data.data.filter((msg: any) => !processedMessageIds.has(msg.id));
          
          if (newMessages.length > 0) {
            const formattedMessages: Message[] = newMessages.map((msg: any) => ({
              id: msg.id,
              content: msg.resposta,
              type: 'assistant' as const,
              timestamp: new Date(msg.timestamp)
            }));

            setMessages(prev => [...prev, ...formattedMessages]);
            setProcessedMessageIds(prev => {
              const newSet = new Set(prev);
              newMessages.forEach((msg: any) => newSet.add(msg.id));
              return newSet;
            });

            console.log('✅ [Chat] Novas mensagens da API adicionadas:', formattedMessages.length);
          }
        }
      }
    } catch (error) {
      console.error('❌ [Chat] Erro ao buscar mensagens da API:', error);
    }
  };

  useEffect(() => {
    // Buscar mensagens imediatamente
    fetchChatMessages();
    
    // Configurar polling a cada 2 segundos
    intervalRef.current = setInterval(fetchChatMessages, 2000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [processedMessageIds]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const timestamp = new Date();
    const messageContent = inputValue;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      type: 'user',
      timestamp: timestamp,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Send message to webhook asynchronously
    sendToWebhook(messageContent, timestamp);

    // Respostas do assistente virão apenas da API via polling
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-[calc(70vh)] flex flex-col bg-background">
      {/* Header Minimalista ChatGPT-Style */}
      <div className="flex-shrink-0 h-16 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-3">
          </div>
          <div className="flex items-center space-x-2">
          </div>
        </div>
      </div>

      {/* Messages Area - ChatGPT Style */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'group mb-6 flex animate-in fade-in slide-in-from-bottom-4 duration-500',
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'flex max-w-[85%] md:max-w-[70%]',
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  message.type === 'user' 
                    ? 'bg-blue-500 ml-3' 
                    : 'bg-green-500 mr-3'
                )}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
            
                {/* Message Bubble */}
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 shadow-sm',
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-foreground border border-border/50'
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <div className={cn(
                    'text-xs mt-2 opacity-70',
                    message.type === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                  )}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="flex-shrink-0 border-t border-border/30 bg-background/95 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Suggestions Pills */}
          <div className="mb-4 flex flex-wrap gap-2 justify-center">
            {[
              'Quantos clientes compraram no último mês?',
              'Qual produto tem maior conversão?',
              'Mostre o perfil dos melhores clientes'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputValue(suggestion)}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700 transition-colors hover:scale-105 transform duration-200"
              >
                💡 <span className="hidden sm:inline">{suggestion}</span>
                <span className="sm:hidden">{suggestion.split(' ').slice(0, 3).join(' ')}...</span>
              </button>
            ))}
          </div>

          {/* Input Container */}
          <div className="relative">
            <div className="flex items-end space-x-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta sobre vendas, clientes ou análises..."
                  className="w-full bg-transparent border-0 resize-none focus:outline-none text-sm leading-6 max-h-32 min-h-[24px] placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  rows={1}
                  style={{ height: 'auto' }}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </button>
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    inputValue.trim() 
                      ? "bg-green-500 hover:bg-green-600 text-white" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;