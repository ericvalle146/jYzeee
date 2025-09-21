import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Printer, 
  BarChart3, 
  Users, 
  Settings, 
  ChefHat,
  Clock,
  Zap,
  Shield,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Coffee,
  Package,
  Smartphone,
  Headphones,
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Dashboard: React.FC = () => {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Função de navegação simples
  const navigate = (path: string) => {
    window.location.href = path;
  };

  const features = [
    {
      id: 'orders',
      title: 'Gestão de Pedidos',
      description: 'Sistema completo para gerenciar todos os pedidos do seu negócio em tempo real',
      icon: ShoppingCart,
      color: 'from-blue-500 to-indigo-600',
      route: '/app/pedidos',
      image: '🍔📋',
      stats: '+500 pedidos/dia'
    },
    {
      id: 'printing',
      title: 'Impressão Automática',
      description: 'Impressão automática de pedidos com sistema anti-duplicata e controle total',
      icon: Printer,
      color: 'from-green-500 to-emerald-600',
      route: '/app/impressao',
      image: '🖨️⚡',
      stats: '99.9% precisão'
    },
    {
      id: 'analytics',
      title: 'Dashboard & Analytics',
      description: 'Métricas avançadas, relatórios detalhados e insights do seu negócio',
      icon: BarChart3,
      color: 'from-purple-500 to-violet-600',
      route: '/app/analytics',
      image: '📊📈',
      stats: 'Insights em tempo real'
    },
    {
      id: 'customers',
      title: 'Gestão de Clientes',
      description: 'Controle completo da base de clientes com histórico e preferências',
      icon: Users,
      color: 'from-orange-500 to-red-600',
      route: '/app/clientes',
      image: '👥💫',
      stats: 'Base crescendo 15%'
    }
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      business: 'Hamburgueria do Bairro',
      rating: 5,
      text: 'Revolucionou nosso atendimento! Agora conseguimos processar 3x mais pedidos sem erro.',
      avatar: '👩‍🍳'
    },
    {
      name: 'João Santos',
      business: 'Pizzaria Família',
      rating: 5,
      text: 'A impressão automática economiza horas do nosso tempo. Sistema perfeito!',
      avatar: '👨‍🍳'
    },
    {
      name: 'Ana Costa',
      business: 'Açaíteria Premium',
      rating: 5,
      text: 'Interface intuitiva e relatórios que realmente ajudam no crescimento do negócio.',
      avatar: '👩‍💼'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-auto">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-indigo-700/90 to-purple-800/90"></div>
        <div className="absolute inset-0 bg-pattern animate-pulse"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Logo/Brand */}
          <div className="mb-8 transform hover:scale-110 transition-all duration-500">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl">
              <ChefHat className="h-16 w-16 text-white animate-bounce" />
            </div>
          </div>
          
          {/* Main Title */}
          <h1 className="text-7xl md:text-8xl font-bold text-white mb-8 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Converse
            </span>
            <br />
            <span className="text-white">Sell Hub</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-blue-100 mb-4 font-light max-w-4xl mx-auto leading-relaxed">
            Sistema Completo de Gestão para 
            <span className="font-bold text-yellow-300"> Restaurantes, Lanchonetes e Delivery</span>
          </p>
          
          {/* Emojis Visual */}
          <div className="text-6xl mb-12 animate-pulse">
            🍔 🍕 🥤 🍗 🧊
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl font-bold text-yellow-400 mb-2">500+</div>
              <div className="text-blue-100 text-lg">Pedidos Processados Diariamente</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl font-bold text-green-400 mb-2">99.9%</div>
              <div className="text-blue-100 text-lg">Precisão na Impressão Automática</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
              <div className="text-blue-100 text-lg">Sistema Sempre Disponível</div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/app/pedidos')}
              className="group relative px-12 py-6 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-2xl border-0"
            >
              <Play className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
              Começar Agora
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-12 py-6 bg-white/20 backdrop-blur-lg text-white border-white/30 hover:bg-white/30 font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-2xl"
            >
              <Package className="w-6 h-6 mr-3" />
              Ver Funcionalidades
            </Button>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Funcionalidades
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Principais</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Tudo que você precisa para gerenciar seu restaurante, lanchonete ou delivery de forma profissional e eficiente.
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <Card 
                key={feature.id}
                className={`group relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 cursor-pointer ${
                  hoveredFeature === feature.id ? 'ring-4 ring-blue-500/50' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => navigate(feature.route)}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <CardHeader className="pb-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                      {feature.stats}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 mt-3 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  {/* Visual Representation */}
                  <div className="bg-gray-50 rounded-2xl p-8 mb-6 text-center group-hover:bg-blue-50 transition-colors duration-300">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {feature.image}
                    </div>
                    
                    {/* Feature Highlights */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {feature.id === 'orders' && (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Tempo Real</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Anti-Duplicata</span>
                          </div>
                        </>
                      )}
                      
                      {feature.id === 'printing' && (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Layout Custom</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Multi Impressora</span>
                          </div>
                        </>
                      )}
                      
                      {feature.id === 'analytics' && (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Métricas Avançadas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Relatórios PDF</span>
                          </div>
                        </>
                      )}
                      
                      {feature.id === 'customers' && (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Histórico Completo</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Preferências</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className={`w-full bg-gradient-to-r ${feature.color} text-white hover:shadow-lg transition-all duration-300 group-hover:scale-105`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(feature.route);
                    }}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Acessar {feature.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Por que escolher o 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Jyze Delivery?</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Rápido & Eficiente</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Processe pedidos em segundos com nossa interface otimizada e impressão automática inteligente.
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Seguro & Confiável</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Sistema robusto com backup automático e proteção contra perda de dados dos seus pedidos.
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Headphones className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Suporte 24/7</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Nossa equipe está sempre disponível para ajudar seu negócio a crescer sem interrupções.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              O que nossos 
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent"> clientes dizem</span>
            </h2>
            <p className="text-xl text-gray-600">Histórias reais de sucesso usando o Jyze Delivery</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                <CardContent className="p-8">
                  {/* Stars */}
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600">{testimonial.business}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-dots"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="text-6xl mb-8">🚀</div>
          <h2 className="text-5xl font-bold text-white mb-8">
            Pronto para revolucionar seu negócio?
          </h2>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            Comece hoje mesmo e veja como o Jyze Delivery pode transformar 
            sua operação de delivery e atendimento.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/app/pedidos')}
              className="group px-12 py-6 bg-white text-blue-600 hover:bg-gray-100 font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-2xl border-0"
            >
              <Smartphone className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
              Começar Gratuitamente
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/app/pedidos?tab=configurar-layout')}
              className="px-12 py-6 bg-transparent text-white border-white/30 hover:bg-white/10 font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-2xl"
            >
              <Settings className="w-6 h-6 mr-3" />
              Ver Configurações
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <ChefHat className="h-8 w-8 text-yellow-400 mr-3" />
                <span className="text-2xl font-bold">Jyze Delivery</span>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                A solução completa para gestão de restaurantes, lanchonetes e delivery. 
                Simplifique sua operação e foque no que realmente importa: seus clientes.
              </p>
              <div className="flex space-x-4 text-3xl">
                🍔 🍕 🥤 🍗
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-6">Acesso Rápido</h3>
              <ul className="space-y-4 text-gray-400">
                <li>
                  <button 
                    onClick={() => navigate('/app/pedidos')}
                    className="hover:text-white transition-colors hover:underline"
                  >
                    Gestão de Pedidos
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/app/pedidos?tab=configurar-layout')}
                    className="hover:text-white transition-colors hover:underline"
                  >
                    Configurar Impressão
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/app/analytics')}
                    className="hover:text-white transition-colors hover:underline"
                  >
                    Relatórios
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-xl font-bold mb-6">Suporte</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-400" />
                  Suporte 24/7
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-400" />
                  Sistema Seguro
                </li>
                <li className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-400" />
                  Tempo Real
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Jyze Delivery. Transformando negócios com tecnologia. 🚀</p>
          </div>
        </div>
      </footer>

      {/* CSS para padrões de fundo e animações */}
      <style>{`
        .bg-pattern {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 2px, transparent 2px);
          background-size: 60px 60px;
        }
        .bg-pattern-dots {
          background-image: radial-gradient(circle, rgba(255,255,255,0.1) 2px, transparent 2px);
          background-size: 60px 60px;
        }
        @keyframes gradient-x {
          0%, 100% {
            transform: translateX(0%);
          }
          50% {
            transform: translateX(100%);
          }
        }
        .animate-gradient-x {
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;