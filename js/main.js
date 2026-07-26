import { scriptData } from './data/scripts.js';
import { topicCategories, readOnlyTopics } from './data/categories.js';
import { ixcReferenceTopics } from './data/ixc-reference.js';
import { supportData } from './data/support.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Script carregado em:', new Date().toLocaleString());

    const currentVersion = '2.6.1';
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
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeText) themeText.textContent = 'Light';
        }

        const welcomePanel = document.getElementById('welcomePanel');
        const topicsMain = document.querySelector('.topics-main');

        function isWelcomeVisible() {
            return Boolean(welcomePanel && !welcomePanel.hidden);
        }

        function dismissWelcome({ focusAttendant = true } = {}) {
            if (!welcomePanel || welcomePanel.hidden) return;

            welcomePanel.hidden = true;
            topicsMain?.classList.remove('is-welcome');
            if (selectedTopicName) {
                renderActiveTopicPanel(selectedTopicName);
                expandCategoryForTopic(selectedTopicName);
            }
            handleSearch(document.getElementById('searchInput')?.value || '');
            if (focusAttendant) document.getElementById('attendantName')?.focus();
        }

        function initWelcomePanel() {
            if (!welcomePanel) return;
            topicsMain?.classList.add('is-welcome');
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
        let closeMobileSidebar = () => {};

        const topicCategoryMap = new Map();
        topicCategories.forEach(category => {
            category.topics.forEach(topicName => {
                topicCategoryMap.set(topicName, category.label.toLowerCase());
            });
        });

        const TOAST_ICONS = {
            success: '<i class="fas fa-check"></i>',
            error: '<i class="fas fa-circle-exclamation"></i>',
            warning: '<i class="fas fa-triangle-exclamation"></i>',
            info: '<i class="fas fa-circle-info"></i>',
        };

        const PLAN_OPTIONS = {
            'Maricá / Geral': [
                { velocidade: '240 MEGA', valorPreVenc: 'R$ 59,99', valorPosVenc: 'R$ 79,99' },
                { velocidade: '400 Mega', valorPreVenc: 'R$ 79,99', valorPosVenc: 'R$ 99,99' },
                { velocidade: '500 Mega', valorPreVenc: 'R$ 99,99', valorPosVenc: 'R$ 119,99' },
                { velocidade: '600 Mega', valorPreVenc: 'R$ 119,99', valorPosVenc: 'R$ 139,99' },
                { velocidade: '700 MEGA (Prime)', valorPreVenc: 'R$ 99,99', valorPosVenc: 'R$ 119,99' },
                { velocidade: '1 GIGA', valorPreVenc: 'R$ 149,99', valorPosVenc: 'R$ 169,99' },
            ],
            'Muqui': [
                { velocidade: '100 MEGA', valorPreVenc: 'R$ 59,99', valorPosVenc: 'R$ 79,99' },
                { velocidade: '300 Mega', valorPreVenc: 'R$ 89,99', valorPosVenc: 'R$ 109,99' },
                { velocidade: '500 Mega', valorPreVenc: 'R$ 99,99', valorPosVenc: 'R$ 119,99' },
                { velocidade: '1 GIGA', valorPreVenc: 'R$ 149,99', valorPosVenc: 'R$ 169,99' },
            ],
            'Mimoso do Sul': [
                { velocidade: '240 MEGA', valorPreVenc: 'R$ 59,99', valorPosVenc: 'R$ 79,99' },
                { velocidade: '300 Mega', valorPreVenc: 'R$ 69,99', valorPosVenc: 'R$ 69,99' },
                { velocidade: '400 Mega', valorPreVenc: 'R$ 79,99', valorPosVenc: 'R$ 99,99' },
                { velocidade: '500 Mega', valorPreVenc: 'R$ 99,99', valorPosVenc: 'R$ 119,99' },
                { velocidade: '600 Mega', valorPreVenc: 'R$ 119,99', valorPosVenc: 'R$ 139,99' },
                { velocidade: '700 Mega', valorPreVenc: 'R$ 89,99', valorPosVenc: 'R$ 89,99' },
                { velocidade: '1 GIGA', valorPreVenc: 'R$ 149,99', valorPosVenc: 'R$ 169,99' },
            ],
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

        function getTopicContent(topicName) {
            return scriptData[topicName] ?? ixcReferenceTopics[topicName];
        }

        function isIxcReferenceContent(content) {
            return content?.type === 'ixc-reference';
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

        function isReadOnlyTopic(topicName) {
            return readOnlyTopics.has(topicName);
        }

        function createMessageCard(message, topicName, readOnly = false) {
            const isMsgReadOnly = readOnly || (typeof message === 'object' && message !== null && message.readOnly);
            const messageItem = document.createElement('div');
            messageItem.className = 'message-item';
            if (isMsgReadOnly) {
                messageItem.classList.add('message-item--readonly');
            } else {
                messageItem.setAttribute('role', 'button');
                messageItem.setAttribute('tabindex', '0');
            }
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
            if (!isMsgReadOnly) {
                const isPlanSelector = message && typeof message === 'object' && message.type === 'plan-selector';
                if (isPlanSelector) {
                    messageItem.classList.add('message-item--plan-selector');
                    messageItem.dataset.planSelector = 'true';
                    const planBtn = document.createElement('button');
                    planBtn.type = 'button';
                    planBtn.className = 'plan-select-btn';
                    planBtn.innerHTML = '<i class="fas fa-tag"></i> Selecionar Plano';
                    messageItem.appendChild(planBtn);
                } else {
                    messageItem.appendChild(createCopyButton());
                }
            }

            return messageItem;
        }

        function createTopicPanelHeader(topicName, count, readOnly = false, countLabel = null) {
            const topicHeader = document.createElement('div');
            topicHeader.className = 'topic-panel-header';
            let badge;
            if (readOnly) {
                badge = '<span class="topic-badge topic-badge--readonly"><i class="fas fa-eye"></i> Somente consulta</span>';
            } else if (countLabel) {
                badge = `<span class="topic-badge">${count} ${countLabel}</span>`;
            } else {
                badge = `<span class="topic-badge">${count} ${count === 1 ? 'script' : 'scripts'}</span>`;
            }
            topicHeader.innerHTML = `
                <h2>${topicName}</h2>
                ${badge}
            `;
            return topicHeader;
        }

        function createTopicNavItem(topicName) {
            const navItem = document.createElement('button');
            navItem.type = 'button';
            navItem.className = 'topics-nav-item';
            navItem.dataset.topicName = topicName;
            navItem.innerHTML = `<span class="topics-nav-label">${topicName}</span>`;
            return navItem;
        }

        function toggleNavGroup(group, { forceOpen = false, accordion = true } = {}) {
            if (!group) return;

            const willOpen = forceOpen || !group.classList.contains('is-open');

            if (accordion && willOpen) {
                topicsNav.querySelectorAll('.topics-nav-group.is-open').forEach(openGroup => {
                    if (openGroup !== group) openGroup.classList.remove('is-open');
                });
            }

            group.classList.toggle('is-open', willOpen);
            group.querySelector('.topics-nav-category-toggle')?.setAttribute('aria-expanded', String(willOpen));
        }

        function expandCategoryForTopic(topicName) {
            const navItem = Array.from(topicsNav.querySelectorAll('.topics-nav-item'))
                .find(item => item.dataset.topicName === topicName);
            if (!navItem) return;
            toggleNavGroup(navItem.closest('.topics-nav-group'), { forceOpen: true });
        }

        function renderActiveTopicPanel(topicName) {
            topicsContainer.querySelectorAll('.topic').forEach(topic => {
                const isActive = topic.dataset.topicName === topicName;
                topic.classList.toggle('is-selected', isActive);
                topic.hidden = !isActive;
            });
            topicsMain?.classList.toggle('is-welcome', isWelcomeVisible());
        }

        function selectTopic(topicName, { expandCategory = null } = {}) {
            if (!topicName) return;

            const shouldExpand = expandCategory ?? !isWelcomeVisible();
            selectedTopicName = topicName;
            renderActiveTopicPanel(topicName);

            if (topicsMain) {
                topicsMain.scrollTop = 0;
            }

            topicsNav.querySelectorAll('.topics-nav-item').forEach(navItem => {
                const isActive = navItem.dataset.topicName === topicName;
                navItem.classList.toggle('is-active', isActive);
                if (isActive) {
                    if (shouldExpand) expandCategoryForTopic(topicName);
                    navItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            });

            if (topicsPlaceholder) {
                topicsPlaceholder.hidden = Boolean(selectedTopicName) || isWelcomeVisible();
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
        }

        function copyPassword(text, triggerBtn = null) {
            navigator.clipboard.writeText(text).then(() => {
                const isIxcId = triggerBtn?.closest('.topic--ixc-reference');
                showToast({
                    type: 'success',
                    message: isIxcId ? `ID ${text} copiado!` : 'Senha copiada!',
                });
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

        function buildIxcReferenceTopic(topicName, content) {
            const topicDiv = document.createElement('div');
            topicDiv.className = 'topic topic--ixc-reference topic--passwords';
            topicDiv.dataset.topicName = topicName;

            const { messagesDiv, grid } = createMessagesContainer();
            let copyableCount = 0;

            content.sections.forEach(section => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'password-group';
                groupDiv.dataset.search = `${topicName} ${section.title || ''} ${section.text || ''}`.toLowerCase();

                const regionHeader = document.createElement('div');
                regionHeader.className = 'password-region-header';
                regionHeader.textContent = section.title;
                groupDiv.appendChild(regionHeader);

                if (section.description) {
                    const desc = document.createElement('p');
                    desc.className = 'ixc-section-desc';
                    desc.textContent = section.description;
                    groupDiv.appendChild(desc);
                }

                if (section.text) {
                    const textEl = document.createElement('div');
                    textEl.className = 'ixc-readonly-text';
                    textEl.textContent = section.text;
                    groupDiv.appendChild(textEl);
                }

                if (section.items?.length) {
                    const cardsContainer = document.createElement('div');
                    cardsContainer.className = 'password-cards';

                    section.items.forEach(item => {
                        copyableCount += 1;
                        groupDiv.dataset.search += ` ${item.label} ${item.copyValue}`.toLowerCase();
                        cardsContainer.appendChild(createPasswordCredCard(item.label, item.copyValue));
                    });

                    groupDiv.appendChild(cardsContainer);
                }

                grid.appendChild(groupDiv);
            });

            topicDiv.dataset.totalCount = copyableCount;
            const topicHeader = createTopicPanelHeader(topicName, copyableCount, false, copyableCount === 1 ? 'ID' : 'IDs');
            topicDiv.appendChild(topicHeader);
            topicDiv.appendChild(messagesDiv);

            return topicDiv;
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

        function createTopicNavGroup(category) {
            const group = document.createElement('div');
            group.className = 'topics-nav-group';
            group.dataset.categoryId = category.id;

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'topics-nav-category-toggle';
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = `
                <span class="topics-nav-category-label">
                    <i class="fas ${category.icon}"></i>
                    <span>${category.label}</span>
                </span>
                <i class="fas fa-chevron-down topics-nav-chevron" aria-hidden="true"></i>
            `;
            group.appendChild(toggle);

            const list = document.createElement('div');
            list.className = 'topics-nav-list';
            group.appendChild(list);

            return { group, list };
        }

        function buildTopicPanel(topicName, content) {
            if (isPasswordsContent(content)) {
                return buildPasswordTopic(topicName, content);
            }

            if (isIxcReferenceContent(content)) {
                return buildIxcReferenceTopic(topicName, content);
            }

            const readOnly = isReadOnlyTopic(topicName);
            const topicDiv = document.createElement('div');
            topicDiv.className = 'topic';
            if (readOnly) topicDiv.classList.add('topic--readonly');
            topicDiv.dataset.topicName = topicName;
            topicDiv.dataset.totalCount = content.length;

            const cards = content.map(message => createMessageCard(message, topicName, readOnly));
            const { messagesDiv } = createMessagesContainer(cards);
            const topicHeader = createTopicPanelHeader(topicName, content.length, readOnly);

            topicDiv.appendChild(topicHeader);
            topicDiv.appendChild(messagesDiv);
            return topicDiv;
        }

        function buildTopics() {
            if (topicsBuilt) return;

            const panelFragment = document.createDocumentFragment();
            const navFragment = document.createDocumentFragment();
            const assignedTopics = new Set();

            topicCategories.forEach(category => {
                const { group, list } = createTopicNavGroup(category);
                let groupHasTopics = false;

                category.topics.forEach(topicName => {
                    const content = getTopicContent(topicName);
                    if (!content || (!Array.isArray(content) && !isPasswordsContent(content) && !isIxcReferenceContent(content))) return;

                    assignedTopics.add(topicName);
                    groupHasTopics = true;

                    const topicDiv = buildTopicPanel(topicName, content);
                    panelFragment.appendChild(topicDiv);
                    list.appendChild(createTopicNavItem(topicName));
                });

                if (groupHasTopics) {
                    navFragment.appendChild(group);
                }
            });

            const uncategorized = [
                ...Object.keys(scriptData),
                ...Object.keys(ixcReferenceTopics),
            ].filter((name, index, all) => all.indexOf(name) === index && !assignedTopics.has(name));
            if (uncategorized.length > 0) {
                const { group, list } = createTopicNavGroup({
                    id: 'outros',
                    label: 'Outros',
                    icon: 'fa-folder',
                });

                uncategorized.forEach(topicName => {
                    const content = getTopicContent(topicName);
                    if (!Array.isArray(content) && !isPasswordsContent(content) && !isIxcReferenceContent(content)) return;

                    const topicDiv = buildTopicPanel(topicName, content);
                    panelFragment.appendChild(topicDiv);
                    list.appendChild(createTopicNavItem(topicName));
                });

                navFragment.appendChild(group);
            }

            topicsNav.appendChild(navFragment);
            topicsContainer.appendChild(panelFragment);

            topicsContainer.querySelectorAll('.topic').forEach(topic => {
                topic.hidden = true;
            });

            topicsContainer.addEventListener('click', handleTopicsClick);
            topicsNav.addEventListener('click', handleTopicsNavClick);
            topicsBuilt = true;
        }

        function handleTopicsNavClick(event) {
            const categoryToggle = event.target.closest('.topics-nav-category-toggle');
            if (categoryToggle) {
                toggleNavGroup(categoryToggle.closest('.topics-nav-group'));
                return;
            }

            const navItem = event.target.closest('.topics-nav-item');
            if (!navItem || navItem.classList.contains('is-filtered-out')) return;
            if (isWelcomeVisible()) dismissWelcome({ focusAttendant: false });
            selectTopic(navItem.dataset.topicName);
            closeMobileSidebar();
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

            const planSelectorBtn = event.target.closest('.plan-select-btn');
            if (planSelectorBtn) {
                event.stopPropagation();
                const card = planSelectorBtn.closest('[data-plan-selector]');
                if (card) openPlanSelector(Number(card.dataset.msgId));
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
            if (card && !card.classList.contains('message-item--readonly')) {
                const isPlanSelector = card.hasAttribute('data-plan-selector');
                if (isPlanSelector) {
                    openPlanSelector(Number(card.dataset.msgId));
                } else {
                    copyToClipboard(messageStore.get(Number(card.dataset.msgId)));
                }
            }
        }

        function filterTopics(searchTerm = '') {
            const normalizedTerm = searchTerm.trim().toLowerCase();
            let totalMessages = 0;
            let totalTopics = 0;

            const topicCounts = new Map();

            topicsContainer.querySelectorAll('.topic').forEach(topic => {
                const topicName = (topic.dataset.topicName || '').toLowerCase();
                const categoryName = topicCategoryMap.get(topic.dataset.topicName) || '';
                const topicMatches = !normalizedTerm ||
                    topicName.includes(normalizedTerm) ||
                    categoryName.includes(normalizedTerm);
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
            });

            topicsNav.querySelectorAll('.topics-nav-group').forEach(group => {
                const visibleItems = group.querySelectorAll('.topics-nav-item:not(.is-filtered-out)');
                const hasVisible = visibleItems.length > 0;
                group.classList.toggle('is-filtered-out', normalizedTerm && !hasVisible);
                if (normalizedTerm && hasVisible) {
                    toggleNavGroup(group, { forceOpen: true, accordion: false });
                }
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

            const btnMobileInternet = document.getElementById('btnMobileInternet');
            if (btnMobileInternet) {
                btnMobileInternet.addEventListener('click', () => {
                    if (isWelcomeVisible()) dismissWelcome({ focusAttendant: false });
                    selectTopic('📱 INTERNET MÓVEL');
                    closeMobileSidebar();
                    showToast({
                        type: 'info',
                        message: '📱 Internet Móvel',
                        subtext: 'Planos de internet móvel disponíveis.',
                        duration: 2000,
                    });
                });
            }

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

        // --- Plan Selector Modal ---
        const planSelectorOverlay = document.getElementById('planSelectorOverlay');
        const planSelectorBody = document.getElementById('planSelectorBody');
        const closePlanSelectorBtn = document.getElementById('closePlanSelector');
        let pendingPlanMsgId = null;

        function openPlanSelector(msgId) {
            pendingPlanMsgId = msgId;
            renderPlanOptions();
            planSelectorOverlay.hidden = false;
            planSelectorOverlay.classList.add('is-visible');
            planSelectorOverlay.setAttribute('aria-hidden', 'false');
        }

        function closePlanSelector() {
            planSelectorOverlay.classList.remove('is-visible');
            planSelectorOverlay.hidden = true;
            planSelectorOverlay.setAttribute('aria-hidden', 'true');
            pendingPlanMsgId = null;
        }

        function renderPlanOptions() {
            if (!planSelectorBody) return;
            planSelectorBody.innerHTML = '';

            Object.keys(PLAN_OPTIONS).forEach((city) => {
                const section = document.createElement('div');
                section.className = 'plan-city-section';

                const header = document.createElement('div');
                header.className = 'plan-city-header';
                header.textContent = city;
                section.appendChild(header);

                const grid = document.createElement('div');
                grid.className = 'plan-city-grid';

                PLAN_OPTIONS[city].forEach(plan => {
                    const card = document.createElement('div');
                    card.className = 'plan-option-card';
                    card.dataset.planVelocidade = plan.velocidade;
                    card.dataset.planPreVenc = plan.valorPreVenc;
                    card.dataset.planPosVenc = plan.valorPosVenc;

                    const showPosVenc = plan.valorPosVenc !== plan.valorPreVenc;

                    card.innerHTML = `
                        <div class="plan-option-name">${plan.velocidade}</div>
                        <div class="plan-option-price"><strong>${plan.valorPreVenc}/mês</strong> até o vencimento</div>
                        ${showPosVenc ? `<div class="plan-option-price"><span class="pos-venc">${plan.valorPosVenc}/mês</span> após vencimento</div>` : ''}
                    `;
                    card.addEventListener('click', () => handlePlanSelection(plan));
                    grid.appendChild(card);
                });

                section.appendChild(grid);
                planSelectorBody.appendChild(section);
            });
        }

        function handlePlanSelection(plan) {
            if (pendingPlanMsgId === null) return;

            const attendantNameInput = document.getElementById('attendantName');
            const attendantName = attendantNameInput.value.trim();

            if (!attendantName) {
                attendantNameInput.style.borderColor = '#ef4444';
                attendantNameInput.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
                attendantNameInput.focus();
                closePlanSelector();
                showToast({
                    type: 'error',
                    message: 'Nome do atendente obrigatório',
                    subtext: 'Preencha seu nome no menu lateral para copiar mensagens.',
                    duration: 3500,
                });
                return;
            }

            attendantNameInput.style.borderColor = '';
            attendantNameInput.style.boxShadow = '';

            const message = messageStore.get(pendingPlanMsgId);
            if (!message || typeof message !== 'object') return;

            const template = message.content || '';
            const valorCompleto = `${plan.valorPreVenc}/mês (pagando até o vencimento) / ${plan.valorPosVenc}/mês (após vencimento)`;

            let text = template
                .replace(/\[VELOCIDADE\]/g, plan.velocidade)
                .replace(/\[VALOR\]/g, valorCompleto);

            text = replaceVariables(text);

            trackMessageUsage(message);

            navigator.clipboard.writeText(text).then(() => {
                closePlanSelector();
                showToast({
                    type: 'success',
                    message: `Mensagem copiada! Plano ${plan.velocidade}`,
                    subtext: 'Cole no chat do cliente com Ctrl+V.',
                    duration: 3000,
                });
            }).catch(err => {
                console.error('Erro ao copiar:', err);
                showToast({
                    type: 'error',
                    message: 'Não foi possível copiar',
                    subtext: 'Verifique as permissões do navegador.',
                });
            });
        }

        if (closePlanSelectorBtn) {
            closePlanSelectorBtn.addEventListener('click', closePlanSelector);
        }

        if (planSelectorOverlay) {
            planSelectorOverlay.addEventListener('click', (e) => {
                if (e.target === planSelectorOverlay) closePlanSelector();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && planSelectorOverlay && !planSelectorOverlay.hidden) {
                closePlanSelector();
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
                const rows = [
                    item.withDiscount ? renderWalletRow(item.withDiscount, 'Com desconto') : '',
                    item.noDiscount ? renderWalletRow(item.noDiscount, 'Sem desconto') : '',
                ].filter(Boolean).join('');

                walletsHtml += `
                    <div class="support-card support-wallet-card">
                        <div class="support-card-title">${item.city}</div>
                        <div class="support-card-info support-wallet-card-info">
                            ${rows}
                        </div>
                    </div>
                `;
            });
            walletsHtml += '</div>';
            contentWallets.innerHTML = walletsHtml;

            let dueDatesHtml = '';

            dueDatesHtml += '<div class="support-section">';
            dueDatesHtml += '<div class="support-section-title"><span>📅</span> Filial 2 e 6</div>';
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
            dueDatesHtml += '<div class="support-section-title"><span>🔄</span> Filial 7, 8 (Muqui), 9 e 11</div>';
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

        // --- Highlight de busca ---
        function highlightText(text, term) {
            if (!term || !text) return text;
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedTerm})`, 'gi');
            return text.replace(regex, '<mark class="search-highlight">$1</mark>');
        }

        function clearSearchHighlights() {
            document.querySelectorAll('[data-original]').forEach(el => {
                el.textContent = el.dataset.original;
                el.removeAttribute('data-original');
            });
        }

        function applySearchHighlights(term) {
            clearSearchHighlights();
            if (!term) return;

            const visibleTexts = topicsContainer.querySelectorAll(
                '.message-text, .message-text-preview, .message-text-full, ' +
                '.message-title, .password-cred-label, ' +
                '.password-copy-value, .ixc-readonly-text, .ixc-section-desc, ' +
                '.password-region-header, .password-device-title'
            );

            visibleTexts.forEach(el => {
                if (el.closest('.is-filtered-out')) return;

                // Pula .message-text que tem estrutura truncada (filhos com spans de texto)
                if (el.classList.contains('message-text') &&
                    el.querySelector('.message-text-preview, .message-text-full')) return;

                // Pula elementos interativos (botões, etc)
                if (el.closest('.message-copy-btn, .password-copy-btn, .plan-select-btn, .message-toggle')) return;

                const text = el.textContent;
                if (!text || !text.trim()) return;

                el.dataset.original = text;
                el.innerHTML = highlightText(text, term);
            });
        }

        function handleSearch(term = '') {
            const normalizedTerm = term.trim();
            clearSearch.hidden = !normalizedTerm;

            const { totalMessages, totalTopics } = filterTopics(normalizedTerm);

            const hasResults = totalTopics > 0;
            emptyState.hidden = hasResults || !normalizedTerm;
            if (topicsPlaceholder) {
                topicsPlaceholder.hidden = Boolean(normalizedTerm) || Boolean(selectedTopicName) || isWelcomeVisible();
            }

            if (normalizedTerm) {
                searchResults.hidden = false;
                searchResults.textContent = totalTopics
                    ? `${totalMessages} resultado(s) em ${totalTopics} tópico(s)`
                    : 'Nenhum resultado encontrado';
            } else {
                searchResults.hidden = true;
            }

            applySearchHighlights(normalizedTerm);
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

        function initMobileSidebar() {
            const sidebar = document.getElementById('topicsSidebar');
            const overlay = document.getElementById('sidebarOverlay');
            const toggle = document.getElementById('sidebarToggle');
            const MOBILE_BP = 768;

            if (!sidebar || !overlay || !toggle) return;

            function isMobile() {
                return window.innerWidth <= MOBILE_BP;
            }

            function openSidebar() {
                if (!isMobile()) return;
                sidebar.classList.add('is-open');
                overlay.hidden = false;
                overlay.classList.add('is-visible');
                overlay.setAttribute('aria-hidden', 'false');
                toggle.setAttribute('aria-expanded', 'true');
                body.classList.add('sidebar-mobile-open');
            }

            function closeSidebar() {
                sidebar.classList.remove('is-open');
                overlay.classList.remove('is-visible');
                overlay.hidden = true;
                overlay.setAttribute('aria-hidden', 'true');
                toggle.setAttribute('aria-expanded', 'false');
                body.classList.remove('sidebar-mobile-open');
            }

            closeMobileSidebar = () => {
                if (isMobile()) closeSidebar();
            };

            toggle.addEventListener('click', () => {
                if (sidebar.classList.contains('is-open')) closeSidebar();
                else openSidebar();
            });

            overlay.addEventListener('click', closeSidebar);

            window.addEventListener('resize', () => {
                if (!isMobile()) closeSidebar();
            });

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && sidebar.classList.contains('is-open')) {
                    closeSidebar();
                }
            });
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
        initWelcomePanel();
        buildTopics();
        handleSearch();
        initMobileSidebar();
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
