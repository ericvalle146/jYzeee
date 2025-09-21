import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Settings,
  AlertTriangle,
  FileText,
  ArrowRight
} from 'lucide-react';

interface DynamicLayoutWarningProps {
  onConfigureLayout?: () => void;
  className?: string;
}

export const DynamicLayoutWarning: React.FC<DynamicLayoutWarningProps> = ({
  onConfigureLayout,
  className
}) => {
  return (
    <div className={className}>
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">🎨 Sistema de Impressão Dinâmico Ativo</h4>
              <p className="text-sm">
                Este sistema utiliza APENAS layouts configurados dinamicamente. 
                Não há layouts fixos ou hardcoded no código.
              </p>
            </div>
            
            <div className="bg-white p-3 rounded border border-yellow-200">
              <h5 className="font-medium text-yellow-900 mb-2">Como funciona:</h5>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Todos os layouts são criados na página "🖨️ Configurar Layout"</li>
                <li>• Cada impressão usa as configurações salvas pelo usuário</li>
                <li>• Sem configuração = sem impressão (sistema falha intencionalmente)</li>
                <li>• Layouts podem ser testados antes de imprimir</li>
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={onConfigureLayout}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Layout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <div className="text-xs text-yellow-700">
                Configure pelo menos um layout para usar a impressão
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

interface NoLayoutsErrorProps {
  onCreateLayout?: () => void;
  className?: string;
}

export const NoLayoutsError: React.FC<NoLayoutsErrorProps> = ({
  onCreateLayout,
  className
}) => {
  return (
    <div className={className}>
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Nenhum Layout Configurado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-red-700">
          <div className="space-y-4">
            <p>
              O sistema de impressão dinâmica requer pelo menos um layout configurado 
              para funcionar. Atualmente não há layouts disponíveis.
            </p>
            
            <div className="bg-white p-4 rounded border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">O que fazer:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Acesse a página "🖨️ Configurar Layout"</li>
                <li>Crie um novo layout personalizado</li>
                <li>Configure as seções e campos desejados</li>
                <li>Salve o layout</li>
                <li>Retorne aqui para imprimir</li>
              </ol>
            </div>

            <Button
              onClick={onCreateLayout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Criar Primeiro Layout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


