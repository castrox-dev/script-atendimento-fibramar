// Script de Atendimento - Fibramar Internet
// Versão otimizada com melhor organização e performance

// Lazy Loading Manager
class LazyLoadManager {
    constructor() {
        this.loadedResources = new Set();
        this.pendingLoads = new Map();
    }

    async loadResource(url, type = 'json') {
        if (this.loadedResources.has(url)) {
            return this.pendingLoads.get(url);
        }

        const loadPromise = this.fetchResource(url, type);
        this.pendingLoads.set(url, loadPromise);
        this.loadedResources.add(url);
        
        return loadPromise;
    }

    async fetchResource(url, type) {
        try {
            const response = await fetch(url + '?t=' + Date.now());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            switch (type) {
                case 'json':
                    return await response.json();
                case 'text':
                    return await response.text();
                default:
                    return response;
            }
        } catch (error) {
            console.warn(`Failed to load resource: ${url}`, error);
            throw error;
        }
    }

    preloadCriticalResources() {
        // Preload script data in background
        this.loadResource(CONFIG.remote.scriptDataUrl, 'json').catch(() => {
            // Fallback to local if remote fails
            this.loadResource(CONFIG.localUrls.scriptData, 'json');
        });
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.startTime = performance.now();
    }

    mark(name) {
        this.metrics[name] = performance.now() - this.startTime;
    }

    getMetrics() {
        return this.metrics;
    }
}

// Configuração integrada
const CONFIG = {
    version: '2.1.0',
    remote: {
        scriptDataUrl: 'https://castrox-dev.github.io/script-atendimento-fibramar/script-data.json',
        configUrl: 'https://castrox-dev.github.io/script-atendimento-fibramar/config.js',
        backupScriptDataUrl: 'https://raw.githubusercontent.com/castrox-dev/script-atendimento-fibramar/main/script-data.json',
        backupConfigUrl: 'https://raw.githubusercontent.com/castrox-dev/script-atendimento-fibramar/main/config.js'
    },
    localUrls: {
        scriptData: './script-data.json'
    },
    updateSettings: {
        checkInterval: 30000,
        autoUpdate: true,
        showUpdateNotifications: true
    },
    ui: {
        theme: 'light',
        autoSaveNotepad: true,
        backupInterval: 300000,
        maxBackups: 5
    },
    company: {
        name: 'Fibramar Internet',
        supportHours: '24 horas, todos os dias',
        phones: ['0800 100 3850', '(21) 3864-3850']
    },
    notifications: {
        duration: 3000,
        position: 'top-right'
    }
};

// UpdateManager otimizado
class UpdateManager {
    constructor(lazyLoader) {
        this.scriptData = null;
        this.currentVersion = CONFIG.version;
        this.lastCheck = localStorage.getItem('lastUpdateCheck') || 0;
        this.lazyLoader = lazyLoader;
    }

