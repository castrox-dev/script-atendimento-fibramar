// Script de Atendimento - Fibramar Internet
// Versão otimizada com melhor organização e performance para GitHub Pages

// Theme Manager - Sistema de temas automático
class AnimationManager {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupPageTransitions();
        this.addGlobalAnimationClasses();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '50px'
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target, 'animate-fade-in');
                }
            });
        }, options);
    }

    setupPageTransitions() {
        document.body.classList.add('page-transition');
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.classList.add('loaded');
            }, 100);
        });
    }

    addGlobalAnimationClasses() {
        // Add animation classes to topics when they're rendered
        const style = document.createElement('style');
        style.textContent = `
            .topic {
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.5s ease-out;
            }
            
            .topic.animate-in {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    animateElement(element, animationClass, duration = null) {
        return new Promise((resolve) => {
            element.classList.add(animationClass);
            
            const handleAnimationEnd = () => {
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
            
            if (duration) {
                setTimeout(() => {
                    element.removeEventListener('animationend', handleAnimationEnd);
                    resolve();
                }, duration);
            }
        });
    }

    async animateSequence(elements, animationClass, delay = 100) {
        for (let i = 0; i < elements.length; i++) {
            this.animateElement(elements[i], animationClass);
            if (i < elements.length - 1) {
                await this.delay(delay);
            }
        }
    }

    animateTopics() {
        const topics = document.querySelectorAll('.topic');
        topics.forEach((topic, index) => {
            setTimeout(() => {
                topic.classList.add('animate-in');
            }, index * 100);
        });
    }

    animateMessages(container) {
        const messages = container.querySelectorAll('.message');
        messages.forEach((message, index) => {
            setTimeout(() => {
                this.animateElement(message, 'animate-fade-in');
            }, index * 50);
        });
    }

    showNotificationWithAnimation(element, type = 'success') {
        element.classList.add('animate-scale-in');
        
        if (type === 'success') {
            element.classList.add('success-feedback');
        } else if (type === 'error') {
            element.classList.add('error-feedback');
        }
        
        setTimeout(() => {
            element.classList.remove('success-feedback', 'error-feedback');
        }, 600);
    }

    addButtonPressEffect(button) {
        button.addEventListener('mousedown', () => {
            button.classList.add('button-press');
        });
        
        button.addEventListener('mouseup', () => {
            button.classList.remove('button-press');
        });
        
        button.addEventListener('mouseleave', () => {
            button.classList.remove('button-press');
        });
    }

    addHoverEffects() {
        // Add hover effects to all interactive elements
        const interactiveElements = document.querySelectorAll('button, .topic, .message, .floating-btn');
        
        interactiveElements.forEach(element => {
            this.addButtonPressEffect(element);
        });
    }

    observeElement(element) {
        this.intersectionObserver.observe(element);
    }

    unobserveElement(element) {
        this.intersectionObserver.unobserve(element);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 300) {
        let start = null;
        const initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = initialOpacity * (1 - Math.min(progress / duration, 1));
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }

    slideIn(element, direction = 'right', duration = 300) {
        const directions = {
            right: 'animate-slide-in-right',
            left: 'animate-slide-in-left',
            top: 'animate-slide-in-top',
            bottom: 'animate-slide-in-bottom'
        };
        
        return this.animateElement(element, directions[direction], duration);
    }

    scaleIn(element, duration = 300) {
        return this.animateElement(element, 'animate-scale-in', duration);
    }

    pulse(element) {
        element.classList.add('animate-pulse');
        setTimeout(() => {
            element.classList.remove('animate-pulse');
        }, 2000);
    }

    shake(element) {
        element.classList.add('animate-shake');
        setTimeout(() => {
            element.classList.remove('animate-shake');
        }, 500);
    }

    glow(element) {
        element.classList.add('animate-glow');
        setTimeout(() => {
            element.classList.remove('animate-glow');
        }, 2000);
    }

    addLoadingAnimation(element) {
        element.classList.add('loading');
    }

    removeLoadingAnimation(element) {
        element.classList.remove('loading');
    }

    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        this.observers.clear();
    }
}

class ThemeManager {
    constructor() {
        this.storageKey = 'fibramar-theme-preference';
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
        this.watchSystemTheme();
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    getStoredTheme() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (error) {
            console.warn('Erro ao carregar preferência de tema:', error);
            return null;
        }
    }

    setStoredTheme(theme) {
        try {
            if (theme === 'auto') {
                localStorage.removeItem(this.storageKey);
            } else {
                localStorage.setItem(this.storageKey, theme);
            }
        } catch (error) {
            console.warn('Erro ao salvar preferência de tema:', error);
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        const body = document.body;
        
        // Remove classes anteriores
        root.removeAttribute('data-theme');
        body.classList.remove('light-theme', 'dark-theme');
        
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            body.classList.add('dark-theme');
        } else {
            root.setAttribute('data-theme', 'light');
            body.classList.add('light-theme');
        }
        
        this.updateThemeIcon(theme);
        this.currentTheme = theme;
    }

    updateThemeIcon(theme) {
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        
        if (sunIcon && moonIcon) {
            if (theme === 'dark') {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            } else {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            }
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.setStoredTheme(newTheme);
        
        // Trigger analytics
        if (window.app && window.app.analytics) {
            window.app.analytics.trackEvent('theme_changed', { theme: newTheme });
        }
        
        // Show notification
        if (window.app) {
            window.app.showNotification(
                `Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`, 
                'info'
            );
        }
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Só aplica automaticamente se não há preferência salva
            if (!this.getStoredTheme()) {
                const systemTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(systemTheme);
            }
        });
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    setTheme(theme) {
        if (['light', 'dark', 'auto'].includes(theme)) {
            if (theme === 'auto') {
                this.setStoredTheme('auto');
                this.applyTheme(this.getSystemTheme());
            } else {
                this.applyTheme(theme);
                this.setStoredTheme(theme);
            }
        }
    }

    getThemePreference() {
        const stored = this.getStoredTheme();
        return stored || 'auto';
    }
}

// Analytics Manager - Sistema simples para GitHub Pages
class AnalyticsManager {
    constructor() {
        this.storageKey = 'fibramar-analytics';
        this.sessionKey = 'fibramar-session';
        this.initSession();
    }

    initSession() {
        const session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 1,
            messagesUsed: 0,
            calculatorUsed: 0,
            notepadUsed: 0,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
        this.saveAnalytics('session_start', session);
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    trackEvent(eventType, data = {}) {
        const session = JSON.parse(sessionStorage.getItem(this.sessionKey) || '{}');
        
        const event = {
            type: eventType,
            timestamp: Date.now(),
            sessionId: session.id,
            data: data
        };

        // Atualizar contadores da sessão
        switch(eventType) {
            case 'message_copied':
                session.messagesUsed++;
                break;
            case 'calculator_used':
                session.calculatorUsed++;
                break;
            case 'notepad_used':
                session.notepadUsed++;
                break;
        }

        sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
        this.saveAnalytics('event', event);
    }

    saveAnalytics(type, data) {
        try {
            const analytics = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            analytics.push({ type, data, timestamp: Date.now() });
            
            // Manter apenas os últimos 1000 registros
            if (analytics.length > 1000) {
                analytics.splice(0, analytics.length - 1000);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(analytics));
        } catch (error) {
            console.warn('Erro ao salvar analytics:', error);
        }
    }

    getAnalytics() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            console.warn('Erro ao carregar analytics:', error);
            return [];
        }
    }

    getStats() {
        const analytics = this.getAnalytics();
        const events = analytics.filter(a => a.type === 'event');
        const sessions = analytics.filter(a => a.type === 'session_start');

        const messagesCopied = events.filter(e => e.data.type === 'message_copied').length;
        const calculatorUsed = events.filter(e => e.data.type === 'calculator_used').length;
        const notepadUsed = events.filter(e => e.data.type === 'notepad_used').length;

        return {
            totalSessions: sessions.length,
            totalEvents: events.length,
            messagesCopied,
            calculatorUsed,
            notepadUsed,
            lastSession: sessions[sessions.length - 1]?.data || null
        };
    }

    exportAnalytics() {
        const analytics = this.getAnalytics();
        const stats = this.getStats();
        
        const exportData = {
            exportDate: new Date().toISOString(),
            stats,
            rawData: analytics
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fibramar-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Lazy Loading Manager
class LazyLoadManager {
    constructor() {
        this.loadedResources = new Map();
        this.pendingLoads = new Map();
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async loadResource(url, type = 'json', useCache = true) {
        const cacheKey = `${url}_${type}`;
        
        // Check cache first
        if (useCache && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Check if already loading
        if (this.pendingLoads.has(cacheKey)) {
            return this.pendingLoads.get(cacheKey);
        }

        const loadPromise = this.fetchResourceWithRetry(url, type, cacheKey);
        this.pendingLoads.set(cacheKey, loadPromise);
        
        try {
            const result = await loadPromise;
            if (useCache) {
                this.cache.set(cacheKey, result);
                this.cacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout);
            }
            this.loadedResources.set(cacheKey, result);
            return result;
        } finally {
            this.pendingLoads.delete(cacheKey);
        }
    }

    async fetchResourceWithRetry(url, type, cacheKey) {
        const retryCount = this.retryAttempts.get(cacheKey) || 0;
        
        try {
            const response = await this.fetchWithTimeout(url, 10000); // 10s timeout
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            // Reset retry count on success
            this.retryAttempts.delete(cacheKey);
            
            switch (type) {
                case 'json':
                    return await response.json();
                case 'text':
                    return await response.text();
                case 'blob':
                    return await response.blob();
                default:
                    return response;
            }
        } catch (error) {
            if (retryCount < this.maxRetries) {
                this.retryAttempts.set(cacheKey, retryCount + 1);
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchResourceWithRetry(url, type, cacheKey);
            }
            
            console.warn(`Failed to load resource after ${this.maxRetries} attempts: ${url}`, error);
            throw error;
        }
    }

    async fetchWithTimeout(url, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            // Add cache busting for GitHub Pages
            const cacheBuster = this.shouldCacheBust(url) ? `?v=${CONFIG.version}&t=${Date.now()}` : '';
            const response = await fetch(url + cacheBuster, {
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    shouldCacheBust(url) {
        // Cache bust for local files and script data
        return url.includes('script-data.json') || 
               url.includes('config.js') || 
               url.startsWith('./') || 
               url.startsWith('/');
    }

    isCacheValid(cacheKey) {
        if (!this.cache.has(cacheKey)) return false;
        const expiry = this.cacheExpiry.get(cacheKey);
        return expiry && Date.now() < expiry;
    }

    preloadCriticalResources() {
        // Preload critical CSS and fonts first
        this.preloadStaticResources();
        
        // Preload script data with intelligent fallback
        const preloadPromises = [
            this.loadResource(CONFIG.remote.scriptDataUrl, 'json').catch(() => 
                this.loadResource(CONFIG.localUrls.scriptData, 'json')
            ),
            // Preload weather data
            this.loadResource('https://api.open-meteo.com/v1/forecast?latitude=-22.9068&longitude=-43.1729&current_weather=true&timezone=America/Sao_Paulo', 'json').catch(() => null)
        ];

        // Don't block initialization on preloads
        Promise.allSettled(preloadPromises).then(results => {
            console.log('Critical resources preloaded:', results.filter(r => r.status === 'fulfilled').length);
            this.preloadTopicsData();
        });
    }

    preloadStaticResources() {
        const criticalResources = [
            { url: './styles.css', as: 'style', priority: 'high' },
            { url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', as: 'style', priority: 'medium' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.url;
            link.as = resource.as;
            if (resource.priority === 'high') {
                link.fetchPriority = 'high';
            }
            document.head.appendChild(link);
        });
    }

    preloadTopicsData() {
        // Cache first topics for instant display
        if (window.app && window.app.scriptData && window.app.scriptData.scriptData) {
            const topicEntries = Object.entries(window.app.scriptData.scriptData);
            const firstTopics = topicEntries.slice(0, 5);
            
            // Pre-process and cache topic elements
            firstTopics.forEach(([topicName, messages]) => {
                const cacheKey = `topic_${topicName}`;
                if (!this.cache.has(cacheKey)) {
                    this.cache.set(cacheKey, { topicName, messages });
                    this.cacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout);
                }
            });
        }
    }

    optimizeResourceLoading() {
        // Enable compression headers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(() => {
                console.log('Service Worker not available, using fallback optimization');
            });
        }

        // Optimize images with lazy loading
        this.setupImageOptimization();
        
        // Defer non-critical scripts
        this.deferNonCriticalScripts();
    }

    setupImageOptimization() {
        const images = document.querySelectorAll('img');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        images.forEach(img => {
            if (img.dataset.src) {
                imageObserver.observe(img);
            }
        });
    }

    deferNonCriticalScripts() {
        // Defer analytics and non-essential features
        setTimeout(() => {
            if (window.app && window.app.analyticsManager) {
                window.app.analyticsManager.initSession();
            }
        }, 2000);
    }

    clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
        this.retryAttempts.clear();
    }

    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            loadedResources: this.loadedResources.size,
            pendingLoads: this.pendingLoads.size
        };
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
        this.backupKey = 'fibramar_backup';
        this.settingsKey = 'fibramar_settings';
        this.maxBackups = 10;
        this.autoBackupInterval = 300000; // 5 minutos
        this.startAutoBackup();
    }

    // Backup completo do estado da aplicação
    createFullBackup() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: CONFIG.version,
                data: {
                    notepadContent: document.getElementById('notepadContent')?.value || '',
                    theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
                    settings: this.getSettings(),
                    analytics: this.getAnalyticsData(),
                    customVariables: this.getCustomVariables(),
                    searchHistory: this.getSearchHistory()
                }
            };

            this.saveBackup(backup);
            return backup;
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            return null;
        }
    }

    // Salvar backup no localStorage
    saveBackup(backup) {
        try {
            const backups = this.getAllBackups();
            backups.unshift(backup);
            
            // Manter apenas os últimos backups
            if (backups.length > this.maxBackups) {
                backups.splice(this.maxBackups);
            }

            localStorage.setItem(this.backupKey, JSON.stringify(backups));
            localStorage.setItem(`${this.backupKey}_latest`, JSON.stringify(backup));
        } catch (error) {
            console.error('Erro ao salvar backup:', error);
        }
    }

    // Obter todos os backups
    getAllBackups() {
        try {
            const backups = localStorage.getItem(this.backupKey);
            return backups ? JSON.parse(backups) : [];
        } catch (error) {
            console.error('Erro ao obter backups:', error);
            return [];
        }
    }

    // Restaurar backup específico
    restoreBackup(backupIndex = 0) {
        try {
            const backups = this.getAllBackups();
            if (backups[backupIndex]) {
                const backup = backups[backupIndex];
                this.applyBackup(backup);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            return false;
        }
    }

    // Aplicar dados do backup
    applyBackup(backup) {
        try {
            const data = backup.data;

            // Restaurar conteúdo do notepad
            if (data.notepadContent && document.getElementById('notepadContent')) {
                document.getElementById('notepadContent').value = data.notepadContent;
            }

            // Restaurar tema
            if (data.theme) {
                const isDark = data.theme === 'dark';
                document.body.classList.toggle('dark-theme', isDark);
                localStorage.setItem('theme', data.theme);
                if (window.app) {
                    window.app.updateThemeToggle(isDark);
                }
            }

            // Restaurar configurações
            if (data.settings) {
                this.applySettings(data.settings);
            }

            // Restaurar analytics
            if (data.analytics) {
                this.restoreAnalytics(data.analytics);
            }

            // Restaurar variáveis customizadas
            if (data.customVariables) {
                this.restoreCustomVariables(data.customVariables);
            }

            console.log('Backup restaurado com sucesso:', backup.timestamp);
        } catch (error) {
            console.error('Erro ao aplicar backup:', error);
        }
    }

    // Restaurar backup automático (mais recente)
    restoreAutoBackup() {
        try {
            const latestBackup = localStorage.getItem(`${this.backupKey}_latest`);
            if (latestBackup) {
                const backup = JSON.parse(latestBackup);
                this.applyBackup(backup);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao restaurar backup automático:', error);
            return false;
        }
    }

    // Exportar backup como arquivo
    exportBackup() {
        try {
            const backup = this.createFullBackup();
            if (backup) {
                const dataStr = JSON.stringify(backup, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(dataBlob);
                link.download = `fibramar_backup_${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                
                URL.revokeObjectURL(link.href);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao exportar backup:', error);
            return false;
        }
    }

    // Importar backup de arquivo
    importBackup(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const backup = JSON.parse(e.target.result);
                        this.applyBackup(backup);
                        this.saveBackup(backup);
                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.readAsText(file);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Obter configurações
    getSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            return {};
        }
    }

    // Aplicar configurações
    applySettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
        } catch (error) {
            console.error('Erro ao aplicar configurações:', error);
        }
    }

    // Obter dados de analytics
    getAnalyticsData() {
        try {
            return {
                session: localStorage.getItem('fibramar_session'),
                analytics: localStorage.getItem('fibramar_analytics')
            };
        } catch (error) {
            return {};
        }
    }

    // Restaurar analytics
    restoreAnalytics(analyticsData) {
        try {
            if (analyticsData.session) {
                localStorage.setItem('fibramar_session', analyticsData.session);
            }
            if (analyticsData.analytics) {
                localStorage.setItem('fibramar_analytics', analyticsData.analytics);
            }
        } catch (error) {
            console.error('Erro ao restaurar analytics:', error);
        }
    }

    // Obter variáveis customizadas
    getCustomVariables() {
        try {
            const variables = localStorage.getItem('fibramar_variables');
            return variables ? JSON.parse(variables) : {};
        } catch (error) {
            return {};
        }
    }

    // Restaurar variáveis customizadas
    restoreCustomVariables(variables) {
        try {
            localStorage.setItem('fibramar_variables', JSON.stringify(variables));
        } catch (error) {
            console.error('Erro ao restaurar variáveis:', error);
        }
    }

    // Obter histórico de pesquisa
    getSearchHistory() {
        try {
            const history = localStorage.getItem('fibramar_search_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            return [];
        }
    }

    // Iniciar backup automático
    startAutoBackup() {
        setInterval(() => {
            this.createFullBackup();
        }, this.autoBackupInterval);
    }

    // Limpar backups antigos
    clearOldBackups() {
        try {
            const backups = this.getAllBackups();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const recentBackups = backups.filter(backup => 
                new Date(backup.timestamp) > oneWeekAgo
            );

            localStorage.setItem(this.backupKey, JSON.stringify(recentBackups));
        } catch (error) {
            console.error('Erro ao limpar backups antigos:', error);
        }
    }

    // Obter estatísticas de backup
    getBackupStats() {
        try {
            const backups = this.getAllBackups();
            return {
                totalBackups: backups.length,
                latestBackup: backups[0]?.timestamp || null,
                oldestBackup: backups[backups.length - 1]?.timestamp || null,
                totalSize: JSON.stringify(backups).length
            };
        } catch (error) {
            return {
                totalBackups: 0,
                latestBackup: null,
                oldestBackup: null,
                totalSize: 0
            };
        }
    }
}

