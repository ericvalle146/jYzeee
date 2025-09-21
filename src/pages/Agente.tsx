import { useState } from 'react';
import { AgenteSubNavigation } from '@/components/agente/AgenteSubNavigation';
import { ConfiguracaoAgente } from '@/components/agente/subpages/ConfiguracaoAgente';
import { PaginaProdutos } from '@/components/agente/subpages/PaginaProdutos';
import { Extracao } from '@/components/agente/subpages/Extracao';
import { Cardapios } from '@/components/agente/subpages/Cardapios';

const Agente = () => {
  const [activeTab, setActiveTab] = useState('configuracao');

  const renderContent = () => {
    switch (activeTab) {
      case 'configuracao':
        return <ConfiguracaoAgente />;
      case 'produtos':
        return <PaginaProdutos />;
      case 'extracao':
        return <Extracao />;
      case 'cardapios':
        return <Cardapios />;
      default:
        return <ConfiguracaoAgente />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {renderContent()}
      </div>

      {/* Right Sub-Navigation */}
      <AgenteSubNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="hidden lg:block"
      />

      {/* Mobile Sub-Navigation */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4">
        <div className="bg-card/95 backdrop-blur-sm border rounded-xl p-2">
          <div className="flex justify-between">
            {['configuracao', 'produtos', 'extracao', 'cardapios'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-1 py-2 text-xs font-medium rounded-lg transition-all duration-smooth ${
                  activeTab === tab
                    ? 'bg-gradient-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'configuracao' ? 'Config' : 
                 tab === 'produtos' ? 'Produtos' : 
                 tab === 'extracao' ? 'Extração' : 
                 'Cardápios'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agente;