    async loadScriptData() {
        try {
            this.scriptData = await this.lazyLoader.loadResource(CONFIG.remote.scriptDataUrl, 'json');
            localStorage.setItem('scriptData', JSON.stringify(this.scriptData));
            return this.scriptData;
        } catch (error) {
            console.warn('Erro ao carregar dados remotos, usando dados locais:', error);
        }
        
        try {
            const localData = localStorage.getItem('scriptData');
            if (localData) {
                this.scriptData = JSON.parse(localData);
                return this.scriptData;
            }
            
            this.scriptData = await this.lazyLoader.loadResource(CONFIG.localUrls.scriptData, 'json');
            return this.scriptData;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
        
        return null;
    }

    async checkForUpdates() {
        try {
            const now = Date.now();
            const lastCheck = parseInt(this.lastCheck) || 0;
            
            if (now - lastCheck < CONFIG.updateSettings.checkInterval) {
                return false;
            }
            
            const response = await fetch(CONFIG.remote.scriptDataUrl + '?t=' + now);
            if (response.ok) {
                const remoteData = await response.json();
                
                if (this.isNewerVersion(remoteData.version, this.currentVersion)) {
                    if (CONFIG.updateSettings.autoUpdate) {
                        this.scriptData = remoteData;
                        localStorage.setItem('scriptData', JSON.stringify(remoteData));
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
}

// BackupManager otimizado
class BackupManager {
    constructor() {
        this.maxBackups = CONFIG.ui.maxBackups;
    }

    restoreAutoBackup() {
        try {
            const backup = localStorage.getItem('notepadAutoBackup');
            if (backup) {
                const notepad = document.getElementById('notepad');
                if (notepad && !notepad.value.trim()) {
                    notepad.value = backup;
                }
            }
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
        }
    }
}

// Classe principal da aplicação
class FibramarApp {
    constructor() {
        this.scriptData = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.lazyLoader = new LazyLoadManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.updateManager = new UpdateManager(this.lazyLoader);
        this.backupManager = new BackupManager();
    }

    async init() {
        try {
            this.performanceMonitor.mark('init_start');
            
            // Preload critical resources
            this.lazyLoader.preloadCriticalResources();
            
            // Carrega dados do script
            this.scriptData = await this.updateManager.loadScriptData();
            
            if (!this.scriptData) {
                this.scriptData = this.getFallbackData();
            }

            // Inicializa componentes
            this.initializeTheme();
            this.initializeNotepad();
            this.initializeEventListeners();
            this.renderTopics();
            this.updateDateTime();
            this.updateWeather();
            
            // Restaura backup automático
            this.backupManager.restoreAutoBackup();
            
            // Verifica atualizações
            await this.updateManager.checkForUpdates();
            
            // Configura verificação periódica de atualizações
            setInterval(() => {
                this.updateManager.checkForUpdates();
            }, CONFIG.updateSettings.checkInterval);

            this.performanceMonitor.mark('init_complete');
            
            // Log performance metrics in development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('Performance Metrics:', this.performanceMonitor.getMetrics());
            }

        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showNotification('Erro na inicialização da aplicação', 'error');
        }
    }

    getFallbackData() {
        return {
            version: "2.1.0",
            lastUpdated: "2024-12-19",
            company: {
                name: "Fibramar Internet",
                phones: ["0800 100 3850", "(21) 3864-3850"],
                website: "https://crnetfibramar.com.br/",
                whatsapp: "https://api.whatsapp.com/send/?phone=5508001003850"
            },
            scriptData: {
                "✅ INÍCIO DE ATENDIMENTO": [
                    "Olá! Seja bem-vindo(a) ao atendimento da Fibramar Internet.\n\nNosso atendimento é 24 horas, todos os dias.\n\nCaso prefira atendimento por ligação, utilize um dos nossos números:\n\n📞 0800 100 3850\n📞 (21) 3864-3850\n\nMeu nome é [NOME_ATENDENTE], e vou lhe atender agora.\n\nEm que posso ajudar?"
                ],
                "🧾 IDENTIFICAÇÃO DO CLIENTE": [
                    "[PERIODO]! \nPoderia me informar o nome completo ou o cpf do titular, por gentileza?"
                ],
                "🔚 ENCERRAMENTOS": [
                    "Por falta de comunicação, o atendimento está sendo encerrado.\nPara atendimento, peço que retorne o contato com a nossa central nos telefones: FIBRAMAR: 0800 100 3850 \nOu envie uma mensagem por aqui novamente, nosso atendimento é 24 horas, todos os dias!\nAgradecemos o seu contato, tenha uma ótima semana!"
                ]
            }
        };
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            this.updateThemeToggle(true);
        }
    }

    initializeEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Search
        document.getElementById('searchBox').addEventListener('input', () => this.handleSearch());
        
        // Notepad
        document.getElementById('openNotepad').addEventListener('click', () => this.openNotepad());
        document.getElementById('closeNotepad').addEventListener('click', () => this.closeNotepad());
        document.getElementById('minimizeNotepad').addEventListener('click', () => this.minimizeNotepad());
        document.getElementById('exportNotepad').addEventListener('click', () => this.exportNotepad());
        document.getElementById('importNotepad').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importNotepad(e));
        document.getElementById('clearNotepad').addEventListener('click', () => this.clearNotepad());
        document.getElementById('notepadContent').addEventListener('input', () => this.updateCharCount());
        
        // Calculator
        document.getElementById('openCalculator').addEventListener('click', () => this.openCalculator());
        document.getElementById('calculatorModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeCalculator();
        });
        
        // Notepad dragging
        const notepadHeader = document.getElementById('notepadHeader');
        notepadHeader.addEventListener('mousedown', (e) => this.startDragging(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDragging());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey) {
            switch(e.key) {
                case 'n':
                    e.preventDefault();
                    this.openNotepad();
                    break;
                case 'k':
                    e.preventDefault();
                    document.getElementById('searchBox').focus();
                    break;
                case 'Escape':
                    this.closeCalculator();
                    break;
            }
        }
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateThemeToggle(isDark);
    }

    updateThemeToggle(isDark) {
        const icon = document.getElementById('themeIcon');
        const text = document.getElementById('themeText');
        
        if (isDark) {
            icon.textContent = '☀️';
            text.textContent = 'Modo Claro';
        } else {
            icon.textContent = '🌙';
            text.textContent = 'Modo Escuro';
        }
    }

    renderTopics(searchTerm = '') {
        if (!this.scriptData || !this.scriptData.scriptData) return;
        
        const topicsContainer = document.getElementById('topics');
        topicsContainer.innerHTML = '';

        Object.entries(this.scriptData.scriptData).forEach(([topicName, messages]) => {
            if (searchTerm && !topicName.toLowerCase().includes(searchTerm.toLowerCase()) && 
                !messages.some(msg => msg.toLowerCase().includes(searchTerm.toLowerCase()))) {
                return;
            }

            const topicDiv = this.createTopicElement(topicName, messages, searchTerm);
            topicsContainer.appendChild(topicDiv);
        });

        // Renderiza senhas se existirem
        if (this.scriptData.passwords) {
            this.renderPasswords();
        }
    }

    createTopicElement(topicName, messages, searchTerm) {
        const topicDiv = document.createElement('div');
        topicDiv.className = 'topic';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'topic-title';
        
        const titleContent = document.createElement('div');
        titleContent.className = 'topic-title-content';
        titleContent.textContent = topicName;
        
        const arrow = document.createElement('div');
        arrow.className = 'topic-arrow collapsed';
        
        titleDiv.appendChild(titleContent);
        titleDiv.appendChild(arrow);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'topic-content collapsed';
        
        topicDiv.appendChild(titleDiv);
        topicDiv.appendChild(contentDiv);
        
        // Adiciona funcionalidade de toggle
        titleDiv.addEventListener('click', () => {
            const isCollapsed = contentDiv.classList.contains('collapsed');
            if (isCollapsed) {
                contentDiv.classList.remove('collapsed');
                arrow.classList.remove('collapsed');
            } else {
                contentDiv.classList.add('collapsed');
                arrow.classList.add('collapsed');
            }
        });

        if (topicName.includes('SENHAS') || topicName.includes('PASSWORDS')) {
            this.renderPasswordTopic(contentDiv, messages);
        } else {
            this.renderMessages(contentDiv, messages, searchTerm);
        }

        return topicDiv;
    }

    renderMessages(contentDiv, messages, searchTerm) {
        messages.forEach((message) => {
            if (!searchTerm || message.toLowerCase().includes(searchTerm.toLowerCase())) {
                const messageDiv = this.createMessageElement(message);
                contentDiv.appendChild(messageDiv);
            }
        });
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const messageContentDiv = document.createElement('div');
        messageContentDiv.className = 'message-content';
        
        // Preserva quebras de linha convertendo \n para <br>
        const formattedMessage = message.replace(/\n/g, '<br>');
        messageContentDiv.innerHTML = formattedMessage;
        
        // Adiciona apenas o botão de copiar
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        const copyBtn = this.createCopyButton(message);
        actionsDiv.appendChild(copyBtn);
        
        messageDiv.appendChild(messageContentDiv);
        messageDiv.appendChild(actionsDiv);
        
        return messageDiv;
    }

    createCopyButton(message) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copiar';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            this.copyToClipboard(message);
        };
        return copyBtn;
    }

    renderPasswords() {
        const topicsContainer = document.getElementById('topics');
        
        const passwordDiv = document.createElement('div');
        passwordDiv.className = 'topic';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'topic-title';
        
        const titleContent = document.createElement('div');
        titleContent.className = 'topic-title-content';
        titleContent.textContent = '🔐 SENHAS PADRÃO';
        
        const arrow = document.createElement('div');
        arrow.className = 'topic-arrow collapsed';
        
        titleDiv.appendChild(titleContent);
        titleDiv.appendChild(arrow);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'topic-content collapsed';
        
        passwordDiv.appendChild(titleDiv);
        passwordDiv.appendChild(contentDiv);
        
        // Adiciona funcionalidade de toggle
        titleDiv.addEventListener('click', () => {
            const isCollapsed = contentDiv.classList.contains('collapsed');
            if (isCollapsed) {
                contentDiv.classList.remove('collapsed');
                arrow.classList.remove('collapsed');
            } else {
                contentDiv.classList.add('collapsed');
                arrow.classList.add('collapsed');
            }
        });
        
        this.scriptData.passwords.items.forEach(item => {
            const table = this.createPasswordTable(item);
            contentDiv.appendChild(table);
        });
        
        topicsContainer.appendChild(passwordDiv);
    }

    createPasswordTable(item) {
        const table = document.createElement('table');
        table.className = 'password-table';
        
        const caption = document.createElement('caption');
        caption.textContent = item.title;
        caption.style.fontWeight = 'bold';
        caption.style.marginBottom = '10px';
        table.appendChild(caption);
        
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Usuário</th><th>Senha</th>';
        table.appendChild(headerRow);
        
        item.credentials.forEach(cred => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${cred.user}</td><td>${cred.password}</td>`;
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                const text = `Usuário: ${cred.user}\nSenha: ${cred.password}`;
                this.copyToClipboard(text);
            });
            table.appendChild(row);
        });
        
        return table;
    }

    handleSearch() {
        const searchTerm = document.getElementById('searchBox').value;
        this.renderTopics(searchTerm);
    }

    copyToClipboard(text) {
        const processedText = this.replaceVariables(text);
        
        navigator.clipboard.writeText(processedText).then(() => {
            this.showNotification('Texto copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar texto:', err);
            this.showNotification('Erro ao copiar texto', 'error');
        });
    }

    replaceVariables(text) {
        const now = new Date();
        const attendantName = document.getElementById('attendantName').value || '[NOME_ATENDENTE]';
        
        const period = now.getHours() < 12 ? 'Bom dia' : 
                      now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
        
        return text
            .replace(/\[PERIODO\]/g, period)
            .replace(/\[NOME_ATENDENTE\]/g, attendantName)
            .replace(/\[DATA\]/g, now.toLocaleDateString('pt-BR'))
            .replace(/\[HORA\]/g, now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }

    showNotification(message, type = 'success') {
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

    // Notepad functions
    initializeNotepad() {
        const savedContent = localStorage.getItem('notepadContent');
        if (savedContent) {
            document.getElementById('notepadContent').value = savedContent;
            this.updateCharCount();
        }
        
        document.getElementById('notepadContent').addEventListener('input', () => {
            localStorage.setItem('notepadContent', document.getElementById('notepadContent').value);
            this.updateCharCount();
        });
    }

    openNotepad() {
        document.getElementById('notepad').style.display = 'flex';
    }

    closeNotepad() {
        document.getElementById('notepad').style.display = 'none';
    }

    minimizeNotepad() {
        const notepad = document.getElementById('notepad');
        notepad.style.display = notepad.style.display === 'none' ? 'flex' : 'none';
    }

    exportNotepad() {
        const content = document.getElementById('notepadContent').value;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `notas_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Arquivo exportado com sucesso!');
    }

    importNotepad(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('notepadContent').value = e.target.result;
                localStorage.setItem('notepadContent', e.target.result);
                this.updateCharCount();
                this.showNotification('Arquivo importado com sucesso!');
            };
            reader.readAsText(file);
        }
    }

    clearNotepad() {
        if (confirm('Tem certeza que deseja limpar todas as anotações?')) {
            document.getElementById('notepadContent').value = '';
            localStorage.removeItem('notepadContent');
            this.updateCharCount();
            this.showNotification('Anotações limpas!');
        }
    }

    updateCharCount() {
        const content = document.getElementById('notepadContent').value;
        document.getElementById('charCount').textContent = `${content.length} caracteres`;
    }

    // Dragging functionality
    startDragging(e) {
        this.isDragging = true;
        const notepad = document.getElementById('notepad');
        const rect = notepad.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
    }

    drag(e) {
        if (!this.isDragging) return;
        
        const notepad = document.getElementById('notepad');
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
        notepad.style.left = `${x}px`;
        notepad.style.top = `${y}px`;
        notepad.style.transform = 'none';
    }

    stopDragging() {
        this.isDragging = false;
    }

    // Calculator functions
    openCalculator() {
        document.getElementById('calculatorModal').style.display = 'flex';
    }

    closeCalculator() {
        document.getElementById('calculatorModal').style.display = 'none';
    }

    calculateProportional() {
        const value = parseFloat(document.getElementById('propValue').value);
        const days = parseInt(document.getElementById('propDays').value);
        
        if (isNaN(value) || isNaN(days) || days <= 0 || days > 31) {
            this.showNotification('Por favor, insira valores válidos', 'error');
            return;
        }
        
        const proportional = (value / 30) * days;
        const result = document.getElementById('propResult');
        result.innerHTML = `
            <strong>Resultado:</strong><br>
            Valor proporcional: R$ ${proportional.toFixed(2)}<br>
            Base: R$ ${value.toFixed(2)} ÷ 30 dias × ${days} dias
        `;
        result.style.display = 'block';
    }

    calculateAgreement() {
        const value = parseFloat(document.getElementById('agreementValue').value);
        const discount = parseFloat(document.getElementById('agreementDiscount').value);
        
        if (isNaN(value) || isNaN(discount) || discount < 0 || discount > 100) {
            this.showNotification('Por favor, insira valores válidos', 'error');
            return;
        }
        
        const discountAmount = (value * discount) / 100;
        const finalValue = value - discountAmount;
        
        const result = document.getElementById('agreementResult');
        result.innerHTML = `
            <strong>Resultado:</strong><br>
            Valor original: R$ ${value.toFixed(2)}<br>
            Desconto (${discount}%): R$ ${discountAmount.toFixed(2)}<br>
            <strong>Valor final: R$ ${finalValue.toFixed(2)}</strong>
        `;
        result.style.display = 'block';
    }

    calculateCommission() {
        const value = parseFloat(document.getElementById('commissionValue').value);
        const rate = parseFloat(document.getElementById('commissionRate').value);
        
        if (isNaN(value) || isNaN(rate) || rate < 0) {
            this.showNotification('Por favor, insira valores válidos', 'error');
            return;
        }
        
        const commission = (value * rate) / 100;
        
        const result = document.getElementById('commissionResult');
        result.innerHTML = `
            <strong>Resultado:</strong><br>
            Valor da venda: R$ ${value.toFixed(2)}<br>
            Taxa de comissão: ${rate}%<br>
            <strong>Comissão: R$ ${commission.toFixed(2)}</strong>
        `;
        result.style.display = 'block';
    }

    // Date/Time and Weather functions
    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        document.getElementById('datetime').textContent = now.toLocaleDateString('pt-BR', options);
    }

    async updateWeather() {
        try {
            // Usando Open-Meteo API (gratuita) com lazy loading
            const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=-22.9068&longitude=-43.1729&current_weather=true&timezone=America/Sao_Paulo';
            const data = await this.lazyLoader.loadResource(weatherUrl, 'json');
            
            if (data.current_weather) {
                const temp = Math.round(data.current_weather.temperature);
                document.getElementById('temperature').textContent = `${temp}°C - Rio de Janeiro`;
            }
        } catch (error) {
            console.warn('Erro ao carregar dados do clima:', error);
            document.getElementById('temperature').textContent = 'Clima indisponível';
        }
    }
}

// Inicialização da aplicação
let app;

document.addEventListener('DOMContentLoaded', async function() {
    app = new FibramarApp();
    await app.init();
    
    // Update intervals
    setInterval(() => app.updateDateTime(), 1000);
    setInterval(() => app.updateWeather(), 600000); // 10 minutos
});

// Expose functions globally for calculator buttons
window.calculateProportional = () => app.calculateProportional();
window.calculateAgreement = () => app.calculateAgreement();
window.calculateCommission = () => app.calculateCommission();
window.closeCalculator = () => app.closeCalculator();
window.renderTopics = (searchTerm) => app.renderTopics(searchTerm);

// Expose CONFIG and managers globally for compatibility
window.CONFIG = CONFIG;
window.updateManager = new UpdateManager();
window.backupManager = new BackupManager();