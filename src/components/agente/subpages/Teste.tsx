import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, RotateCcw, Plus, Save, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function Teste() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Olá! Sou a Sofia, sua assistente de vendas. Como posso ajudá-lo hoje?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState(0);
  const [totalMessages, setTotalMessages] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simular resposta da IA
    const startTime = Date.now();
    setTimeout(() => {
      const responses = [
        "Entendo! Posso te ajudar a encontrar o produto perfeito. Você está procurando algo específico?",
        "Ótima escolha! Temos várias opções disponíveis. Gostaria de saber mais detalhes sobre algum produto?",
        "Claro! Vou te mostrar nossas melhores opções. Qual é o seu orçamento aproximado?",
        "Perfeito! Com base no que você me disse, tenho algumas sugestões excelentes para você.",
        "Posso te ajudar com isso! Deixe me verificar nossa disponibilidade e te dar as melhores opções."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const endTime = Date.now();
      
      const aiMessage: Message = {
        id: Date.now(),
        content: randomResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      setLastResponseTime(endTime - startTime);
      setTotalMessages(prev => prev + 2);
    }, 1500);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        content: "Olá! Sou a Sofia, sua assistente de vendas. Como posso ajudá-lo hoje?",
        sender: 'ai',
        timestamp: new Date()
      }
    ]);
    setTotalMessages(1);
    setLastResponseTime(0);
  };

  const saveConversation = () => {
    console.log('Salvando conversa...', messages);
    // Implementar lógica de salvamento
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Teste do Agente IA
        </h2>
        <p className="text-muted-foreground">
          Teste o comportamento do seu agente de vendas em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversa de Teste</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={clearChat}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conversa
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-96 border rounded-lg bg-muted/20 p-4 overflow-y-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-start space-x-2 max-w-[70%]",
                      message.sender === 'user' ? "flex-row-reverse space-x-reverse" : ""
                    )}
                  >
                    <Avatar className="w-8 h-8">
                      {message.sender === 'ai' ? (
                        <>
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        message.sender === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Sofia está digitando...</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-4">
          {/* Test Controls */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Controles do Teste</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tipo-cliente">Simular Tipo de Cliente</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo Cliente</SelectItem>
                    <SelectItem value="frequente">Cliente Frequente</SelectItem>
                    <SelectItem value="problema">Cliente com Problema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showDetails}
                  onCheckedChange={setShowDetails}
                />
                <Label className="text-sm">Mostrar detalhes técnicos</Label>
              </div>
              
              <Button variant="outline" className="w-full" onClick={saveConversation}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Conversa
              </Button>
            </CardContent>
          </Card>

          {/* Metrics */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Métricas da Conversa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de mensagens:</span>
                <Badge variant="outline">{totalMessages}</Badge>
              </div>
              
              {showDetails && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tempo de resposta:</span>
                    <Badge variant="outline">{lastResponseTime}ms</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tokens usados:</span>
                    <Badge variant="outline">~{totalMessages * 25}</Badge>
                  </div>
                </>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  Online
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}