// Gerenciador de atalhos de teclado personalizáveis
class KeyboardShortcutManager {
    constructor() {
        this.shortcuts = this.loadShortcuts();
        this.defaultShortcuts = {
            'search': { key: 'f', ctrl: true, description: 'Focar na busca' },
            'theme': { key: 't', ctrl: true, alt: true, description: 'Alternar tema' },
            'notepad': { key: 'n', ctrl: true, description: 'Abrir bloco de notas' },
            'calculator': { key: 'c', ctrl: true, alt: true, description: 'Abrir calculadora' },
            'analytics': { key: 'a', ctrl: true, alt: true, description: 'Abrir analytics' },
            'backup': { key: 'b', ctrl: true, alt: true, description: 'Abrir backup' },
            'help': { key: 'h', ctrl: true, description: 'Mostrar atalhos' }
        };
        this.actions = {};
        this.isListening = false;
    }

    loadShortcuts() {
        try {
            const saved = localStorage.getItem('fibramar_shortcuts');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Erro ao carregar atalhos:', error);
            return {};
        }
    }

    saveShortcuts() {
        try {
            localStorage.setItem('fibramar_shortcuts', JSON.stringify(this.shortcuts));
        } catch (error) {
            console.error('Erro ao salvar atalhos:', error);
        }
    }

