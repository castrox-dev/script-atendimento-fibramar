// Configuração centralizada do sistema - TEMPLATE GITHUB PAGES
const CONFIG = {
    // Versão atual do sistema
    version: '2.1.0',
    
    // URLs para arquivos remotos - CONFIGURE APÓS HOSPEDAR NO GITHUB
    remote: {
        // SUBSTITUA "SEU-USUARIO" e "NOME-DO-REPOSITORIO" pelos seus dados reais
        scriptDataUrl: 'https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/script-data.json',
        configUrl: 'https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/config.js',
        
        // Exemplo com dados reais:
        // scriptDataUrl: 'https://joaosilva.github.io/script-atendimento-fibramar/script-data.json',
        // configUrl: 'https://joaosilva.github.io/script-atendimento-fibramar/config.js',
    },
    
    // URLs locais (fallback)
    localUrls: {
        scriptData: './script-data.json'
    },
    
    // Configurações de atualização
    updateSettings: {
        checkInterval: 300000, // 5 minutos (recomendado para GitHub Pages)
        autoUpdate: true,
        showUpdateNotifications: true
    },
    
    // Configurações da interface
    ui: {
        theme: 'light', // 'light' ou 'dark'
        autoSaveNotepad: true,
        backupInterval: 300000, // 5 minutos
        maxBackups: 5
    },
    
    // Configurações da empresa
    company: {
        name: 'Fibramar Internet',
        supportHours: '24 horas, todos os dias',
        phones: ['0800 100 3850', '(21) 3864-3850']
    },
    
    // Configurações de notificação
    notifications: {
        duration: 3000,
        position: 'top-right'
    }
};

// Função para detectar se está rodando no GitHub Pages
function isGitHubPages() {
    return window.location.hostname.includes('github.io');
}

// Auto-configuração para GitHub Pages (opcional)
if (isGitHubPages()) {
    const pathParts = window.location.pathname.split('/');
    const username = window.location.hostname.split('.')[0];
    const repoName = pathParts[1];
    
    if (username && repoName) {
        CONFIG.remote.scriptDataUrl = `https://${username}.github.io/${repoName}/script-data.json`;
        CONFIG.remote.configUrl = `https://${username}.github.io/${repoName}/config.js`;
        console.log('🚀 Auto-configurado para GitHub Pages:', CONFIG.remote);
    }
}