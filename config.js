// Configuração centralizada do sistema
const CONFIG = {
    // Versão atual do sistema
    version: '2.1.0',
    
    // URLs para arquivos remotos - CONFIGURADO PARA SEU REPOSITÓRIO
    remote: {
        // URLs do seu GitHub Pages
        scriptDataUrl: 'https://castrox-dev.github.io/script-atendimento-fibramar/script-data.json',
        configUrl: 'https://castrox-dev.github.io/script-atendimento-fibramar/config.js',
        
        // Backup URLs (raw GitHub files)
        backupScriptDataUrl: 'https://raw.githubusercontent.com/castrox-dev/script-atendimento-fibramar/main/script-data.json',
        backupConfigUrl: 'https://raw.githubusercontent.com/castrox-dev/script-atendimento-fibramar/main/config.js'
    },
    
    // URLs locais (fallback)
    localUrls: {
        scriptData: './script-data.json'
    },
    
    // Configurações de atualização
    updateSettings: {
        checkInterval: 30000, // 30 segundos
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

// Sistema de versionamento e atualização
class UpdateManager {
    constructor() {
        this.currentVersion = CONFIG.version;
        this.lastCheck = localStorage.getItem('lastUpdateCheck');
        this.scriptData = null;
    }
    
    async checkForUpdates() {
        try {
            // Verifica se deve fazer a verificação
            const now = Date.now();
            const lastCheck = parseInt(this.lastCheck) || 0;
            
            if (now - lastCheck < CONFIG.updateSettings.checkInterval) {
                return false;
            }
            
            // Tenta carregar dados remotos
            const response = await fetch(CONFIG.remoteUrls.scriptData + '?t=' + now);
            if (response.ok) {
                const remoteData = await response.json();
                
                // Compara versões
                if (this.isNewerVersion(remoteData.version, this.currentVersion)) {
                    if (CONFIG.updateSettings.showUpdateNotifications) {
                        this.showUpdateNotification(remoteData.version);
                    }
                    
                    if (CONFIG.updateSettings.autoUpdate) {
                        await this.updateScriptData(remoteData);
                        return true;
                    }
                }
            }
            
            localStorage.setItem('lastUpdateCheck', now.toString());
            return false;
            
        } catch (error) {
            console.warn('Erro ao verificar atualizações:', error);
            return false;
        }
    }
    
    isNewerVersion(remote, local) {
        const remoteVersion = remote.split('.').map(Number);
        const localVersion = local.split('.').map(Number);
        
        for (let i = 0; i < Math.max(remoteVersion.length, localVersion.length); i++) {
            const r = remoteVersion[i] || 0;
            const l = localVersion[i] || 0;
            
            if (r > l) return true;
            if (r < l) return false;
        }
        
        return false;
    }
    
    async updateScriptData(newData) {
        try {
            // Backup dos dados atuais
            this.createBackup();
            
            // Atualiza os dados
            this.scriptData = newData;
            localStorage.setItem('scriptData', JSON.stringify(newData));
            localStorage.setItem('scriptVersion', newData.version);
            
            // Recarrega a interface
            if (window.renderTopics) {
                window.renderTopics();
            }
            
            this.showSuccessNotification(`Atualizado para versão ${newData.version}`);
            
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            this.showErrorNotification('Erro ao aplicar atualização');
        }
    }
    
    async loadScriptData() {
        try {
            // Tenta carregar dados remotos primeiro
            const response = await fetch(CONFIG.remoteUrls.scriptData + '?t=' + Date.now());
            if (response.ok) {
                this.scriptData = await response.json();
                localStorage.setItem('scriptData', JSON.stringify(this.scriptData));
                return this.scriptData;
            }
        } catch (error) {
            console.warn('Erro ao carregar dados remotos, usando dados locais:', error);
        }
        
        // Fallback para dados locais
        try {
            const localData = localStorage.getItem('scriptData');
            if (localData) {
                this.scriptData = JSON.parse(localData);
                return this.scriptData;
            }
            
            // Último fallback - carrega arquivo local
            const response = await fetch(CONFIG.localUrls.scriptData);
            if (response.ok) {
                this.scriptData = await response.json();
                return this.scriptData;
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
        
        return null;
    }
    
    createBackup() {
        try {
            const backups = JSON.parse(localStorage.getItem('scriptBackups') || '[]');
            const currentData = localStorage.getItem('scriptData');
            
            if (currentData) {
                backups.unshift({
                    timestamp: Date.now(),
                    version: this.currentVersion,
                    data: currentData
                });
                
                // Mantém apenas os últimos backups
                if (backups.length > CONFIG.ui.maxBackups) {
                    backups.splice(CONFIG.ui.maxBackups);
                }
                
                localStorage.setItem('scriptBackups', JSON.stringify(backups));
            }
        } catch (error) {
            console.warn('Erro ao criar backup:', error);
        }
    }
    
    showUpdateNotification(version) {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>Nova versão disponível!</strong>
                <p>Versão ${version} está disponível.</p>
                <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, CONFIG.notifications.duration);
    }
    
    showSuccessNotification(message) {
        this.showNotification(message, 'success');
    }
    
    showErrorNotification(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, CONFIG.notifications.duration);
    }
}

// Sistema de backup automático
class BackupManager {
    constructor() {
        this.backupInterval = null;
        this.startAutoBackup();
    }
    
    startAutoBackup() {
        if (CONFIG.ui.autoSaveNotepad) {
            this.backupInterval = setInterval(() => {
                this.createAutoBackup();
            }, CONFIG.ui.backupInterval);
        }
    }
    
    createAutoBackup() {
        try {
            const notepadContent = document.getElementById('notepadContent')?.value || '';
            const attendantName = document.getElementById('attendantName')?.value || '';
            
            const backupData = {
                timestamp: Date.now(),
                notepadContent,
                attendantName,
                theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
            };
            
            localStorage.setItem('autoBackup', JSON.stringify(backupData));
        } catch (error) {
            console.warn('Erro ao criar backup automático:', error);
        }
    }
    
    restoreAutoBackup() {
        try {
            const backup = localStorage.getItem('autoBackup');
            if (backup) {
                const data = JSON.parse(backup);
                
                // Restaura apenas se for recente (últimas 24 horas)
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    const notepadContent = document.getElementById('notepadContent');
                    const attendantName = document.getElementById('attendantName');
                    
                    if (notepadContent && data.notepadContent) {
                        notepadContent.value = data.notepadContent;
                    }
                    
                    if (attendantName && data.attendantName) {
                        attendantName.value = data.attendantName;
                    }
                    
                    // Restaura tema
                    if (data.theme === 'dark') {
                        document.body.classList.add('dark-theme');
                    }
                }
            }
        } catch (error) {
            console.warn('Erro ao restaurar backup automático:', error);
        }
    }
}

// Inicialização global
window.CONFIG = CONFIG;
window.updateManager = new UpdateManager();
window.backupManager = new BackupManager();

// Exporta para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, UpdateManager, BackupManager };
}