    registerAction(shortcutId, callback) {
        this.actions[shortcutId] = callback;
    }

    getShortcut(shortcutId) {
        return this.shortcuts[shortcutId] || this.defaultShortcuts[shortcutId];
    }

    setShortcut(shortcutId, shortcut) {
        this.shortcuts[shortcutId] = { ...shortcut };
        this.saveShortcuts();
    }

    resetShortcut(shortcutId) {
        delete this.shortcuts[shortcutId];
        this.saveShortcuts();
    }

    resetAllShortcuts() {
        this.shortcuts = {};
        this.saveShortcuts();
    }

    getAllShortcuts() {
        const allShortcuts = {};
        for (const [id, defaultShortcut] of Object.entries(this.defaultShortcuts)) {
            allShortcuts[id] = this.getShortcut(id);
        }
        return allShortcuts;
    }

    formatShortcut(shortcut) {
        const parts = [];
        if (shortcut.ctrl) parts.push('Ctrl');
        if (shortcut.alt) parts.push('Alt');
        if (shortcut.shift) parts.push('Shift');
        parts.push(shortcut.key.toUpperCase());
        return parts.join(' + ');
    }

    matchesShortcut(event, shortcut) {
        return event.key.toLowerCase() === shortcut.key.toLowerCase() &&
               !!event.ctrlKey === !!shortcut.ctrl &&
               !!event.altKey === !!shortcut.alt &&
               !!event.shiftKey === !!shortcut.shift;
    }

    handleKeyDown(event) {
        if (!this.isListening) return;

        // Ignorar se estiver em um input/textarea
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        for (const [shortcutId, action] of Object.entries(this.actions)) {
            const shortcut = this.getShortcut(shortcutId);
            if (shortcut && this.matchesShortcut(event, shortcut)) {
                event.preventDefault();
                action();
                break;
            }
        }
    }

