import { scriptData } from './data/scripts.js';
import { supportData } from './data/support.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Script carregado em:', new Date().toLocaleString());

    const currentVersion = '2.0.0';
    const storedVersion = localStorage.getItem('scriptVersion');

    if (storedVersion !== currentVersion) {
        localStorage.setItem('scriptVersion', currentVersion);
        console.log('Nova versão detectada:', currentVersion);
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
    }

    // Tema
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        const body = document.body;

        // Carregar tema salvo
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light';
        }

        // Alternar tema
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                themeIcon.textContent = '☀️';
                themeText.textContent = 'Light';
                localStorage.setItem('theme', 'dark');
            } else {
                themeIcon.textContent = '🌙';
                themeText.textContent = 'Dark';
                localStorage.setItem('theme', 'light');
            }
        });

        const MESSAGE_PREVIEW_LENGTH = 220;
        const topicsContainer = document.getElementById('topics');
        const topicsNav = document.getElementById('topicsNav');
        const topicsPlaceholder = document.getElementById('topicsPlaceholder');
        const messageStore = new Map();
        let messageIdCounter = 0;
        let topicsBuilt = false;
        let supportBoxesPopulated = false;
        let selectedTopicName = null;
        let notificationTimer = null;

        const TOAST_ICONS = {
            success: '<i class="fas fa-check"></i>',
            error: '<i class="fas fa-circle-exclamation"></i>',
            warning: '<i class="fas fa-triangle-exclamation"></i>',
            info: '<i class="fas fa-circle-info"></i>',
        };

        function showToast({ type = 'success', message, subtext = '', duration = 2500 } = {}) {
            const notification = document.getElementById('notification');
            const messageEl = document.getElementById('notificationMessage');
            const subtextEl = document.getElementById('notificationSubtext');
            const iconEl = notification?.querySelector('.notification-icon');
            const progressEl = document.getElementById('notificationProgress');

            if (!notification || !messageEl || !iconEl) return;

            if (notificationTimer) {
                clearTimeout(notificationTimer);
                notificationTimer = null;
            }

            notification.classList.remove(
                'show',
                'notification--success',
                'notification--error',
                'notification--warning',
                'notification--info'
            );
            void notification.offsetWidth;

            notification.classList.add(`notification--${type}`);
            notification.style.setProperty('--notification-duration', `${duration}ms`);
            iconEl.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.success;
            messageEl.textContent = message;

            if (subtext) {
                subtextEl.textContent = subtext;
                subtextEl.hidden = false;
            } else {
                subtextEl.textContent = '';
                subtextEl.hidden = true;
            }

            if (progressEl) {
                progressEl.style.animation = 'none';
                void progressEl.offsetWidth;
                progressEl.style.animation = '';
            }

            notification.hidden = false;
            requestAnimationFrame(() => notification.classList.add('show'));

            notificationTimer = setTimeout(() => {
                notification.classList.remove('show');
                notificationTimer = setTimeout(() => {
                    notification.hidden = true;
                }, 350);
            }, duration);
        }

        function registerMessage(message) {
            const id = messageIdCounter++;
            messageStore.set(id, message);
            return id;
        }

        function debounce(fn, delay) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), delay);
            };
        }

        function isPasswordsContent(content) {
            return content?.type === 'passwords' ||
                (Array.isArray(content) && content.some(item => item && Array.isArray(item.credentials)));
        }

        function getPasswordsItems(content) {
            return content?.type === 'passwords' ? content.items : content;
        }

        function getMessageSearchText(message, topicName) {
            if (typeof message === 'object' && message !== null && message.title) {
                return `${topicName} ${message.title} ${message.content || ''}`.toLowerCase();
            }
            return `${topicName} ${message ?? ''}`.toLowerCase();
        }

        function truncateMessageText(text, maxLength = MESSAGE_PREVIEW_LENGTH) {
            const safeText = text == null ? '' : String(text);
            if (safeText.length <= maxLength) {
                return { preview: safeText, isTruncated: false };
            }

            let cut = safeText.slice(0, maxLength);
            const lastSpace = cut.lastIndexOf(' ');
            const lastBreak = cut.lastIndexOf('\n');

            if (lastBreak > maxLength * 0.5) {
                cut = cut.slice(0, lastBreak);
            } else if (lastSpace > maxLength * 0.6) {
                cut = cut.slice(0, lastSpace);
            }

            return { preview: cut.trimEnd() + '...', isTruncated: true };
        }

        function createMessageTextElement(fullText) {
            const messageText = document.createElement('div');
            messageText.className = 'message-text';
            const { preview, isTruncated } = truncateMessageText(fullText);

            if (!isTruncated) {
                messageText.textContent = fullText;
                return messageText;
            }

            const previewSpan = document.createElement('span');
            previewSpan.className = 'message-text-preview';
            previewSpan.textContent = preview;

            const fullSpan = document.createElement('span');
            fullSpan.className = 'message-text-full';
            fullSpan.textContent = fullText;
            fullSpan.hidden = true;

            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'message-toggle';
            toggleBtn.textContent = 'Ver mais';

            messageText.appendChild(previewSpan);
            messageText.appendChild(fullSpan);
            messageText.appendChild(toggleBtn);

            return messageText;
        }

        function createCopyButton() {
            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'message-copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar';
            return copyBtn;
        }

        function createMessageCard(message, topicName) {
            const messageItem = document.createElement('div');
            messageItem.className = 'message-item';
            messageItem.setAttribute('role', 'button');
            messageItem.setAttribute('tabindex', '0');
            messageItem.dataset.msgId = registerMessage(message);
            messageItem.dataset.search = getMessageSearchText(message, topicName);

            let title = '';
            let contentToDisplay = message;

            if (typeof message === 'object' && message !== null && message.title) {
                title = message.title;
                contentToDisplay = message.content ?? '';
            }

            if (title) {
                const titleEl = document.createElement('div');
                titleEl.className = 'message-title';
                titleEl.textContent = title;
                messageItem.appendChild(titleEl);
            }

            const messageText = createMessageTextElement(contentToDisplay);
            if (messageText.querySelector('.message-toggle')) {
                messageItem.classList.add('message-item--truncated');
            }

            messageItem.appendChild(messageText);
            messageItem.appendChild(createCopyButton());

            return messageItem;
        }

        function createTopicPanelHeader(topicName, count) {
            const topicHeader = document.createElement('div');
            topicHeader.className = 'topic-panel-header';
            const label = count === 1 ? 'script' : 'scripts';
            topicHeader.innerHTML = `
                <h2>${topicName}</h2>
                <span class="topic-badge">${count} ${label}</span>
            `;
            return topicHeader;
        }

        function createTopicNavItem(topicName, count) {
            const label = count === 1 ? 'script' : 'scripts';
            const navItem = document.createElement('button');
            navItem.type = 'button';
            navItem.className = 'topics-nav-item';
            navItem.dataset.topicName = topicName;
            navItem.innerHTML = `
                <span class="topics-nav-label">${topicName}</span>
                <span class="topics-nav-badge">${count} ${label}</span>
            `;
            return navItem;
        }

        function updateNavBadge(navItem, count) {
            const badge = navItem.querySelector('.topics-nav-badge');
            if (!badge) return;
            const label = count === 1 ? 'script' : 'scripts';
            badge.textContent = `${count} ${label}`;
        }

        function selectTopic(topicName) {
            if (!topicName) return;

            selectedTopicName = topicName;

            topicsContainer.querySelectorAll('.topic').forEach(topic => {
                topic.classList.toggle('is-selected', topic.dataset.topicName === topicName);
            });

            topicsNav.querySelectorAll('.topics-nav-item').forEach(navItem => {
                const isActive = navItem.dataset.topicName === topicName;
                navItem.classList.toggle('is-active', isActive);
                if (isActive) {
                    navItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            });

            if (topicsPlaceholder) {
                topicsPlaceholder.hidden = true;
            }
        }

        function createMessagesContainer(children = []) {
            const messagesDiv = document.createElement('div');
            messagesDiv.className = 'messages';

            const grid = document.createElement('div');
            grid.className = 'messages-grid';
            children.forEach(child => grid.appendChild(child));
            messagesDiv.appendChild(grid);

            return { messagesDiv, grid };
        }

        function updateTopicBadge(topicEl, count) {
            const badge = topicEl.querySelector('.topic-badge');
            if (!badge) return;
            const label = count === 1 ? 'script' : 'scripts';
            badge.textContent = `${count} ${label}`;

            const navItem = Array.from(topicsNav.querySelectorAll('.topics-nav-item'))
                .find(item => item.dataset.topicName === topicEl.dataset.topicName);
            if (navItem) updateNavBadge(navItem, count);
        }

        function copyPassword(text, triggerBtn = null) {
            navigator.clipboard.writeText(text).then(() => {
                showToast({ type: 'success', message: 'Senha copiada!' });
                if (triggerBtn) {
                    triggerBtn.classList.add('copied');
                    setTimeout(() => triggerBtn.classList.remove('copied'), 1600);
                }
            });
        }

        function createPasswordCredCard(userText, passwordText) {
            const card = document.createElement('div');
            card.className = 'password-cred-card';

            const label = document.createElement('span');
            label.className = 'password-cred-label';
            label.textContent = userText || 'Senha';

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'password-copy-btn';
            copyBtn.dataset.copyPassword = passwordText;
            copyBtn.title = 'Clique para copiar a senha';
            copyBtn.innerHTML = `<i class="fas fa-copy"></i><span class="password-copy-value">${passwordText}</span>`;

            card.appendChild(label);
            card.appendChild(copyBtn);
            return card;
        }

        function buildPasswordTopic(topicName, content) {
            const topicDiv = document.createElement('div');
            topicDiv.className = 'topic topic--passwords';
            topicDiv.dataset.topicName = topicName;

            const { messagesDiv, grid } = createMessagesContainer();
            let credentialCount = 0;
            const items = getPasswordsItems(content);

            items.forEach(item => {
                const isRegion = !item.credentials || item.credentials.length === 0;
                const groupDiv = document.createElement('div');
                groupDiv.className = 'password-group';
                groupDiv.dataset.search = `${topicName} ${item.title || ''}`.toLowerCase();

                if (isRegion) {
                    groupDiv.classList.add('password-group--region');
                    const regionHeader = document.createElement('div');
                    regionHeader.className = 'password-region-header';
                    regionHeader.textContent = item.title;
                    groupDiv.appendChild(regionHeader);
                } else {
                    credentialCount += 1;
                    const isRestricted = /NUNCA ENVIAR/i.test(item.title || '');

                    item.credentials.forEach(cred => {
                        const isObject = typeof cred === 'object' && cred !== null;
                        const userText = isObject ? (cred.user || '') : '';
                        const passwordText = isObject ? cred.password : cred;
                        groupDiv.dataset.search += ` ${userText} ${passwordText}`.toLowerCase();
                    });

                    const deviceHeader = document.createElement('div');
                    deviceHeader.className = 'password-device-header';

                    const deviceTitle = document.createElement('span');
                    deviceTitle.className = 'password-device-title';
                    deviceTitle.textContent = item.title;
                    deviceHeader.appendChild(deviceTitle);

                    if (isRestricted) {
                        const badge = document.createElement('span');
                        badge.className = 'password-restricted-badge';
                        badge.textContent = 'Uso interno';
                        deviceHeader.appendChild(badge);
                        groupDiv.classList.add('password-group--restricted');
                    }

                    groupDiv.appendChild(deviceHeader);

                    const cardsContainer = document.createElement('div');
                    cardsContainer.className = 'password-cards';

                    item.credentials.forEach(cred => {
                        const isObject = typeof cred === 'object' && cred !== null;
                        const userText = isObject ? (cred.user || '') : '';
                        const passwordText = isObject ? cred.password : cred;
                        cardsContainer.appendChild(createPasswordCredCard(userText, passwordText));
                    });

                    groupDiv.appendChild(cardsContainer);
                }

                grid.appendChild(groupDiv);
            });

            topicDiv.dataset.totalCount = credentialCount;
            const topicHeader = createTopicPanelHeader(topicName, credentialCount || items.length);
            topicDiv.appendChild(topicHeader);
            topicDiv.appendChild(messagesDiv);

            return topicDiv;
        }

        function buildTopics() {
            if (topicsBuilt) return;

            const panelFragment = document.createDocumentFragment();
            const navFragment = document.createDocumentFragment();
            let firstTopicName = null;

            for (const [topicName, content] of Object.entries(scriptData)) {
                if (!Array.isArray(content) && !isPasswordsContent(content)) continue;

                if (!firstTopicName) firstTopicName = topicName;

                if (isPasswordsContent(content)) {
                    const topicDiv = buildPasswordTopic(topicName, content);
                    panelFragment.appendChild(topicDiv);
                    navFragment.appendChild(
                        createTopicNavItem(topicName, Number(topicDiv.dataset.totalCount) || 0)
                    );
                    continue;
                }

                const topicDiv = document.createElement('div');
                topicDiv.className = 'topic';
                topicDiv.dataset.topicName = topicName;
                topicDiv.dataset.totalCount = content.length;

                const cards = content.map(message => createMessageCard(message, topicName));
                const { messagesDiv } = createMessagesContainer(cards);
                const topicHeader = createTopicPanelHeader(topicName, content.length);

                topicDiv.appendChild(topicHeader);
                topicDiv.appendChild(messagesDiv);
                panelFragment.appendChild(topicDiv);
                navFragment.appendChild(createTopicNavItem(topicName, content.length));
            }

            topicsNav.appendChild(navFragment);
            topicsContainer.appendChild(panelFragment);
            topicsContainer.addEventListener('click', handleTopicsClick);
            topicsNav.addEventListener('click', handleTopicsNavClick);
            topicsBuilt = true;

            if (firstTopicName) {
                selectTopic(firstTopicName);
            }
        }

        function handleTopicsNavClick(event) {
            const navItem = event.target.closest('.topics-nav-item');
            if (!navItem || navItem.classList.contains('is-filtered-out')) return;
            selectTopic(navItem.dataset.topicName);
        }

        function handleTopicsClick(event) {
            const toggleBtn = event.target.closest('.message-toggle');
            if (toggleBtn) {
                event.stopPropagation();
                const messageText = toggleBtn.closest('.message-text');
                const preview = messageText.querySelector('.message-text-preview');
                const full = messageText.querySelector('.message-text-full');
                const expanded = messageText.classList.toggle('expanded');
                preview.hidden = expanded;
                full.hidden = !expanded;
                toggleBtn.textContent = expanded ? 'Ver menos' : 'Ver mais';
                return;
            }

            const copyBtn = event.target.closest('.message-copy-btn');
            if (copyBtn) {
                event.stopPropagation();
                const card = copyBtn.closest('[data-msg-id]');
                if (card) copyToClipboard(messageStore.get(Number(card.dataset.msgId)), copyBtn);
                return;
            }

            const passwordCopyBtn = event.target.closest('[data-copy-password]');
            if (passwordCopyBtn) {
                event.stopPropagation();
                copyPassword(passwordCopyBtn.dataset.copyPassword, passwordCopyBtn);
                return;
            }

            const card = event.target.closest('.message-item[data-msg-id]');
            if (card) {
                copyToClipboard(messageStore.get(Number(card.dataset.msgId)));
            }
        }

        function filterTopics(searchTerm = '') {
            const normalizedTerm = searchTerm.trim().toLowerCase();
            let totalMessages = 0;
            let totalTopics = 0;

            const topicCounts = new Map();

            topicsContainer.querySelectorAll('.topic').forEach(topic => {
                const topicName = (topic.dataset.topicName || '').toLowerCase();
                const topicMatches = !normalizedTerm || topicName.includes(normalizedTerm);
                const totalCount = Number(topic.dataset.totalCount) || 0;

                topic.querySelectorAll('.message-item[data-search]').forEach(item => {
                    const matches = !normalizedTerm ||
                        item.dataset.search.includes(normalizedTerm) ||
                        topicMatches;
                    item.classList.toggle('is-filtered-out', !matches);
                });

                topic.querySelectorAll('.password-group').forEach(group => {
                    const matches = !normalizedTerm ||
                        group.dataset.search.includes(normalizedTerm) ||
                        topicMatches;
                    group.classList.toggle('is-filtered-out', !matches);
                });

                const visibleCount = topic.querySelectorAll(
                    '.message-item[data-search]:not(.is-filtered-out), .password-group:not(.is-filtered-out):not(.password-group--region) .password-cred-card'
                ).length;

                const topicVisible = !normalizedTerm || visibleCount > 0;
                topic.classList.toggle('is-filtered-out', normalizedTerm && visibleCount === 0);
                topicCounts.set(topic.dataset.topicName, { visibleCount, totalCount, topicVisible });

                updateTopicBadge(topic, normalizedTerm ? visibleCount : totalCount);

                if (topicVisible && visibleCount > 0) {
                    totalTopics += 1;
                    totalMessages += normalizedTerm ? visibleCount : totalCount;
                } else if (!normalizedTerm) {
                    totalTopics += 1;
                    totalMessages += totalCount;
                }
            });

            topicsNav.querySelectorAll('.topics-nav-item').forEach(navItem => {
                const counts = topicCounts.get(navItem.dataset.topicName);
                if (!counts) return;

                navItem.classList.toggle('is-filtered-out', normalizedTerm && !counts.topicVisible);
                updateNavBadge(navItem, normalizedTerm ? counts.visibleCount : counts.totalCount);
            });

            if (normalizedTerm && totalTopics > 0) {
                const selectedTopic = Array.from(topicsContainer.querySelectorAll('.topic'))
                    .find(topic => topic.dataset.topicName === selectedTopicName);
                const selectedStillVisible = selectedTopic && !selectedTopic.classList.contains('is-filtered-out');

                if (!selectedStillVisible) {
                    const firstVisible = topicsContainer.querySelector('.topic:not(.is-filtered-out)');
                    if (firstVisible) selectTopic(firstVisible.dataset.topicName);
                }
            } else if (!normalizedTerm && selectedTopicName) {
                selectTopic(selectedTopicName);
            }

            return { totalMessages, totalTopics };
        }

        // --- Substitui variáveis e adiciona saudação automática ---
        function replaceVariables(text) {
            const attendantName = document.getElementById('attendantName').value || '';
            const now = new Date();
            const dia = String(now.getDate()).padStart(2, '0');
            const mes = String(now.getMonth() + 1).padStart(2, '0');
            const ano = String(now.getFullYear()).slice(-2);
            const hora = String(now.getHours()).padStart(2, '0');
            const minuto = String(now.getMinutes()).padStart(2, '0');

            const dataAtual = `${dia}/${mes}/${ano}`;
            const horaAtual = `${hora}:${minuto}`;

            // Saudação automática conforme o horário
            let periodo = "";
            const horaNum = now.getHours();
            if (horaNum >= 5 && horaNum < 12) {
                periodo = "Bom dia";
            } else if (horaNum >= 12 && horaNum < 18) {
                periodo = "Boa tarde";
            } else {
                periodo = "Boa noite";
            }

            // Lógica de vencimento automático
            let vencimentoAuto = "";
            const diaNum = now.getDate();
            if (diaNum >= 2 && diaNum <= 10) {
                vencimentoAuto = "03, 06 ou 09";
            } else if (diaNum >= 11 && diaNum <= 20) {
                vencimentoAuto = "13 ou 18";
            } else {
                vencimentoAuto = "22, 26 ou 01";
            }

            return text
                .replace(/\[PERIODO\]/g, periodo)
                .replace(/\[NOME_ATENDENTE\]/g, attendantName)
                .replace(/\[DATA\]/g, dataAtual)
                .replace(/\[HORA\]/g, horaAtual)
                .replace(/\[VENCIMENTO_AUTO\]/g, vencimentoAuto);
        }

        // Copiar para área de transferência
        function copyToClipboard(input, triggerBtn = null) {
            const attendantNameInput = document.getElementById('attendantName');
            const attendantName = attendantNameInput.value.trim();

            if (!attendantName) {
                attendantNameInput.style.borderColor = '#ef4444';
                attendantNameInput.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
                attendantNameInput.focus();

                showToast({
                    type: 'error',
                    message: 'Nome do atendente obrigatório',
                    subtext: 'Preencha seu nome no menu lateral para copiar mensagens.',
                    duration: 3500,
                });

                return;
            }

            // Resetar estilos caso o nome esteja preenchido
            attendantNameInput.style.borderColor = '';
            attendantNameInput.style.boxShadow = '';

            // Rastrear uso
            trackMessageUsage(input);

            // Se for objeto com title e content, pegar apenas o content
            const textToProcess = (typeof input === 'object' && input !== null && input.content) 
                ? input.content 
                : input;
            
            let textAtualizado = replaceVariables(textToProcess);
            
            navigator.clipboard.writeText(textAtualizado).then(() => {
                showNotification();
                if (triggerBtn) {
                    const originalHtml = triggerBtn.innerHTML;
                    triggerBtn.classList.add('copied');
                    triggerBtn.innerHTML = '<i class="fas fa-check"></i> Copiado';
                    setTimeout(() => {
                        triggerBtn.classList.remove('copied');
                        triggerBtn.innerHTML = originalHtml;
                    }, 1600);
                }
            }).catch(err => {
                console.error('Erro ao copiar:', err);
                showToast({
                    type: 'error',
                    message: 'Não foi possível copiar',
                    subtext: 'Verifique as permissões do navegador.',
                });
            });
        }

        function showNotification() {
            showToast({
                type: 'success',
                message: 'Mensagem copiada!',
                subtext: 'Cole no chat do cliente com Ctrl+V.',
            });
        }

        // Sistema de rastreamento de uso com data
        function trackMessageUsage(input) {
            try {
                // Se for objeto com title e content, pegar apenas o content
                const messageText = (typeof input === 'object' && input !== null && input.content) 
                    ? input.content 
                    : input;

                let usageHistory = JSON.parse(localStorage.getItem('messageUsageHistory') || '[]');
                
                // Adicionar registro de uso
                usageHistory.push({
                    text: messageText,
                    timestamp: new Date().toISOString(),
                    date: new Date().toLocaleDateString('pt-BR'),
                    time: new Date().toLocaleTimeString('pt-BR')
                });
                
                // Manter apenas últimos 1000 registros
                if (usageHistory.length > 1000) {
                    usageHistory = usageHistory.slice(-1000);
                }
                
                setTimeout(() => {
                    localStorage.setItem('messageUsageHistory', JSON.stringify(usageHistory));
                }, 0);
            } catch (err) {
                console.error('Erro ao rastrear uso:', err);
            }
        }

        // --- Gerenciamento das Caixas de Apoio ---
        const supportBoxes = document.getElementById('supportBoxes');
        const contentWallets = document.getElementById('contentWallets');
        const contentDueDates = document.getElementById('contentDueDates');
        const boxWallets = document.getElementById('boxWallets');
        const boxDueDates = document.getElementById('boxDueDates');
        const btnWallets = document.getElementById('btnWallets');
        const btnDueDates = document.getElementById('btnDueDates');
        const btnOltUnamar = document.getElementById('btnOltUnamar');
        const closeSupportModal = document.getElementById('closeSupportModal');
        const infoBalloons = document.getElementById('infoBalloons');

        function openSupportModal(type) {
            supportBoxes.classList.add('show');
            if (!supportBoxesPopulated) {
                populateSupportBoxes();
                supportBoxesPopulated = true;
            }
            
            if (type === 'wallets') {
                boxWallets.style.display = 'flex';
                boxDueDates.style.display = 'none';
                document.querySelector('.support-modal-header h2').innerHTML = '<span>💳</span> Carteiras de Cobrança';
            } else if (type === 'dueDates') {
                boxWallets.style.display = 'none';
                boxDueDates.style.display = 'flex';
                document.querySelector('.support-modal-header h2').innerHTML = '<span>📅</span> Vencimentos';
            }
        }

        if (btnWallets) {
            btnWallets.addEventListener('click', () => {
                openSupportModal('wallets');
                if (infoBalloons) {
                    infoBalloons.classList.add('show');
                }
            });
        }

        if (btnDueDates) {
            btnDueDates.addEventListener('click', () => {
                openSupportModal('dueDates');
                if (infoBalloons) {
                    infoBalloons.classList.add('show');
                }
            });

            if (btnOltUnamar) {
                btnOltUnamar.addEventListener('click', () => {
                    window.open('https://186.26.81.5:4443/action/login.html', '_blank');
                    navigator.clipboard.writeText('Xpon@Olt9417#');
                    showToast({
                        type: 'info',
                        message: 'OLT UNAMAR aberta',
                        subtext: 'User: admin | Senha copiada: Xpon@Olt9417#',
                        duration: 5500,
                    });
                });
            }
        }

        if (closeSupportModal) {
            closeSupportModal.addEventListener('click', () => {
                supportBoxes.classList.remove('show');
            });
        }

        // Fechar ao clicar fora do modal
        supportBoxes.addEventListener('click', (e) => {
            if (e.target === supportBoxes) {
                supportBoxes.classList.remove('show');
            }
        });

        function copySupportId(id) {
            navigator.clipboard.writeText(id).then(() => {
                showToast({
                    type: 'success',
                    message: `ID ${id} copiado!`,
                });
            });
        }

        function handleSupportCopyClick(e) {
            const copyBtn = e.target.closest('[data-copy-id]');
            if (!copyBtn) return;
            copySupportId(copyBtn.dataset.copyId);
        }

        function renderWalletRow(id, label) {
            return `
                <div class="support-wallet-row">
                    <button type="button" class="support-id-copy" data-copy-id="${id}" title="Clique para copiar o ID">
                        <i class="fas fa-copy"></i> ${id}
                    </button>
                    <span class="support-wallet-label">${label}</span>
                </div>
            `;
        }

        function populateSupportBoxes() {
            let walletsHtml = '<div class="support-grid support-grid--wallet">';
            supportData.wallets.forEach(item => {
                const hasNoDiscount = item.noDiscount && item.noDiscount !== '-';
                walletsHtml += `
                    <div class="support-card support-wallet-card">
                        <div class="support-card-title">${item.city}</div>
                        <div class="support-card-info">
                            ${renderWalletRow(item.withDiscount, 'Com desconto')}
                            ${hasNoDiscount ? renderWalletRow(item.noDiscount, 'Sem desconto') : ''}
                        </div>
                    </div>
                `;
            });
            walletsHtml += '</div>';
            contentWallets.innerHTML = walletsHtml;

            let dueDatesHtml = '';

            dueDatesHtml += '<div class="support-section">';
            dueDatesHtml += '<div class="support-section-title"><span>📅</span> Sem Proporcional</div>';
            dueDatesHtml += '<div class="support-grid support-grid--due">';
            supportData.dueDatesNoProp.forEach(item => {
                dueDatesHtml += `
                    <div class="support-card support-due-card">
                        <button type="button" class="support-id-copy" data-copy-id="${item.id}" title="Clique para copiar o ID">
                            <i class="fas fa-copy"></i> ID ${item.id}
                        </button>
                        <span class="support-due-day">Vencimento dia ${item.day}</span>
                    </div>
                `;
            });
            dueDatesHtml += '</div></div>';

            dueDatesHtml += '<div class="support-section">';
            dueDatesHtml += '<div class="support-section-title"><span>🔄</span> Com Proporcional</div>';
            dueDatesHtml += '<div class="support-grid support-grid--due">';
            supportData.dueDatesProp.forEach(item => {
                dueDatesHtml += `
                    <div class="support-card support-due-card">
                        <button type="button" class="support-id-copy" data-copy-id="${item.id}" title="Clique para copiar o ID">
                            <i class="fas fa-copy"></i> ID ${item.id}
                        </button>
                        <span class="support-due-day">Vencimento dia ${item.day}</span>
                    </div>
                `;
            });
            dueDatesHtml += '</div></div>';

            contentDueDates.innerHTML = dueDatesHtml;
        }

        contentWallets.addEventListener('click', handleSupportCopyClick);
        contentDueDates.addEventListener('click', handleSupportCopyClick);

        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        const emptyState = document.getElementById('emptyState');
        const searchResults = document.getElementById('searchResults');
        const attendantNameInput = document.getElementById('attendantName');
        const nameConfig = document.getElementById('nameConfig');
        const nameStatus = document.getElementById('nameStatus');

        function updateDateTime() {
            const widget = document.getElementById('datetimeWidget');
            if (!widget) return;
            const now = new Date();
            widget.textContent = now.toLocaleString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function updateNameStatus() {
            const hasName = attendantNameInput.value.trim().length > 0;
            nameConfig.classList.toggle('ready', hasName);
            nameStatus.className = hasName ? 'name-status ready' : 'name-status';
            nameStatus.title = hasName ? 'Pronto para copiar' : 'Preencha para copiar mensagens';
            nameStatus.innerHTML = hasName
                ? '<i class="fas fa-circle-check"></i>'
                : '<i class="fas fa-circle-exclamation"></i>';
        }

        function handleSearch(term = '') {
            const normalizedTerm = term.trim();
            clearSearch.hidden = !normalizedTerm;

            const { totalMessages, totalTopics } = filterTopics(normalizedTerm);

            const hasResults = totalTopics > 0;
            emptyState.hidden = hasResults || !normalizedTerm;
            if (topicsPlaceholder) {
                topicsPlaceholder.hidden = Boolean(normalizedTerm) || hasResults || Boolean(selectedTopicName);
            }

            if (normalizedTerm) {
                searchResults.hidden = false;
                searchResults.textContent = totalTopics
                    ? `${totalMessages} resultado(s) em ${totalTopics} tópico(s)`
                    : 'Nenhum resultado encontrado';
            } else {
                searchResults.hidden = true;
            }
        }

        const debouncedSearch = debounce(handleSearch, 120);

        searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            handleSearch('');
            searchInput.focus();
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
            if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.value = '';
                handleSearch('');
                searchInput.blur();
            }
        });

        const savedAttendantName = localStorage.getItem('attendantName');
        if (savedAttendantName) {
            attendantNameInput.value = savedAttendantName;
        }

        function initSidebarResizer() {
            const app = document.querySelector('.app');
            const resizer = document.getElementById('sidebarResizer');
            if (!app || !resizer) return;

            const SIDEBAR_MIN = 200;
            const SIDEBAR_MAX = 520;
            const SIDEBAR_DEFAULT = 260;
            const STORAGE_KEY = 'sidebarWidth';

            function clampWidth(width) {
                return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, width));
            }

            function setSidebarWidth(width, persist = false) {
                const clamped = clampWidth(width);
                app.style.setProperty('--sidebar-width', `${clamped}px`);
                if (persist) localStorage.setItem(STORAGE_KEY, String(clamped));
            }

            const savedWidth = Number(localStorage.getItem(STORAGE_KEY));
            if (savedWidth) setSidebarWidth(savedWidth);

            let dragging = false;

            function onPointerMove(event) {
                if (!dragging) return;
                setSidebarWidth(event.clientX);
            }

            function stopDragging() {
                if (!dragging) return;
                dragging = false;
                resizer.classList.remove('is-dragging');
                body.classList.remove('is-resizing-sidebar');

                const currentWidth = parseInt(
                    getComputedStyle(app).getPropertyValue('--sidebar-width'),
                    10
                );
                if (currentWidth) localStorage.setItem(STORAGE_KEY, String(currentWidth));

                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', stopDragging);
                document.removeEventListener('pointercancel', stopDragging);
            }

            resizer.addEventListener('pointerdown', (event) => {
                if (window.innerWidth <= 768) return;
                event.preventDefault();
                dragging = true;
                resizer.classList.add('is-dragging');
                body.classList.add('is-resizing-sidebar');
                resizer.setPointerCapture(event.pointerId);
                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', stopDragging);
                document.addEventListener('pointercancel', stopDragging);
            });

            resizer.addEventListener('dblclick', () => {
                setSidebarWidth(SIDEBAR_DEFAULT, true);
            });

            resizer.addEventListener('keydown', (event) => {
                const currentWidth = parseInt(
                    getComputedStyle(app).getPropertyValue('--sidebar-width'),
                    10
                ) || SIDEBAR_DEFAULT;
                const step = event.shiftKey ? 40 : 10;

                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    setSidebarWidth(currentWidth - step, true);
                } else if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    setSidebarWidth(currentWidth + step, true);
                } else if (event.key === 'Home') {
                    event.preventDefault();
                    setSidebarWidth(SIDEBAR_MIN, true);
                } else if (event.key === 'End') {
                    event.preventDefault();
                    setSidebarWidth(SIDEBAR_MAX, true);
                }
            });
        }

        updateNameStatus();
        updateDateTime();
        setInterval(updateDateTime, 30000);
        buildTopics();
        handleSearch();
        initSidebarResizer();

        attendantNameInput.addEventListener('input', () => {
            localStorage.setItem('attendantName', attendantNameInput.value);
            if (attendantNameInput.value.trim()) {
                attendantNameInput.style.borderColor = '';
                attendantNameInput.style.boxShadow = '';
            }
            updateNameStatus();
        });
});
