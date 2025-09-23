const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Importar serviço de impressão USB
const usbPrinter = require('./electron-usb-printer');

// Importar servidor de impressão robusto
const robustPrintServer = require('./robust-print-server');

// Manter referência global da janela
let mainWindow;

function createWindow() {
  // Criar a janela principal (expandida para aplicação completa)
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    titleBarStyle: 'default',
    show: false, // Não mostrar até estar pronto
    autoHideMenuBar: false // Mostrar menu para navegação
  });

  // 🚀 APLICAÇÃO PRINCIPAL - Carregar frontend React
  const startUrl = isDev ? 'http://localhost:8081' : `file://${path.join(__dirname, 'dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Mostrar janela quando pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focar na janela
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Lidar com links externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Quando a janela for fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Menu da aplicação
function createMenu() {
  const template = [
    {
      label: 'JYZE.AI',
      submenu: [
        {
          label: 'Sobre o JYZE.AI',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre o JYZE.AI',
              message: 'JYZE.AI Desktop v1.0.0',
              detail: '🤖 Sistema inteligente de gestão de pedidos\n📊 Dashboard completo de analytics\n🖨️ Com impressão automática integrada\n\nDesenvolvido para otimizar seu negócio!'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.executeJavaScript(`window.location.href = '/#/'`);
          }
        },
        {
          label: 'Configurações',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.executeJavaScript(`window.location.href = '/#/configuracoes'`);
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Pedidos',
      submenu: [
        {
          label: 'Ver Pedidos',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.executeJavaScript(`window.location.href = '/#/pedidos'`);
          }
        },
        {
          label: 'Analytics de Pedidos',
          accelerator: 'CmdOrCtrl+A',
          click: () => {
            mainWindow.webContents.executeJavaScript(`window.location.href = '/#/dashboard-analytics'`);
          }
        }
      ]
    },
    {
      label: 'Gestão',
      submenu: [
        {
          label: 'Produtos',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            mainWindow.webContents.executeJavaScript(`window.location.href = '/#/produtos'`);
          }
        },
        {
          label: 'Agente IA',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.executeJavaScript(`window.location.href = '/#/agente'`);
          }
        },
        {
          label: 'Integrações',
          click: () => {
            mainWindow.webContents.executeJavaScript(`window.location.href = '/#/integracoes'`);
          }
        }
      ]
    },
    {
      label: 'Impressão',
      submenu: [
        {
          label: 'Testar Impressora',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('test-printer');
          }
        },
        {
          label: 'Configurar Impressora',
          click: () => {
            mainWindow.webContents.send('configure-printer');
          }
        }
      ]
    },
    {
      label: 'Janela',
      submenu: [
        {
          label: 'Minimizar',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Fechar',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        { type: 'separator' },
        {
          label: 'Recarregar',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Forçar Recarregar',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Documentação',
          click: () => {
            mainWindow.webContents.executeJavaScript(`window.location.href = '/#/documentacao'`);
          }
        },
        {
          label: 'Chat Suporte',
          click: () => {
            mainWindow.webContents.executeJavaScript(`window.location.href = '/#/chat'`);
          }
        },
        {
          label: 'Suporte Online',
          click: () => {
            shell.openExternal('https://api.jyze.space/support');
          }
        },
        { type: 'separator' },
        {
          label: 'DevTools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.openDevTools();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Pronto quando o Electron terminar de inicializar
app.whenReady().then(() => {
  console.log('🔧 Iniciando servidor robusto de impressão...');
  robustPrintServer.start(); // Iniciar servidor robusto
  
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Sair quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Manipuladores IPC para comunicação com o renderer
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Manipulador para notificações
ipcMain.handle('show-notification', (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      icon: path.join(__dirname, 'public/favicon.ico')
    }).show();
  }
});

// Log para debugging
console.log('🚀 JYZE.AI Desktop iniciando...');
console.log('📁 Diretório da aplicação:', __dirname);
console.log('🔧 Modo desenvolvimento:', isDev);