    startListening() {
        if (this.isListening) return;
        this.isListening = true;
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    stopListening() {
        if (!this.isListening) return;
        this.isListening = false;
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }

    showShortcutsHelp() {
        const shortcuts = this.getAllShortcuts();
        let helpText = 'Atalhos de Teclado Disponíveis:\n\n';
        
        for (const [id, shortcut] of Object.entries(shortcuts)) {
            helpText += `${this.formatShortcut(shortcut)}: ${shortcut.description}\n`;
        }
        
        helpText += '\nPara personalizar os atalhos, use o painel de configurações.';
        alert(helpText);
    }

    exportShortcuts() {
        const shortcuts = this.getAllShortcuts();
        const dataStr = JSON.stringify(shortcuts, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `fibramar_shortcuts_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        return true;
    }

    async importShortcuts(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const shortcuts = JSON.parse(e.target.result);
                    
                    // Validar estrutura dos atalhos
                    for (const [id, shortcut] of Object.entries(shortcuts)) {
                        if (!shortcut.key || typeof shortcut.key !== 'string') {
                            throw new Error(`Atalho inválido para ${id}`);
                        }
                    }
                    
                    this.shortcuts = shortcuts;
                    this.saveShortcuts();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }
}

// Gerenciador de Conectividade e Modo Offline
class ConnectivityManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = new Set();
        this.offlineQueue = [];
        this.syncInProgress = false;
        
        this.init();
    }
    
    init() {
        // Eventos de conectividade
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Verifica conectividade periodicamente
        setInterval(() => this.checkConnectivity(), 30000);
        
        // Registra service worker se disponível
        this.registerServiceWorker();
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrado:', registration.scope);
                
                // Escuta mensagens do service worker
                navigator.serviceWorker.addEventListener('message', event => {
                    this.handleServiceWorkerMessage(event.data);
                });
                
            } catch (error) {
                console.warn('Falha no registro do Service Worker:', error);
            }
        }
    }
    
    handleServiceWorkerMessage(data) {
        if (data.type === 'OFFLINE_FALLBACK') {
            this.showOfflineNotification();
        }
    }
    
    async checkConnectivity() {
        try {
            // Tenta fazer uma requisição simples para verificar conectividade real
            const response = await fetch('/ping', { 
                method: 'HEAD',
                cache: 'no-cache',
                timeout: 5000 
            });
            
            const wasOffline = !this.isOnline;
            this.isOnline = true;
            
            if (wasOffline) {
                this.handleOnline();
            }
            
        } catch (error) {
            const wasOnline = this.isOnline;
            this.isOnline = false;
            
            if (wasOnline) {
                this.handleOffline();
            }
        }
    }
    
    handleOnline() {
        console.log('Conectividade restaurada');
        this.isOnline = true;
        
        // Notifica listeners
        this.listeners.forEach(callback => callback(true));
        
        // Sincroniza dados pendentes
        this.syncOfflineData();
        
        // Atualiza UI
        this.updateConnectivityUI(true);
        
        // Mostra notificação
        this.showNotification('Conectividade restaurada! Sincronizando dados...', 'success');
    }
    
    handleOffline() {
        console.log('Conectividade perdida - modo offline ativado');
        this.isOnline = false;
        
        // Notifica listeners
        this.listeners.forEach(callback => callback(false));
        
        // Atualiza UI
        this.updateConnectivityUI(false);
        
        // Mostra notificação
        this.showNotification('Modo offline ativado. Funcionalidades limitadas.', 'warning');
    }
    
    async syncOfflineData() {
        if (this.syncInProgress || this.offlineQueue.length === 0) {
            return;
        }
        
        this.syncInProgress = true;
        
        try {
            console.log(`Sincronizando ${this.offlineQueue.length} itens pendentes...`);
            
            const syncPromises = this.offlineQueue.map(async (item) => {
                try {
                    await this.processOfflineItem(item);
                    return { success: true, item };
                } catch (error) {
                    console.error('Erro na sincronização:', error);
                    return { success: false, item, error };
                }
            });
            
            const results = await Promise.allSettled(syncPromises);
            const successful = results.filter(r => r.value?.success).length;
            
            // Remove itens sincronizados com sucesso
            this.offlineQueue = this.offlineQueue.filter((item, index) => 
                !results[index]?.value?.success
            );
            
            if (successful > 0) {
                this.showNotification(`${successful} itens sincronizados com sucesso!`, 'success');
            }
            
        } catch (error) {
            console.error('Erro na sincronização:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    async processOfflineItem(item) {
        switch (item.type) {
            case 'analytics':
                // Sincroniza dados de analytics
                return this.syncAnalytics(item.data);
            case 'backup':
                // Sincroniza backups
                return this.syncBackup(item.data);
            case 'settings':
                // Sincroniza configurações
                return this.syncSettings(item.data);
            default:
                console.warn('Tipo de item offline desconhecido:', item.type);
        }
    }
    
    async syncAnalytics(data) {
        // Implementa sincronização de analytics quando online
        console.log('Sincronizando analytics:', data);
    }
    
    async syncBackup(data) {
        // Implementa sincronização de backup quando online
        console.log('Sincronizando backup:', data);
    }
    
    async syncSettings(data) {
        // Implementa sincronização de configurações quando online
        console.log('Sincronizando configurações:', data);
    }
    
    addToOfflineQueue(type, data) {
        this.offlineQueue.push({
            type,
            data,
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        });
        
        // Limita o tamanho da fila
        if (this.offlineQueue.length > 100) {
            this.offlineQueue = this.offlineQueue.slice(-50);
        }
        
        console.log(`Item adicionado à fila offline: ${type}`);
    }
    
    updateConnectivityUI(isOnline) {
        // Atualiza indicadores visuais de conectividade
        const indicator = document.getElementById('connectivity-indicator');
        if (indicator) {
            indicator.className = isOnline ? 'online' : 'offline';
            indicator.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
        }
        
        // Atualiza botões que dependem de conectividade
        const networkButtons = document.querySelectorAll('[data-requires-network]');
        networkButtons.forEach(button => {
            button.disabled = !isOnline;
            button.title = isOnline ? '' : 'Requer conexão com a internet';
        });
    }
    
    addConnectivityListener(callback) {
        this.listeners.add(callback);
        
        // Chama imediatamente com o status atual
        callback(this.isOnline);
        
        // Retorna função para remover o listener
        return () => this.listeners.delete(callback);
    }
    
    getOfflineCapabilities() {
        return {
            canSearch: true,
            canUseNotepad: true,
            canUseCalculator: true,
            canViewCachedData: true,
            canCreateBackups: true,
            canUseShortcuts: true,
            cannotUpdateData: true,
            cannotSyncAnalytics: true,
            cannotCheckWeather: true
        };
    }
    
    showNotification(message, type = 'info') {
        // Usa o sistema de notificações da aplicação se disponível
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    showOfflineNotification() {
        const capabilities = this.getOfflineCapabilities();
        const availableFeatures = Object.keys(capabilities)
            .filter(key => capabilities[key] === true)
            .map(key => key.replace('can', '').replace(/([A-Z])/g, ' $1').toLowerCase())
            .join(', ');
            
        this.showNotification(
            `Modo offline ativo. Funcionalidades disponíveis: ${availableFeatures}`,
            'info'
        );
    }
    
    getStatus() {
        return {
            isOnline: this.isOnline,
            queueSize: this.offlineQueue.length,
            syncInProgress: this.syncInProgress,
            capabilities: this.getOfflineCapabilities()
        };
    }
}

// Gerenciador de Versionamento
class VersionManager {
    constructor() {
        this.currentVersion = CONFIG.version;
        this.versionHistory = this.loadVersionHistory();
        this.updateChannel = 'stable'; // stable, beta, alpha
        this.autoUpdateEnabled = CONFIG.updateSettings.autoUpdate;
        this.lastUpdateCheck = null;
        this.pendingUpdate = null;
    }

    loadVersionHistory() {
        try {
            return JSON.parse(localStorage.getItem('fibramar_version_history')) || [];
        } catch (error) {
            console.warn('Erro ao carregar histórico de versões:', error);
            return [];
        }
    }

    saveVersionHistory() {
        try {
            localStorage.setItem('fibramar_version_history', JSON.stringify(this.versionHistory));
        } catch (error) {
            console.error('Erro ao salvar histórico de versões:', error);
        }
    }

    async checkForUpdates() {
        try {
            this.lastUpdateCheck = new Date().toISOString();
            
            const response = await fetch(`${CONFIG.remote.configUrl}?v=${Date.now()}`);
            if (!response.ok) throw new Error('Falha ao verificar atualizações');
            
            const remoteConfig = await response.text();
            const versionMatch = remoteConfig.match(/version:\s*['"]([^'"]+)['"]/);
            
            if (versionMatch) {
                const remoteVersion = versionMatch[1];
                
                if (this.isNewerVersion(remoteVersion, this.currentVersion)) {
                    this.pendingUpdate = {
                        version: remoteVersion,
                        timestamp: new Date().toISOString(),
                        changelog: await this.getChangelog(remoteVersion)
                    };
                    
                    if (this.autoUpdateEnabled) {
                        return await this.applyUpdate();
                    } else {
                        this.showUpdateNotification(remoteVersion);
                        return { updateAvailable: true, version: remoteVersion };
                    }
                }
            }
            
            return { updateAvailable: false };
        } catch (error) {
            console.error('Erro ao verificar atualizações:', error);
            return { error: error.message };
        }
    }

    async getChangelog(version) {
        try {
            const response = await fetch(`${CONFIG.remote.configUrl.replace('config.js', 'CHANGELOG.md')}?v=${Date.now()}`);
            if (response.ok) {
                const changelog = await response.text();
                return this.extractVersionChangelog(changelog, version);
            }
        } catch (error) {
            console.warn('Não foi possível carregar changelog:', error);
        }
        return 'Melhorias e correções de bugs.';
    }

    extractVersionChangelog(changelog, version) {
        const versionRegex = new RegExp(`## \\[?${version}\\]?[\\s\\S]*?(?=## \\[?\\d|$)`, 'i');
        const match = changelog.match(versionRegex);
        return match ? match[0].replace(/^## \[?\d.*?\]?\s*/, '') : 'Melhorias e correções de bugs.';
    }

    isNewerVersion(remote, local) {
        const parseVersion = (v) => v.split('.').map(n => parseInt(n, 10));
        const remoteV = parseVersion(remote);
        const localV = parseVersion(local);
        
        for (let i = 0; i < Math.max(remoteV.length, localV.length); i++) {
            const r = remoteV[i] || 0;
            const l = localV[i] || 0;
            if (r > l) return true;
            if (r < l) return false;
        }
        return false;
    }

    async applyUpdate() {
        try {
            if (!this.pendingUpdate) return { success: false, error: 'Nenhuma atualização pendente' };

            // Criar backup antes da atualização
            const backupManager = window.backupManager || new BackupManager();
            await backupManager.createFullBackup();

            // Registrar a atualização no histórico
            this.addToVersionHistory(this.pendingUpdate.version);

            // Limpar cache do service worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_CACHE',
                    version: this.pendingUpdate.version
                });
            }

            // Atualizar versão local
            this.currentVersion = this.pendingUpdate.version;
            localStorage.setItem('fibramar_current_version', this.currentVersion);

            // Mostrar notificação de sucesso
            this.showUpdateSuccessNotification(this.pendingUpdate.version);

            // Limpar atualização pendente
            this.pendingUpdate = null;

            // Recarregar a página após um breve delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);

            return { success: true, version: this.currentVersion };
        } catch (error) {
            console.error('Erro ao aplicar atualização:', error);
            return { success: false, error: error.message };
        }
    }

    addToVersionHistory(version) {
        const historyEntry = {
            version: version,
            previousVersion: this.currentVersion,
            timestamp: new Date().toISOString(),
            updateType: this.getUpdateType(this.currentVersion, version)
        };

        this.versionHistory.unshift(historyEntry);
        
        // Manter apenas os últimos 10 registros
        if (this.versionHistory.length > 10) {
            this.versionHistory = this.versionHistory.slice(0, 10);
        }

        this.saveVersionHistory();
    }

    getUpdateType(oldVersion, newVersion) {
        const oldV = oldVersion.split('.').map(n => parseInt(n, 10));
        const newV = newVersion.split('.').map(n => parseInt(n, 10));

        if (newV[0] > oldV[0]) return 'major';
        if (newV[1] > oldV[1]) return 'minor';
        if (newV[2] > oldV[2]) return 'patch';
        return 'unknown';
    }

    showUpdateNotification(version) {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <h4>🚀 Nova versão disponível!</h4>
                <p>Versão ${version} está disponível para download.</p>
                <div class="update-actions">
                    <button onclick="versionManager.applyUpdate()" class="btn-update">Atualizar Agora</button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-later">Mais Tarde</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover após 10 segundos se não interagir
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    showUpdateSuccessNotification(version) {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(`✅ Atualizado para versão ${version} com sucesso!`, 'success');
        }
    }

    getVersionInfo() {
        return {
            current: this.currentVersion,
            lastCheck: this.lastUpdateCheck,
            updateChannel: this.updateChannel,
            autoUpdate: this.autoUpdateEnabled,
            pendingUpdate: this.pendingUpdate,
            history: this.versionHistory
        };
    }

    setUpdateChannel(channel) {
        if (['stable', 'beta', 'alpha'].includes(channel)) {
            this.updateChannel = channel;
            localStorage.setItem('fibramar_update_channel', channel);
        }
    }

    toggleAutoUpdate() {
        this.autoUpdateEnabled = !this.autoUpdateEnabled;
        localStorage.setItem('fibramar_auto_update', this.autoUpdateEnabled.toString());
        return this.autoUpdateEnabled;
    }

