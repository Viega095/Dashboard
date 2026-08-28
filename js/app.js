/* ==========================================
   HUB PERSONAL / STACK DASHBOARD ENGINE
   Full client-side, modular & customizable.
   ========================================== */

const app = {
    currentDate: new Date(),
    themes: ['dark', 'ocean', 'sunset', 'forest', 'ruby', 'amethyst', 'light'],
    taskFilter: 'all',
    activeSubjectId: null,
    activeAccountId: 'acc_main',
    habitYear: new Date().getFullYear(),
    habitMonth: new Date().getMonth(), // 0-indexed
    selectedNoteColorClass: 'note-card-green',

    // --- CAPA DE OPTIMIZACIÓN EXTREMA Y RENDIMIENTO RAM ---
    _memoryCache: {},
    _debounceTimers: {},

    getFromCache(key, fetcherFn) {
        if (this._memoryCache[key] !== undefined) {
            return this._memoryCache[key];
        }
        const data = fetcherFn();
        this._memoryCache[key] = data;
        return data;
    },

    invalidateCache(key) {
        delete this._memoryCache[key];
    },

    safeLocalStorageSet(key, value) {
        this.invalidateCache(key);
        try {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            return true;
        } catch (err) {
            console.warn(`[Storage Warning] Error guardando clave "${key}":`, err);
            this.showToast('Memoria Llena', 'El almacenamiento del navegador está al límite.', 'urgent');
            return false;
        }
    },

    debounce(key, func, wait = 180) {
        if (this._debounceTimers[key]) clearTimeout(this._debounceTimers[key]);
        this._debounceTimers[key] = setTimeout(() => {
            func();
            delete this._debounceTimers[key];
        }, wait);
    },

    escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // --- INITIALIZATION ---
    init() {
        this.loadSettings();
        this.renderUserProfile();
        this.checkOnboarding();
        this.initClock();
        this.initWeather();
        this.initQuotes();
        this.renderBookmarks();
        this.renderPresetBookmarks();
        this.initTareas();
        this.initFinanzas();
        this.initNotas();
        this.initHabitos();
        this.initFacultad();
        this.initHorario();
        this.initPomodoro();
        this.renderLobbyGlobalCalendar();
        this.updateLobbyStats();
        this.updateNotificationsUI();
        this.initKeyboardShortcuts();
        this.initCloudSync();
        this.initPopStateNavigation();
    },

    // --- SIDEBAR COLLAPSE & EXPAND LOGIC ---
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const caretIcon = document.getElementById('sidebar-caret-icon');
        if (!sidebar) return;

        if (window.innerWidth <= 768) {
            this.closeMobileSidebar();
            return;
        }

        const isCollapsed = sidebar.classList.toggle('collapsed');
        if (caretIcon) {
            caretIcon.className = isCollapsed ? 'ph ph-caret-right' : 'ph ph-caret-left';
        }

        const cfg = this.getConfig();
        cfg.sidebarCollapsed = isCollapsed;
        this.saveConfig(cfg);
    },

    expandSidebarIfCollapsed() {
        const sidebar = document.getElementById('sidebar');
        const caretIcon = document.getElementById('sidebar-caret-icon');
        if (sidebar && sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            if (caretIcon) caretIcon.className = 'ph ph-caret-left';
            const cfg = this.getConfig();
            cfg.sidebarCollapsed = false;
            this.saveConfig(cfg);
        }
    },

    tutorialCurrentStep: 0,
    tutorialTotalSteps: 6,

    // --- ONBOARDING & MINI TUTORIAL ---
    checkOnboarding() {
        const tutorialV2 = localStorage.getItem('userhub_tutorial_v2');
        if (!tutorialV2) {
            setTimeout(() => {
                this.openTutorialModal(0);
            }, 500);
        }
    },

    openTutorialModal(step = 0) {
        this.tutorialCurrentStep = step;
        this.renderTutorialStep(step);
        this.openModal('welcome-modal');
    },

    renderTutorialStep(step) {
        this.tutorialCurrentStep = step;
        
        for (let i = 0; i <= this.tutorialTotalSteps; i++) {
            const slide = document.getElementById(`tut-slide-${i}`);
            const dot = document.getElementById(`tut-dot-${i}`);
            if (slide) {
                if (i === step) slide.classList.add('active');
                else slide.classList.remove('active');
            }
            if (dot) {
                if (i === step) dot.classList.add('active');
                else dot.classList.remove('active');
            }
        }

        const prevBtn = document.getElementById('tut-prev-btn');
        const nextBtn = document.getElementById('tut-next-btn');

        if (prevBtn) {
            prevBtn.style.visibility = step > 0 ? 'visible' : 'hidden';
        }

        if (nextBtn) {
            if (step === this.tutorialTotalSteps) {
                nextBtn.innerHTML = '¡Comenzar! 🎉';
            } else if (step === 0) {
                nextBtn.innerHTML = 'Ver Mini Tutorial <i class="ph ph-caret-right"></i>';
            } else {
                nextBtn.innerHTML = 'Siguiente <i class="ph ph-caret-right"></i>';
            }
        }
    },

    nextTutorialStep() {
        if (this.tutorialCurrentStep < this.tutorialTotalSteps) {
            this.renderTutorialStep(this.tutorialCurrentStep + 1);
        } else {
            this.finishOnboarding();
        }
    },

    prevTutorialStep() {
        if (this.tutorialCurrentStep > 0) {
            this.renderTutorialStep(this.tutorialCurrentStep - 1);
        }
    },

    onboardingLoginGoogle() {
        localStorage.setItem('userhub_onboarded', 'true');
        localStorage.setItem('userhub_tutorial_v2', 'true');
        this.loginWithGoogle();
        this.renderTutorialStep(1);
    },

    onboardingContinueGuest() {
        localStorage.setItem('userhub_onboarded', 'true');
        localStorage.setItem('userhub_tutorial_v2', 'true');
        this.showToast('Modo Invitado', 'Sincronización por Código PIN activada.', 'info');
        this.renderTutorialStep(1);
    },

    finishOnboarding() {
        localStorage.setItem('userhub_onboarded', 'true');
        localStorage.setItem('userhub_tutorial_v2', 'true');
        this.closeModal('welcome-modal');
        this.showToast('¡Todo Listo!', 'Explora tu nuevo Dashboard.', 'success');
    },

    // --- SETTINGS & CONFIGURATION ---
    getConfig() {
        const saved = localStorage.getItem('userhub_config');
        if (!saved) return defaultUserConfig;
        try {
            return JSON.parse(saved);
        } catch(e) {
            return defaultUserConfig;
        }
    },

    saveConfig(cfg) {
        localStorage.setItem('userhub_config', JSON.stringify(cfg));
    },

    loadSettings() {
        const cfg = this.getConfig();
        
        const sidebar = document.getElementById('sidebar');
        const caretIcon = document.getElementById('sidebar-caret-icon');
        if (sidebar) {
            if (cfg.sidebarCollapsed) {
                sidebar.classList.add('collapsed');
                if (caretIcon) caretIcon.className = 'ph ph-caret-right';
            } else {
                sidebar.classList.remove('collapsed');
                if (caretIcon) caretIcon.className = 'ph ph-caret-left';
            }
        }

        const profile = this.getUserProfile();
        cfg.userName = profile.name;

        const greetingEl = document.getElementById('user-greeting');
        if (greetingEl) {
            greetingEl.textContent = `Hola, ${profile.name}`;
        }
        const sidebarUserEl = document.getElementById('sidebar-user-name');
        if (sidebarUserEl) {
            sidebarUserEl.textContent = profile.name;
        }
        const nameInput = document.getElementById('settings-name-input');
        if (nameInput) nameInput.value = profile.name;

        const bgUrlInput = document.getElementById('settings-bg-url-input');
        if (bgUrlInput) bgUrlInput.value = cfg.bgUrl || '';
        if (cfg.bgUrl && cfg.bgUrl.trim()) {
            document.body.style.backgroundImage = `url('${cfg.bgUrl.trim()}')`;
        } else {
            document.body.style.backgroundImage = '';
        }

        const opacityVal = cfg.bgOpacity !== undefined ? cfg.bgOpacity : 30;
        const opacityInput = document.getElementById('settings-bg-opacity-input');
        if (opacityInput) opacityInput.value = opacityVal;
        this.updateBgOpacity(opacityVal);

        document.documentElement.setAttribute('data-theme', cfg.theme || 'dark');
        const themeSelect = document.getElementById('settings-theme-select');
        if (themeSelect) themeSelect.value = cfg.theme || 'dark';

        const mods = cfg.activeModules || defaultUserConfig.activeModules;
        Object.keys(mods).forEach(modKey => {
            const toggleEl = document.getElementById(`toggle-mod-${modKey}`);
            if (toggleEl) toggleEl.checked = mods[modKey];

            const cardEl = document.getElementById(`card-${modKey}`);
            if (cardEl) {
                cardEl.style.display = mods[modKey] ? 'flex' : 'none';
            }
            const statEl = document.getElementById(`stat-card-${modKey}`);
            if (statEl) {
                statEl.style.display = mods[modKey] ? 'flex' : 'none';
            }
            const modSection = document.getElementById(`mod-${modKey}`);
            if (modSection) {
                modSection.style.display = mods[modKey] ? 'block' : 'none';
            }

            const sidebarBtn = document.getElementById(`sidebar-btn-${modKey}`);
            if (sidebarBtn) {
                sidebarBtn.style.display = mods[modKey] ? 'flex' : 'none';
            }
        });
    },

    openSettingsModal() {
        const cfg = this.getConfig();
        const opacityInput = document.getElementById('settings-bg-opacity-input');
        const opacityValText = document.getElementById('bg-opacity-val');
        const bgUrlInput = document.getElementById('settings-bg-url-input');

        const opVal = cfg.bgOpacity !== undefined ? cfg.bgOpacity : 70;
        if (opacityInput) opacityInput.value = opVal;
        if (opacityValText) opacityValText.textContent = `${opVal}%`;
        if (bgUrlInput) bgUrlInput.value = cfg.bgUrl || '';

        const mods = cfg.activeModules || {};
        ['facultad', 'gimnasio', 'tareas', 'finanzas', 'notas', 'horario', 'pomodoro'].forEach(modKey => {
            const toggleEl = document.getElementById(`toggle-mod-${modKey}`);
            if (toggleEl) toggleEl.checked = mods[modKey] !== false;
        });

        this.openModal('settings-modal');
    },

    updateCustomBgUrl(val) {
        const cfg = this.getConfig();
        cfg.bgUrl = val ? val.trim() : '';
        this.saveConfig(cfg);
        if (cfg.bgUrl) {
            document.body.style.backgroundImage = `url('${cfg.bgUrl}')`;
        } else {
            document.body.style.backgroundImage = '';
        }
    },

    updateBgOpacity(val) {
        const opacity = parseFloat(val) / 100;
        document.documentElement.style.setProperty('--bg-opacity', opacity);
        const valText = document.getElementById('bg-opacity-val');
        if (valText) valText.textContent = `${val}%`;

        const cfg = this.getConfig();
        cfg.bgOpacity = parseInt(val, 10);
        this.saveConfig(cfg);
    },

    toggleModuleVisibility(modKey, isChecked) {
        const cfg = this.getConfig();
        cfg.activeModules = cfg.activeModules || {};
        cfg.activeModules[modKey] = isChecked;
        this.saveConfig(cfg);

        const cardEl = document.getElementById(`card-${modKey}`);
        if (cardEl) cardEl.style.display = isChecked ? 'flex' : 'none';

        const statEl = document.getElementById(`stat-card-${modKey}`);
        if (statEl) statEl.style.display = isChecked ? 'flex' : 'none';

        const sidebarBtn = document.getElementById(`sidebar-btn-${modKey}`);
        if (sidebarBtn) sidebarBtn.style.display = isChecked ? 'flex' : 'none';
    },

    resetDefaultData() {
        this.openConfirmModal('⚠️ ¿Restaurar Valores por Defecto?', 'Se borrarán todos tus datos personalizados (transacciones, notas, materias, tareas) y el dashboard volverá a su estado original.', () => {
            localStorage.clear();
            this.closeModal('settings-modal');
            this.showToast('Restauración Completa', 'Reiniciando con datos por defecto...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 800);
        });
    },

    saveSettingsFromModal() {
        this.closeModal('settings-modal');
        this.showToast('Configuración Guardada', 'Se aplicaron tus preferencias correctamente.', 'success');
    },

    setTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
    },

    cycleTheme() {
        const cfg = this.getConfig();
        const currentIdx = this.themes.indexOf(cfg.theme || 'dark');
        const nextTheme = this.themes[(currentIdx + 1) % this.themes.length];
        cfg.theme = nextTheme;
        this.saveConfig(cfg);
        this.loadSettings();
        this.showToast('Tema Cambiado', `Nuevo tema: ${nextTheme.toUpperCase()}`, 'info');
    },

    toggleMobileSidebar(e) {
        if (e) e.stopPropagation();
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('mobile-open');
    },

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
    },

    initPopStateNavigation() {
        // 1. Clic fuera de las tarjetas (en la sombra modal-overlay) para cerrar modal
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.id);
            }
        });

        // 2. Interceptación del botón físico / gesto de ir atrás en celulares
        window.addEventListener('popstate', (e) => {
            const openModals = Array.from(document.querySelectorAll('.modal-overlay')).filter(m => m.style.display === 'flex');
            if (openModals.length > 0) {
                const topModal = openModals[openModals.length - 1];
                this.closeModal(topModal.id, true);
                return;
            }

            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                this.closeMobileSidebar();
                return;
            }

            if (e.state && e.state.viewId) {
                this.navigateTo(e.state.viewId, true);
            } else {
                const activeView = document.querySelector('.view.active');
                if (activeView && activeView.id !== 'lobby-view') {
                    this.navigateTo('lobby', true);
                }
            }
        });
    },

    // --- NAVIGATION ---
    navigateTo(viewId, isFromPopState = false) {
        this.closeMobileSidebar();
        
        // Cerrar cualquier modal abierto si navegamos a una vista
        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.style.display === 'flex') {
                this.closeModal(m.id, true);
            }
        });

        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        const targetView = document.getElementById(`${viewId}-view`);
        if (targetView) {
            targetView.classList.add('active');
        } else {
            document.getElementById('lobby-view').classList.add('active');
        }

        document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`sidebar-btn-${viewId}`);
        if (activeBtn) activeBtn.classList.add('active');

        if (!isFromPopState && viewId !== 'lobby') {
            history.pushState({ viewId: viewId, type: 'view' }, '');
        }

        if (viewId === 'lobby') {
            this.renderLobbyGlobalCalendar();
            this.updateLobbyStats();
        } else if (viewId === 'facultad') {
            this.initFacultad();
        } else if (viewId === 'pomodoro') {
            this.updatePomodoroUI();
        }
    },

    // --- MODALS ENGINE & UNIVERSAL CONFIRMATION VIÑETA ---
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'flex';
        
        if (!modal.classList.contains('modal-active-pushed')) {
            modal.classList.add('modal-active-pushed');
            history.pushState({ modalId: modalId, type: 'modal' }, '');
        }
    },

    closeModal(modalId, isFromPopState = false) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'none';
        
        if (modal.classList.contains('modal-active-pushed')) {
            modal.classList.remove('modal-active-pushed');
            if (!isFromPopState && history.state && history.state.modalId === modalId) {
                history.back();
            }
        }
    },

    openConfirmModal(title, message, onConfirmCallback) {
        const titleEl = document.getElementById('confirm-modal-title');
        const msgEl = document.getElementById('confirm-modal-msg');
        const actionBtn = document.getElementById('confirm-modal-action-btn');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;
        if (actionBtn) {
            actionBtn.onclick = () => {
                this.closeModal('confirm-modal');
                if (typeof onConfirmCallback === 'function') onConfirmCallback();
            };
        }

        this.openModal('confirm-modal');
    },

    // --- TOAST NOTIFICATIONS (CON LÍMITE DE 2 TOASTS CONCURRENTES) ---
    updateSaveStatusIndicator() {
        const indicator = document.getElementById('save-status-indicator');
        if (indicator) {
            indicator.innerHTML = '<span style="color:#10b981; font-weight:600;">✓ Guardado</span>';
            indicator.style.opacity = '1';
            setTimeout(() => {
                if (indicator) indicator.style.opacity = '0.7';
            }, 1200);
        }
    },

    showToast(title, message, type = 'info', undoCallback = null) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const MAX_TOASTS = 2;
        while (container.children.length >= MAX_TOASTS) {
            container.removeChild(container.firstElementChild);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        const iconClass = type === 'success' ? 'ph-check-circle' : (type === 'urgent' ? 'ph-warning-circle' : 'ph-info');
        const colorStyle = type === 'success' ? '#34d399' : (type === 'urgent' ? '#f87171' : '#60a5fa');
        
        let undoBtnHTML = '';
        if (typeof undoCallback === 'function') {
            undoBtnHTML = `
                <button type="button" class="toast-undo-btn" style="background:rgba(255,255,255,0.14); border:1px solid rgba(255,255,255,0.25); color:#fff; font-size:0.75rem; font-weight:700; padding:0.25rem 0.55rem; border-radius:6px; cursor:pointer; margin-left:0.4rem; flex-shrink:0;">
                    ↩️ Deshacer
                </button>
            `;
        }

        toast.innerHTML = `
            <i class="ph-fill ${iconClass}" style="color:${colorStyle}; font-size:1.3rem; flex-shrink:0;"></i>
            <div style="flex:1;">
                <strong style="font-size:0.85rem; display:block; line-height:1.2;">${title}</strong>
                <span style="font-size:0.78rem; color:var(--text-muted); line-height:1.3;">${message}</span>
            </div>
            ${undoBtnHTML}
            <button style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:0.9rem; padding:0 0 0 0.5rem; opacity:0.6;" onclick="event.stopPropagation(); this.closest('.toast').remove();" title="Cerrar"><i class="ph ph-x"></i></button>
        `;

        if (typeof undoCallback === 'function') {
            const undoBtn = toast.querySelector('.toast-undo-btn');
            if (undoBtn) {
                undoBtn.onclick = (e) => {
                    e.stopPropagation();
                    toast.remove();
                    undoCallback();
                };
            }
        } else {
            toast.onclick = () => {
                toast.classList.add('toast-fade-out');
                setTimeout(() => toast.remove(), 200);
            };
        }

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('toast-fade-out');
                setTimeout(() => toast.remove(), 250);
            }
        }, typeof undoCallback === 'function' ? 5000 : 2600);
    },

    // --- BOOKMARKS / ACCESOS RÁPIDOS ---
    getBookmarks() {
        const saved = localStorage.getItem('userhub_bookmarks');
        if (!saved) return defaultBookmarks;
        try {
            return JSON.parse(saved);
        } catch(e) {
            return defaultBookmarks;
        }
    },

    saveBookmarks(list) {
        localStorage.setItem('userhub_bookmarks', JSON.stringify(list));
        this.renderBookmarks();
    },

    renderBookmarks() {
        const container = document.getElementById('bookmarks-container');
        if (!container) return;

        const list = this.getBookmarks();
        container.innerHTML = '';

        list.forEach(bm => {
            const item = document.createElement('a');
            item.className = 'bookmark-item glass-effect';
            item.href = bm.url;
            item.target = '_blank';
            item.rel = 'noopener noreferrer';
            
            item.innerHTML = `
                <i class="ph-fill ${bm.icon || 'ph-globe'} bookmark-icon"></i>
                <span class="bookmark-name">${bm.name}</span>
                <button class="bookmark-del-btn" onclick="app.deleteBookmark(event, '${bm.id}')" title="Eliminar"><i class="ph ph-trash"></i></button>
            `;
            container.appendChild(item);
        });

        const addCard = document.createElement('div');
        addCard.className = 'bookmark-item bookmark-add-card glass-effect';
        addCard.onclick = () => this.openModal('add-bookmark-modal');
        addCard.innerHTML = `
            <i class="ph ph-plus" style="font-size:1.8rem; color:var(--text-muted);"></i>
            <span class="bookmark-name" style="color:var(--text-muted);">Añadir Nuevo</span>
        `;
        container.appendChild(addCard);
    },

    renderPresetBookmarks() {
        const container = document.getElementById('preset-bookmarks-container');
        if (!container) return;

        container.innerHTML = '';
        presetBookmarksList.forEach(preset => {
            const chip = document.createElement('button');
            chip.className = 'preset-chip';
            chip.onclick = () => this.addPresetBookmark(preset);
            chip.innerHTML = `<i class="ph-fill ${preset.icon}"></i> ${preset.name}`;
            container.appendChild(chip);
        });
    },

    addPresetBookmark(preset) {
        const list = this.getBookmarks();
        if (list.some(b => b.name.toLowerCase() === preset.name.toLowerCase())) {
            this.showToast('Acceso Existente', `"${preset.name}" ya está en tus accesos.`, 'info');
            return;
        }
        list.push({
            id: 'bm_' + Date.now(),
            name: preset.name,
            url: preset.url,
            icon: preset.icon
        });
        this.saveBookmarks(list);
        this.closeModal('add-bookmark-modal');
        this.showToast('Acceso Añadido', `Se agregó ${preset.name} a tu dashboard.`, 'success');
    },

    saveCustomBookmark() {
        const nameInput = document.getElementById('bm-name-input');
        const urlInput = document.getElementById('bm-url-input');

        const name = nameInput ? nameInput.value.trim() : '';
        let url = urlInput ? urlInput.value.trim() : '';

        if (!name || !url) {
            alert('Por favor ingresa un nombre y una URL válida.');
            return;
        }

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const list = this.getBookmarks();
        list.push({
            id: 'bm_' + Date.now(),
            name: name,
            url: url,
            icon: 'ph-globe'
        });

        this.saveBookmarks(list);
        if (nameInput) nameInput.value = '';
        if (urlInput) urlInput.value = '';
        this.closeModal('add-bookmark-modal');
        this.showToast('Acceso Añadido', `Se guardó "${name}" correctamente.`, 'success');
    },

    deleteBookmark(e, id) {
        e.preventDefault();
        e.stopPropagation();
        
        this.openConfirmModal('¿Eliminar Acceso Rápido?', '¿Deseas remover este marcador de tu dashboard?', () => {
            let list = this.getBookmarks();
            list = list.filter(b => b.id !== id);
            this.saveBookmarks(list);
            this.showToast('Eliminado', 'Acceso rápido removido.', 'info');
        });
    },

    // --- BACKUP & DATA MANAGEMENT ---
    exportBackupJSON() {
        const exportDataObj = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('userhub_')) {
                exportDataObj[key] = localStorage.getItem(key);
            }
        }
        
        const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportDataObj, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `hub_personal_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        
        this.showToast('Copia Descargada', 'Se ha guardado tu archivo de respaldo .json', 'success');
    },

    importBackupJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonObj = JSON.parse(e.target.result);
                let itemsImported = 0;
                
                for (const key in jsonObj) {
                    if (key.startsWith('userhub_')) {
                        localStorage.setItem(key, jsonObj[key]);
                        itemsImported++;
                    }
                }

                if (itemsImported > 0) {
                    alert(`¡Respaldo importado con éxito! Se restauraron ${itemsImported} módulos de datos. La página se actualizará.`);
                    location.reload();
                } else {
                    alert('El archivo cargado no contiene datos de respaldo válidos para este dashboard (prefijo userhub_).');
                }
            } catch (err) {
                alert('Error al leer el archivo JSON. Verifica que sea un archivo de respaldo válido.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    },

    resetAllData() {
        this.openConfirmModal('⚠️ Restablecer Dashboard', '¿ESTÁS SEGURO? Esto borrará todas tus notas, tareas, hábitos y finanzas guardadas en este navegador.', () => {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('userhub_')) keysToRemove.push(key);
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            location.reload();
        });
    },

    // --- POMODORO ENGINE (FIXED SVG & TIMER WITH QUICK ADJUST) ---
    pomoState: {
        timeLeft: 20 * 60,
        totalTime: 20 * 60,
        timerId: null,
        mode: 'work',
        isPaused: false
    },

    initPomodoro() {
        this.updatePomodoroUI();
    },

    setPomodoroPreset(mode, minutes) {
        if (this.pomoState.timerId) {
            clearInterval(this.pomoState.timerId);
            this.pomoState.timerId = null;
        }

        this.pomoState.mode = mode;
        this.pomoState.timeLeft = minutes * 60;
        this.pomoState.totalTime = minutes * 60;
        this.pomoState.isPaused = false;

        const toggleBtn = document.getElementById('pomo-toggle-btn');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="ph ph-play"></i> INICIAR';

        this.updatePomodoroUI();
        const modeTitle = mode === 'work' ? `Enfoque (${minutes}m)` : `Descanso (${minutes}m)`;
        this.showToast('Modo Ajustado', `Cambiaste a ${modeTitle}`, 'info');
    },

    adjustPomodoroTime(minutesDelta) {
        const secondsDelta = minutesDelta * 60;
        let newTimeLeft = this.pomoState.timeLeft + secondsDelta;

        if (newTimeLeft <= 0) {
            newTimeLeft = 0;
            this.pomoState.timeLeft = 0;
            if (this.pomoState.timerId) {
                clearInterval(this.pomoState.timerId);
                this.pomoState.timerId = null;
            }
            const toggleBtn = document.getElementById('pomo-toggle-btn');
            if (toggleBtn) toggleBtn.innerHTML = '<i class="ph ph-play"></i> INICIAR';

            this.updatePomodoroUI();
            this.showToast('¡Tiempo Finalizado!', 'El temporizador ha llegado a 00:00.', 'success');
            return;
        }

        this.pomoState.timeLeft = newTimeLeft;
        if (newTimeLeft > this.pomoState.totalTime) {
            this.pomoState.totalTime = newTimeLeft;
        }

        this.updatePomodoroUI();
        this.showToast('Tiempo Ajustado', `${minutesDelta > 0 ? '+' : ''}${minutesDelta} min`, 'info');
    },

    togglePomodoro() {
        const toggleBtn = document.getElementById('pomo-toggle-btn');
        const barDisplay = document.getElementById('pomo-bar-display');

        if (this.pomoState.timerId) {
            clearInterval(this.pomoState.timerId);
            this.pomoState.timerId = null;
            this.pomoState.isPaused = true;

            if (toggleBtn) toggleBtn.innerHTML = '<i class="ph ph-play"></i> REANUDAR';
            this.showToast('Pomodoro en Pausa', 'El temporizador está detenido.', 'info');
        } else {
            if (barDisplay) barDisplay.style.display = 'inline';
            this.pomoState.isPaused = false;

            this.pomoState.timerId = setInterval(() => this.tickPomodoro(), 1000);
            if (toggleBtn) toggleBtn.innerHTML = '<i class="ph ph-pause"></i> PAUSAR';
            this.showToast('Pomodoro Activo', '¡A mantener la concentración!', 'success');
        }
        this.updatePomodoroUI();
    },

    tickPomodoro() {
        this.pomoState.timeLeft--;

        if (this.pomoState.timeLeft <= 0) {
            this.pomoState.timeLeft = 0;
            clearInterval(this.pomoState.timerId);
            this.pomoState.timerId = null;

            this.playZenBell();

            if (this.pomoState.mode === 'work') {
                this.pomoState.mode = 'break';
                this.pomoState.timeLeft = 5 * 60;
                this.pomoState.totalTime = 5 * 60;
                this.showToast('¡Tiempo Cumplido!', 'Inicia descanso corto de 5 minutos.', 'success');
            } else {
                this.pomoState.mode = 'work';
                this.pomoState.timeLeft = 20 * 60;
                this.pomoState.totalTime = 20 * 60;
                this.showToast('Descanso Terminado', 'Volvemos a enfocar por 20 minutos.', 'info');
            }

            const toggleBtn = document.getElementById('pomo-toggle-btn');
            if (toggleBtn) toggleBtn.innerHTML = '<i class="ph ph-play"></i> INICIAR';
        }
        this.updatePomodoroUI();
    },

    resetPomodoro() {
        if (this.pomoState.timerId) {
            clearInterval(this.pomoState.timerId);
            this.pomoState.timerId = null;
        }

        const mins = this.pomoState.mode === 'work' ? 20 : 5;
        this.pomoState.timeLeft = mins * 60;
        this.pomoState.totalTime = mins * 60;
        this.pomoState.isPaused = false;

        const toggleBtn = document.getElementById('pomo-toggle-btn');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="ph ph-play"></i> INICIAR';

        this.updatePomodoroUI();
        this.showToast('Pomodoro Reiniciado', 'Listo para una nueva sesión.', 'info');
    },

    updatePomodoroUI() {
        const safeTime = Math.max(0, this.pomoState.timeLeft);
        const mins = Math.floor(safeTime / 60);
        const secs = safeTime % 60;
        const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const barDisplay = document.getElementById('pomo-bar-display');
        if (barDisplay) barDisplay.textContent = timeFormatted;

        const mainDisplay = document.getElementById('pomo-main-display');
        if (mainDisplay) mainDisplay.textContent = timeFormatted;

        const modeLabel = document.getElementById('pomo-mode-label');
        if (modeLabel) {
            if (this.pomoState.mode === 'work') modeLabel.textContent = `🎯 SESIÓN DE CONCENTRACIÓN (${Math.round((this.pomoState.totalTime||1200)/60)} MIN)`;
            else modeLabel.textContent = `☕ TIEMPO DE DESCANSO (${Math.round((this.pomoState.totalTime||300)/60)} MIN)`;
        }

        document.querySelectorAll('.pomo-mode-btn').forEach(btn => btn.classList.remove('active'));
        let activeBtnId = 'pomo-mode-work20';
        const totalMins = Math.round((this.pomoState.totalTime || 1200) / 60);
        if (totalMins === 20) activeBtnId = 'pomo-mode-work20';
        else if (totalMins === 10 && this.pomoState.mode === 'work') activeBtnId = 'pomo-mode-work10';
        else if (totalMins === 5) activeBtnId = 'pomo-mode-break5';
        else if (totalMins === 10 && this.pomoState.mode !== 'work') activeBtnId = 'pomo-mode-break10';
        
        const activeBtn = document.getElementById(activeBtnId);
        if (activeBtn) activeBtn.classList.add('active');

        const circle = document.querySelector('.progress-ring__circle');
        if (circle) {
            const radius = 105;
            const circumference = radius * 2 * Math.PI; // ~659.734
            circle.style.strokeDasharray = `${circumference} ${circumference}`;

            const total = this.pomoState.totalTime || (20 * 60);
            const ratio = Math.max(0, Math.min(1, safeTime / total));
            const offset = circumference - (ratio * circumference);
            circle.style.strokeDashoffset = isNaN(offset) ? 0 : offset;
        }
    },

    // --- AUDIO ENGINE ---
    lofiAudio: null,

    toggleLoFi() {
        const btn = document.getElementById('lofi-btn');
        if (!this.lofiAudio) {
            this.lofiAudio = new Audio('https://stream.zeno.fm/0r0xa792kwzuv');
            this.lofiAudio.volume = 0.3;
        }

        if (this.lofiAudio.paused) {
            this.lofiAudio.play().then(() => {
                if (btn) btn.classList.add('active');
                this.showToast('Lo-Fi Radio', 'Reproduciendo transmisión en vivo.', 'success');
            }).catch(e => {
                this.showToast('Audio Bloqueado', 'El navegador requiere interactuar primero.', 'urgent');
            });
        } else {
            this.lofiAudio.pause();
            if (btn) btn.classList.remove('active');
            this.showToast('Lo-Fi Pausado', 'Transmisión de música detenida.', 'info');
        }
    },

    // --- AMBIENT SOUNDS ENGINE ---
    ambientAudio: {},
    audioCtx: null,
    brownNoiseNode: null,
    brownNoiseGain: null,

    toggleAmbientSound(soundKey) {
        const btn = document.getElementById(`ambient-btn-${soundKey}`);
        
        // Si es Ruido Marrón (Síntesis local con Web Audio API)
        if (soundKey === 'brown') {
            if (this.brownNoiseNode) {
                try { this.brownNoiseNode.stop(); } catch(e) {}
                this.brownNoiseNode = null;
                if (btn) btn.classList.remove('active');
                this.showToast('Ruido Marrón', 'Desactivado.', 'info');
            } else {
                try {
                    if (!this.audioCtx) {
                        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    }
                    if (this.audioCtx.state === 'suspended') {
                        this.audioCtx.resume();
                    }
                    
                    const bufferSize = 4 * this.audioCtx.sampleRate;
                    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    let lastOut = 0.0;
                    
                    for (let i = 0; i < bufferSize; i++) {
                        const white = Math.random() * 2 - 1;
                        output[i] = (lastOut + (0.02 * white)) / 1.02;
                        lastOut = output[i];
                        output[i] *= 3.5;
                    }
                    
                    this.brownNoiseNode = this.audioCtx.createBufferSource();
                    this.brownNoiseNode.buffer = noiseBuffer;
                    this.brownNoiseNode.loop = true;
                    
                    this.brownNoiseGain = this.audioCtx.createGain();
                    const volVal = parseFloat(document.getElementById('ambient-volume-slider').value) / 100;
                    this.brownNoiseGain.gain.value = volVal * 0.15;
                    
                    this.brownNoiseNode.connect(this.brownNoiseGain);
                    this.brownNoiseGain.connect(this.audioCtx.destination);
                    
                    this.brownNoiseNode.start(0);
                    if (btn) btn.classList.add('active');
                    this.showToast('Ruido Marrón Activo', 'Generando señal de enfoque profundo offline.', 'success');
                } catch(err) {
                    this.showToast('Error de Audio', 'No se pudo iniciar el sintetizador.', 'urgent');
                }
            }
            return;
        }

        // Para sonidos basados en loops
        const urls = {
            rain: 'https://assets.mixkit.co/active_storage/sfx/2433/2433-84.wav',
            waves: 'https://assets.mixkit.co/active_storage/sfx/1188/1188-84.wav',
            cafe: 'https://assets.mixkit.co/active_storage/sfx/2839/2839-84.wav'
        };

        let audio = this.ambientAudio[soundKey];

        if (!audio) {
            audio = new Audio(urls[soundKey]);
            audio.loop = true;
            this.ambientAudio[soundKey] = audio;
        }

        const volVal = parseFloat(document.getElementById('ambient-volume-slider').value) / 100;
        audio.volume = volVal;

        if (audio.paused) {
            audio.play().then(() => {
                if (btn) btn.classList.add('active');
                const titles = { rain: 'Lluvia', waves: 'Olas', cafe: 'Cafetería' };
                this.showToast(`${titles[soundKey]} Activo`, 'Reproduciendo sonido de fondo.', 'success');
            }).catch(() => {
                this.showToast('Audio Bloqueado', 'Haz clic en la pantalla antes de activar.', 'urgent');
            });
        } else {
            audio.pause();
            if (btn) btn.classList.remove('active');
            const titles = { rain: 'Lluvia', waves: 'Olas', cafe: 'Cafetería' };
            this.showToast(`${titles[soundKey]} Detenido`, 'Sonido pausado.', 'info');
        }
    },

    setAmbientVolume(val) {
        const volVal = parseFloat(val) / 100;
        const display = document.getElementById('ambient-volume-val');
        if (display) display.textContent = `${val}%`;

        Object.keys(this.ambientAudio).forEach(key => {
            if (this.ambientAudio[key]) {
                this.ambientAudio[key].volume = volVal;
            }
        });

        if (this.brownNoiseGain) {
            this.brownNoiseGain.gain.value = volVal * 0.15;
        }
    },

    playZenBell() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 1.5);
            
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 2.0);
        } catch(e) {}
    },

    // --- WORKSPACE MODULES LOGIC ---

    // 1. TAREAS
    getTareasData() {
        return this.getFromCache('userhub_tareas', () => {
            const saved = localStorage.getItem('userhub_tareas');
            if (!saved) return defaultTareas;
            try { return JSON.parse(saved); } catch(e) { return defaultTareas; }
        });
    },

    saveTareasData(list) {
        this.safeLocalStorageSet('userhub_tareas', list);
        this.renderTareas();
        this.updateLobbyStats();
        this.updateNotificationsUI();
        this.triggerAutoCloudSync();
    },

    initTareas() {
        this.renderTareas();
    },

    renderTareas() {
        const container = document.getElementById('tasks-container');
        if (!container) return;

        const list = this.getTareasData();
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">No tienes tareas pendientes. ¡Añade una arriba!</p>';
            return;
        }

        list.forEach(task => {
            const item = document.createElement('div');
            item.className = `clean-task-item ${task.completed ? 'completed' : ''}`;
            
            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.9rem; cursor:pointer;" onclick="app.toggleTask('${task.id}')">
                    <i class="ph-fill ${task.completed ? 'ph-check-circle' : 'ph-circle'}" style="color:${task.completed ? '#10b981' : 'var(--text-muted)'}; font-size:1.5rem;"></i>
                    <span class="clean-task-text">${task.text}</span>
                </div>
                <button style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem; opacity:0.6; transition:0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" onclick="app.deleteTask('${task.id}')"><i class="ph ph-trash"></i></button>
            `;
            container.appendChild(item);
        });
    },

    openTaskModal() {
        const input = document.getElementById('modal-task-input');
        if (input) input.value = '';
        this.openModal('task-modal');
        setTimeout(() => { if (input) input.focus(); }, 150);
    },

    saveTaskFromModal() {
        const input = document.getElementById('modal-task-input');
        if (!input || !input.value.trim()) return;

        const list = this.getTareasData();
        list.push({
            id: 't_' + Date.now(),
            text: input.value.trim(),
            completed: false
        });

        this.saveTareasData(list);
        input.value = '';
        this.closeModal('task-modal');
        this.showToast('Tarea Creada', 'Añadida a tu lista.', 'success');
    },

    addTask() {
        const input = document.getElementById('new-task-input');
        if (!input || !input.value.trim()) return;

        const list = this.getTareasData();
        list.push({
            id: 't_' + Date.now(),
            text: input.value.trim(),
            completed: false
        });

        this.saveTareasData(list);
        input.value = '';
        this.showToast('Tarea Creada', 'Añadida a tu lista.', 'success');
    },

    toggleTask(id) {
        const list = this.getTareasData();
        const task = list.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTareasData(list);
        }
    },

    deleteTask(id) {
        let list = this.getTareasData();
        const deletedTask = list.find(t => t.id === id);
        if (!deletedTask) return;

        const deletedIndex = list.findIndex(t => t.id === id);
        list = list.filter(t => t.id !== id);
        this.saveTareasData(list);

        this.showToast('Tarea Eliminada', `"${this.escapeHTML(deletedTask.text)}" removida.`, 'info', () => {
            const currentList = this.getTareasData();
            currentList.splice(deletedIndex, 0, deletedTask);
            this.saveTareasData(currentList);
            this.showToast('Restaurado', 'Tarea recuperada.', 'success');
        });
    },

    // 2. FINANZAS (CON VIÑETAS MODALES Y FUSIÓN DE CUENTAS)
    finTransactionType: 'expense',

    setFinanceType(type) {
        this.finTransactionType = type;
        const expenseBtn = document.getElementById('fin-type-expense');
        const incomeBtn = document.getElementById('fin-type-income');

        if (type === 'expense') {
            if (expenseBtn) expenseBtn.className = 'fin-type-pill active-expense';
            if (incomeBtn) incomeBtn.className = 'fin-type-pill';
        } else {
            if (expenseBtn) expenseBtn.className = 'fin-type-pill';
            if (incomeBtn) incomeBtn.className = 'fin-type-pill active-income';
        }
    },

    getUserAccounts() {
        return this.getFromCache('userhub_accounts', () => {
            const saved = localStorage.getItem('userhub_accounts');
            const cfg = this.getConfig();
            const defaultAccName = cfg.userName ? `Finanzas de ${cfg.userName}` : 'Mi Cuenta Principal';
            
            if (!saved) {
                return [{ id: 'acc_main', name: defaultAccName }];
            }
            try {
                const list = JSON.parse(saved);
                if (list.length === 0) return [{ id: 'acc_main', name: defaultAccName }];
                return list;
            } catch(e) {
                return [{ id: 'acc_main', name: defaultAccName }];
            }
        });
    },

    saveUserAccounts(accs) {
        this.safeLocalStorageSet('userhub_accounts', accs);
        this.renderFinanzas();
    },

    saveUserAccountFromModal() {
        const input = document.getElementById('acc-name-input');
        const name = input ? input.value.trim() : '';

        if (!name) return;

        const accs = this.getUserAccounts();
        const newAcc = {
            id: 'acc_' + Date.now(),
            name: name
        };
        accs.push(newAcc);
        this.activeAccountId = newAcc.id;
        this.saveUserAccounts(accs);

        if (input) input.value = '';
        this.closeModal('add-account-modal');
        this.showToast('Cuenta Creada', `Cambiado a "${newAcc.name}".`, 'success');
    },

    deleteAccount(e, accId) {
        if (e) e.stopPropagation();

        const userAccs = this.getUserAccounts();
        if (userAccs.length <= 1) {
            this.showToast('No se puede eliminar', 'Debes mantener al menos 1 cuenta activa.', 'urgent');
            return;
        }

        const targetAcc = userAccs.find(a => a.id === accId);
        const accName = targetAcc ? targetAcc.name : 'esta cuenta';

        this.openConfirmModal(`¿Eliminar Cuenta "${accName}"?`, `Se eliminará la cuenta "${accName}" y todas sus transacciones asociadas. ¿Deseas continuar?`, () => {
            let accs = this.getUserAccounts();
            accs = accs.filter(a => a.id !== accId);

            accs.forEach(a => {
                if (a.linkedWith === accId) delete a.linkedWith;
            });

            localStorage.setItem('userhub_accounts', JSON.stringify(accs));

            const data = this.getFinanzasData();
            data.transactions = data.transactions.filter(t => (t.account || 'acc_main') !== accId);
            this.saveFinanzasData(data);

            if (this.activeAccountId === accId) {
                this.activeAccountId = accs[0].id;
            }

            this.renderFinanzas();
            this.showToast('Cuenta Eliminada', `Se eliminó "${accName}".`, 'info');
        });
    },

    openMergeAccountsModal() {
        this.openLinkAccountsModal();
    },

    openLinkAccountsModal() {
        const userAccs = this.getUserAccounts();
        if (userAccs.length < 2) {
            this.showToast('Mínimo 2 Cuentas', 'Necesitas al menos 2 cuentas creadas para vincularlas.', 'info');
            return;
        }

        const acc1Select = document.getElementById('link-acc1-select');
        const acc2Select = document.getElementById('link-acc2-select');

        if (acc1Select && acc2Select) {
            let acc1HTML = '';
            let acc2HTML = '';
            userAccs.forEach(acc => {
                acc1HTML += `<option value="${acc.id}">👤 ${acc.name}</option>`;
                acc2HTML += `<option value="${acc.id}">👤 ${acc.name}</option>`;
            });
            acc1Select.innerHTML = acc1HTML;
            acc2Select.innerHTML = acc2HTML;
            if (userAccs.length > 1) {
                acc2Select.selectedIndex = 1;
            }
        }

        this.openModal('link-accounts-modal');
    },

    executeAccountLink() {
        const acc1Select = document.getElementById('link-acc1-select');
        const acc2Select = document.getElementById('link-acc2-select');

        const acc1Id = acc1Select ? acc1Select.value : '';
        const acc2Id = acc2Select ? acc2Select.value : '';

        if (!acc1Id || !acc2Id) return;

        if (acc1Id === acc2Id) {
            this.showToast('Cuentas Iguales', 'Selecciona dos cuentas diferentes para vincular.', 'urgent');
            return;
        }

        const userAccs = this.getUserAccounts();
        const acc1 = userAccs.find(a => a.id === acc1Id);
        const acc2 = userAccs.find(a => a.id === acc2Id);

        if (acc1 && acc2) {
            acc1.linkedWith = acc2Id;
            acc2.linkedWith = acc1Id;

            localStorage.setItem('userhub_accounts', JSON.stringify(userAccs));
            this.renderFinanzas();
            this.closeModal('link-accounts-modal');
            this.showToast('Cuentas Vinculadas', `Se creó la Cuenta en Conjunto entre "${acc1.name}" y "${acc2.name}".`, 'success');
        }
    },

    unlinkAccounts() {
        this.openConfirmModal('⚠️ Desvincular Cuentas', '¿Deseas desconectar estas 2 cuentas? El panel de Cuenta en Conjunto se desactivará pero las transacciones de cada perfil permanecerán intactas.', () => {
            const userAccs = this.getUserAccounts();
            const currentAcc = userAccs.find(a => a.id === this.activeAccountId);
            if (currentAcc && currentAcc.linkedWith) {
                const otherAcc = userAccs.find(a => a.id === currentAcc.linkedWith);
                delete currentAcc.linkedWith;
                if (otherAcc) delete otherAcc.linkedWith;

                localStorage.setItem('userhub_accounts', JSON.stringify(userAccs));
                this.renderFinanzas();
                this.showToast('Cuentas Desvinculadas', 'Las 2 cuentas vuelven a ser independientes.', 'info');
            }
        });
    },

    switchActiveFinanceAccount(val) {
        if (val === '__add_new__') {
            const input = document.getElementById('acc-name-input');
            if (input) input.value = '';
            this.openModal('add-account-modal');
            setTimeout(() => { if (input) input.focus(); }, 150);
        } else {
            this.activeAccountId = val;
            this.renderFinanzas();
        }
    },

    getFinanzasData() {
        return this.getFromCache('userhub_finanzas', () => {
            const saved = localStorage.getItem('userhub_finanzas');
            if (!saved) return { budgetLimit: 50000, transactions: [] };
            try { return JSON.parse(saved); } catch(e) { return { budgetLimit: 50000, transactions: [] }; }
        });
    },

    saveFinanzasData(data) {
        this.safeLocalStorageSet('userhub_finanzas', data);
        this.renderFinanzas();
        this.updateLobbyStats();
        this.updateNotificationsUI();
        this.triggerAutoCloudSync();
    },

    setFinanceLayoutMode(mode) {
        localStorage.setItem('userhub_fin_layout', mode);
        this.applyFinanceLayoutMode(mode);
        this.showToast('Diseño Cambiado', mode === 'analytics' ? 'Activada vista con gráficos y reportes.' : 'Activada vista clásica limpia.', 'info');
    },

    applyFinanceLayoutMode(mode) {
        mode = mode || localStorage.getItem('userhub_fin_layout') || 'classic';
        const classicBtn = document.getElementById('fin-layout-btn-classic');
        const analyticsBtn = document.getElementById('fin-layout-btn-analytics');
        const analyticsPanel = document.getElementById('fin-analytics-panel');

        if (mode === 'analytics') {
            if (classicBtn) classicBtn.classList.remove('active');
            if (analyticsBtn) analyticsBtn.classList.add('active');
            if (analyticsPanel) analyticsPanel.style.display = 'block';
        } else {
            if (classicBtn) classicBtn.classList.add('active');
            if (analyticsBtn) analyticsBtn.classList.remove('active');
            if (analyticsPanel) analyticsPanel.style.display = 'none';
        }
    },

    initFinanzas() {
        const userAccs = this.getUserAccounts();
        if (!userAccs.some(a => a.id === this.activeAccountId)) {
            this.activeAccountId = userAccs[0].id;
        }
        this.applyFinanceLayoutMode();
        this.renderFinanzas();
    },

    saveBudgetLimitFromModal() {
        const input = document.getElementById('budget-limit-input');
        const val = input ? parseFloat(input.value) : 0;

        if (isNaN(val) || val < 0) return;

        const data = this.getFinanzasData();
        data.budgetLimit = val;
        this.saveFinanzasData(data);
        this.closeModal('set-budget-modal');
        this.showToast('Presupuesto Actualizado', `Límite guardado: $${val.toLocaleString()}`, 'success');
    },

    exportFinancesCSV() {
        const data = this.getFinanzasData();
        const activeTx = data.transactions.filter(t => (t.account || 'acc_main') === this.activeAccountId);

        if (activeTx.length === 0) {
            this.showToast('Sin Transacciones', 'No hay transacciones registradas para exportar.', 'urgent');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,\uFEFFFecha,Descripción,Monto,Método Pago,Categoría,Tipo,Compartida\n";
        activeTx.forEach(t => {
            csvContent += `"${t.date}","${t.desc.replace(/"/g, '""')}",${t.amount},"${t.method||'efectivo'}","${t.category||'otro'}","${t.type}","${t.shared ? 'Sí' : 'No'}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_finanzas_excel_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        this.showToast('Excel Descargado', 'Reporte exportado en formato compatible con Excel.', 'success');
    },

    openImportCSVModal() {
        const input = document.getElementById('fin-csv-file-input');
        if (input) input.value = '';
        this.openModal('import-csv-modal');
    },

    processFinanceCSVImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split(/\r\n|\n/);

                if (lines.length < 2) {
                    this.showToast('Archivo Vacío', 'El archivo no contiene suficientes filas de datos.', 'urgent');
                    return;
                }

                const data = this.getFinanzasData();
                let importedCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const cols = line.match(/(".*?"|[^",;]+)(?=\s*[,;]|\s*$)/g) || line.split(/[,;]/);
                    if (cols.length >= 3) {
                        const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
                        
                        const dateVal = cleanCols[0] || new Date().toLocaleDateString('es-AR');
                        const descVal = cleanCols[1] || 'Transacción Importada';
                        const amountVal = parseFloat(cleanCols[2].replace(/[^\d.-]/g, ''));

                        if (isNaN(amountVal) || amountVal <= 0) continue;

                        const methodVal = (cleanCols[3] || 'efectivo').toLowerCase();
                        const catVal = (cleanCols[4] || 'otro').toLowerCase();
                        const typeVal = (cleanCols[5] || 'expense').toLowerCase().includes('ingreso') || cleanCols[5] === 'income' ? 'income' : 'expense';

                        data.transactions.push({
                            id: 'f_' + Date.now() + '_' + i,
                            account: this.activeAccountId,
                            desc: descVal,
                            amount: amountVal,
                            method: methodVal.includes('mp') ? 'mp' : (methodVal.includes('banco') ? 'banco' : 'efectivo'),
                            category: catVal,
                            type: typeVal,
                            date: dateVal
                        });
                        importedCount++;
                    }
                }

                if (importedCount > 0) {
                    this.saveFinanzasData(data);
                    this.closeModal('import-csv-modal');
                    this.showToast('Importación Exitosa', `Se agregaron ${importedCount} transacciones a esta cuenta.`, 'success');
                } else {
                    this.showToast('Sin Datos Válidos', 'No se pudieron procesar las filas del archivo.', 'urgent');
                }
            } catch (err) {
                this.showToast('Error de Lectura', 'Hubo un error al procesar el archivo CSV.', 'urgent');
            }
            event.target.value = '';
        };
        reader.readAsText(file, 'UTF-8');
    },

    toggleAccountDropdown(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('account-dropdown-menu');
        if (menu) menu.classList.toggle('active');
    },

    openAddAccountFromMenu() {
        const menu = document.getElementById('account-dropdown-menu');
        if (menu) menu.classList.remove('active');
        const input = document.getElementById('acc-name-input');
        if (input) input.value = '';
        this.openModal('add-account-modal');
        setTimeout(() => { if (input) input.focus(); }, 150);
    },

    selectAccountFromMenu(accId) {
        const menu = document.getElementById('account-dropdown-menu');
        if (menu) menu.classList.remove('active');
        this.activeAccountId = accId;
        this.renderFinanzas();
    },

    renderFinanzas() {
        const data = this.getFinanzasData();
        const userAccs = this.getUserAccounts();

        if (!userAccs.some(a => a.id === this.activeAccountId)) {
            this.activeAccountId = userAccs[0].id;
        }

        const activeAcc = userAccs.find(a => a.id === this.activeAccountId) || userAccs[0];
        const linkedAcc = activeAcc.linkedWith ? userAccs.find(a => a.id === activeAcc.linkedWith) : null;

        const labelEl = document.getElementById('current-account-name-label');
        if (labelEl) {
            labelEl.textContent = activeAcc ? `${activeAcc.name}${linkedAcc ? ' 🔗' : ''}` : 'Mi Cuenta';
        }

        const listEl = document.getElementById('account-items-list');
        if (listEl) {
            let html = '';
            userAccs.forEach(acc => {
                const isActive = acc.id === this.activeAccountId;
                const isLinked = !!acc.linkedWith;
                const canDelete = userAccs.length > 1;
                html += `
                    <div style="display:flex; align-items:center; justify-content:space-between; width:100%; border-radius:10px; margin-bottom:0.25rem;">
                        <button type="button" class="account-menu-item ${isActive ? 'active' : ''}" style="flex:1;" onclick="app.selectAccountFromMenu('${acc.id}')">
                            <span>👤 ${acc.name}${isLinked ? ' <span style="font-size:0.75rem; color:#38bdf8;">🔗</span>' : ''}</span>
                            ${isActive ? '<i class="ph-bold ph-check" style="color:var(--accent);"></i>' : ''}
                        </button>
                        ${canDelete ? `
                            <button type="button" style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25); color:#ef4444; cursor:pointer; padding:0.35rem 0.55rem; border-radius:8px; margin-left:0.4rem; font-size:0.85rem;" title="Eliminar Cuenta '${acc.name}'" onclick="app.deleteAccount(event, '${acc.id}')">
                                <i class="ph ph-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                `;
            });
            listEl.innerHTML = html;
        }

        const linkBtn = document.getElementById('link-accounts-btn');
        if (linkBtn) {
            linkBtn.style.display = userAccs.length >= 2 ? 'inline-flex' : 'none';
        }

        // RENDER WIDGET CUENTA EN CONJUNTO Y CASILLA DE TRANSACCIÓN COMPARTIDA
        const sharedWrapper = document.getElementById('fin-shared-wrapper');
        if (sharedWrapper) {
            sharedWrapper.style.display = linkedAcc ? 'flex' : 'none';
        }

        const jointWidget = document.getElementById('shared-account-widget');
        if (jointWidget) {
            if (linkedAcc) {
                jointWidget.style.display = 'block';
                const titleEl = document.getElementById('joint-widget-title');
                if (titleEl) titleEl.textContent = `Cuenta en Conjunto (${activeAcc.name} + ${linkedAcc.name})`;

                const myTx = data.transactions.filter(t => (t.account || 'acc_main') === activeAcc.id);
                let myTotal = 0;
                myTx.forEach(t => {
                    myTotal += (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0));
                });

                const otherTx = data.transactions.filter(t => (t.account || 'acc_main') === linkedAcc.id);
                let otherTotal = 0;
                otherTx.forEach(t => {
                    otherTotal += (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0));
                });

                const jointTotal = myTotal + otherTotal;

                const totalEl = document.getElementById('joint-total-balance');
                const myEl = document.getElementById('joint-my-balance');
                const otherEl = document.getElementById('joint-other-balance');

                if (totalEl) totalEl.textContent = `$${jointTotal.toLocaleString()}`;
                if (myEl) myEl.textContent = `$${myTotal.toLocaleString()}`;
                if (otherEl) otherEl.textContent = `$${otherTotal.toLocaleString()}`;
            } else {
                jointWidget.style.display = 'none';
            }
        }

        const activeTx = data.transactions.filter(t => (t.account || 'acc_main') === this.activeAccountId);

        let cashBalance = 0;
        let mpBalance = 0;
        let bankBalance = 0;
        let totalExpensesMonth = 0;

        activeTx.forEach(t => {
            const method = t.method || 'efectivo';
            const amt = t.amount || 0;

            if (t.type === 'income') {
                if (method === 'mp') mpBalance += amt;
                else if (method === 'banco') bankBalance += amt;
                else cashBalance += amt;
            } else {
                totalExpensesMonth += amt;
                if (method === 'mp') mpBalance -= amt;
                else if (method === 'banco') bankBalance -= amt;
                else cashBalance -= amt;
            }
        });

        const totalBalance = cashBalance + mpBalance + bankBalance;

        const totalEl = document.getElementById('fin-total-balance');
        const cashEl = document.getElementById('fin-cash-balance');
        const mpEl = document.getElementById('fin-mp-balance');
        const bankEl = document.getElementById('fin-bank-balance');

        if (totalEl) totalEl.textContent = `$${totalBalance.toLocaleString()}`;
        if (cashEl) cashEl.textContent = `$${cashBalance.toLocaleString()}`;
        if (mpEl) mpEl.textContent = `$${mpBalance.toLocaleString()}`;
        if (bankEl) bankEl.textContent = `$${bankBalance.toLocaleString()}`;

        const budgetLimit = data.budgetLimit || 50000;
        const budgetPct = Math.min(Math.round((totalExpensesMonth / budgetLimit) * 100), 100);

        const statusText = document.getElementById('budget-status-text');
        const fillBar = document.getElementById('budget-progress-fill');

        if (statusText) statusText.textContent = `$${totalExpensesMonth.toLocaleString()} / $${budgetLimit.toLocaleString()} (${budgetPct}%)`;
        if (fillBar) {
            fillBar.style.width = `${budgetPct}%`;
            if (budgetPct >= 90) fillBar.style.background = '#ef4444';
            else if (budgetPct >= 70) fillBar.style.background = '#fbbf24';
            else fillBar.style.background = 'var(--accent)';
        }

        const budgetInput = document.getElementById('budget-limit-input');
        if (budgetInput) budgetInput.value = budgetLimit;

        // Renderizar Reportes & Gráficos Analíticos
        this.renderFinanceAnalytics(activeTx);

        const listContainer = document.getElementById('fin-transactions-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        if (activeTx.length === 0) {
            listContainer.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:1.5rem;">Sin transacciones registradas en esta cuenta.</p>';
            return;
        }

        const catIcons = {
            comida: 'ph-hamburger',
            transporte: 'ph-car',
            servicios: 'ph-lightning',
            ocio: 'ph-game-controller',
            trabajo: 'ph-briefcase',
            otro: 'ph-receipt'
        };

        const methodBadges = {
            efectivo: '<span class="badge" style="background:rgba(16,185,129,0.15); color:#10b981;">💵 Efectivo</span>',
            mp: '<span class="badge" style="background:rgba(6,182,212,0.15); color:#06b6d4;">📲 Mercado Pago</span>',
            banco: '<span class="badge" style="background:rgba(168,85,247,0.15); color:#a855f7;">🏦 Banco</span>'
        };

        activeTx.slice().reverse().forEach(t => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:rgba(255,255,255,0.04); margin-bottom:0.5rem; border-radius:8px;';
            const icon = catIcons[t.category] || 'ph-receipt';
            const methodBadge = methodBadges[t.method || 'efectivo'];
            const sharedBadge = t.shared ? '<span class="badge" style="background:rgba(56,189,248,0.15); color:#38bdf8;">👥 Compartida</span>' : '';

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <i class="ph-fill ${icon}" style="font-size:1.4rem; color:var(--accent);"></i>
                    <div>
                        <strong>${t.desc}</strong>
                        <div style="display:flex; gap:0.4rem; align-items:center; font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem; flex-wrap:wrap;">
                            <span>${t.date}</span> • ${methodBadge} ${sharedBadge} • <span>${t.category ? t.category.toUpperCase() : 'GENERAL'}</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <strong style="color:${t.type==='income'?'#10b981':'#ef4444'};">${t.type==='income'?'+':'-'}$${t.amount.toLocaleString()}</strong>
                    <button style="background:transparent; border:none; color:#ef4444; cursor:pointer;" onclick="app.deleteFinanceTransaction('${t.id}')"><i class="ph ph-trash"></i></button>
                </div>
            `;
            listContainer.appendChild(item);
        });
    },

    renderFinanceAnalytics(activeTx) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const monthLabel = document.getElementById('fin-analytics-month-label');
        if (monthLabel) monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        let totalIncome = 0;
        let totalExpense = 0;

        const categoryExpenses = {
            comida: { label: 'Comida / Alimentos', icon: '🍔', color: '#10b981', amount: 0 },
            transporte: { label: 'Transporte / Nafta', icon: '🚗', color: '#38bdf8', amount: 0 },
            servicios: { label: 'Servicios / Facturas', icon: '💡', color: '#fbbf24', amount: 0 },
            ocio: { label: 'Ocio / Salidas', icon: '🎮', color: '#c084fc', amount: 0 },
            trabajo: { label: 'Trabajo', icon: '💼', color: '#f43f5e', amount: 0 },
            otro: { label: 'Otro / Varios', icon: '📦', color: '#94a3b8', amount: 0 }
        };

        activeTx.forEach(t => {
            if (t.date) {
                const parts = t.date.split('/');
                if (parts.length === 3) {
                    const m = parseInt(parts[1], 10) - 1;
                    const y = parseInt(parts[2], 10);
                    if (m === currentMonth && y === currentYear) {
                        if (t.type === 'income') {
                            totalIncome += t.amount;
                        } else {
                            totalExpense += t.amount;
                            const catKey = (t.category || 'otro').toLowerCase();
                            if (categoryExpenses[catKey]) {
                                categoryExpenses[catKey].amount += t.amount;
                            } else {
                                categoryExpenses.otro.amount += t.amount;
                            }
                        }
                    }
                }
            }
        });

        // 1. Balance Bars
        const incomeValEl = document.getElementById('fin-chart-income-val');
        const expenseValEl = document.getElementById('fin-chart-expense-val');
        const incomeBarEl = document.getElementById('fin-chart-income-bar');
        const expenseBarEl = document.getElementById('fin-chart-expense-bar');
        const netValEl = document.getElementById('fin-chart-net-val');

        if (incomeValEl) incomeValEl.textContent = `+$${totalIncome.toLocaleString()}`;
        if (expenseValEl) expenseValEl.textContent = `-$${totalExpense.toLocaleString()}`;

        const maxVolume = Math.max(totalIncome, totalExpense, 1);
        if (incomeBarEl) incomeBarEl.style.width = `${Math.round((totalIncome / maxVolume) * 100)}%`;
        if (expenseBarEl) expenseBarEl.style.width = `${Math.round((totalExpense / maxVolume) * 100)}%`;

        const net = totalIncome - totalExpense;
        if (netValEl) {
            netValEl.textContent = `${net >= 0 ? '+' : ''}$${net.toLocaleString()}`;
            netValEl.style.color = net >= 0 ? '#10b981' : '#ef4444';
        }

        // 2. Donut Chart SVG & Categories Breakdown
        const svgEl = document.getElementById('fin-donut-svg');
        const breakdownList = document.getElementById('fin-cat-breakdown-list');
        const topCatEl = document.getElementById('fin-donut-top-cat');

        if (!svgEl || !breakdownList) return;

        breakdownList.innerHTML = '';
        svgEl.innerHTML = '';

        if (totalExpense === 0) {
            svgEl.innerHTML = `<circle cx="60" cy="60" r="45" fill="transparent" stroke="rgba(255,255,255,0.08)" stroke-width="14" />`;
            if (topCatEl) topCatEl.textContent = 'Sin gastos';
            breakdownList.innerHTML = '<p style="color:var(--text-muted); font-size:0.78rem; text-align:center; padding:1rem 0;">No hay gastos registrados en este mes.</p>';
            return;
        }

        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        let accumulatedPercent = 0;
        let highestCatName = '-';
        let highestCatAmount = -1;

        // Base circle
        svgEl.innerHTML = `<circle cx="60" cy="60" r="${radius}" fill="transparent" stroke="rgba(255,255,255,0.05)" stroke-width="14" />`;

        Object.keys(categoryExpenses).forEach(key => {
            const cat = categoryExpenses[key];
            if (cat.amount > 0) {
                const pct = cat.amount / totalExpense;
                const strokeDasharray = `${pct * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedPercent * circumference;

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', '60');
                circle.setAttribute('cy', '60');
                circle.setAttribute('r', `${radius}`);
                circle.setAttribute('fill', 'transparent');
                circle.setAttribute('stroke', cat.color);
                circle.setAttribute('stroke-width', '14');
                circle.setAttribute('stroke-dasharray', strokeDasharray);
                circle.setAttribute('stroke-dashoffset', `${strokeDashoffset}`);
                svgEl.appendChild(circle);

                accumulatedPercent += pct;

                if (cat.amount > highestCatAmount) {
                    highestCatAmount = cat.amount;
                    highestCatName = `${cat.icon} ${cat.label.split('/')[0]}`;
                }

                // Add to breakdown list
                const row = document.createElement('div');
                row.className = 'fin-cat-item-row';
                row.innerHTML = `
                    <span style="display:flex; align-items:center; color:var(--text-main);">
                        <span class="fin-cat-color-dot" style="background:${cat.color};"></span>
                        <span>${cat.icon} ${cat.label.split('/')[0]}</span>
                    </span>
                    <strong style="color:var(--text-muted); font-size:0.75rem;">$${cat.amount.toLocaleString()} (${Math.round(pct * 100)}%)</strong>
                `;
                breakdownList.appendChild(row);
            }
        });

        if (topCatEl) topCatEl.textContent = highestCatName;
    },

    toggleAddTransactionForm() {
        const body = document.getElementById('fin-add-form-body');
        const hint = document.getElementById('fin-add-hint-text');
        const caret = document.getElementById('fin-add-caret-icon');

        if (!body) return;

        const isHidden = body.style.display === 'none' || !body.style.display;
        if (isHidden) {
            body.style.display = 'block';
            if (hint) hint.textContent = '(Click para plegar)';
            if (caret) caret.className = 'ph ph-caret-up';
        } else {
            body.style.display = 'none';
            if (hint) hint.textContent = '(Click para desplegar)';
            if (caret) caret.className = 'ph ph-caret-down';
        }
    },

    toggleGlassSelectMenu(e, menuId) {
        if (e) e.stopPropagation();
        document.querySelectorAll('.custom-glass-select-menu').forEach(menu => {
            if (menu.id !== menuId) menu.classList.remove('active');
        });
        const targetMenu = document.getElementById(menuId);
        if (targetMenu) targetMenu.classList.toggle('active');
    },

    selectGlassOption(type, value, labelText) {
        if (type === 'method') {
            const input = document.getElementById('fin-method-input');
            const label = document.getElementById('fin-method-selected-label');
            if (input) input.value = value;
            if (label) label.textContent = labelText;

            const menu = document.getElementById('fin-method-menu');
            if (menu) {
                menu.querySelectorAll('.custom-glass-option').forEach(opt => opt.classList.remove('active'));
                menu.classList.remove('active');
            }
        } else if (type === 'cat') {
            const input = document.getElementById('fin-cat-input');
            const label = document.getElementById('fin-cat-selected-label');
            if (input) input.value = value;
            if (label) label.textContent = labelText;

            const menu = document.getElementById('fin-cat-menu');
            if (menu) {
                menu.querySelectorAll('.custom-glass-option').forEach(opt => opt.classList.remove('active'));
                menu.classList.remove('active');
            }
        }
    },

    addFinanceTransaction() {
        const descInput = document.getElementById('fin-desc-input');
        const amountInput = document.getElementById('fin-amount-input');
        const methodInput = document.getElementById('fin-method-input');
        const catInput = document.getElementById('fin-cat-input');
        const sharedCheckbox = document.getElementById('fin-shared-checkbox');

        const rawDesc = descInput ? descInput.value.trim() : '';
        const rawAmount = amountInput ? amountInput.value.toString().replace(/,/g, '.').replace(/[^\d.]/g, '') : '';
        const parsedAmount = parseFloat(rawAmount);

        if (!rawDesc || isNaN(parsedAmount) || parsedAmount <= 0) {
            this.showToast('Datos Incompletos', 'Ingresa una descripción y un monto numérico válido.', 'urgent');
            return;
        }

        const data = this.getFinanzasData();
        data.transactions.push({
            id: 'f_' + Date.now(),
            account: this.activeAccountId,
            desc: rawDesc,
            amount: parsedAmount,
            method: methodInput ? methodInput.value : 'efectivo',
            category: catInput ? catInput.value : 'otro',
            type: this.finTransactionType || 'expense',
            shared: sharedCheckbox ? sharedCheckbox.checked : false,
            date: new Date().toLocaleDateString('es-AR')
        });

        if (sharedCheckbox) sharedCheckbox.checked = false;

        this.saveFinanzasData(data);
        descInput.value = '';
        amountInput.value = '';
        this.showToast('Transacción Registrada', 'Saldo actualizado.', 'success');
    },

    deleteFinanceTransaction(id) {
        const data = this.getFinanzasData();
        const deletedTx = data.transactions.find(t => t.id === id);
        if (!deletedTx) return;

        data.transactions = data.transactions.filter(t => t.id !== id);
        this.saveFinanzasData(data);

        this.showToast('Transacción Borrada', `$${deletedTx.amount.toLocaleString()} removido.`, 'info', () => {
            const currentData = this.getFinanzasData();
            currentData.transactions.push(deletedTx);
            this.saveFinanzasData(currentData);
            this.showToast('Restaurado', 'Transacción recuperada.', 'success');
        });
    },

    // 3. NOTAS RÁPIDAS
    getNotasData() {
        return this.getFromCache('userhub_notas', () => {
            const saved = localStorage.getItem('userhub_notas');
            if (!saved) return defaultNotes;
            try { return JSON.parse(saved); } catch(e) { return defaultNotes; }
        });
    },

    saveNotasData(list) {
        this.safeLocalStorageSet('userhub_notas', list);
        this.renderNotas();
        this.triggerAutoCloudSync();
    },

    initNotas() {
        this.renderNotas();
    },

    renderNotas() {
        const container = document.getElementById('notes-cards-grid');
        if (!container) return;

        const list = this.getNotasData();
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding:2rem;">No tienes notas guardadas. ¡Haz clic en "+ Nueva Nota" para crear una!</p>';
            return;
        }

        const urlRegex = /(https?:\/\/[^\s]+)/g;

        list.forEach((note, idx) => {
            const card = document.createElement('div');
            const colorClass = note.colorClass || 'note-card-green';
            card.className = `note-card-glass ${colorClass}`;

            const formattedContent = (note.content || '').replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);

            card.innerHTML = `
                <div>
                    <div class="note-card-header">
                        <span class="note-card-title">${note.title || 'Sin Título'}</span>
                        <div style="display:flex; align-items:center; gap:0.4rem;">
                            <div class="note-reorder-btns">
                                <button class="note-reorder-btn" onclick="app.moveNote(${idx}, -1)" ${idx===0?'disabled style="opacity:0.3;"':''} title="Mover Izquierda/Arriba"><i class="ph ph-caret-left"></i></button>
                                <button class="note-reorder-btn" onclick="app.moveNote(${idx}, 1)" ${idx===list.length-1?'disabled style="opacity:0.3;"':''} title="Mover Derecha/Abajo"><i class="ph ph-caret-right"></i></button>
                            </div>
                            <button style="background:transparent; border:none; color:#ef4444; cursor:pointer; opacity:0.6; font-size:1rem;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" onclick="app.deleteNote('${note.id}')" title="Eliminar Nota"><i class="ph ph-trash"></i></button>
                        </div>
                    </div>
                    <div class="note-card-body">${formattedContent}</div>
                </div>
                <div class="note-card-footer">
                    <span>${note.date || new Date().toLocaleDateString('es-AR')}</span>
                    <button style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:0.85rem;" onclick="app.openNoteModal('${note.id}')"><i class="ph ph-pencil-simple"></i> Editar</button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    openNoteModal(id = null) {
        const titleModalEl = document.getElementById('note-modal-title');
        const idInput = document.getElementById('note-id-input');
        const titleInput = document.getElementById('note-title-input');
        const contentInput = document.getElementById('note-content-input');

        this.selectedNoteColorClass = 'note-card-green';
        this.updateNoteColorChipsUI('note-card-green');

        if (id) {
            const list = this.getNotasData();
            const note = list.find(n => n.id === id);
            if (note) {
                if (titleModalEl) titleModalEl.innerHTML = '<i class="ph ph-pencil-simple"></i> Editar Nota';
                if (idInput) idInput.value = note.id;
                if (titleInput) titleInput.value = note.title || '';
                if (contentInput) contentInput.value = note.content || '';
                this.selectedNoteColorClass = note.colorClass || 'note-card-green';
                this.updateNoteColorChipsUI(this.selectedNoteColorClass);
            }
        } else {
            if (titleModalEl) titleModalEl.innerHTML = '<i class="ph ph-note-pencil"></i> Nueva Nota';
            if (idInput) idInput.value = '';
            
            const draftTitle = localStorage.getItem('userhub_draft_note_title') || '';
            const draftContent = localStorage.getItem('userhub_draft_note_content') || '';
            if (titleInput) titleInput.value = draftTitle;
            if (contentInput) contentInput.value = draftContent;
        }

        if (titleInput && !titleInput._hasDraftListener) {
            titleInput._hasDraftListener = true;
            titleInput.addEventListener('input', () => {
                if (!document.getElementById('note-id-input').value) {
                    localStorage.setItem('userhub_draft_note_title', titleInput.value);
                }
            });
        }
        if (contentInput && !contentInput._hasDraftListener) {
            contentInput._hasDraftListener = true;
            contentInput.addEventListener('input', () => {
                if (!document.getElementById('note-id-input').value) {
                    localStorage.setItem('userhub_draft_note_content', contentInput.value);
                }
            });
        }

        this.openModal('note-modal');
        setTimeout(() => { if (titleInput) titleInput.focus(); }, 150);
    },

    selectNoteColor(btnEl) {
        const color = btnEl.getAttribute('data-color');
        if (color) {
            this.selectedNoteColorClass = color;
            this.updateNoteColorChipsUI(color);
        }
    },

    updateNoteColorChipsUI(colorClass) {
        document.querySelectorAll('.color-chip-btn').forEach(btn => {
            if (btn.getAttribute('data-color') === colorClass) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    saveNoteFromModal() {
        const idInput = document.getElementById('note-id-input');
        const titleInput = document.getElementById('note-title-input');
        const contentInput = document.getElementById('note-content-input');

        const id = idInput ? idInput.value : '';
        const title = titleInput ? titleInput.value.trim() : '';
        const content = contentInput ? contentInput.value.trim() : '';

        if (!title && !content) {
            this.showToast('Nota Vacía', 'Ingresa un título o contenido para la nota.', 'urgent');
            return;
        }

        localStorage.removeItem('userhub_draft_note_title');
        localStorage.removeItem('userhub_draft_note_content');

        const list = this.getNotasData();

        if (id) {
            const note = list.find(n => n.id === id);
            if (note) {
                note.title = title || 'Sin Título';
                note.content = content;
                note.colorClass = this.selectedNoteColorClass;
            }
        } else {
            list.unshift({
                id: 'n_' + Date.now(),
                title: title || 'Nueva Nota',
                content: content,
                date: new Date().toLocaleDateString('es-AR'),
                colorClass: this.selectedNoteColorClass
            });
        }

        this.saveNotasData(list);
        this.closeModal('note-modal');
        this.showToast('Nota Guardada', 'Se ha guardado en tus notas rápidas.', 'success');
    },

    moveNote(index, direction) {
        const list = this.getNotasData();
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= list.length) return;

        const temp = list[index];
        list[index] = list[targetIndex];
        list[targetIndex] = temp;

        this.saveNotasData(list);
    },

    deleteNote(id) {
        let list = this.getNotasData();
        const deletedNote = list.find(n => n.id === id);
        if (!deletedNote) return;

        const deletedIndex = list.findIndex(n => n.id === id);
        list = list.filter(n => n.id !== id);
        this.saveNotasData(list);

        this.showToast('Nota Eliminada', `"${this.escapeHTML(deletedNote.title)}" removida.`, 'info', () => {
            const currentList = this.getNotasData();
            currentList.splice(deletedIndex, 0, deletedNote);
            this.saveNotasData(currentList);
            this.showToast('Restaurado', 'Nota recuperada.', 'success');
        });
    },

    // 4. SEGUIMIENTO DE HÁBITOS (CON VIÑETA MODAL)
    getHabitosData() {
        return this.getFromCache('userhub_habitos', () => {
            const saved = localStorage.getItem('userhub_habitos');
            if (!saved) return defaultHabits;
            try { return JSON.parse(saved); } catch(e) { return defaultHabits; }
        });
    },

    saveHabitosData(data) {
        this.safeLocalStorageSet('userhub_habitos', data);
        this.renderHabitos();
        this.updateLobbyStats();
        this.updateNotificationsUI();
        this.triggerAutoCloudSync();
    },

    initHabitos() {
        this.renderHabitos();
    },

    navigateHabitMonth(delta) {
        this.habitMonth += delta;
        if (this.habitMonth > 11) {
            this.habitMonth = 0;
            this.habitYear++;
        } else if (this.habitMonth < 0) {
            this.habitMonth = 11;
            this.habitYear--;
        }
        this.renderHabitos();
    },

    calculateHabitsStreak() {
        const data = this.getHabitosData();
        let streak = 0;
        let d = new Date();

        while (true) {
            const dateStr = d.toISOString().slice(0, 10);
            let hasCompletedHabit = false;

            if (data.records[dateStr]) {
                hasCompletedHabit = Object.values(data.records[dateStr]).some(v => v === true);
            }

            if (hasCompletedHabit) {
streak++;
                d.setDate(d.getDate() - 1);
            } else {
                const todayStr = new Date().toISOString().slice(0, 10);
                if (dateStr === todayStr && streak === 0) {
                    d.setDate(d.getDate() - 1);
                    continue;
                }
                break;
            }
        }
        return streak;
    },

    scrollHabitMatrix(dir) {
        const container = document.getElementById('habits-matrix-container');
        if (container) {
            container.scrollBy({ left: dir * 220, behavior: 'smooth' });
        }
    },

    renderTodayHabitsChecklist() {
        const chipsContainer = document.getElementById('today-habits-chips-list');
        const progressLabel = document.getElementById('today-habits-progress-label');
        if (!chipsContainer) return;

        const data = this.getHabitosData();
        const todayStr = new Date().toISOString().slice(0, 10);
        chipsContainer.innerHTML = '';

        if (data.list.length === 0) {
            chipsContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; margin:0;">No tienes hábitos registrados aún. ¡Haz clic en "+ Añadir Hábito" abajo!</p>';
            if (progressLabel) progressLabel.textContent = '0 de 0 Completados (0%)';
            return;
        }

        let doneCount = 0;
        data.list.forEach(h => {
            const isDone = !!(data.records[todayStr] && data.records[todayStr][h.id]);
            if (isDone) doneCount++;

            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `today-habit-chip ${isDone ? 'done' : ''}`;
            chip.innerHTML = `
                <i class="ph-fill ${isDone ? 'ph-check-circle' : 'ph-circle'}"></i>
                <span>${h.name}</span>
            `;
            chip.onclick = () => this.toggleHabitMatrix(h.id, todayStr);
            chipsContainer.appendChild(chip);
        });

        const pct = Math.min(100, Math.round((doneCount / data.list.length) * 100));
        if (progressLabel) {
            progressLabel.textContent = `${doneCount} de ${data.list.length} Completados (${pct}%)`;
        }
    },

    renderHabitos() {
        const container = document.getElementById('habits-matrix-container');
        const monthLabel = document.getElementById('habits-month-label');
        const streakTitle = document.getElementById('streak-count-title');
        const perfectBadge = document.getElementById('perfect-days-badge');
        const leaderBadge = document.getElementById('consistent-habit-badge');

        if (!container) return;

        this.renderTodayHabitsChecklist();

        const streak = this.calculateHabitsStreak();
        if (streakTitle) {
            streakTitle.textContent = `Racha Actual: ${streak} Días Seguidos 🔥`;
        }

        const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        if (monthLabel) monthLabel.textContent = `${monthsNames[this.habitMonth]} ${this.habitYear}`;

        const data = this.getHabitosData();
        const daysInMonth = new Date(this.habitYear, this.habitMonth + 1, 0).getDate();

        if (data.list.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">No tienes hábitos registrados. ¡Haz clic en "+ Añadir Hábito"!</p>';
            if (perfectBadge) perfectBadge.textContent = '🎯 0 Días Perfectos';
            if (leaderBadge) leaderBadge.textContent = '🏆 Líder: -';
            return;
        }

        const realNow = new Date();
        const isCurrentRealMonth = (this.habitYear === realNow.getFullYear() && this.habitMonth === realNow.getMonth());
        const realTodayDay = realNow.getDate();

        const firstDayObj = new Date(this.habitYear, this.habitMonth, 1);
        const firstDayWeekday = (firstDayObj.getDay() + 6) % 7;

        let weeksHeaderHTML = '<th class="habit-name-cell" style="background:transparent; border:none;"></th>';
        let daysHeaderHTML = '<th class="habit-name-cell" style="background:transparent; border:none; font-size:0.75rem; color:var(--text-muted);">HÁBITOS DE HOY</th>';

        const totalWeeks = Math.ceil((daysInMonth + firstDayWeekday) / 7);
        for (let w = 1; w <= totalWeeks; w++) {
            weeksHeaderHTML += `<th colspan="7" class="week-separator" style="font-size:0.7rem; text-align:center; color:var(--text-muted); padding:0.3rem 0.1rem;">SEM ${w}</th>`;

            const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
            let weekDaysHTML = '';
            for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
                const dayNum = (w - 1) * 7 + dayIdx + 1 - firstDayWeekday;
                const isTodayHeader = isCurrentRealMonth && dayNum === realTodayDay;

                weekDaysHTML += `
                    <th class="${dayIdx===6?'week-separator':''} ${isTodayHeader?'day-header-today':''}" style="font-size:0.7rem; color:var(--text-muted); text-align:center; font-weight:600; width:34px;">
                        ${dayLetters[dayIdx]}
                    </th>
                `;
            }
            daysHeaderHTML += weekDaysHTML;
        }

        let perfectDaysCount = 0;
        const habitDoneCounts = {};
        data.list.forEach(h => { habitDoneCounts[h.id] = 0; });

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${this.habitYear}-${String(this.habitMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            let doneCountDay = 0;

            data.list.forEach(h => {
                if (data.records[dateStr] && data.records[dateStr][h.id]) {
                    doneCountDay++;
                    habitDoneCounts[h.id]++;
                }
            });

            if (doneCountDay === data.list.length && data.list.length > 0) {
                perfectDaysCount++;
            }
        }

        let maxDone = -1;
        let leaderHabitName = '-';
        data.list.forEach(h => {
            if (habitDoneCounts[h.id] > maxDone && habitDoneCounts[h.id] > 0) {
                maxDone = habitDoneCounts[h.id];
                leaderHabitName = h.name;
            }
        });

        if (perfectBadge) perfectBadge.textContent = `🎯 ${perfectDaysCount} Días Perfectos`;
        if (leaderBadge) leaderBadge.textContent = `🏆 Líder: ${leaderHabitName}`;

        let rowsHTML = '';
        data.list.forEach((habit, idx) => {
            const totalDoneMonth = habitDoneCounts[habit.id] || 0;
            let tilesHTML = '';

            for (let p = 0; p < firstDayWeekday; p++) {
                const isSundayCol = p % 7 === 6;
                tilesHTML += `<td style="text-align:center;" class="${isSundayCol?'week-separator':''}"><span class="habit-tile tile-empty-padding"></span></td>`;
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const colIdx = firstDayWeekday + (d - 1);
                const isSundayCol = colIdx % 7 === 6;
                const isTodayTile = isCurrentRealMonth && d === realTodayDay;

                const dateStr = `${this.habitYear}-${String(this.habitMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isDone = !!(data.records[dateStr] && data.records[dateStr][habit.id]);

                const colorClass = habit.color || (idx % 3 === 0 ? 'tile-blue' : (idx % 3 === 1 ? 'tile-purple' : 'tile-cyan'));
                let tileClass = isDone ? `habit-tile ${colorClass}` : 'habit-tile';
                if (isTodayTile) tileClass += ' tile-today';

                tilesHTML += `
                    <td style="text-align:center;" class="${isSundayCol?'week-separator':''}">
                        <span class="${tileClass}" title="Día ${d} ${isTodayTile?'(HOY)':''}: ${isDone?'Completado':'Pendiente'}" onclick="app.toggleHabitMatrix('${habit.id}', '${dateStr}')">
                            ${isDone ? '✓' : ''}
                        </span>
                    </td>
                `;
            }

            const totalCells = firstDayWeekday + daysInMonth;
            const remainingCells = (7 - (totalCells % 7)) % 7;
            for (let r = 0; r < remainingCells; r++) {
                const colIdx = totalCells + r;
                const isSundayCol = colIdx % 7 === 6;
                tilesHTML += `<td style="text-align:center;" class="${isSundayCol?'week-separator':''}"><span class="habit-tile tile-empty-padding"></span></td>`;
            }

            const pct = Math.min(100, Math.round((totalDoneMonth / daysInMonth) * 100));

            rowsHTML += `
                <tr>
                    <td class="habit-name-cell">
                        <span>${habit.name}</span>
                        <div style="display:flex; align-items:center; gap:0.3rem;">
                            <span class="habit-pct-badge">${pct}%</span>
                            <button style="background:transparent; border:none; color:#ef4444; cursor:pointer; opacity:0.5;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5" onclick="app.deleteHabit(event, '${habit.id}')"><i class="ph ph-trash"></i></button>
                        </div>
                    </td>
                    ${tilesHTML}
                </tr>
            `;
        });

        container.innerHTML = `
            <table class="habit-matrix-table">
                <thead>
                    <tr>${weeksHeaderHTML}</tr>
                    <tr>${daysHeaderHTML}</tr>
                </thead>
                <tbody>
                    ${rowsHTML}
                </tbody>
            </table>
        `;

        this.renderHabitsMonthlyChart();
    },

    toggleHabitMatrix(habitId, dateStr) {
        const data = this.getHabitosData();
        data.records[dateStr] = data.records[dateStr] || {};
        data.records[dateStr][habitId] = !data.records[dateStr][habitId];
        this.saveHabitosData(data);
    },

    renderHabitsMonthlyChart() {
        const container = document.getElementById('habits-monthly-chart');
        if (!container) return;

        const data = this.getHabitosData();
        const daysInMonth = new Date(this.habitYear, this.habitMonth + 1, 0).getDate();
        const numHabits = data.list.length;

        container.innerHTML = '';

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${this.habitYear}-${String(this.habitMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            let done = 0;
            if (data.records[dateStr]) {
                data.list.forEach(h => {
                    if (data.records[dateStr][h.id]) done++;
                });
            }

            const pct = numHabits > 0 ? Math.min(100, Math.round((done / numHabits) * 100)) : 0;
            const col = document.createElement('div');
            col.className = 'habit-chart-col';
            col.title = `Día ${d}: ${pct}% cumplido (${done} de ${numHabits})`;

            col.innerHTML = `
                <div class="habit-chart-bar" style="height:${pct}%; background:${pct>=80?'#10b981':(pct>=50?'#38bdf8':'#3b82f6')}"></div>
                <span style="font-size:0.65rem; color:var(--text-muted); margin-top:4px;">${d}</span>
            `;
            container.appendChild(col);
        }
    },

    saveHabitFromModal() {
        const input = document.getElementById('habit-name-input');
        const name = input ? input.value.trim() : '';

        if (!name) return;

        const colors = ['tile-blue', 'tile-purple', 'tile-cyan'];
        const data = this.getHabitosData();

        data.list.push({
            id: 'h_' + Date.now(),
            name: name,
            color: colors[data.list.length % colors.length]
        });

        this.saveHabitosData(data);
        if (input) input.value = '';
        this.closeModal('add-habit-modal');
        this.showToast('Hábito Creado', `Se añadió "${name}".`, 'success');
    },

    deleteHabit(e, id) {
        if (e) e.stopPropagation();
        
        const data = this.getHabitosData();
        const deletedHabit = data.list.find(h => h.id === id);
        if (!deletedHabit) return;

        data.list = data.list.filter(h => h.id !== id);
        this.saveHabitosData(data);

        this.showToast('Hábito Eliminado', `"${this.escapeHTML(deletedHabit.name)}" removido.`, 'info', () => {
            const currentData = this.getHabitosData();
            currentData.list.push(deletedHabit);
            this.saveHabitosData(currentData);
            this.showToast('Restaurado', 'Hábito recuperado.', 'success');
        });
    },

    // 5. ESTUDIO / FACULTAD (CON NAVEGACIÓN Y RESALTADO DE FECHAS SELECCIONADAS)
    getSubjectsData() {
        return this.getFromCache('userhub_subjects', () => {
            const saved = localStorage.getItem('userhub_subjects');
            if (!saved) return defaultSubjectsData;
            try { return JSON.parse(saved); } catch(e) { return defaultSubjectsData; }
        });
    },

    saveSubjectsData(list) {
        this.safeLocalStorageSet('userhub_subjects', list);
        this.initFacultad();
        this.renderLobbyGlobalCalendar();
        this.updateLobbyStats();
        this.updateNotificationsUI();
    },

    initFacultad() {
        const tabsContainer = document.getElementById('subjects-nav-tabs');
        const detailContainer = document.getElementById('subject-detail-container');
        if (!tabsContainer || !detailContainer) return;

        const subjects = this.getSubjectsData();
        tabsContainer.innerHTML = '';

        if (subjects.length === 0) {
            detailContainer.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:2.5rem;">No tienes materias guardadas. ¡Haz clic en "+ Añadir Materia" arriba!</p>';
            return;
        }

        if (!this.activeSubjectId || !subjects.some(s => s.id === this.activeSubjectId)) {
            this.activeSubjectId = subjects[0].id;
        }

        subjects.forEach(sub => {
            const tabBtn = document.createElement('button');
            tabBtn.className = `subject-tab-btn ${sub.id === this.activeSubjectId ? 'active' : ''}`;
            tabBtn.textContent = sub.name;
            tabBtn.onclick = () => {
                this.activeSubjectId = sub.id;
                this.initFacultad();
            };
            tabsContainer.appendChild(tabBtn);
        });

        const activeSub = subjects.find(s => s.id === this.activeSubjectId) || subjects[0];
        this.renderSubjectDetail(activeSub);
    },

    renderSubjectDetail(sub) {
        const detailContainer = document.getElementById('subject-detail-container');
        if (!detailContainer) return;

        const totalWeeks = sub.weeksCount || 16;
        const currentWeek = sub.currentWeek || 1;
        sub.weeksState = sub.weeksState || {};
        sub.events = sub.events || [];
        sub.grades = sub.grades || { p1: '', p2: '', tp: '' };

        let weekCardsHTML = '';
        for (let i = 1; i <= totalWeeks; i++) {
            const isDone = !!sub.weeksState[i];
            const isCurrent = i === currentWeek;

            weekCardsHTML += `
                <div class="facultad-week-card ${isDone ? 'completed' : ''} ${isCurrent ? 'current-week' : ''}" onclick="app.toggleWeekState('${sub.id}', ${i})">
                    ${isCurrent ? '<span class="current-week-badge">Semana actual</span>' : ''}
                    <div class="week-card-title">Semana ${i}</div>
                    <div class="week-card-status">
                        <i class="ph-fill ${isDone ? 'ph-check-circle' : 'ph-circle'}"></i>
                        <span>${isDone ? 'Completado' : 'Pendiente'}</span>
                    </div>
                </div>
            `;
        }

        let eventsHTML = '';
        if (sub.events.length === 0) {
            eventsHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No hay fechas importantes registradas.</p>';
        } else {
            sub.events.forEach((ev, idx) => {
                eventsHTML += `
                    <div class="important-date-card" id="event-card-${sub.id}-${idx}">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <strong style="font-size:0.9rem; color:var(--text-main);">${ev.title}</strong>
                            <button style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem; opacity:0.6;" onclick="app.deleteSubjectEvent('${sub.id}', ${idx})"><i class="ph ph-trash"></i></button>
                        </div>
                        <span style="font-size:0.78rem; color:var(--text-muted); display:flex; align-items:center; gap:0.3rem;">
                            <i class="ph ph-calendar"></i> ${ev.dates}
                        </span>
                    </div>
                `;
            });
        }

        const p1 = parseFloat(sub.grades.p1);
        const p2 = parseFloat(sub.grades.p2);
        const tp = parseFloat(sub.grades.tp);

        const validGrades = [p1, p2, tp].filter(g => !isNaN(g));
        let avgText = '-';
        let statusBadgeText = 'Ingresá tus notas para calcular el promedio.';
        let badgeColor = '#60a5fa';

        if (validGrades.length > 0) {
            const sum = validGrades.reduce((a, b) => a + b, 0);
            const avg = (sum / validGrades.length).toFixed(2);
            avgText = `${avg}`;

            if (avg >= 7) {
                statusBadgeText = `¡Excelente! Promedio ${avg} - 🏆 Promocionado`;
                badgeColor = '#10b981';
            } else if (avg >= 4) {
                statusBadgeText = `Promedio ${avg} - 👍 Aprobado para Final`;
                badgeColor = '#fbbf24';
            } else {
                statusBadgeText = `Promedio ${avg} - ⚠️ Insuficiente`;
                badgeColor = '#ef4444';
            }
        }

        let doneWeeksCount = 0;
        for (let i = 1; i <= totalWeeks; i++) {
            if (sub.weeksState[i]) doneWeeksCount++;
        }
        const progressPct = totalWeeks > 0 ? Math.min(Math.round((doneWeeksCount / totalWeeks) * 100), 100) : 0;

        detailContainer.innerHTML = `
            <!-- TARJETA CABECERA UNIFICADA DE MATERIA -->
            <div class="subject-header-card glass-effect">
                <div class="subject-card-top-row">
                    <div>
                        <span class="subject-badge-pill">🎓 Materia Activa</span>
                        <h2 class="subject-card-title">${sub.name}</h2>
                        <p class="subject-card-prof">
                            <i class="ph ph-chalkboard-teacher"></i> ${sub.professor || 'Cátedra / Profesor no especificado'}
                        </p>
                    </div>
                    <div class="subject-card-actions">
                        <button class="btn-cyan-pill" onclick="app.setSubjectCurrentWeekPrompt('${sub.id}', ${currentWeek})" title="Cambiar Semana Actual">
                            <i class="ph-fill ph-map-pin"></i> Semana Actual: ${currentWeek}
                        </button>
                        <button class="btn-icon-danger" onclick="app.deleteSubject('${sub.id}')" title="Eliminar Materia">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- BARRA DE PROGRESO PORCENTUAL DE LA MATERIA -->
                <div class="subject-progress-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.82rem; margin-bottom:0.45rem;">
                        <span style="color:var(--text-muted); font-weight:600;"><i class="ph ph-chart-line-up"></i> Progreso del Cursado</span>
                        <strong style="color:var(--accent); font-weight:700;">${progressPct}% (${doneWeeksCount} de ${totalWeeks} semanas completadas)</strong>
                    </div>
                    <div class="subject-progress-bar">
                        <div class="subject-progress-bar-fill" style="width:${progressPct}%;"></div>
                    </div>
                </div>

                <!-- ACCESOS RÁPIDOS / ENLACES DE LA MATERIA -->
                <div class="sub-link-pills-row" style="margin-top:1.25rem;">
                    <span class="sub-link-pill" onclick="app.openLinkManagementModal('${sub.id}', 'campusUrl', 'Campus', '${sub.campusUrl || ''}')">
                        <i class="ph ph-student"></i> Campus ${sub.campusUrl ? '🔗' : '+'}
                    </span>
                    <span class="sub-link-pill" onclick="app.openLinkManagementModal('${sub.id}', 'programaUrl', 'Programa', '${sub.programaUrl || ''}')">
                        <i class="ph ph-file-text"></i> Programa ${sub.programaUrl ? '🔗' : '+'}
                    </span>
                    <span class="sub-link-pill" onclick="app.openLinkManagementModal('${sub.id}', 'cronogramaUrl', 'Cronograma', '${sub.cronogramaUrl || ''}')">
                        <i class="ph ph-calendar"></i> Cronograma ${sub.cronogramaUrl ? '🔗' : '+'}
                    </span>
                    <span class="sub-link-pill" onclick="app.openLinkManagementModal('${sub.id}', 'biblioUrl', 'Bibliografía', '${sub.biblioUrl || ''}')">
                        <i class="ph ph-book-open"></i> Bibliografía ${sub.biblioUrl ? '🔗' : '+'}
                    </span>
                    <span class="sub-link-pill" onclick="app.openLinkManagementModal('${sub.id}', 'anunciosUrl', 'Anuncios', '${sub.anunciosUrl || ''}')">
                        <i class="ph ph-megaphone"></i> Anuncios ${sub.anunciosUrl ? '🔗' : '+'}
                    </span>
                </div>
            </div>

            <div class="facultad-main-grid">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;"><i class="ph ph-check-square" style="color:var(--accent);"></i> Progreso por Semanas</h3>
                        <div style="display:flex; gap:0.4rem;">
                            <button class="btn-icon-only glass-effect" onclick="app.addWeekToSubject('${sub.id}')" title="Añadir Semana"><i class="ph ph-plus"></i></button>
                            <button class="btn-icon-only glass-effect" onclick="app.removeWeekFromSubject('${sub.id}')" title="Quitar Semana"><i class="ph ph-minus"></i></button>
                        </div>
                    </div>
                    <div class="weeks-cards-grid">
                        ${weekCardsHTML}
                    </div>
                </div>

                <div>
                    <div class="important-dates-panel">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h3 style="font-size:1.05rem; display:flex; align-items:center; gap:0.5rem;"><i class="ph-fill ph-bell-simple-ringing" style="color:#fbbf24;"></i> Fechas Importantes</h3>
                            <button class="btn-icon-only" onclick="app.openModal('add-event-modal')" title="Añadir Fecha"><i class="ph ph-plus"></i></button>
                        </div>
                        <div class="important-dates-list">
                            ${eventsHTML}
                        </div>
                    </div>
                </div>
            </div>

            <div class="facultad-section-box">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
                    <h3 style="font-size:1.18rem; display:flex; align-items:center; gap:0.5rem;"><i class="ph ph-notebook" style="color:#c084fc;"></i> Apuntes de la Materia</h3>
                    <button class="btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="app.navigateTo('notas')">
                        <i class="ph ph-arrow-square-out"></i> Ver en Notas Rápidas
                    </button>
                </div>
                <textarea class="facultad-notes-textarea" id="subject-notes-textarea" placeholder="Anota acá fechas importantes, temas a repasar de ${sub.name}, links, o apuntes rápidos..." oninput="app.saveSubjectNotes('${sub.id}', this.value)">${sub.notesContent || ''}</textarea>
            </div>

            <div class="facultad-section-box">
                <h3 style="font-size:1.18rem; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem;"><i class="ph ph-calculator" style="color:#60a5fa;"></i> Calculadora de Promedio</h3>
                <div class="grade-calc-box">
                    <div class="grade-input-group">
                        <label style="font-size:0.8rem; color:var(--text-muted);">1° Parcial</label>
                        <input type="number" step="0.5" min="1" max="10" class="grade-input" id="grade-input-p1-${sub.id}" placeholder="-" value="${sub.grades.p1 || ''}" oninput="app.updateSubjectGrade('${sub.id}', 'p1', this.value, this)">
                    </div>
                    <div class="grade-input-group">
                        <label style="font-size:0.8rem; color:var(--text-muted);">2° Parcial</label>
                        <input type="number" step="0.5" min="1" max="10" class="grade-input" id="grade-input-p2-${sub.id}" placeholder="-" value="${sub.grades.p2 || ''}" oninput="app.updateSubjectGrade('${sub.id}', 'p2', this.value, this)">
                    </div>
                    <div class="grade-input-group">
                        <label style="font-size:0.8rem; color:var(--text-muted);">TP / Final</label>
                        <input type="number" step="0.5" min="1" max="10" class="grade-input" id="grade-input-tp-${sub.id}" placeholder="-" value="${sub.grades.tp || ''}" oninput="app.updateSubjectGrade('${sub.id}', 'tp', this.value, this)">
                    </div>
                    <div class="average-badge" id="subject-avg-badge-${sub.id}" style="border-color:${badgeColor}; color:${badgeColor};">
                        Promedio: ${avgText}
                    </div>
                </div>
                <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.75rem;" id="subject-avg-status-text-${sub.id}">${statusBadgeText}</p>
            </div>

            <div class="facultad-section-box">
                <h3 style="font-size:1.18rem; margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><i class="ph ph-calendar-check" style="color:#f43f5e;"></i> Calendario Académico Global</h3>
                <div class="global-events-grid" id="facultad-global-calendar-grid">
                    <!-- Events injected dynamically -->
                </div>
            </div>
        `;

        this.renderFacultadGlobalCalendar();
    },

    goToAcademicEvent(subjectId, eventIndex) {
        this.navigateTo('facultad');
        this.activeSubjectId = subjectId;
        this.initFacultad();

        setTimeout(() => {
            const targetEl = document.getElementById(`event-card-${subjectId}-${eventIndex}`) || document.querySelector('.important-dates-panel');
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetEl.classList.add('highlight-pulse');
                setTimeout(() => {
                    targetEl.classList.remove('highlight-pulse');
                }, 2500);
            }
        }, 150);
    },

    openLinkManagementModal(subjectId, linkKey, labelName, currentUrl) {
        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === subjectId);
        if (!sub) return;

        document.getElementById('link-subject-id-input').value = subjectId;
        document.getElementById('link-key-input').value = linkKey;

        const titleEl = document.getElementById('link-modal-title');
        const subtitleEl = document.getElementById('link-modal-subtitle');
        const inputEl = document.getElementById('link-modal-url-input');
        const openBtn = document.getElementById('link-modal-open-btn');
        const delBtn = document.getElementById('link-modal-del-btn');

        if (titleEl) titleEl.innerHTML = `<i class="ph ph-link" style="color:var(--accent);"></i> Enlace: ${labelName}`;
        if (subtitleEl) subtitleEl.textContent = `Configura la URL para ${labelName} de ${sub.name}`;
        if (inputEl) inputEl.value = currentUrl || '';

        if (openBtn) openBtn.style.display = currentUrl ? 'inline-flex' : 'none';
        if (delBtn) delBtn.style.display = currentUrl ? 'inline-block' : 'none';

        this.openModal('link-modal');
        setTimeout(() => { if (inputEl) inputEl.focus(); }, 150);
    },

    openSubjectLinkFromModal() {
        const inputEl = document.getElementById('link-modal-url-input');
        const url = inputEl ? inputEl.value.trim() : '';

        if (url) {
            let validUrl = url;
            if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
                validUrl = 'https://' + validUrl;
            }
            window.open(validUrl, '_blank');
        }
    },

    saveSubjectLinkFromModal() {
        const subjectId = document.getElementById('link-subject-id-input').value;
        const linkKey = document.getElementById('link-key-input').value;
        const inputEl = document.getElementById('link-modal-url-input');

        let url = inputEl ? inputEl.value.trim() : '';
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === subjectId);
        if (sub) {
            sub[linkKey] = url;
            this.saveSubjectsData(subjects);
            this.closeModal('link-modal');
            this.showToast('Enlace Guardado', 'Se actualizó la URL de la materia.', 'success');
        }
    },

    deleteSubjectLinkFromModal() {
        const subjectId = document.getElementById('link-subject-id-input').value;
        const linkKey = document.getElementById('link-key-input').value;

        this.openConfirmModal('¿Eliminar URL?', '¿Deseas borrar esta URL guardada?', () => {
            const subjects = this.getSubjectsData();
            const sub = subjects.find(s => s.id === subjectId);
            if (sub) {
                sub[linkKey] = '';
                this.saveSubjectsData(subjects);
                this.closeModal('link-modal');
                this.showToast('Enlace Eliminado', 'Se borró la URL de la materia.', 'info');
            }
        });
    },

    saveSubjectNotes(subjectId, text) {
        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === subjectId);
        if (sub) {
            sub.notesContent = text;
            this.saveSubjectsData(subjects);

            const list = this.getNotasData();
            const noteTitle = `Apuntes: ${sub.name}`;
            let existingNote = list.find(n => n.title === noteTitle);

            if (existingNote) {
                existingNote.content = text;
                existingNote.date = new Date().toLocaleDateString('es-AR');
            } else if (text.trim()) {
                list.unshift({
                    id: 'n_' + Date.now(),
                    title: noteTitle,
                    content: text,
                    date: new Date().toLocaleDateString('es-AR'),
                    colorClass: 'note-card-cyan'
                });
            }
            this.saveNotasData(list);
        }
    },

    updateSubjectGrade(subjectId, gradeKey, val, inputEl) {
        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === subjectId);
        if (sub) {
            sub.grades = sub.grades || {};
            sub.grades[gradeKey] = val;
            localStorage.setItem('userhub_subjects', JSON.stringify(subjects));
            
            // Actualizar promedio en vivo sin re-renderizar todo el DOM
            this.recalculateSubjectAverageInDOM(sub);

            // Avance automático de foco al escribir una nota válida
            const num = parseFloat(val);
            if (!isNaN(num) && num >= 1 && num <= 10 && inputEl) {
                if (gradeKey === 'p1') {
                    const nextInput = document.getElementById(`grade-input-p2-${subjectId}`);
                    if (nextInput && !nextInput.value) nextInput.focus();
                } else if (gradeKey === 'p2') {
                    const nextInput = document.getElementById(`grade-input-tp-${subjectId}`);
                    if (nextInput && !nextInput.value) nextInput.focus();
                }
            }
        }
    },

    recalculateSubjectAverageInDOM(sub) {
        const p1 = parseFloat(sub.grades.p1);
        const p2 = parseFloat(sub.grades.p2);
        const tp = parseFloat(sub.grades.tp);

        const validGrades = [p1, p2, tp].filter(g => !isNaN(g));
        let avgText = '-';
        let statusBadgeText = 'Ingresá tus notas para calcular el promedio.';
        let badgeColor = '#60a5fa';

        if (validGrades.length > 0) {
            const sum = validGrades.reduce((a, b) => a + b, 0);
            const avg = (sum / validGrades.length).toFixed(2);
            avgText = `${avg}`;

            if (avg >= 7) {
                statusBadgeText = `¡Excelente! Promedio ${avg} - 🏆 Promocionado`;
                badgeColor = '#10b981';
            } else if (avg >= 4) {
                statusBadgeText = `Promedio ${avg} - 👍 Aprobado para Final`;
                badgeColor = '#fbbf24';
            } else {
                statusBadgeText = `Promedio ${avg} - ⚠️ Insuficiente`;
                badgeColor = '#ef4444';
            }
        }

        const badgeEl = document.getElementById(`subject-avg-badge-${sub.id}`);
        const textEl = document.getElementById(`subject-avg-status-text-${sub.id}`);
        if (badgeEl) {
            badgeEl.textContent = `Promedio: ${avgText}`;
            badgeEl.style.borderColor = badgeColor;
            badgeEl.style.color = badgeColor;
        }
        if (textEl) {
            textEl.textContent = statusBadgeText;
        }
    },

    setSubjectCurrentWeekPrompt(subjectId, current) {
        document.getElementById('week-subject-id-input').value = subjectId;
        const input = document.getElementById('week-number-input');
        if (input) input.value = current;

        this.openModal('set-week-modal');
        setTimeout(() => { if (input) input.focus(); }, 150);
    },

    saveSubjectCurrentWeekFromModal() {
        const subjectId = document.getElementById('week-subject-id-input').value;
        const input = document.getElementById('week-number-input');
        const val = input ? parseInt(input.value, 10) : 1;

        if (isNaN(val) || val < 1) return;

        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === subjectId);
        if (sub) {
            sub.currentWeek = Math.max(1, Math.min(val, sub.weeksCount || 16));
            this.saveSubjectsData(subjects);
            this.closeModal('set-week-modal');
            this.showToast('Semana Actualizada', `Avanzaste a la Semana ${sub.currentWeek}.`, 'success');
        }
    },

    renderFacultadGlobalCalendar() {
        const grid = document.getElementById('facultad-global-calendar-grid');
        if (!grid) return;

        const subjects = this.getSubjectsData();
        const now = new Date();
        now.setHours(0,0,0,0);

        let allEvents = [];
        subjects.forEach(sub => {
            if (sub.events) {
                sub.events.forEach((ev, idx) => {
                    if (ev.dates) {
                        let diffDays = 999;
                        if (ev.dates.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const dateObj = new Date(ev.dates + 'T00:00:00');
                            diffDays = Math.ceil((dateObj - now) / (1000 * 60 * 60 * 24));
                        }
                        allEvents.push({
                            subjectId: sub.id,
                            eventId: idx,
                            subject: sub.name,
                            title: ev.title,
                            dateStr: ev.dates,
                            diffDays
                        });
                    }
                });
            }
        });

        allEvents.sort((a, b) => a.diffDays - b.diffDays);
        grid.innerHTML = '';

        if (allEvents.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1;">Sin compromisos registrados en ninguna materia.</p>';
            return;
        }

        allEvents.forEach(ev => {
            let colorClass = 'cal-far';
            let badgeText = `En ${ev.diffDays} días`;

            if (ev.diffDays === 0) {
                colorClass = 'cal-today-intense';
                badgeText = '¡HOY!';
            } else if (ev.diffDays === 1) {
                colorClass = 'cal-tomorrow';
                badgeText = 'Mañana';
            } else if (ev.diffDays > 1 && ev.diffDays <= 3) {
                colorClass = 'cal-3days';
                badgeText = `Faltan ${ev.diffDays}d`;
            } else if (ev.diffDays > 3 && ev.diffDays <= 7) {
                colorClass = 'cal-7days';
                badgeText = `Faltan ${ev.diffDays}d`;
            } else if (ev.diffDays > 7 && ev.diffDays <= 30) {
                colorClass = 'cal-30days';
                badgeText = `Faltan ${ev.diffDays}d`;
            } else if (ev.diffDays > 30) {
                colorClass = 'cal-far';
                badgeText = `Faltan ${ev.diffDays}d`;
            } else {
                colorClass = 'cal-today-intense';
                badgeText = 'Pasado';
            }

            const card = document.createElement('div');
            card.className = `global-event-card ${colorClass}`;
            card.style.cursor = 'pointer';
            card.title = `Ir a ${ev.subject} - ${ev.title}`;
            card.onclick = () => this.goToAcademicEvent(ev.subjectId, ev.eventId);

            card.innerHTML = `
                <div style="font-size:0.75rem; color:var(--text-muted);">${ev.subject}</div>
                <strong style="font-size:0.92rem;">${ev.title}</strong>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem;">
                    <span style="font-size:0.78rem; color:var(--text-muted);"><i class="ph ph-calendar"></i> ${ev.dateStr}</span>
                    <span class="badge" style="background:rgba(255,255,255,0.15); color:#fff;">${badgeText}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    toggleWeekState(subjectId, weekNum) {
        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === subjectId);
        if (sub) {
            sub.weeksState = sub.weeksState || {};
            const wasDone = !!sub.weeksState[weekNum];
            sub.weeksState[weekNum] = !wasDone;

            if (!wasDone && (sub.currentWeek || 1) === weekNum && weekNum < (sub.weeksCount || 16)) {
                sub.currentWeek = weekNum + 1;
                this.showToast('¡Semana Completada!', `Avanzaste a la Semana ${sub.currentWeek}.`, 'success');
            }

            this.saveSubjectsData(subjects);
        }
    },

    addWeekToSubject(subjectId) {
        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === subjectId);
        if (sub && (sub.weeksCount || 16) < 24) {
            sub.weeksCount = (sub.weeksCount || 16) + 1;
            this.saveSubjectsData(subjects);
        }
    },

    removeWeekFromSubject(subjectId) {
        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === subjectId);
        if (sub && (sub.weeksCount || 16) > 1) {
            sub.weeksCount = (sub.weeksCount || 16) - 1;
            this.saveSubjectsData(subjects);
        }
    },

    saveNewSubject() {
        const nameInput = document.getElementById('sub-name-input');
        const profInput = document.getElementById('sub-prof-input');
        const weeksInput = document.getElementById('sub-weeks-input');
        const linkInput = document.getElementById('sub-link-input');

        if (!nameInput || !nameInput.value.trim()) {
            this.showToast('Nombre Requerido', 'Por favor ingresa un nombre para la materia.', 'urgent');
            return;
        }

        const subjects = this.getSubjectsData();
        const newSub = {
            id: 'sub_' + Date.now(),
            name: nameInput.value.trim(),
            professor: profInput ? profInput.value.trim() : '',
            driveLink: linkInput ? linkInput.value.trim() : '',
            campusUrl: linkInput ? linkInput.value.trim() : '',
            weeksCount: weeksInput && parseInt(weeksInput.value, 10) > 0 ? parseInt(weeksInput.value, 10) : 16,
            currentWeek: 1,
            weeksState: {},
            notesContent: '',
            grades: { p1: '', p2: '', tp: '' },
            events: []
        };

        subjects.push(newSub);
        this.activeSubjectId = newSub.id;
        this.saveSubjectsData(subjects);
        
        nameInput.value = '';
        if (profInput) profInput.value = '';
        if (linkInput) linkInput.value = '';
        this.closeModal('add-subject-modal');
        this.showToast('Materia Creada', 'Añadida a tu lista.', 'success');
    },

    deleteSubject(id) {
        this.openConfirmModal('¿Eliminar Materia?', '¿Deseas eliminar esta materia con todos sus exámenes y apuntes?', () => {
            let subjects = this.getSubjectsData();
            subjects = subjects.filter(s => s.id !== id);
            this.activeSubjectId = subjects.length > 0 ? subjects[0].id : null;
            this.saveSubjectsData(subjects);
            this.showToast('Materia Eliminada', 'Removida correctamente.', 'info');
        });
    },

    saveSubjectEvent() {
        if (!this.activeSubjectId) return;

        const titleInput = document.getElementById('event-title-input');
        const dateInput = document.getElementById('event-date-input');

        if (!titleInput || !titleInput.value.trim() || !dateInput || !dateInput.value.trim()) {
            this.showToast('Datos Incompletos', 'Ingresa título y fecha del examen.', 'urgent');
            return;
        }

        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === this.activeSubjectId);
        if (sub) {
            sub.events = sub.events || [];
            sub.events.push({
                title: titleInput.value.trim(),
                dates: dateInput.value.trim()
            });
            this.saveSubjectsData(subjects);
            titleInput.value = '';
            dateInput.value = '';
            this.closeModal('add-event-modal');
            this.showToast('Examen Añadido', 'Fecha registrada.', 'success');
        }
    },

    deleteSubjectEvent(subjectId, eventIndex) {
        const subjects = this.getSubjectsData();
        const sub = subjects.find(s => s.id === subjectId);
        if (sub && sub.events) {
            sub.events.splice(eventIndex, 1);
            this.saveSubjectsData(subjects);
        }
    },

    exportAcademicEventsICS() {
        const subjects = this.getSubjectsData();
        let allEvents = [];

        subjects.forEach(sub => {
            if (sub.events && sub.events.length > 0) {
                sub.events.forEach(ev => {
                    if (ev.dates) {
                        allEvents.push({
                            subject: sub.name,
                            title: ev.title,
                            dateStr: ev.dates
                        });
                    }
                });
            }
        });

        if (allEvents.length === 0) {
            this.showToast('Sin Exámenes', 'No tienes fechas de exámenes cargadas para exportar.', 'urgent');
            return;
        }

        let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Dashboard Personal//Calendario Academico//ES\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n";

        allEvents.forEach((ev, idx) => {
            const cleanDate = ev.dateStr.replace(/-/g, '');
            const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

            icsContent += "BEGIN:VEVENT\r\n";
            icsContent += `UID:exam-${idx}-${Date.now()}@userdashboard\r\n`;
            icsContent += `DTSTAMP:${nowStr}\r\n`;
            icsContent += `DTSTART;VALUE=DATE:${cleanDate}\r\n`;
            icsContent += `SUMMARY:${ev.subject} - ${ev.title}\r\n`;
            icsContent += `DESCRIPTION:Examen registrado en el Dashboard Personal para la materia ${ev.subject}.\r\n`;
            icsContent += "STATUS:CONFIRMED\r\n";
            icsContent += "END:VEVENT\r\n";
        });

        icsContent += "END:VCALENDAR\r\n";

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `calendario_examenes_facultad_${new Date().toISOString().slice(0, 10)}.ics`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        this.showToast('Archivo .ICS Generado', '¡Descargado! Ábrelo para importar a Google Calendar o tu celular.', 'success');
    },

    // 6. CALENDARIO ACADÉMICO GLOBAL DEL LOBBY
    renderLobbyGlobalCalendar() {
        const upcomingList = document.getElementById('upcoming-events-list');
        const globalGrid = document.getElementById('global-calendar-events-grid');
        if (!upcomingList || !globalGrid) return;

        const subjects = this.getSubjectsData();
        const now = new Date();
        now.setHours(0,0,0,0);

        let allEvents = [];

        subjects.forEach(sub => {
            if (sub.events) {
                sub.events.forEach((ev, idx) => {
                    if (ev.dates) {
                        let diffDays = 999;

                        if (ev.dates.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const dateObj = new Date(ev.dates + 'T00:00:00');
                            diffDays = Math.ceil((dateObj - now) / (1000 * 60 * 60 * 24));
                        }

                        allEvents.push({
                            subjectId: sub.id,
                            eventId: idx,
                            subject: sub.name,
                            title: ev.title,
                            dateStr: ev.dates,
                            diffDays
                        });
                    }
                });
            }
        });

        allEvents.sort((a, b) => a.diffDays - b.diffDays);

        upcomingList.innerHTML = '';
        const topEvents = allEvents.slice(0, 3);

        if (topEvents.length === 0) {
            upcomingList.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem;">No hay compromisos próximos.</div>';
        } else {
            topEvents.forEach(ev => {
                let badgeText = ev.diffDays === 0 ? '¡Hoy!' : (ev.diffDays === 1 ? 'Mañana' : (ev.diffDays < 0 ? 'Vencido' : `En ${ev.diffDays}d`));
                const item = document.createElement('div');
                item.className = 'upcoming-item';
                item.title = `Ir a ${ev.subject} - ${ev.title}`;
                item.onclick = () => this.goToAcademicEvent(ev.subjectId, ev.eventId);

                item.innerHTML = `
                    <div class="upcoming-item-info">
                        <strong>${ev.title}</strong>
                        <span>${ev.subject}</span>
                    </div>
                    <div class="upcoming-item-date">${badgeText}</div>
                `;
                upcomingList.appendChild(item);
            });
        }

        globalGrid.innerHTML = '';
        if (allEvents.length === 0) {
            globalGrid.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1;">Sin compromisos registrados.</p>';
            return;
        }

        allEvents.forEach(ev => {
            let colorClass = 'cal-far';
            let badgeText = `En ${ev.diffDays} días`;

            if (ev.diffDays === 0) {
                colorClass = 'cal-today-intense';
                badgeText = '¡HOY!';
            } else if (ev.diffDays === 1) {
                colorClass = 'cal-tomorrow';
                badgeText = 'Mañana';
            } else if (ev.diffDays > 1 && ev.diffDays <= 3) {
                colorClass = 'cal-3days';
                badgeText = `En ${ev.diffDays} días`;
            } else if (ev.diffDays > 3 && ev.diffDays <= 7) {
                colorClass = 'cal-7days';
                badgeText = `En ${ev.diffDays} días`;
            } else if (ev.diffDays > 7 && ev.diffDays <= 30) {
                colorClass = 'cal-30days';
                badgeText = `En ${ev.diffDays} días`;
            } else if (ev.diffDays > 30) {
                colorClass = 'cal-far';
                badgeText = `En ${ev.diffDays} días`;
            } else {
                colorClass = 'cal-today-intense';
                badgeText = 'Pasado';
            }

            const card = document.createElement('div');
            card.className = `global-event-card ${colorClass}`;
            card.style.cursor = 'pointer';
            card.title = `Ir a ${ev.subject} - ${ev.title}`;
            card.onclick = () => this.goToAcademicEvent(ev.subjectId, ev.eventId);

            card.innerHTML = `
                <div style="font-size:0.75rem; color:var(--text-muted);">${ev.subject}</div>
                <strong style="font-size:0.95rem;">${ev.title}</strong>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.3rem;">
                    <span style="font-size:0.8rem; color:var(--text-muted);"><i class="ph ph-calendar"></i> ${ev.dateStr}</span>
                    <span class="badge" style="background:rgba(255,255,255,0.15); color:#fff;">${badgeText}</span>
                </div>
            `;
            globalGrid.appendChild(card);
        });
    },

    // 7. HORARIO SEMANAL POR HORA EXACTA (EJ: 18:35)
    getHorarioData() {
        const saved = localStorage.getItem('userhub_horario_exact');
        if (!saved) return defaultHorarioExactData;
        try { return JSON.parse(saved); } catch(e) { return defaultHorarioExactData; }
    },

    saveHorarioData(data) {
        localStorage.setItem('userhub_horario_exact', JSON.stringify(data));
        this.renderHorario();
    },

    openAddScheduleModal(dayKey = 'lunes', editId = null) {
        const daySelect = document.getElementById('sched-day-select');
        const startInput = document.getElementById('sched-start-input');
        const endInput = document.getElementById('sched-end-input');
        const titleInput = document.getElementById('sched-title-input');
        const catSelect = document.getElementById('sched-cat-select');
        const detailsInput = document.getElementById('sched-details-input');
        const editIdInput = document.getElementById('sched-edit-id');

        if (daySelect) daySelect.value = dayKey;

        if (editId) {
            const data = this.getHorarioData();
            const item = data.find(i => i.id === editId);
            if (item) {
                if (editIdInput) editIdInput.value = item.id;
                if (startInput) startInput.value = item.startTime || '18:35';
                if (endInput) endInput.value = item.endTime || '21:00';
                if (titleInput) titleInput.value = item.title || '';
                if (catSelect) catSelect.value = item.category || 'trabajo';
                if (detailsInput) detailsInput.value = item.details || '';
            }
        } else {
            if (editIdInput) editIdInput.value = '';
            if (startInput) startInput.value = '18:35';
            if (endInput) endInput.value = '21:00';
            if (titleInput) titleInput.value = '';
            if (catSelect) catSelect.value = 'trabajo';
            if (detailsInput) detailsInput.value = '';
        }

        this.openModal('schedule-item-modal');
        setTimeout(() => { if (titleInput) titleInput.focus(); }, 150);
    },

    saveScheduleItemModal() {
        const editIdInput = document.getElementById('sched-edit-id');
        const daySelect = document.getElementById('sched-day-select');
        const startInput = document.getElementById('sched-start-input');
        const endInput = document.getElementById('sched-end-input');
        const titleInput = document.getElementById('sched-title-input');
        const catSelect = document.getElementById('sched-cat-select');
        const detailsInput = document.getElementById('sched-details-input');

        const editId = editIdInput ? editIdInput.value : '';
        const day = daySelect ? daySelect.value : 'lunes';
        const startTime = startInput ? startInput.value : '18:35';
        const endTime = endInput ? endInput.value : '21:00';
        const title = titleInput ? titleInput.value.trim() : '';
        const category = catSelect ? catSelect.value : 'trabajo';
        const details = detailsInput ? detailsInput.value.trim() : '';

        if (!title) {
            this.showToast('Título Requerido', 'Ingresa una descripción para la actividad.', 'urgent');
            return;
        }

        let data = this.getHorarioData();

        if (editId) {
            const item = data.find(i => i.id === editId);
            if (item) {
                item.day = day;
                item.startTime = startTime;
                item.endTime = endTime;
                item.title = title;
                item.category = category;
                item.details = details;
            }
        } else {
            data.push({
                id: 'sch_' + Date.now(),
                day,
                startTime,
                endTime,
                title,
                category,
                details
            });
        }

        this.saveHorarioData(data);
        this.closeModal('schedule-item-modal');
        this.showToast('Horario Guardado', `Agregado a ${day.toUpperCase()} (${startTime}).`, 'success');
    },

    deleteScheduleItem(id) {
        this.openConfirmModal('¿Eliminar Actividad?', '¿Deseas quitar esta actividad del horario?', () => {
            let data = this.getHorarioData();
            data = data.filter(i => i.id !== id);
            this.saveHorarioData(data);
            this.showToast('Actividad Borrada', 'Eliminada del horario.', 'info');
        });
    },

    scheduleActiveFilter: 'all',

    filterScheduleDay(dayKey) {
        this.scheduleActiveFilter = dayKey;
        document.querySelectorAll('.sched-tab-btn').forEach(btn => {
            if (btn.id === `sched-tab-${dayKey}`) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        this.renderHorario();
    },

    renderScheduleSummaryChips(data) {
        const chipsContainer = document.getElementById('sched-summary-chips');
        if (!chipsContainer) return;

        const counts = { trabajo: 0, facultad: 0, gimnasio: 0, otros: 0 };
        data.forEach(item => {
            if (item.category === 'trabajo') counts.trabajo++;
            else if (item.category === 'facultad') counts.facultad++;
            else if (item.category === 'gimnasio') counts.gimnasio++;
            else counts.otros++;
        });

        chipsContainer.innerHTML = `
            <div class="sched-stat-chip"><span style="color:#38bdf8;">💼</span> ${counts.trabajo} Turno${counts.trabajo!==1?'s':''}</div>
            <div class="sched-stat-chip"><span style="color:#a855f7;">🎓</span> ${counts.facultad} Cursado${counts.facultad!==1?'s':''}</div>
            <div class="sched-stat-chip"><span style="color:#ef4444;">💪</span> ${counts.gimnasio} Gym</div>
            <div class="sched-stat-chip" style="color:var(--text-muted);"><span style="color:#34d399;">📊</span> ${data.length} Total</div>
        `;
    },

    renderHorario() {
        const container = document.getElementById('schedule-days-container');
        if (!container) return;

        const allDays = [
            { key: 'lunes', label: 'Lunes', icon: '🗓️', dayNum: 1 },
            { key: 'martes', label: 'Martes', icon: '🗓️', dayNum: 2 },
            { key: 'miercoles', label: 'Miércoles', icon: '🗓️', dayNum: 3 },
            { key: 'jueves', label: 'Jueves', icon: '🗓️', dayNum: 4 },
            { key: 'viernes', label: 'Viernes', icon: '🗓️', dayNum: 5 },
            { key: 'sabado', label: 'Sábado', icon: '🌴', dayNum: 6 },
            { key: 'domingo', label: 'Domingo', icon: '🌴', dayNum: 0 }
        ];

        const todayDayNum = new Date().getDay();
        const data = this.getHorarioData();
        this.renderScheduleSummaryChips(data);

        let filteredDays = allDays;
        if (this.scheduleActiveFilter && this.scheduleActiveFilter !== 'all') {
            filteredDays = allDays.filter(d => d.key === this.scheduleActiveFilter);
        }

        container.innerHTML = '';

        const catBadges = {
            trabajo: { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', icon: '💼', label: 'Trabajo' },
            facultad: { color: '#a855f7', bg: 'rgba(168,85,247,0.15)', icon: '🎓', label: 'Facultad' },
            gimnasio: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '💪', label: 'Gym' },
            estudio: { color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: '📖', label: 'Estudio' },
            personal: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', icon: '🏠', label: 'Personal' },
            otro: { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: '📦', label: 'Otro' }
        };

        filteredDays.forEach(d => {
            const dayItems = data.filter(i => i.day === d.key);
            dayItems.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

            const isToday = (todayDayNum === d.dayNum);
            const col = document.createElement('div');
            col.className = `schedule-day-column glass-effect ${isToday ? 'today-column' : ''}`;

            let itemsHTML = '';
            if (dayItems.length === 0) {
                itemsHTML = `
                    <div style="text-align:center; padding:2rem 0.5rem; color:var(--text-muted);">
                        <i class="ph ph-calendar-blank" style="font-size:1.8rem; opacity:0.4; display:block; margin-bottom:0.4rem;"></i>
                        <span style="font-size:0.82rem;">Sin actividades para este día</span>
                    </div>
                `;
            } else {
                dayItems.forEach(item => {
                    const badge = catBadges[item.category] || catBadges.otro;
                    itemsHTML += `
                        <div class="schedule-block-item" style="border-left: 4px solid ${badge.color};">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="sched-time-badge" style="background:${badge.bg}; color:${badge.color}; border: 1px solid ${badge.color}40;">
                                    <i class="ph ph-clock"></i> ${item.startTime || '18:35'} ➔ ${item.endTime || '21:00'}
                                </span>
                                <div style="display:flex; gap:0.3rem;">
                                    <button style="background:rgba(255,255,255,0.06); border:none; color:var(--text-muted); width:24px; height:24px; border-radius:6px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; justify-content:center;" onclick="app.openAddScheduleModal('${d.key}', '${item.id}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                                    <button style="background:rgba(239,68,68,0.1); border:none; color:#ef4444; width:24px; height:24px; border-radius:6px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; justify-content:center;" onclick="app.deleteScheduleItem('${item.id}')" title="Eliminar"><i class="ph ph-trash"></i></button>
                                </div>
                            </div>
                            <strong class="sched-block-title">${badge.icon} ${item.title}</strong>
                            ${item.details ? `<div class="sched-block-details"><i class="ph ph-map-pin" style="color:var(--accent);"></i> ${item.details}</div>` : ''}
                        </div>
                    `;
                });
            }

            col.innerHTML = `
                <div class="schedule-day-header">
                    <h4>${d.icon} ${d.label} ${isToday ? '<span class="today-badge-pill">HOY</span>' : ''}</h4>
                    <button class="sched-add-btn" onclick="app.openAddScheduleModal('${d.key}')" title="Añadir actividad a ${d.label}"><i class="ph ph-plus"></i></button>
                </div>
                <div class="schedule-day-body">
                    ${itemsHTML}
                </div>
            `;
            container.appendChild(col);
        });
    },

    initHorario() {
        this.renderHorario();
    },

    // --- LOBBY STATS UPDATE ---
    updateLobbyStats() {
        const tareas = this.getTareasData();
        const pendingCount = tareas.filter(t => !t.completed).length;
        const svTareas = document.getElementById('sv-tareas');
        if (svTareas) svTareas.textContent = pendingCount;

        const finanzas = this.getFinanzasData();
        let inc = 0, exp = 0;
        finanzas.transactions.forEach(t => { if(t.type==='income') inc+=t.amount; else exp+=t.amount; });
        const svFinanzas = document.getElementById('sv-finanzas');
        if (svFinanzas) svFinanzas.textContent = `$${(inc - exp).toLocaleString()}`;

        const habitos = this.getHabitosData();
        const todayStr = new Date().toISOString().slice(0, 10);
        let done = 0;
        if (habitos.records[todayStr]) {
            habitos.list.forEach(h => {
                if (habitos.records[todayStr][h.id]) done++;
            });
        }
        const pct = habitos.list.length > 0 ? Math.min(100, Math.round((done / habitos.list.length) * 100)) : 0;
        const svHabitos = document.getElementById('sv-habitos');
        if (svHabitos) svHabitos.textContent = `${pct}%`;

        const subjects = this.getSubjectsData();
        let totalW = 0, doneW = 0;
        subjects.forEach(s => {
            const count = s.weeksCount || 16;
            totalW += count;
            if (s.weeksState) {
                for (let i = 1; i <= count; i++) {
                    if (s.weeksState[i]) doneW++;
                }
            }
        });
        const facPct = totalW > 0 ? Math.round((doneW / totalW) * 100) : 0;
        const svFacultad = document.getElementById('sv-facultad');
        if (svFacultad) svFacultad.textContent = `${facPct}%`;
    },

    // --- AMBIENT SOUND SYNTHESIZER (WEB AUDIO API) ---
    ambientAudioCtx: null,
    ambientSourceNode: null,
    ambientGainNode: null,
    ambientLfoNode: null,
    activeAmbientSound: null,
    ambientVolume: 0.5,

    initAmbientAudioCtx() {
        if (!this.ambientAudioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ambientAudioCtx = new AudioContext();
            }
        }
        if (this.ambientAudioCtx && this.ambientAudioCtx.state === 'suspended') {
            this.ambientAudioCtx.resume();
        }
    },

    toggleAmbientSound(type) {
        if (this.activeAmbientSound === type) {
            this.stopAmbientSound();
            return;
        }

        this.stopAmbientSound();
        this.initAmbientAudioCtx();

        if (!this.ambientAudioCtx) return;

        const ctx = this.ambientAudioCtx;
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        if (type === 'brown') {
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5;
            }
        } else if (type === 'rain') {
            let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11;
                b6 = white * 0.115926;
            }
        } else if (type === 'waves') {
            let b0=0, b1=0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99 * b0 + white * 0.05;
                b1 = 0.97 * b1 + white * 0.1;
                output[i] = (b0 + b1) * 0.3;
            }
        } else if (type === 'cafe') {
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + (0.04 * white)) / 1.04;
                output[i] = lastOut * 1.5;
            }
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.value = this.ambientVolume;

        const filterNode = ctx.createBiquadFilter();
        if (type === 'brown') {
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 400;
        } else if (type === 'rain') {
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 1000;
        } else if (type === 'waves') {
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 600;

            const lfo = ctx.createOscillator();
            lfo.frequency.value = 0.12;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.35;
            lfo.connect(lfoGain);
            lfoGain.connect(gainNode.gain);
            lfo.start();
            this.ambientLfoNode = lfo;
        } else if (type === 'cafe') {
            filterNode.type = 'bandpass';
            filterNode.frequency.value = 800;
            filterNode.Q.value = 1.2;
        }

        whiteNoise.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();

        this.ambientSourceNode = whiteNoise;
        this.ambientGainNode = gainNode;
        this.activeAmbientSound = type;

        this.updateAmbientUI();
        this.showToast('Audio Ambiente', `Reproduciendo ${type.toUpperCase()}.`, 'info');
    },

    stopAmbientSound() {
        if (this.ambientSourceNode) {
            try { this.ambientSourceNode.stop(); } catch(e) {}
            this.ambientSourceNode.disconnect();
            this.ambientSourceNode = null;
        }
        if (this.ambientLfoNode) {
            try { this.ambientLfoNode.stop(); } catch(e) {}
            this.ambientLfoNode.disconnect();
            this.ambientLfoNode = null;
        }
        this.activeAmbientSound = null;
        this.updateAmbientUI();
    },

    setAmbientVolume(val) {
        const num = parseFloat(val) / 100;
        this.ambientVolume = num;
        if (this.ambientGainNode && this.ambientAudioCtx) {
            this.ambientGainNode.gain.setValueAtTime(num, this.ambientAudioCtx.currentTime);
        }
        const label = document.getElementById('ambient-volume-val');
        if (label) label.textContent = `${val}%`;
    },

    updateAmbientUI() {
        const soundKeys = ['rain', 'waves', 'cafe', 'brown'];
        soundKeys.forEach(key => {
            const btn = document.getElementById(`ambient-btn-${key}`);
            if (btn) {
                if (this.activeAmbientSound === key) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    },

    initClock() {
        const clockEl = document.getElementById('clock-display');
        const dateEl = document.getElementById('date-display');
        const zenClockEl = document.getElementById('zen-clock');

        const update = () => {
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            if (clockEl) {
                clockEl.textContent = timeStr;
            }
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            }
            if (zenClockEl) {
                zenClockEl.textContent = timeStr;
            }
        };
        update();
        setInterval(update, 1000);
    },

    initWeather() {
        const weatherEl = document.querySelector('#weather-display span');
        if (weatherEl) {
            const temps = [22, 24, 25, 21, 23];
            const t = temps[Math.floor(Math.random() * temps.length)];
            weatherEl.textContent = `${t}°C - Despejado`;
        }
    },

    initQuotes() {
        const quotes = [
            '"La mejor forma de predecir el futuro es creándolo." – Peter Drucker',
            '"Tu tiempo es limitado, no lo malgastes viviendo la vida de otro." – Steve Jobs',
            '"La disciplina es el puente entre las metas y los logros." – Jim Rohn',
            '"Cree que puedes y ya estarás a mitad de camino." – Theodore Roosevelt'
        ];
        const el = document.getElementById('quote-display');
        if (el) el.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    },

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
            if (e.key === 'Escape') {
                this.closeModal('search-modal');
                this.closeModal('settings-modal');
                this.closeModal('add-bookmark-modal');
                this.closeModal('add-subject-modal');
                this.closeModal('add-event-modal');
                this.closeModal('backup-modal');
                this.closeModal('welcome-modal');
                this.closeModal('note-modal');
                this.closeModal('task-modal');
                this.closeModal('link-modal');
                this.closeModal('add-habit-modal');
                this.closeModal('set-budget-modal');
                this.closeModal('add-account-modal');
                this.closeModal('set-week-modal');
                this.closeModal('edit-schedule-modal');
                this.closeModal('confirm-modal');
            }
        });
    },

    openSearch() {
        this.openModal('search-modal');
        const input = document.getElementById('global-search-input');
        if (input) {
            input.value = '';
            input.focus();
        }
    },

    performGlobalSearch(query) {
        const container = document.getElementById('global-search-results');
        if (!container) return;

        query = query.toLowerCase().trim();
        if (!query) {
            container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Escribe para buscar...</p>';
            return;
        }

        const results = [];

        this.getTareasData().forEach(t => {
            if (t.text.toLowerCase().includes(query)) {
                results.push({ type: 'Tarea', text: t.text, action: () => this.navigateTo('tareas') });
            }
        });

        this.getNotasData().forEach(n => {
            if (n.title.toLowerCase().includes(query) || (n.content && n.content.toLowerCase().includes(query))) {
                results.push({ type: 'Nota', text: n.title, action: () => this.navigateTo('notas') });
            }
        });

        this.getSubjectsData().forEach(s => {
            if (s.name.toLowerCase().includes(query)) {
                results.push({ type: 'Materia', text: s.name, action: () => this.navigateTo('facultad') });
            }
        });

        if (results.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No se encontraron resultados.</p>`;
            return;
        }

        container.innerHTML = '';
        results.forEach(r => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:0.6rem 0.9rem; background:rgba(255,255,255,0.05); margin-bottom:0.4rem; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;';
            item.onclick = () => {
                this.closeModal('search-modal');
                r.action();
            };
            item.innerHTML = `<strong>${r.text}</strong><span style="font-size:0.75rem; color:var(--accent);">${r.type}</span>`;
            container.appendChild(item);
        });
    },

    toggleZenMode() {
        const overlay = document.getElementById('zen-overlay');
        if (!overlay) return;

        if (overlay.style.display === 'none' || !overlay.style.display) {
            overlay.style.display = 'flex';
            const now = new Date();
            document.getElementById('zen-clock').textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        } else {
            overlay.style.display = 'none';
        }
    },

    // --- PERFIL DE USUARIO GLOBAL ---
    toggleTopUserMenu(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('top-user-dropdown-menu');
        if (menu) menu.classList.toggle('active');
    },

    getUserProfile() {
        const cfg = this.getConfig();
        const saved = localStorage.getItem('userhub_profile');
        let profileName = cfg.userName || 'Usuario';
        let profileStatus = 'Estudiante y Planificador';

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.name) profileName = parsed.name;
                if (parsed.status) profileStatus = parsed.status;
            } catch(e) {}
        }
        return { name: profileName, status: profileStatus };
    },

    saveUserProfile(profile) {
        const cfg = this.getConfig();
        cfg.userName = profile.name;
        this.saveConfig(cfg);
        localStorage.setItem('userhub_profile', JSON.stringify(profile));
        this.renderUserProfile();
    },

    renderUserProfile() {
        const profile = this.getUserProfile();
        const name = profile.name || 'Usuario';
        const initial = name.charAt(0).toUpperCase();

        const greetingEl = document.getElementById('user-greeting');
        const sidebarNameEl = document.getElementById('sidebar-user-name');
        const topNameEl = document.getElementById('top-user-name');
        const topAvatarEl = document.getElementById('top-user-avatar-circle');
        const dropdownNameEl = document.getElementById('dropdown-user-name');
        const dropdownStatusEl = document.getElementById('dropdown-user-email');

        const modalAvatarEl = document.getElementById('profile-modal-avatar');
        const modalTitleEl = document.getElementById('profile-modal-title');

        if (greetingEl) greetingEl.textContent = `Hola, ${name}`;
        if (sidebarNameEl) sidebarNameEl.textContent = name;
        if (topNameEl) topNameEl.textContent = name;
        if (topAvatarEl) topAvatarEl.textContent = initial;
        if (dropdownNameEl) dropdownNameEl.textContent = name;
        if (dropdownStatusEl) dropdownStatusEl.textContent = profile.status || 'Perfil Personal';

        if (modalAvatarEl) modalAvatarEl.textContent = initial;
        if (modalTitleEl) modalTitleEl.textContent = name;
    },

    openUserProfileModal() {
        const profile = this.getUserProfile();
        const modalInputEl = document.getElementById('profile-username-input');
        const modalStatusInputEl = document.getElementById('profile-status-input');
        if (modalInputEl) modalInputEl.value = profile.name || '';
        if (modalStatusInputEl) modalStatusInputEl.value = profile.status || '';
        this.openModal('user-profile-modal');
    },

    saveUserProfileModal() {
        const nameInput = document.getElementById('profile-username-input');
        const statusInput = document.getElementById('profile-status-input');

        const newName = nameInput ? nameInput.value.trim() : '';
        const newStatus = statusInput ? statusInput.value.trim() : '';

        if (!newName) {
            this.showToast('Nombre Vacío', 'Por favor ingresa un nombre válido.', 'urgent');
            return;
        }

        const profile = { name: newName, status: newStatus || 'Estudiante y Planificador' };
        this.saveUserProfile(profile);
        this.closeModal('user-profile-modal');
        this.showToast('Perfil Actualizado', `¡Hola de nuevo, ${newName}!`, 'success');
    },

    // --- HÍBRIDO: FIREBASE GOOGLE AUTH + SINCRONIZACIÓN POR CÓDIGO PIN ---
    firebaseConfig: {
        apiKey: "AIzaSyBRCyd70VN4bXCrMAfMBfmwZmXJmrTPPEY",
        authDomain: "mi-dashboard-79a54.firebaseapp.com",
        projectId: "mi-dashboard-79a54",
        storageBucket: "mi-dashboard-79a54.firebasestorage.app",
        messagingSenderId: "85551588946",
        appId: "1:85551588946:web:57daf0bf1cf04d2ff3618b",
        measurementId: "G-CQJFEN6QWZ"
    },
    firebaseApp: null,
    db: null,
    currentUser: null,

    initCloudSync() {
        try {
            if (window.firebase && !firebase.apps.length) {
                this.firebaseApp = firebase.initializeApp(this.firebaseConfig);
                this.db = firebase.database();
                
                firebase.auth().onAuthStateChanged(user => {
                    this.currentUser = user;
                    this.updateAuthUI(user);
                    if (user) {
                        this.listenToUserCloudData(user.uid);
                    }
                });

                // Procesar resultado de redirección de Google en celulares
                firebase.auth().getRedirectResult().then(result => {
                    if (result && result.user) {
                        const user = result.user;
                        this.currentUser = user;
                        this.showToast('Sesión Iniciada', `Bienvenido/a, ${user.displayName || 'Usuario'}`, 'success');
                        if (user.displayName) {
                            const profile = { name: user.displayName, status: user.email || 'Cuenta de Google' };
                            this.saveUserProfile(profile);
                        }
                        this.syncDataToCloudUser(user.uid);
                    }
                }).catch(err => {
                    if (err.code === 'auth/unauthorized-domain') {
                        this.showUnauthorizedDomainModal();
                    }
                });
            }
        } catch(e) {
            console.warn('Firebase init info:', e);
        }

        this.renderSyncPinUI();

        // Iniciar escucha continua si hay un PIN de sincronización guardado
        const activePin = localStorage.getItem('userhub_sync_pin');
        if (activePin && this.db) {
            this.listenToPinCloudData(activePin);
        }
    },

    showUnauthorizedDomainModal() {
        const domain = window.location.hostname;
        this.openConfirmModal(
            '⚠️ Dominio No Autorizado en Firebase',
            `Tu página en "${domain}" necesita permiso en Firebase para conectar con Google.\n\nPasos (10 segundos):\n1. Ve a console.firebase.google.com\n2. Entra a Autenticación -> Ajustes -> Dominios autorizados\n3. Agrega "${domain}".`,
            () => {}
        );
    },

    getSyncPin() {
        let pin = localStorage.getItem('userhub_sync_pin');
        if (!pin) {
            const randomCode = Math.floor(100000 + Math.random() * 900000);
            pin = `PIN-${randomCode}`;
            localStorage.setItem('userhub_sync_pin', pin);
        }
        return pin;
    },

    isPinVisible: false,

    togglePinVisibility() {
        this.isPinVisible = !this.isPinVisible;
        this.renderSyncPinUI();
    },

    renderSyncPinUI() {
        const pinEl = document.getElementById('profile-sync-pin');
        const eyeIcon = document.getElementById('pin-eye-icon');
        const eyeLabel = document.getElementById('pin-eye-label');

        const pin = this.getSyncPin();
        if (pinEl) {
            if (this.isPinVisible) {
                pinEl.textContent = pin;
            } else {
                pinEl.textContent = 'PIN-••••••';
            }
        }
        if (eyeIcon) {
            eyeIcon.className = this.isPinVisible ? 'ph ph-eye-slash' : 'ph ph-eye';
        }
        if (eyeLabel) {
            eyeLabel.textContent = this.isPinVisible ? 'Ocultar' : 'Mostrar';
        }
    },

    copySyncPin() {
        const pin = this.getSyncPin();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pin).then(() => {
                this.showToast('PIN Copiado', `Copiado: ${pin}`, 'success');
            }).catch(() => {
                this.showToast('Tu PIN', pin, 'info');
            });
        } else {
            this.showToast('Tu PIN', pin, 'info');
        }
    },

    // OPCIÓN 1: GOOGLE AUTH
    loginWithGoogle() {
        if (!window.firebase) {
            this.showToast('Error de Conexión', 'No se pudieron cargar los componentes de Google.', 'urgent');
            return;
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        firebase.auth().signInWithPopup(provider).then(result => {
            const user = result.user;
            this.currentUser = user;
            this.showToast('Sesión Iniciada', `Bienvenido/a, ${user.displayName || 'Usuario'}`, 'success');
            
            if (user.displayName) {
                const profile = { name: user.displayName, status: user.email || 'Cuenta de Google' };
                this.saveUserProfile(profile);
            }
            
            this.syncDataToCloudUser(user.uid);
        }).catch(err => {
            if (err.code === 'auth/unauthorized-domain') {
                this.showUnauthorizedDomainModal();
            } else if (err.code === 'auth/operation-not-allowed') {
                this.openConfirmModal(
                    '⚠️ Google No Habilitado en Firebase',
                    'Debes activar Google en Firebase Console:\n\n1. Ve a console.firebase.google.com\n2. Entra a Autenticación -> Sign-in method\n3. Haz clic en Google, activa "Habilitar", selecciona tu email de soporte y haz clic en Guardar.',
                    () => {}
                );
            } else if (err.code === 'auth/popup-blocked') {
                firebase.auth().signInWithRedirect(provider);
            } else if (err.code !== 'auth/popup-closed-by-user') {
                this.showToast('Error de Login', err.message || 'Verifica la configuración de Google en Firebase.', 'urgent');
            }
        });
    },

    logoutGoogle() {
        if (window.firebase && firebase.auth()) {
            firebase.auth().signOut().then(() => {
                this.currentUser = null;
                this.updateAuthUI(null);
                this.showToast('Sesión Cerrada', 'Has salido de tu cuenta de Google.', 'info');
            });
        }
    },

    deleteAccountAndCloudData() {
        if (!this.currentUser) return;
        const email = this.currentUser.email || 'tu cuenta';
        this.openConfirmModal(
            '🗑️ ¿Eliminar Cuenta y Datos Cloud?',
            `¿ESTÁS SEGURO? Se dará de baja a ${email} y tu extensión de Firebase eliminará automáticamente todos tus datos guardados en la nube.`,
            () => {
                const user = firebase.auth().currentUser;
                if (user) {
                    user.delete().then(() => {
                        this.currentUser = null;
                        this.updateAuthUI(null);
                        this.showToast('Cuenta Eliminada', 'Se eliminó tu cuenta y la extensión borró los datos de la nube.', 'info');
                    }).catch(err => {
                        if (err.code === 'auth/requires-recent-login') {
                            const provider = new firebase.auth.GoogleAuthProvider();
                            firebase.auth().signInWithPopup(provider).then(res => {
                                if (res.user) {
                                    res.user.delete().then(() => {
                                        this.currentUser = null;
                                        this.updateAuthUI(null);
                                        this.showToast('Cuenta Eliminada', 'Se eliminó tu cuenta y la extensión borró los datos.', 'info');
                                    });
                                }
                            }).catch(() => {
                                this.showToast('Error', 'Se requiere verificación para eliminar.', 'urgent');
                            });
                        } else {
                            this.showToast('Error', err.message || 'No se pudo eliminar la cuenta.', 'urgent');
                        }
                    });
                }
            }
        );
    },

    updateAuthUI(user) {
        const badge = document.getElementById('google-status-badge');
        const container = document.getElementById('google-auth-container');

        if (user) {
            if (badge) {
                badge.textContent = 'Conectado';
                badge.style.background = 'rgba(52, 211, 153, 0.2)';
                badge.style.color = '#34d399';
            }
            if (container) {
                container.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; margin-bottom:0.5rem;">
                        <div style="display:flex; align-items:center; gap:0.6rem; overflow:hidden;">
                            ${user.photoURL ? `<img src="${user.photoURL}" style="width:32px; height:32px; border-radius:50%;">` : '<i class="ph ph-user-circle" style="font-size:1.8rem; color:#4285f4;"></i>'}
                            <div style="overflow:hidden;">
                                <strong style="font-size:0.85rem; display:block; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${user.displayName || 'Google User'}</strong>
                                <span style="font-size:0.75rem; color:var(--text-muted); display:block; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${user.email}</span>
                            </div>
                        </div>
                        <button type="button" class="btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.75rem;" onclick="app.logoutGoogle()">
                            <i class="ph ph-sign-out"></i> Salir
                        </button>
                    </div>
                    <div style="text-align:right;">
                        <button type="button" style="background:transparent; border:none; color:#ef4444; font-size:0.78rem; cursor:pointer; text-decoration:underline;" onclick="app.deleteAccountAndCloudData()">
                            <i class="ph ph-trash"></i> Eliminar Cuenta y Datos de la Nube
                        </button>
                    </div>
                `;
            }
        } else {
            if (badge) {
                badge.textContent = 'Sin Conectar';
                badge.style.background = 'rgba(255, 255, 255, 0.08)';
                badge.style.color = 'var(--text-muted)';
            }
            if (container) {
                container.innerHTML = `
                    <button type="button" class="btn-primary" style="width:100%; justify-content:center; background:#4285f4; border-color:#4285f4;" onclick="app.loginWithGoogle()">
                        <i class="ph ph-google-logo"></i> Iniciar Sesión con Google
                    </button>
                `;
            }
        }
    },

    getAllBackupPayload() {
        const payload = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('userhub_')) {
                payload[key] = localStorage.getItem(key);
            }
        }
        return payload;
    },

    isSyncingFromCloud: false,
    cloudSyncTimer: null,

    triggerAutoCloudSync() {
        if (this.isSyncingFromCloud) return;
        clearTimeout(this.cloudSyncTimer);
        this.cloudSyncTimer = setTimeout(() => {
            const payload = this.getAllBackupPayload();
            
            if (this.currentUser && this.db) {
                this.db.ref(`users/${this.currentUser.uid}`).set(payload);
            }
            
            const pin = localStorage.getItem('userhub_sync_pin');
            if (pin && this.db) {
                const safePin = pin.replace(/[^a-zA-Z0-9_-]/g, '');
                this.db.ref(`sync_pins/${safePin}`).set({
                    payload: payload,
                    updatedAt: Date.now()
                });
            }
        }, 1200);
    },

    applyBackupPayload(payload, isLive = false) {
        if (!payload || typeof payload !== 'object') return;
        let count = 0;
        this.isSyncingFromCloud = true;

        Object.keys(payload).forEach(k => {
            if (k.startsWith('userhub_')) {
                if (localStorage.getItem(k) !== payload[k]) {
                    localStorage.setItem(k, payload[k]);
                    count++;
                }
            }
        });

        this.isSyncingFromCloud = false;

        if (count > 0) {
            this.loadSettings();
            this.renderUserProfile();
            this.renderBookmarks();
            this.renderTareas();
            this.renderFinanzas();
            this.renderNotas();
            this.renderHabitos();
            this.initFacultad();
            this.renderHorario();
            this.renderLobbyGlobalCalendar();
            this.updateLobbyStats();
            this.updateNotificationsUI();

            if (!isLive) {
                this.showToast('Sincronizado', 'Datos actualizados desde la nube.', 'success');
            } else {
                this.showToast('Sincronización en Vivo', 'Se actualizaron datos desde tu otro dispositivo.', 'info');
            }
        }
    },

    syncDataToCloudUser(uid) {
        if (!this.db || !uid) return;
        const payload = this.getAllBackupPayload();
        const pin = this.getSyncPin();
        const safePin = pin.replace(/[^a-zA-Z0-9_-]/g, '');

        this.db.ref(`users/${uid}`).set(payload).then(() => {
            this.db.ref(`sync_pins/${safePin}`).set({
                payload: payload,
                updatedAt: Date.now()
            });
            this.showToast('Nube Conectada', 'Sincronización unificada con tu cuenta de Google y PIN.', 'success');
        }).catch(e => console.warn(e));
    },

    listenToUserCloudData(uid) {
        if (!this.db || !uid) return;
        // Escuchar en tiempo real bidireccional (.on)
        this.db.ref(`users/${uid}`).on('value', snapshot => {
            const val = snapshot.val();
            if (val) {
                this.applyBackupPayload(val, true);
            } else {
                this.syncDataToCloudUser(uid);
            }
        });
    },

    listenToPinCloudData(pin) {
        if (!this.db || !pin) return;
        const safePin = pin.replace(/[^a-zA-Z0-9_-]/g, '');
        this.db.ref(`sync_pins/${safePin}`).on('value', snapshot => {
            const data = snapshot.val();
            if (data && data.payload) {
                this.applyBackupPayload(data.payload, true);
            }
        });
    },

    lastSyncTime: 0,
    syncCooldownSeconds: 4,

    // OPCIÓN 2: SINCRONIZACIÓN POR CÓDIGO PIN (SIN CUENTA)
    syncNowCloud(action = 'upload') {
        const pin = this.getSyncPin();
        if (!this.db) {
            this.showToast('Sin Conexión', 'Se requiere conexión a la nube.', 'urgent');
            alert('⚠️ REALTIME DATABASE NO CONFIGURADA:\n\nPara activar la sincronización:\n1. Ve a console.firebase.google.com\n2. Entra a "Realtime Database" -> "Crear base de datos"\n3. Selecciona la ubicación y en la pestaña Reglas pon:\n{\n  "rules": {\n    ".read": true,\n    ".write": true\n  }\n}');
            return;
        }

        const now = Date.now();
        if (action === 'upload') {
            const timeDiff = (now - this.lastSyncTime) / 1000;
            if (timeDiff < this.syncCooldownSeconds) {
                const remaining = Math.ceil(this.syncCooldownSeconds - timeDiff);
                this.showToast('Espera un momento', `Espera ${remaining}s antes de volver a guardar.`, 'info');
                return;
            }
        }

        const safePin = pin.replace(/[^a-zA-Z0-9_-]/g, '');

        if (action === 'upload') {
            const payload = this.getAllBackupPayload();
            this.showToast('Subiendo...', 'Guardando copia de seguridad en la nube...', 'info');

            this.db.ref(`sync_pins/${safePin}`).set({
                payload: payload,
                updatedAt: Date.now()
            }).then(() => {
                this.lastSyncTime = Date.now();
                this.showToast('¡Guardado en Nube!', `Copia guardada exitosamente con tu PIN ${pin}.`, 'success');
            }).catch(err => {
                console.error('Error al subir a Firebase:', err);
                if (err.message && err.message.includes('PERMISSION_DENIED')) {
                    this.showToast('Permiso Denegado', 'Permite lectura/escritura en Realtime Database.', 'urgent');
                    alert('⚠️ REGLAS DE FIREBASE:\n\nDebes permitir lectura/escritura en tu Realtime Database:\n\n1. Ve a console.firebase.google.com -> Realtime Database -> Reglas\n2. Cambia las reglas a:\n{\n  "rules": {\n    ".read": true,\n    ".write": true\n  }\n}');
                } else {
                    this.showToast('Error de Red', err.message || 'No se pudo subir la copia.', 'urgent');
                    alert(`⚠️ ERROR EN BASE DE DATOS:\n\n${err.message || 'Asegúrate de haber hecho clic en "Crear base de datos" dentro del apartado Realtime Database en console.firebase.google.com.'}`);
                }
            });
        } else {
            this.showToast('Cargando...', 'Buscando tu copia en la nube...', 'info');
            this.db.ref(`sync_pins/${safePin}`).once('value').then(snapshot => {
                const data = snapshot.val();
                if (data && data.payload) {
                    this.applyBackupPayload(data.payload);
                    this.listenToPinCloudData(pin);
                    this.showToast('¡Copia Restaurada!', 'Datos cargados exitosamente.', 'success');
                } else {
                    this.showToast('Sin Datos', `No hay copia guardada para el PIN ${pin}.`, 'info');
                }
            }).catch(err => {
                console.error('Error al cargar de Firebase:', err);
                this.showToast('Error al Cargar', err.message || 'Verifica tu conexión a la nube.', 'urgent');
            });
        }
    },

    linkDevicePin() {
        const input = document.getElementById('link-pin-input');
        let rawPin = input ? input.value.trim().toUpperCase() : '';
        if (!rawPin) {
            this.showToast('PIN Vacío', 'Por favor ingresa un código PIN válido (ej: PIN-123456).', 'urgent');
            return;
        }

        if (!rawPin.startsWith('PIN-')) {
            rawPin = `PIN-${rawPin}`;
        }

        if (!this.db) {
            this.showToast('Sin Conexión', 'Se requiere conexión a la nube.', 'urgent');
            alert('⚠️ REALTIME DATABASE NO CONFIGURADA:\n\nCrea tu Realtime Database en console.firebase.google.com primero.');
            return;
        }

        const safePin = rawPin.replace(/[^a-zA-Z0-9_-]/g, '');
        this.showToast('Buscando PIN...', `Verificando ${rawPin} en la nube...`, 'info');

        this.db.ref(`sync_pins/${safePin}`).once('value').then(snapshot => {
            const data = snapshot.val();
            if (data && data.payload) {
                localStorage.setItem('userhub_sync_pin', rawPin);
                this.renderSyncPinUI();
                this.applyBackupPayload(data.payload);
                this.listenToPinCloudData(rawPin);
                if (input) input.value = '';
                this.showToast('¡Vínculo Exitoso!', `Dispositivo vinculado con el ${rawPin}. Datos actualizados.`, 'success');
            } else {
                this.showToast('PIN No Encontrado', `No hay datos guardados bajo el ${rawPin}. Presiona "Guardar en Nube" en tu otro dispositivo primero.`, 'urgent');
                alert(`⚠️ NO HAY DATOS PARA ${rawPin}:\n\nPrimero presiona "Guardar en Nube" en el otro dispositivo donde creaste tus tareas para subirlas.`);
            }
        }).catch(err => {
            console.error('Error al vincular PIN:', err);
            this.showToast('Error de Conexión', err.message || 'No se pudo verificar el PIN en la nube.', 'urgent');
            alert(`⚠️ ERROR AL VINCULAR:\n\n${err.message || 'Verifica que la Realtime Database esté creada en console.firebase.google.com.'}`);
        });
    },

    // --- CENTRO DE NOTIFICACIONES Y ALERTAS INTELIGENTES ---
    toggleNotificationsMenu(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('top-notif-dropdown-menu');
        if (menu) {
            menu.classList.toggle('active');
            if (menu.classList.contains('active')) {
                this.updateNotificationsUI();
            }
        }
    },

    getSystemNotifications() {
        const notifs = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // 1. Exámenes & Compromisos Académicos Próximos (en <= 7 días)
        const subjects = this.getSubjectsData();
        subjects.forEach(sub => {
            if (sub.events) {
                sub.events.forEach(ev => {
                    if (ev.dates && ev.dates.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const dateObj = new Date(ev.dates + 'T00:00:00');
                        const diffDays = Math.ceil((dateObj - now) / (1000 * 60 * 60 * 24));
                        
                        if (diffDays === 0) {
                            notifs.push({
                                type: 'urgent',
                                icon: 'ph-warning',
                                iconColor: '#ef4444',
                                title: `¡HOY! Examen en ${sub.name}`,
                                desc: `${ev.title} programado para el día de hoy.`,
                                action: () => this.navigateTo('facultad')
                            });
                        } else if (diffDays === 1) {
                            notifs.push({
                                type: 'urgent',
                                icon: 'ph-bell-ringing',
                                iconColor: '#f59e0b',
                                title: `Mañana: Examen en ${sub.name}`,
                                desc: `${ev.title} se rinde mañana.`,
                                action: () => this.navigateTo('facultad')
                            });
                        } else if (diffDays > 1 && diffDays <= 5) {
                            notifs.push({
                                type: 'info',
                                icon: 'ph-calendar-check',
                                iconColor: '#60a5fa',
                                title: `En ${diffDays} días: ${sub.name}`,
                                desc: `${ev.title} (${ev.dates}).`,
                                action: () => this.navigateTo('facultad')
                            });
                        }
                    }
                });
            }
        });

        // 2. Alertas de Presupuesto Financiero
        const finanzas = this.getFinanzasData();
        const budgetLimit = finanzas.budgetLimit || 50000;
        let totalExpensesMonth = 0;
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        finanzas.transactions.forEach(t => {
            if (t.type === 'expense' && t.date) {
                const parts = t.date.split('/');
                if (parts.length === 3) {
                    const m = parseInt(parts[1], 10) - 1;
                    const y = parseInt(parts[2], 10);
                    if (m === currentMonth && y === currentYear) {
                        totalExpensesMonth += t.amount;
                    }
                }
            }
        });

        const budgetPct = Math.round((totalExpensesMonth / budgetLimit) * 100);
        if (budgetPct >= 100) {
            notifs.push({
                type: 'urgent',
                icon: 'ph-trend-up',
                iconColor: '#ef4444',
                title: 'Presupuesto Mensual Excedido',
                desc: `Has gastado $${totalExpensesMonth.toLocaleString()} de tu límite de $${budgetLimit.toLocaleString()} (${budgetPct}%).`,
                action: () => this.navigateTo('finanzas')
            });
        } else if (budgetPct >= 80) {
            notifs.push({
                type: 'warning',
                icon: 'ph-receipt',
                iconColor: '#fbbf24',
                title: `Presupuesto al ${budgetPct}%`,
                desc: `Te quedan $${(budgetLimit - totalExpensesMonth).toLocaleString()} disponibles este mes.`,
                action: () => this.navigateTo('finanzas')
            });
        }

        // 3. Racha de Hábitos
        const habitos = this.getHabitosData();
        const todayStr = now.toISOString().slice(0, 10);
        let doneToday = 0;
        if (habitos.records[todayStr]) {
            Object.values(habitos.records[todayStr]).forEach(v => { if (v) doneToday++; });
        }
        if (habitos.list.length > 0 && doneToday < habitos.list.length) {
            const pendingHabits = habitos.list.length - doneToday;
            notifs.push({
                type: 'info',
                icon: 'ph-fire',
                iconColor: '#f97316',
                title: 'Hábitos Pendientes Hoy',
                desc: `Te falta${pendingHabits>1?'n':''} completar ${pendingHabits} hábito${pendingHabits>1?'s':''} para mantener tu racha.`,
                action: () => this.navigateTo('gimnasio')
            });
        }

        // 4. Tareas Pendientes
        const tareas = this.getTareasData();
        const pendingTareas = tareas.filter(t => !t.completed).length;
        if (pendingTareas > 0) {
            notifs.push({
                type: 'info',
                icon: 'ph-check-square',
                iconColor: '#34d399',
                title: `${pendingTareas} Tarea${pendingTareas>1?'s':''} Pendiente${pendingTareas>1?'s':''}`,
                desc: 'Organiza tu día completando tus pendientes.',
                action: () => this.navigateTo('tareas')
            });
        }

        return notifs;
    },

    updateNotificationsUI() {
        const notifs = this.getSystemNotifications();
        const badgeEl = document.getElementById('top-notif-badge');
        const countLabel = document.getElementById('notif-count-label');
        const listEl = document.getElementById('top-notif-items-list');

        // Banner en el Lobby
        const bannerEl = document.getElementById('lobby-urgent-alert-banner');
        const bannerTitle = document.getElementById('lobby-urgent-alert-title');
        const bannerMsg = document.getElementById('lobby-urgent-alert-msg');
        const bannerBtn = document.getElementById('lobby-urgent-alert-btn');

        if (badgeEl) {
            if (notifs.length > 0) {
                badgeEl.style.display = 'flex';
                badgeEl.textContent = notifs.length;
            } else {
                badgeEl.style.display = 'none';
            }
        }

        if (countLabel) {
            countLabel.textContent = `${notifs.length} aviso${notifs.length!==1?'s':''}`;
        }

        if (listEl) {
            listEl.innerHTML = '';
            if (notifs.length === 0) {
                listEl.innerHTML = `
                    <div style="text-align:center; padding:1.5rem 0.5rem; color:var(--text-muted);">
                        <i class="ph ph-check-circle" style="font-size:1.8rem; color:#10b981; display:block; margin-bottom:0.3rem;"></i>
                        <span style="font-size:0.85rem;">¡Todo al día! Sin alertas pendientes.</span>
                    </div>
                `;
            } else {
                notifs.forEach(n => {
                    const item = document.createElement('div');
                    item.className = 'notif-item';
                    item.onclick = () => {
                        const menu = document.getElementById('top-notif-dropdown-menu');
                        if (menu) menu.classList.remove('active');
                        if (typeof n.action === 'function') n.action();
                    };

                    item.innerHTML = `
                        <i class="ph ${n.icon} notif-item-icon" style="color:${n.iconColor};"></i>
                        <div class="notif-item-content">
                            <strong class="notif-item-title">${n.title}</strong>
                            <p class="notif-item-desc">${n.desc}</p>
                        </div>
                    `;
                    listEl.appendChild(item);
                });
            }
        }

        // Configurar el banner urgente en el Lobby si hay avisos 'urgent'
        const urgentAlert = notifs.find(n => n.type === 'urgent');
        if (bannerEl) {
            if (urgentAlert) {
                bannerEl.style.display = 'flex';
                if (bannerTitle) bannerTitle.textContent = urgentAlert.title;
                if (bannerMsg) bannerMsg.textContent = urgentAlert.desc;
                if (bannerBtn) {
                    bannerBtn.onclick = () => {
                        if (typeof urgentAlert.action === 'function') urgentAlert.action();
                    };
                }
            } else {
                bannerEl.style.display = 'none';
            }
        }
    }
};

// Cerrar menús desplegables al hacer click fuera
document.addEventListener('click', (e) => {
    const menu = document.getElementById('account-dropdown-menu');
    const container = document.querySelector('.custom-account-dropdown-container');
    if (menu && container && !container.contains(e.target)) {
        menu.classList.remove('active');
    }

    const topMenu = document.getElementById('top-user-dropdown-menu');
    const topContainer = document.querySelector('.top-user-profile-container');
    if (topMenu && topContainer && !topContainer.contains(e.target)) {
        topMenu.classList.remove('active');
    }

    const notifMenu = document.getElementById('top-notif-dropdown-menu');
    const notifContainer = document.querySelector('.top-notif-container');
    if (notifMenu && notifContainer && !notifContainer.contains(e.target)) {
        notifMenu.classList.remove('active');
    }

    document.querySelectorAll('.custom-glass-select-menu').forEach(gMenu => {
        const gContainer = gMenu.closest('.custom-glass-select-container');
        if (gContainer && !gContainer.contains(e.target)) {
            gMenu.classList.remove('active');
        }
    });
});

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
