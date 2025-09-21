import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from '@/utils/FirecrawlService';
import { Globe, Utensils, DollarSign, ChefHat, Loader2 } from 'lucide-react';

interface MenuItem {
  name: string;
  price: string;
  description: string;
  category: string;
}

interface MenuData {
  menu_items: MenuItem[];
  restaurant_name: string;
  categories: string[];
}

export const MenuExtractor = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!FirecrawlService.getApiKey());

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave API válida",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const isValid = await FirecrawlService.testApiKey(apiKey);
    
    if (isValid) {
      FirecrawlService.saveApiKey(apiKey);
      setShowApiKeyInput(false);
      toast({
        title: "Sucesso",
        description: "Chave API salva com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Chave API inválida ou serviço indisponível",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setMenuData(null);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);
    
    try {
      console.log('Starting menu extraction for URL:', url);
      const result = await FirecrawlService.extractMenu(url);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success && result.data?.extract) {
        toast({
          title: "Sucesso",
          description: "Cardápio extraído com sucesso!",
        });
        setMenuData(result.data.extract);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Falha ao extrair cardápio",
          variant: "destructive",
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error extracting menu:', error);
      toast({
        title: "Erro",
        description: "Falha ao extrair cardápio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  if (showApiKeyInput) {
    return (
      <Card className="glass-card p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Configurar Extração de Cardápio</h3>
          <p className="text-muted-foreground">
            Configure sua chave API do Firecrawl para começar a extrair cardápios
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              Chave API Firecrawl
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="fc-..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Obtenha sua chave API em{' '}
              <a 
                href="https://firecrawl.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                firecrawl.dev
              </a>
            </p>
          </div>
          
          <Button 
            onClick={handleSaveApiKey} 
            disabled={isLoading}
            className="w-full bg-gradient-primary hover:shadow-glow"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Salvar Chave API'
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Extração de Cardápio</h3>
          <p className="text-muted-foreground">
            Extraia automaticamente cardápios de restaurantes usando IA
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              URL do Restaurante
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://restaurante.com/cardapio"
              required
            />
          </div>
          
          {isLoading && progress > 0 && (
            <Progress value={progress} className="w-full" />
          )}
          
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-primary hover:shadow-glow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extraindo...
                </>
              ) : (
                <>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Extrair Cardápio
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowApiKeyInput(true)}
            >
              Configurar API
            </Button>
          </div>
        </form>
      </Card>

      {menuData && (
        <Card className="glass-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Utensils className="h-5 w-5 text-primary" />
              {menuData.restaurant_name || 'Cardápio Extraído'}
            </h3>
            
            {menuData.categories && menuData.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {menuData.categories.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {menuData.menu_items && menuData.menu_items.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium text-muted-foreground">
                {menuData.menu_items.length} itens encontrados
              </h4>
              
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {menuData.menu_items.map((item, index) => (
                  <div key={index} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h5 className="font-medium">{item.name}</h5>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        {item.category && (
                          <Badge variant="outline" className="mt-2">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      {item.price && (
                        <div className="flex items-center gap-1 text-primary font-medium">
                          <DollarSign className="h-4 w-4" />
                          {item.price}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum item de cardápio foi encontrado. 
                Tente com uma URL diferente.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};