    async rollbackToPreviousVersion() {
        try {
            if (this.versionHistory.length === 0) {
                throw new Error('Nenhuma versão anterior disponível');
            }

            const previousVersion = this.versionHistory[0].previousVersion;
            
            // Restaurar backup da versão anterior se disponível
            const backupManager = window.backupManager || new BackupManager();
            const backups = backupManager.getAllBackups();
            
            const versionBackup = backups.find(backup => 
                backup.metadata && backup.metadata.version === previousVersion
            );

            if (versionBackup) {
                await backupManager.applyBackup(versionBackup);
            }

            this.currentVersion = previousVersion;
            localStorage.setItem('fibramar_current_version', this.currentVersion);

            this.showUpdateSuccessNotification(`Revertido para versão ${previousVersion}`);
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);

            return { success: true, version: previousVersion };
        } catch (error) {
            console.error('Erro ao reverter versão:', error);
            return { success: false, error: error.message };
        }
    }

    exportVersionHistory() {
        const data = {
            currentVersion: this.currentVersion,
            versionHistory: this.versionHistory,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fibramar-version-history-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Favorites Manager Class
class FavoritesManager {
    constructor() {
        this.favorites = this.loadFavorites();
        this.isCollapsed = this.loadCollapseState();
        this.maxFavorites = 50;
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.updateVisibility();
    }

    setupEventListeners() {
        // Toggle collapse/expand
        const toggleBtn = document.getElementById('favoritesToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleCollapse());
        }

        // Clear all favorites
        const clearBtn = document.getElementById('clearFavorites');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFavorites());
        }
    }

    addFavorite(text, topicName = '') {
        if (this.favorites.length >= this.maxFavorites) {
            this.showNotification('Limite máximo de favoritos atingido!', 'warning');
            return false;
        }

        const favoriteId = this.generateId();
        const favorite = {
            id: favoriteId,
            text: text.trim(),
            topic: topicName,
            timestamp: Date.now(),
            usageCount: 0
        };

        // Check if already exists
        if (this.favorites.some(fav => fav.text === favorite.text)) {
            this.showNotification('Esta mensagem já está nos favoritos!', 'info');
            return false;
        }

        this.favorites.unshift(favorite);
        this.saveFavorites();
        this.updateDisplay();
        this.updateVisibility();
        this.showNotification('Mensagem adicionada aos favoritos!', 'success');
        return true;
    }

    removeFavorite(favoriteId) {
        const index = this.favorites.findIndex(fav => fav.id === favoriteId);
        if (index !== -1) {
            this.favorites.splice(index, 1);
            this.saveFavorites();
            this.updateDisplay();
            this.updateVisibility();
            this.showNotification('Favorito removido!', 'success');
        }
    }

    isFavorited(text) {
        return this.favorites.some(fav => fav.text.trim() === text.trim());
    }

    getFavoriteByText(text) {
        return this.favorites.find(fav => fav.text.trim() === text.trim());
    }

    incrementUsage(favoriteId) {
        const favorite = this.favorites.find(fav => fav.id === favoriteId);
        if (favorite) {
            favorite.usageCount++;
            favorite.lastUsed = Date.now();
            this.saveFavorites();
        }
    }

    copyFavorite(favoriteId) {
        const favorite = this.favorites.find(fav => fav.id === favoriteId);
        if (favorite) {
            this.incrementUsage(favoriteId);
            
            // Use the app's copy function if available
            if (window.app && window.app.copyToClipboard) {
                window.app.copyToClipboard(favorite.text);
            } else {
                // Fallback copy method
                navigator.clipboard.writeText(favorite.text).then(() => {
                    this.showNotification('Favorito copiado!', 'success');
                }).catch(() => {
                    this.showNotification('Erro ao copiar favorito!', 'error');
                });
            }
        }
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.saveCollapseState();
        this.updateCollapseDisplay();
    }

    updateCollapseDisplay() {
        const favoritesList = document.getElementById('favoritesList');
        const favoritesStats = document.getElementById('favoritesStats');
        const toggleBtn = document.getElementById('favoritesToggle');

        if (favoritesList && favoritesStats && toggleBtn) {
            if (this.isCollapsed) {
                favoritesList.style.display = 'none';
                favoritesStats.style.display = 'none';
                toggleBtn.textContent = '▶';
                toggleBtn.title = 'Expandir';
            } else {
                favoritesList.style.display = 'grid';
                favoritesStats.style.display = this.favorites.length > 0 ? 'flex' : 'none';
                toggleBtn.textContent = '▼';
                toggleBtn.title = 'Recolher';
            }
        }
    }

    updateDisplay() {
        const favoritesList = document.getElementById('favoritesList');
        const favoritesEmpty = document.getElementById('favoritesEmpty');
        const favoritesCount = document.getElementById('favoritesCount');
        const favoritesStats = document.getElementById('favoritesStats');

        if (!favoritesList) return;

        if (this.favorites.length === 0) {
            favoritesList.innerHTML = '<div class="favorites-empty">Nenhuma mensagem favoritada ainda. Clique na estrela ao lado das mensagens para adicioná-las aos favoritos.</div>';
            if (favoritesStats) favoritesStats.style.display = 'none';
        } else {
            favoritesList.innerHTML = '';
            
            // Sort favorites by usage count and recency
            const sortedFavorites = [...this.favorites].sort((a, b) => {
                if (b.usageCount !== a.usageCount) {
                    return b.usageCount - a.usageCount;
                }
                return b.timestamp - a.timestamp;
            });

            sortedFavorites.forEach(favorite => {
                const favoriteElement = this.createFavoriteElement(favorite);
                favoritesList.appendChild(favoriteElement);
            });

            if (favoritesCount) {
                favoritesCount.textContent = `${this.favorites.length} favorito${this.favorites.length !== 1 ? 's' : ''}`;
            }
            if (favoritesStats) {
                favoritesStats.style.display = this.isCollapsed ? 'none' : 'flex';
            }
        }

        this.updateCollapseDisplay();
    }

    createFavoriteElement(favorite) {
        const div = document.createElement('div');
        div.className = 'favorite-item animate-add';
        div.dataset.favoriteId = favorite.id;

        const truncatedText = favorite.text.length > 100 
            ? favorite.text.substring(0, 100) + '...' 
            : favorite.text;

        div.innerHTML = `
            <div class="favorite-text" title="${this.escapeHtml(favorite.text)}">
                ${this.escapeHtml(truncatedText)}
                ${favorite.topic ? `<small style="color: var(--text-secondary); display: block; margin-top: 4px;">📁 ${this.escapeHtml(favorite.topic)}</small>` : ''}
                ${favorite.usageCount > 0 ? `<small style="color: var(--text-secondary); display: block; margin-top: 2px;">📊 Usado ${favorite.usageCount}x</small>` : ''}
            </div>
            <div class="favorite-actions">
                <button class="favorite-btn copy-favorite" title="Copiar" onclick="window.app.favoritesManager.copyFavorite('${favorite.id}')">
                    📋
                </button>
                <button class="favorite-btn remove-favorite" title="Remover" onclick="window.app.favoritesManager.removeFavorite('${favorite.id}')">
                    🗑️
                </button>
            </div>
        `;

        // Add click to copy functionality
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-actions')) {
                this.copyFavorite(favorite.id);
            }
        });

        return div;
    }

    clearAllFavorites() {
        if (this.favorites.length === 0) return;

        if (confirm(`Tem certeza que deseja remover todos os ${this.favorites.length} favoritos?`)) {
            this.favorites = [];
            this.saveFavorites();
            this.updateDisplay();
            this.updateVisibility();
            this.showNotification('Todos os favoritos foram removidos!', 'success');
        }
    }

    updateVisibility() {
        const favoritesSection = document.getElementById('favoritesSection');
        if (favoritesSection) {
            favoritesSection.style.display = this.favorites.length > 0 ? 'block' : 'none';
        }
    }

    searchFavorites(searchTerm) {
        if (!searchTerm) return this.favorites;
        
        const term = searchTerm.toLowerCase();
        return this.favorites.filter(favorite => 
            favorite.text.toLowerCase().includes(term) ||
            favorite.topic.toLowerCase().includes(term)
        );
    }

    exportFavorites() {
        const data = {
            favorites: this.favorites,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fibramar-favoritos-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async importFavorites(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.favorites && Array.isArray(data.favorites)) {
                const importedCount = data.favorites.length;
                
                // Merge with existing favorites, avoiding duplicates
                data.favorites.forEach(favorite => {
                    if (!this.favorites.some(existing => existing.text === favorite.text)) {
                        this.favorites.push({
                            ...favorite,
                            id: this.generateId(),
                            timestamp: favorite.timestamp || Date.now()
                        });
                    }
                });

                this.saveFavorites();
                this.updateDisplay();
                this.updateVisibility();
                this.showNotification(`${importedCount} favoritos importados com sucesso!`, 'success');
            } else {
                throw new Error('Formato de arquivo inválido');
            }
        } catch (error) {
            this.showNotification('Erro ao importar favoritos: ' + error.message, 'error');
        }
    }

    getStats() {
        const totalUsage = this.favorites.reduce((sum, fav) => sum + fav.usageCount, 0);
        const mostUsed = this.favorites.reduce((max, fav) => 
            fav.usageCount > (max?.usageCount || 0) ? fav : max, null);

        return {
            totalFavorites: this.favorites.length,
            totalUsage,
            mostUsed: mostUsed ? {
                text: mostUsed.text.substring(0, 50) + '...',
                usageCount: mostUsed.usageCount
            } : null,
            averageUsage: this.favorites.length > 0 ? (totalUsage / this.favorites.length).toFixed(1) : 0
        };
    }

    // Utility methods
    generateId() {
        return 'fav_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadFavorites() {
        try {
            const stored = localStorage.getItem('fibramar_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('fibramar_favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
            this.showNotification('Erro ao salvar favoritos!', 'error');
        }
    }

    loadCollapseState() {
        try {
            const stored = localStorage.getItem('fibramar_favorites_collapsed');
            return stored === 'true';
        } catch (error) {
            return false;
        }
    }

    saveCollapseState() {
        try {
            localStorage.setItem('fibramar_favorites_collapsed', this.isCollapsed.toString());
        } catch (error) {
            console.error('Error saving collapse state:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Use the app's notification system if available
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            // Fallback notification
            console.log(`[${type.toUpperCase()}] ${message}`);
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
        this.analytics = new AnalyticsManager();
        this.keyboardManager = new KeyboardShortcutManager();
        this.connectivityManager = new ConnectivityManager();
        this.versionManager = new VersionManager();
        this.themeManager = new ThemeManager();
        this.animationManager = new AnimationManager();
        this.favoritesManager = new FavoritesManager();
    }

    async init() {
        try {
            this.performanceMonitor.mark('init_start');
            
            // Preload critical resources
            this.lazyLoader.preloadCriticalResources();
            
            // Otimizar carregamento de recursos
            this.lazyLoader.optimizeResourceLoading();
            
            // Carrega dados do script
            this.scriptData = await this.updateManager.loadScriptData();
            
            if (!this.scriptData) {
                this.scriptData = this.getFallbackData();
            }

            // Inicializa componentes
            this.themeManager.init();
            this.favoritesManager.init();
            this.initializeNotepad();
            this.initializeEventListeners();
            this.renderTopics();
            this.updateDateTime();
            this.updateWeather();
            
            // Restaura backup automático
            this.backupManager.restoreAutoBackup();
            
            // Verifica atualizações
            await this.updateManager.checkForUpdates();
            await this.versionManager.checkForUpdates();
            
            // Configura verificação periódica de atualizações
            setInterval(() => {
                this.updateManager.checkForUpdates();
                this.versionManager.checkForUpdates();
            }, CONFIG.updateSettings.checkInterval);

            // Configura atalhos de teclado
            this.setupKeyboardShortcuts();

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

    initializeEventListeners() {
        // Theme toggle is now handled by ThemeManager
        
        // Search
        document.getElementById('searchBox').addEventListener('input', () => this.handleSearch());
        
        // Adicionar animações aos botões flutuantes
        const floatingButtons = document.querySelectorAll('.floating-btn');
        floatingButtons.forEach(btn => {
            this.animationManager.addButtonPressEffect(btn);
            
            // Animação de entrada escalonada
            this.animationManager.observeElement(btn);
            btn.classList.add('animate-on-scroll');
        });
        
        // Notepad
        document.getElementById('openNotepad').addEventListener('click', () => {
            this.animationManager.pulse(document.getElementById('openNotepad'));
            this.openNotepad();
        });
        document.getElementById('closeNotepad').addEventListener('click', () => this.closeNotepad());
        document.getElementById('minimizeNotepad').addEventListener('click', () => this.minimizeNotepad());
        document.getElementById('exportNotepad').addEventListener('click', () => this.exportNotepad());
        document.getElementById('importNotepad').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importNotepad(e));
        document.getElementById('clearNotepad').addEventListener('click', () => this.clearNotepad());
        document.getElementById('notepadContent').addEventListener('input', () => this.updateCharCount());
        
        // Calculator
        document.getElementById('openCalculator').addEventListener('click', () => {
            this.animationManager.pulse(document.getElementById('openCalculator'));
            this.openCalculator();
        });
        document.getElementById('calculatorModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeCalculator();
        });
        
        // Analytics
        document.getElementById('openAnalytics').addEventListener('click', () => {
            this.animationManager.pulse(document.getElementById('openAnalytics'));
            this.openAnalytics();
        });
        
        // Backup
        const backupBtn = document.getElementById('openBackup');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.animationManager.pulse(backupBtn);
                this.openBackup();
            });
        }
        
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

    renderTopics(searchTerm = '') {
        if (!this.scriptData || !this.scriptData.scriptData) return;
        
        const topicsContainer = document.getElementById('topics');
        
        // Fade out existing topics before clearing
        if (topicsContainer.children.length > 0) {
            this.animationManager.fadeOut(topicsContainer, 200).then(() => {
                this.renderTopicsContent(searchTerm, topicsContainer);
            });
        } else {
            this.renderTopicsContent(searchTerm, topicsContainer);
        }
    }

    renderTopicsContent(searchTerm, topicsContainer) {
        topicsContainer.innerHTML = '';

        // Lazy loading configuration
        const INITIAL_LOAD = 10; // Carregar apenas 10 tópicos inicialmente
        const LOAD_MORE_THRESHOLD = 5; // Carregar mais quando restam 5 tópicos visíveis
        const VIRTUALIZATION_THRESHOLD = 100; // Usar virtualização para mais de 100 tópicos

        const allTopics = [];
        Object.entries(this.scriptData.scriptData).forEach(([topicName, messages]) => {
            if (searchTerm && !topicName.toLowerCase().includes(searchTerm.toLowerCase()) && 
                !messages.some(msg => msg.toLowerCase().includes(searchTerm.toLowerCase()))) {
                return;
            }
            allTopics.push({ topicName, messages });
        });

        // Use virtualização para listas muito longas
        if (allTopics.length > VIRTUALIZATION_THRESHOLD) {
            this.setupVirtualizedTopicsList(topicsContainer, allTopics, searchTerm);
            return;
        }

        let loadedCount = 0;
        let isLoading = false;

        const loadMoreTopics = () => {
            if (isLoading || loadedCount >= allTopics.length) return;
            
            isLoading = true;
            const loadingIndicator = this.createLoadingIndicator();
            topicsContainer.appendChild(loadingIndicator);

            // Simular delay mínimo para UX suave
            setTimeout(() => {
                const endIndex = Math.min(loadedCount + INITIAL_LOAD, allTopics.length);
                const topicsToLoad = allTopics.slice(loadedCount, endIndex);

                topicsToLoad.forEach((topic, index) => {
                    const topicDiv = this.createTopicElement(topic.topicName, topic.messages, searchTerm);
                    topicsContainer.insertBefore(topicDiv, loadingIndicator);
                    
                    // Animação escalonada
                    setTimeout(() => {
                        this.animationManager.slideIn(topicDiv, 'right', 300);
                    }, index * 30);
                });

                loadedCount = endIndex;
                topicsContainer.removeChild(loadingIndicator);
                isLoading = false;

                // Setup intersection observer para próximo carregamento
                if (loadedCount < allTopics.length) {
                    this.setupLazyLoadObserver(topicsContainer, loadMoreTopics, LOAD_MORE_THRESHOLD);
                }
            }, 100);
        };

        // Carregamento inicial
        loadMoreTopics();

        // Fade in the container
        this.animationManager.fadeIn(topicsContainer, 300);

        // Renderiza senhas se existirem
        if (this.scriptData.passwords) {
            this.renderPasswords();
        }
    }

    setupVirtualizedTopicsList(container, topics, searchTerm) {
        const itemHeight = 120; // Altura aproximada de cada tópico
        const containerHeight = container.clientHeight || 600;
        const visibleItems = Math.ceil(containerHeight / itemHeight) + 5; // Buffer items
        
        let scrollTop = 0;
        let startIndex = 0;
        
        // Criar container virtual
        const virtualContainer = document.createElement('div');
        virtualContainer.className = 'virtual-topics-container';
        virtualContainer.style.height = `${topics.length * itemHeight}px`;
        virtualContainer.style.position = 'relative';
        virtualContainer.style.overflow = 'hidden';
        
        const visibleContainer = document.createElement('div');
        visibleContainer.className = 'visible-topics-container';
        visibleContainer.style.position = 'absolute';
        visibleContainer.style.top = '0';
        visibleContainer.style.width = '100%';
        visibleContainer.style.willChange = 'transform';
        
        virtualContainer.appendChild(visibleContainer);
        container.appendChild(virtualContainer);
        
        const renderVisibleItems = () => {
            const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
            const endIndex = Math.min(newStartIndex + visibleItems, topics.length);
            
            if (newStartIndex !== startIndex) {
                startIndex = newStartIndex;
                visibleContainer.innerHTML = '';
                visibleContainer.style.transform = `translateY(${startIndex * itemHeight}px)`;
                
                // Renderizar apenas os itens visíveis
                for (let i = startIndex; i < endIndex; i++) {
                    const topic = topics[i];
                    const topicElement = this.createTopicElement(topic.topicName, topic.messages, searchTerm);
                    topicElement.style.position = 'relative';
                    topicElement.style.height = `${itemHeight}px`;
                    visibleContainer.appendChild(topicElement);
                }
                
                // Animação suave para novos elementos
                this.animationManager.fadeIn(visibleContainer, 200);
            }
        };
        
        // Renderização inicial
        renderVisibleItems();
        
        // Otimizar scroll com throttling
        let scrollTimeout;
        const handleScroll = () => {
            scrollTop = container.scrollTop;
            
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            scrollTimeout = setTimeout(() => {
                requestAnimationFrame(renderVisibleItems);
            }, 16); // ~60fps
        };
        
        container.addEventListener('scroll', handleScroll, { passive: true });
        
        // Cleanup function
        container._virtualCleanup = () => {
            container.removeEventListener('scroll', handleScroll);
            if (scrollTimeout) clearTimeout(scrollTimeout);
        };
    }

    createLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <span>Carregando mais tópicos...</span>
        `;
        return loadingDiv;
    }

    setupLazyLoadObserver(container, loadMoreCallback, threshold) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const topics = container.querySelectorAll('.topic');
                    const remainingTopics = topics.length - Array.from(topics).findIndex(topic => topic === entry.target);
                    
                    if (remainingTopics <= threshold) {
                        loadMoreCallback();
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, {
            rootMargin: '100px'
        });

        // Observar os últimos tópicos carregados
        const topics = container.querySelectorAll('.topic');
        if (topics.length > 0) {
            const lastTopics = Array.from(topics).slice(-threshold);
            lastTopics.forEach(topic => observer.observe(topic));
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
            this.renderMessages(contentDiv, messages, searchTerm, topicName);
        }

        return topicDiv;
    }

    renderMessages(contentDiv, messages, searchTerm, topicName = '') {
        messages.forEach((message) => {
            if (!searchTerm || message.toLowerCase().includes(searchTerm.toLowerCase())) {
                const messageDiv = this.createMessageElement(message, topicName);
                contentDiv.appendChild(messageDiv);
            }
        });
    }

    createMessageElement(message, topicName = '') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const messageContentDiv = document.createElement('div');
        messageContentDiv.className = 'message-content';
        
        // Preserva quebras de linha convertendo \n para <br>
        const formattedMessage = message.replace(/\n/g, '<br>');
        messageContentDiv.innerHTML = formattedMessage;
        
        // Adiciona botões de ação
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        const copyBtn = this.createCopyButton(message);
        const favoriteBtn = this.createFavoriteButton(message, topicName);
        
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(favoriteBtn);
        
        messageDiv.appendChild(messageContentDiv);
        messageDiv.appendChild(actionsDiv);
        
        return messageDiv;
    }

    createFavoriteButton(message, topicName = '') {
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        
        // Verifica se já está favoritado
        const isFavorited = this.favoritesManager.isFavorited(message);
        favoriteBtn.innerHTML = isFavorited ? '★' : '☆';
        favoriteBtn.title = isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
        
        if (isFavorited) {
            favoriteBtn.classList.add('favorited');
        }
        
        // Adicionar efeito de pressão do botão
        this.animationManager.addButtonPressEffect(favoriteBtn);
        
        favoriteBtn.onclick = (e) => {
            e.stopPropagation();
            
            if (this.favoritesManager.isFavorited(message)) {
                // Remove dos favoritos
                const favorite = this.favoritesManager.getFavoriteByText(message);
                if (favorite) {
                    this.favoritesManager.removeFavorite(favorite.id);
                    favoriteBtn.innerHTML = '☆';
                    favoriteBtn.title = 'Adicionar aos favoritos';
                    favoriteBtn.classList.remove('favorited');
                    this.animationManager.shake(favoriteBtn);
                    this.showNotification('Removido dos favoritos', 'info');
                }
            } else {
                // Adiciona aos favoritos
                this.favoritesManager.addFavorite(message, topicName);
                favoriteBtn.innerHTML = '★';
                favoriteBtn.title = 'Remover dos favoritos';
                favoriteBtn.classList.add('favorited');
                this.animationManager.glow(favoriteBtn);
                this.showNotification('Adicionado aos favoritos', 'success');
            }
        };
        
        return favoriteBtn;
    }

    createCopyButton(message) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copiar';
        
        // Adicionar efeito de pressão do botão
        this.animationManager.addButtonPressEffect(copyBtn);
        
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            
            // Animação de feedback visual
            this.animationManager.pulse(copyBtn);
            
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
        headerRow.innerHTML = '<th>Usuário</th><th>Senha</th><th>Ações</th>';
        table.appendChild(headerRow);
        
        item.credentials.forEach(cred => {
            const row = document.createElement('tr');
            
            // Célula do usuário
            const userCell = document.createElement('td');
            userCell.textContent = cred.user;
            row.appendChild(userCell);
            
            // Célula da senha
            const passwordCell = document.createElement('td');
            passwordCell.textContent = cred.password;
            passwordCell.className = 'password-cell';
            row.appendChild(passwordCell);
            
            // Célula das ações
            const actionsCell = document.createElement('td');
            actionsCell.className = 'password-actions';
            
            // Botão para copiar apenas a senha
            const copyPasswordBtn = document.createElement('button');
            copyPasswordBtn.className = 'copy-password-btn';
            copyPasswordBtn.innerHTML = '🔑';
            copyPasswordBtn.title = 'Copiar apenas a senha';
            copyPasswordBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyToClipboard(cred.password);
                this.showNotification('Senha copiada!', 'success');
            });
            
            // Botão para copiar tudo
            const copyAllBtn = document.createElement('button');
            copyAllBtn.className = 'copy-all-btn';
            copyAllBtn.innerHTML = '📋';
            copyAllBtn.title = 'Copiar usuário e senha';
            copyAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = `Usuário: ${cred.user}\nSenha: ${cred.password}`;
                this.copyToClipboard(text);
                this.showNotification('Usuário e senha copiados!', 'success');
            });
            
            actionsCell.appendChild(copyPasswordBtn);
            actionsCell.appendChild(copyAllBtn);
            row.appendChild(actionsCell);
            
            table.appendChild(row);
        });
        
        return table;
    }

    handleSearch() {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        const searchBox = document.getElementById('searchBox');
        const searchTerm = searchBox.value;

        // Add loading animation to search box
        this.animationManager.addLoadingAnimation(searchBox);

        // Debounce search to avoid excessive re-renders
        this.searchTimeout = setTimeout(() => {
            this.animationManager.removeLoadingAnimation(searchBox);
            
            // Add pulse effect to search box when searching
            if (searchTerm.trim()) {
                this.animationManager.pulse(searchBox);
            }
            
            this.renderTopics(searchTerm);
        }, 300);
    }

    copyToClipboard(text) {
        const processedText = this.replaceVariables(text);
        
        navigator.clipboard.writeText(processedText).then(() => {
            // Animação de sucesso
            const copyButtons = document.querySelectorAll('.copy-btn');
            copyButtons.forEach(btn => {
                if (btn.onclick && btn.onclick.toString().includes(text.substring(0, 20))) {
                    this.animationManager.glow(btn);
                }
            });
            
            this.showNotification('Texto copiado para a área de transferência!', 'success');
            
            // Track analytics
            this.analytics.trackEvent('message_copied', {
                messageLength: processedText.length,
                hasVariables: text !== processedText,
                timestamp: Date.now()
            });
        }).catch(err => {
            console.error('Erro ao copiar texto:', err);
            
            // Animação de erro
            const copyButtons = document.querySelectorAll('.copy-btn');
            copyButtons.forEach(btn => {
                if (btn.onclick && btn.onclick.toString().includes(text.substring(0, 20))) {
                    this.animationManager.shake(btn);
                }
            });
            
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
        
        // Set initial state for animation
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        document.body.appendChild(notification);
        
        // Use AnimationManager for smooth entrance
        this.animationManager.showNotificationWithAnimation(notification, type);
        
        // Animate out and remove
        setTimeout(() => {
            if (notification.parentElement) {
                this.animationManager.fadeOut(notification, 300).then(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                });
            }
        }, CONFIG.notifications.duration - 300);
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
        
        // Track analytics
        this.analytics.trackEvent('notepad_opened');
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
        
        // Track analytics
        this.analytics.trackEvent('calculator_used', {
            type: 'proportional',
            value: value,
            days: days,
            result: proportional
        });
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
        
        // Track analytics
        this.analytics.trackEvent('calculator_used', {
            type: 'agreement',
            value: value,
            discount: discount,
            result: finalValue
        });
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
        
        // Track analytics
        this.analytics.trackEvent('calculator_used', {
            type: 'commission',
            value: value,
            rate: rate,
            result: commission
        });
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
        }
    }

    // Analytics functions
    openAnalytics() {
        document.getElementById('analyticsPanel').style.display = 'flex';
        this.updateAnalyticsDisplay();
    }

    closeAnalytics() {
        document.getElementById('analyticsPanel').style.display = 'none';
    }

    updateAnalyticsDisplay() {
        const stats = this.analytics.getStats();
        const sessionDuration = Math.floor((Date.now() - stats.sessionStart) / 1000 / 60);
        
        document.getElementById('sessionDuration').textContent = `${sessionDuration} min`;
        document.getElementById('messagesCopied').textContent = stats.messagesCopied;
        document.getElementById('calculatorUsage').textContent = stats.calculatorUsage;
        document.getElementById('notepadUsage').textContent = stats.notepadUsage;
    }

    exportAnalytics() {
        const analyticsData = this.analytics.exportAnalytics();
        const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fibramar-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('Analytics exportados com sucesso!', 'success');
    }

    clearAnalytics() {
        if (confirm('Tem certeza que deseja limpar todos os dados de analytics?')) {
            localStorage.removeItem('fibramar_analytics');
            sessionStorage.removeItem('fibramar_session');
            this.analytics = new AnalyticsManager();
            this.updateAnalyticsDisplay();
            this.showNotification('Dados de analytics limpos!', 'success');
        }
    }

    // Funções de Backup
    openBackup() {
        document.getElementById('backupPanel').style.display = 'flex';
        this.updateBackupDisplay();
    }

    closeBackup() {
        document.getElementById('backupPanel').style.display = 'none';
    }

    updateBackupDisplay() {
        const stats = this.backupManager.getBackupStats();
        
        document.getElementById('totalBackups').textContent = stats.totalBackups;
        document.getElementById('lastBackup').textContent = stats.latestBackup 
            ? new Date(stats.latestBackup).toLocaleString('pt-BR')
            : 'Nunca';
        document.getElementById('backupSize').textContent = `${(stats.totalSize / 1024).toFixed(1)} KB`;

        this.updateBackupList();
    }

    updateBackupList() {
        const backups = this.backupManager.getAllBackups();
        const backupList = document.getElementById('backupList');
        
        if (backups.length === 0) {
            backupList.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">Nenhum backup encontrado</p>';
            return;
        }

        backupList.innerHTML = backups.map((backup, index) => `
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-date">${new Date(backup.timestamp).toLocaleString('pt-BR')}</div>
                    <div class="backup-size">Versão: ${backup.version} • ${(JSON.stringify(backup).length / 1024).toFixed(1)} KB</div>
                </div>
                <button class="backup-restore-btn" onclick="restoreSpecificBackup(${index})">
                    🔄 Restaurar
                </button>
            </div>
        `).join('');
    }

    createManualBackup() {
        const backup = this.backupManager.createFullBackup();
        if (backup) {
            this.updateBackupDisplay();
            this.showNotification('Backup criado com sucesso!', 'success');
        } else {
            this.showNotification('Erro ao criar backup', 'error');
        }
    }

    exportBackup() {
        if (this.backupManager.exportBackup()) {
            this.showNotification('Backup exportado com sucesso!', 'success');
        } else {
            this.showNotification('Erro ao exportar backup', 'error');
        }
    }

    async importBackup(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await this.backupManager.importBackup(file);
            this.updateBackupDisplay();
            this.showNotification('Backup importado e aplicado com sucesso!', 'success');
            
            // Recarregar a página para aplicar todas as mudanças
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            this.showNotification('Erro ao importar backup', 'error');
        }
        
        // Limpar o input
        event.target.value = '';
    }

    restoreSpecificBackup(index) {
        if (confirm('Tem certeza que deseja restaurar este backup? Isso substituirá os dados atuais.')) {
            if (this.backupManager.restoreBackup(index)) {
                this.showNotification('Backup restaurado com sucesso!', 'success');
                
                // Recarregar a página para aplicar todas as mudanças
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showNotification('Erro ao restaurar backup', 'error');
            }
        }
    }

    clearOldBackups() {
        if (confirm('Tem certeza que deseja limpar backups antigos (mais de 7 dias)?')) {
            this.backupManager.clearOldBackups();
            this.updateBackupDisplay();
            this.showNotification('Backups antigos removidos!', 'success');
        }
    }

    clearAllBackups() {
        if (confirm('⚠️ ATENÇÃO: Isso removerá TODOS os backups permanentemente. Tem certeza?')) {
            localStorage.removeItem('fibramar_backup');
            localStorage.removeItem('fibramar_backup_latest');
            this.updateBackupDisplay();
            this.showNotification('Todos os backups foram removidos!', 'warning');
        }
    }

    // Configuração dos atalhos de teclado
    setupKeyboardShortcuts() {
        // Registrar ações dos atalhos
        this.keyboardManager.registerAction('search', () => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        });

        this.keyboardManager.registerAction('theme', () => {
            this.toggleTheme();
        });

        this.keyboardManager.registerAction('notepad', () => {
            this.openNotepad();
        });

        this.keyboardManager.registerAction('calculator', () => {
            this.openCalculator();
        });

        this.keyboardManager.registerAction('analytics', () => {
            this.openAnalytics();
        });

        this.keyboardManager.registerAction('backup', () => {
            this.openBackup();
        });

        this.keyboardManager.registerAction('help', () => {
            this.keyboardManager.showShortcutsHelp();
        });

        // Iniciar escuta dos atalhos
        this.keyboardManager.startListening();
    }

    // Funções para gerenciar atalhos
    openShortcutsPanel() {
        document.getElementById('shortcutsPanel').style.display = 'flex';
        this.updateShortcutsDisplay();
    }

    closeShortcutsPanel() {
        document.getElementById('shortcutsPanel').style.display = 'none';
    }

    updateShortcutsDisplay() {
        const shortcuts = this.keyboardManager.getAllShortcuts();
        const shortcutsList = document.getElementById('shortcutsList');
        
        shortcutsList.innerHTML = Object.entries(shortcuts).map(([id, shortcut]) => `
            <div class="shortcut-item">
                <div class="shortcut-info">
                    <div class="shortcut-name">${shortcut.description}</div>
                    <div class="shortcut-keys">${this.keyboardManager.formatShortcut(shortcut)}</div>
                </div>
                <div class="shortcut-actions">
                    <button class="shortcut-edit-btn" onclick="editShortcut('${id}')">
                        ✏️ Editar
                    </button>
                    <button class="shortcut-reset-btn" onclick="resetShortcut('${id}')">
                        🔄 Resetar
                    </button>
                </div>
            </div>
        `).join('');
    }

    editShortcut(shortcutId) {
        const shortcut = this.keyboardManager.getShortcut(shortcutId);
        const newKey = prompt(`Digite a nova tecla para "${shortcut.description}":`, shortcut.key);
        
        if (newKey && newKey.trim()) {
            const ctrl = confirm('Usar Ctrl?');
            const alt = confirm('Usar Alt?');
            const shift = confirm('Usar Shift?');
            
            const newShortcut = {
                key: newKey.trim().toLowerCase(),
                ctrl,
                alt,
                shift,
                description: shortcut.description
            };
            
            this.keyboardManager.setShortcut(shortcutId, newShortcut);
            this.updateShortcutsDisplay();
            this.showNotification('Atalho atualizado!', 'success');
        }
    }

    resetShortcut(shortcutId) {
        if (confirm('Tem certeza que deseja resetar este atalho?')) {
            this.keyboardManager.resetShortcut(shortcutId);
            this.updateShortcutsDisplay();
            this.showNotification('Atalho resetado!', 'success');
        }
    }

    resetAllShortcuts() {
        if (confirm('Tem certeza que deseja resetar TODOS os atalhos?')) {
            this.keyboardManager.resetAllShortcuts();
            this.updateShortcutsDisplay();
            this.showNotification('Todos os atalhos foram resetados!', 'success');
        }
    }

    exportShortcuts() {
        if (this.keyboardManager.exportShortcuts()) {
            this.showNotification('Atalhos exportados com sucesso!', 'success');
        } else {
            this.showNotification('Erro ao exportar atalhos', 'error');
        }
    }

    async importShortcuts(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await this.keyboardManager.importShortcuts(file);
            this.updateShortcutsDisplay();
            this.showNotification('Atalhos importados com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao importar atalhos:', error);
            this.showNotification('Erro ao importar atalhos', 'error');
        }
        
        // Limpar o input
        event.target.value = '';
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
// Global functions for HTML
window.closeAnalytics = () => app?.closeAnalytics();
window.exportAnalytics = () => app?.exportAnalytics();
window.clearAnalytics = () => app?.clearAnalytics();
window.calculateProportional = () => app?.calculateProportional();
window.calculateAgreement = () => app?.calculateAgreement();
window.calculateCommission = () => app?.calculateCommission();
window.openCalculator = () => app?.openCalculator();
window.closeCalculator = () => app?.closeCalculator();

// Funções globais para backup
window.openBackup = () => app?.openBackup();
window.closeBackup = () => app?.closeBackup();
window.createManualBackup = () => app?.createManualBackup();
window.exportBackup = () => app?.exportBackup();
window.importBackup = (event) => app?.importBackup(event);
window.restoreSpecificBackup = (index) => app?.restoreSpecificBackup(index);
window.clearOldBackups = () => app?.clearOldBackups();
window.clearAllBackups = () => app?.clearAllBackups();

// Funções globais para atalhos de teclado
window.openShortcutsPanel = () => app?.openShortcutsPanel();
window.closeShortcutsPanel = () => app?.closeShortcutsPanel();
window.editShortcut = (shortcutId) => app?.editShortcut(shortcutId);
window.resetShortcut = (shortcutId) => app?.resetShortcut(shortcutId);
window.resetAllShortcuts = () => app?.resetAllShortcuts();
window.exportShortcuts = () => app?.exportShortcuts();
window.importShortcuts = (event) => app?.importShortcuts(event);

window.CONFIG = CONFIG;
window.updateManager = new UpdateManager();
window.backupManager = new BackupManager();
window.versionManager = new VersionManager();