import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, BarChart3 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/ui/header';

function Index() {

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="md:pl-64">
        <Header />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section with Robot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center p-16 
                           bg-gradient-to-br from-slate-50/80 to-white/90 dark:from-slate-800/20 dark:to-slate-700/30
                           rounded-3xl mb-12 min-h-[500px]
                           border border-slate-200/50 dark:border-slate-600/30
                           shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
              {/* Left Side - Content */}
              <div style={{ textAlign: 'left' }}>
                {/* Main Heading */}
                <h1 className="text-6xl font-bold mb-6 leading-tight
                               bg-gradient-to-r from-slate-800 via-blue-600 to-slate-800 
                               dark:from-slate-100 dark:via-blue-300 dark:to-slate-100
                               bg-clip-text text-transparent"
                    style={{ animation: 'colorWave 12s linear infinite' }}>
                  JYZE DELIVERY
                </h1>

                {/* Subtitle */}
                <p className="text-xl mb-8 leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-slate-200">
                    Plataforma Inteligente de Gestão para Restaurantes
                  </strong>
                </p>

                {/* Services List */}
                <div style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#22c55e', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }}></div>
                    <span className="text-lg text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-800 dark:text-slate-200">Automação Completa</strong> - Pedidos, impressão e gestão automatizada
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#22c55e', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }}></div>
                    <span style={{ fontSize: '1.1rem', color: 'hsl(var(--foreground))' }}>
                      <strong>IA Avançada</strong> - Chatbot inteligente e análise preditiva
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#22c55e', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }}></div>
                    <span style={{ fontSize: '1.1rem', color: 'hsl(var(--foreground))' }}>
                      <strong>Analytics Real-time</strong> - Dashboards e relatórios inteligentes
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#22c55e', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }}></div>
                    <span style={{ fontSize: '1.1rem', color: 'hsl(var(--foreground))' }}>
                      <strong>Integrações</strong> - WhatsApp, sistemas de pagamento e delivery
                    </span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  flexWrap: 'wrap'
                }}>
                  <Link
                    to="/dashboard"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem 2rem',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    <span>Acessar Dashboard</span>
                    <Zap style={{ width: '20px', height: '20px' }} />
                  </Link>
                  <Link
                    to="/chat"
                    style={{
                      padding: '1rem 2rem',
                      border: '2px solid #22c55e',
                      color: '#22c55e',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '1.1rem'
                    }}
                  >
                    <span>Insights</span>
                  </Link>
                </div>
              </div>

              {/* Right Side - Robot Image */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center'
              }}>
                <div style={{ 
                  position: 'relative',
                  animation: 'float 3s ease-in-out infinite'
                }}>
                  <img 
                    src="/robo_suporte.jpg" 
                    alt="Assistente IA JYZE - Robô de Suporte Inteligente" 
                    style={{ 
                      width: '350px', 
                      height: '350px', 
                      objectFit: 'cover',
                      borderRadius: '24px',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem', 
              marginTop: '3rem' 
            }}>
              <div className="bg-gradient-to-br from-slate-50/80 to-white/90 dark:from-slate-800/20 dark:to-slate-700/30
                             border border-slate-200/50 dark:border-slate-600/30
                             rounded-2xl p-8 text-center
                             shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1rem' 
                }}>
                  <Brain style={{ width: '30px', height: '30px', color: 'white' }} />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">IA Avançada</h3>
                <p className="text-slate-600 dark:text-slate-400">Sistema inteligente de análise e otimização de processos</p>
              </div>

              <div className="bg-gradient-to-br from-slate-50/80 to-white/90 dark:from-slate-800/20 dark:to-slate-700/30
                             border border-slate-200/50 dark:border-slate-600/30
                             rounded-2xl p-8 text-center
                             shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1rem' 
                }}>
                  <BarChart3 style={{ width: '30px', height: '30px', color: 'white' }} />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Analytics Real-time</h3>
                <p className="text-slate-600 dark:text-slate-400">Dados em tempo real para decisões inteligentes</p>
              </div>

              <div className="bg-gradient-to-br from-slate-50/80 to-white/90 dark:from-slate-800/20 dark:to-slate-700/30
                             border border-slate-200/50 dark:border-slate-600/30
                             rounded-2xl p-8 text-center
                             shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  background: 'linear-gradient(135deg, #ec4899, #06b6d4)', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1rem' 
                }}>
                  <Zap style={{ width: '30px', height: '30px', color: 'white' }} />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Automação Total</h3>
                <p className="text-slate-600 dark:text-slate-400">Processos automatizados para máxima eficiência</p>
              </div>
            </div>

            {/* Additional Content Section */}
            <div style={{ 
              marginTop: '4rem',
              padding: '3rem 2rem',
              background: 'hsl(var(--muted))',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <h2 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                color: 'hsl(var(--foreground))'
              }}>
                Bem-vindo ao Futuro da Gestão
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: 'hsl(var(--muted-foreground))',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Use a navegação lateral para explorar todas as funcionalidades da plataforma JYZE.AI e revolucionar a gestão do seu restaurante.
              </p>
              
            </div>
          </div>
        </main>
      </div>


      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        
        
            @keyframes colorWave {
              0% { 
                background: linear-gradient(90deg, #ffffff 0%, #ffffff 30%, #22c55e 50%, #ffffff 70%, #ffffff 100%);
                background-size: 400% 100%;
                background-position: 100% 0%;
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              100% { 
                background: linear-gradient(90deg, #ffffff 0%, #ffffff 30%, #22c55e 50%, #ffffff 70%, #ffffff 100%);
                background-size: 400% 100%;
                background-position: 0% 0%;
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
              }
            }
        
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            text-align: center !important;
          }
          h1 { font-size: 2.5rem !important; }
          p { font-size: 1.1rem !important; }
          img[style*="width: '350px'"] {
            width: 250px !important;
            height: 250px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Index;
