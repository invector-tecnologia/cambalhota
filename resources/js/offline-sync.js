/**
 * Sistema de Sincronização Offline para Tavolo
 * Detecta desconexão e sincroniza automaticamente quando voltar online
 */

class OfflineSyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.dbName = 'tavolo-sync-db';
    this.storeName = 'sync-queue';
    this.cacheStoreName = 'response-cache';
    this.db = null;
    this.isSyncing = false;
    this.queueMaxSize = 500;
    this.cacheMaxSize = 2000;
    this.preCacheVersion = 'v1';
    this.preCacheKey = `tavolo-precache-${this.preCacheVersion}`;
    this.criticalRoutes = [
      '/dashboard',
      '/comandas',
      '/comandas/nova',
      '/comandas/pedidos',
      '/comandas/pedidos/novo',
      '/cozinha',
      '/financeiro/vendas',
      '/financeiro/vendas/nova',
      '/cardapio/produtos',
      '/cardapio/produtos/novo',
      '/financeiro/caixa',
      '/financeiro/caixa/atual',
      '/mesas',
      '/mesas/nova',
      '/funcionarios',
      '/funcionarios/novo'
    ];
    this.criticalApiUrls = [
      '/api/tables',
      '/api/orders/stats',
      '/api/sales/stats',
      '/api/cash-registers/stats',
      '/api/financeiro/caixa/atual/dados',
      '/api/menu/items',
      '/api/menu/categories'
    ];
    
    this.init();
  }

  isSupportTicketRoute() {
    const path = window.location.pathname || ''
    return path.startsWith('/suporte/tickets')
  }

  shouldRenderSupportIndicator() {
    return this.isSupportTicketRoute()
  }

  removeIndicator() {
    const indicator = document.getElementById('offline-sync-indicator')
    if (indicator) {
      indicator.remove()
    }
  }

  applyIndicatorClass(indicator, status) {
    const classes = ['offline-indicator', status]
    if (this.isSupportTicketRoute()) {
      classes.push('support-ticket-context')
    }
    indicator.className = classes.join(' ')
  }

  getConnectionLabels() {
    if (this.isSupportTicketRoute()) {
      return {
        online: 'Suporte online',
        offline: 'Suporte offline (modo local)'
      }
    }

    return {
      online: 'Online',
      offline: 'Offline (modo local)'
    }
  }

  getSyncMessagePrefix() {
    return this.isSupportTicketRoute() ? 'Suporte: ' : ''
  }

  /**
   * Inicializar o sistema
   */
  async init() {
    await this.initDB();
    await this.registerServiceWorker();
    this.setupEventListeners();
    this.showConnectionStatus();
    
    // Se voltar online, sincronizar
    if (this.isOnline) {
      await this.loadQueueFromDB();
      if (this.syncQueue.length > 0) {
        this.sync();
      }
      this.prepareOfflineCache();
    }
  }

  /**
   * Inicializar IndexedDB
   */
  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(this.cacheStoreName)) {
          const cacheStore = db.createObjectStore(this.cacheStoreName, { keyPath: 'url' });
          cacheStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  /**
   * Registrar Service Worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[Offline] Service Worker não suportado');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[Offline] Service Worker registrado:', registration);

      // Escutar mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, action } = event.data;
        if (type === 'SYNC_QUEUE' && action === 'start') {
          this.sync();
        }
      });
    } catch (error) {
      console.error('[Offline] Erro ao registrar Service Worker:', error);
    }
  }

  /**
   * Configurar listeners de conexão
   */
  setupEventListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    document.addEventListener('submit', (event) => this.handleFormSubmit(event), true);
  }

  /**
   * Quando volta online
   */
  async handleOnline() {
    this.isOnline = true;
    console.log('[Offline] Voltou online!');
    this.showConnectionStatus();
    this.hideQueuePanel();
    
    // Sincronizar que com delay para garantir conexão estável
    setTimeout(() => {
      this.sync();
    }, 1000);
  }

  /**
   * Quando perde conexão
   */
  handleOffline() {
    this.isOnline = false;
    console.log('[Offline] Perdeu conexão com a internet');
    this.showConnectionStatus();
    this.updateQueuePanel();
  }

  /**
   * Adicionar requisição à fila de sincronização
   */
  async addToQueue(request) {
    const bodyData = await this.readRequestBody(request);
    const item = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      headers: this.serializeHeaders(request.headers),
      body: bodyData.body,
      bodyType: bodyData.bodyType,
      contentType: bodyData.contentType,
      retries: 0,
      maxRetries: 3
    };

    if (this.syncQueue.length >= this.queueMaxSize) {
      this.syncQueue.shift();
    }

    this.syncQueue.push(item);
    await this.saveQueueToDB();
    await this.registerBackgroundSync();
    this.updateQueuePanel();

    // Se offline, avisar o usuário
    if (!this.isOnline) {
      this.showSyncStatus('offline', 'Seus dados serão salvos quando voltar online');
    }

    console.log('[Offline] Requisição adicionada à fila:', item);
    return item;
  }

  /**
   * Preparar body para armazenamento seguro
   */
  async readRequestBody(request) {
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return { body: null, bodyType: null, contentType: null };
    }

    const contentType = request.headers.get('content-type');
    try {
      const textBody = await request.clone().text();
      return {
        body: textBody,
        bodyType: 'text',
        contentType
      };
    } catch (error) {
      console.warn('[Offline] Falha ao ler body da requisição:', error);
      return { body: null, bodyType: null, contentType };
    }
  }

  /**
   * Serializar headers (alguns não serializam)
   */
  serializeHeaders(headers) {
    const serialized = {};
    if (headers.forEach) {
      headers.forEach((value, key) => {
        if (!['content-length'].includes(key.toLowerCase())) {
          serialized[key] = value;
        }
      });
    }
    return serialized;
  }

  /**
   * Salvar fila no IndexedDB
   */
  async saveQueueToDB() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Limpar anteriores
      store.clear();

      // Salvar novos
      this.syncQueue.forEach((item) => {
        store.add(item);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Carregar fila do IndexedDB
   */
  async loadQueueFromDB() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        this.syncQueue = request.result;
        console.log('[Offline] Fila carregada do DB:', this.syncQueue.length, 'itens');
        this.updateQueuePanel();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sincronizar fila
   */
  async sync() {
    if (!this.isOnline || this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.showSyncStatus('syncing', 'Sincronizando dados...');

    console.log('[Offline] Iniciando sincronização de', this.syncQueue.length, 'itens');

    const failedItems = [];

    for (let i = 0; i < this.syncQueue.length; i++) {
      const item = this.syncQueue[i];
      const success = await this.syncItem(item);

      if (!success) {
        failedItems.push(i);
      }
    }

    // Remover itens sincronizados
    this.syncQueue = this.syncQueue.filter((_, i) => failedItems.includes(i));
    await this.saveQueueToDB();
    this.updateQueuePanel();

    this.isSyncing = false;

    if (this.syncQueue.length === 0) {
      this.showSyncStatus('success', 'Todos os dados foram sincronizados com sucesso!');
      console.log('[Offline] Sincronização concluída com sucesso');
    } else {
      this.showSyncStatus('error', `${this.syncQueue.length} itens não foram sincronizados`);
      console.error('[Offline] Falha ao sincronizar itens:', this.syncQueue.length);
    }
  }

  /**
   * Sincronizar um item individual
   */
  async syncItem(item) {
    try {
      const headers = { ...(item.headers || {}) };
      if (item.contentType && !headers['content-type']) {
        headers['content-type'] = item.contentType;
      }

      const body = item.bodyType === 'text' ? item.body : undefined;
      const response = await fetch(item.url, {
        method: item.method,
        headers,
        body,
        credentials: 'include'
      });

      if (response.ok) {
        console.log('[Offline] Item sincronizado:', item.url);
        return true;
      } else if (response.status === 401 || response.status === 403) {
        // Erro de autenticação - não fazer retry
        console.error('[Offline] Erro de autenticação, não será retentado');
        return true; // Remover da fila
      } else {
        item.retries += 1;
        if (item.retries < item.maxRetries) {
          console.warn('[Offline] Erro ao sincronizar, tentará novamente:', item.url);
          return false;
        }
        return true; // Remover após maxRetries
      }
    } catch (error) {
      item.retries += 1;
      if (item.retries < item.maxRetries) {
        console.warn('[Offline] Erro de conexão ao sincronizar:', error.message);
        return false;
      }
      return true; // Remover após maxRetries
    }
  }

  /**
   * Mostra o status de conexão
   */
  showConnectionStatus() {
    if (!this.shouldRenderSupportIndicator()) {
      this.removeIndicator()
      return
    }

    const indicator = this.getOrCreateIndicator();
    const labels = this.getConnectionLabels();
    
    if (this.isOnline) {
      this.applyIndicatorClass(indicator, 'online');
      indicator.textContent = labels.online;
      indicator.setAttribute('aria-label', labels.online);
      indicator.setAttribute('title', labels.online);
    } else {
      this.applyIndicatorClass(indicator, 'offline');
      indicator.textContent = labels.offline;
      indicator.setAttribute('aria-label', labels.offline);
      indicator.setAttribute('title', labels.offline);
    }
  }

  /**
   * Mostrar status de sincronização
   */
  showSyncStatus(status, message) {
    if (!this.shouldRenderSupportIndicator()) {
      return
    }

    const indicator = this.getOrCreateIndicator();
    const prefix = this.getSyncMessagePrefix();
    
    const statusIcon = {
      syncing: '⟳ ',
      success: '✓ ',
      error: '⚠ ',
      offline: '⛔ '
    };

    this.applyIndicatorClass(indicator, status);
    const fullMessage = `${statusIcon[status] || ''}${prefix}${message}`;
    indicator.textContent = fullMessage;
    indicator.setAttribute('aria-label', fullMessage);
    indicator.setAttribute('title', fullMessage);

    // Auto-esconder após 5 segundos (se não for offline)
    if (status !== 'offline' && this.isOnline) {
      setTimeout(() => this.showConnectionStatus(), 5000);
    }
  }

  /**
   * Obter ou criar indicador visual
   */
  getOrCreateIndicator() {
    let indicator = document.getElementById('offline-sync-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-sync-indicator';
      indicator.className = 'offline-indicator';
      indicator.setAttribute('role', 'status');
      indicator.setAttribute('aria-live', 'polite');
      document.body.appendChild(indicator);
    }
    
    return indicator;
  }

  /**
   * Painel de fila offline
   */
  getOrCreateQueuePanel() {
    let panel = document.getElementById('offline-queue-panel');
    let toggle = document.getElementById('offline-queue-toggle');

    if (!toggle) {
      toggle = document.createElement('button');
      toggle.id = 'offline-queue-toggle';
      toggle.type = 'button';
      toggle.textContent = 'Fila offline';
      toggle.style.position = 'fixed';
      toggle.style.bottom = '96px';
      toggle.style.right = '16px';
      toggle.style.zIndex = '70';
      toggle.style.padding = '8px 12px';
      toggle.style.borderRadius = '8px';
      toggle.style.border = '1px solid #e5e7eb';
      toggle.style.background = '#ffffff';
      toggle.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
      toggle.style.cursor = 'pointer';
      toggle.style.display = 'none';
      document.body.appendChild(toggle);
    }

    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'offline-queue-panel';
      panel.style.position = 'fixed';
      panel.style.bottom = '136px';
      panel.style.right = '16px';
      panel.style.zIndex = '70';
      panel.style.width = '360px';
      panel.style.maxHeight = '60vh';
      panel.style.overflow = 'auto';
      panel.style.background = '#ffffff';
      panel.style.border = '1px solid #e5e7eb';
      panel.style.borderRadius = '12px';
      panel.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12)';
      panel.style.display = 'none';
      panel.innerHTML = `
        <div style="padding: 12px 14px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">
          Fila offline
          <span id="offline-queue-count" style="margin-left: 8px; color: #6b7280; font-weight: 500;">0</span>
          <button id="offline-queue-action" type="button" style="float:right; font-size: 12px; color:#2563eb; background: none; border: none; cursor: pointer;">Preparar offline</button>
        </div>
        <div id="offline-queue-list" style="padding: 10px 14px; font-size: 13px; color: #111827;"></div>
      `;
      document.body.appendChild(panel);
    }

    toggle.onclick = () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };

    return panel;
  }

  hideQueuePanel() {
    const panel = document.getElementById('offline-queue-panel');
    const toggle = document.getElementById('offline-queue-toggle');

    if (panel) {
      panel.style.display = 'none';
    }

    if (toggle) {
      toggle.style.display = 'none';
    }
  }

  updateQueuePanel() {
    if (this.isOnline) {
      this.hideQueuePanel();
      return;
    }

    const panel = this.getOrCreateQueuePanel();
    const count = panel.querySelector('#offline-queue-count');
    const list = panel.querySelector('#offline-queue-list');
    const action = panel.querySelector('#offline-queue-action');

    const toggle = document.getElementById('offline-queue-toggle');
    if (toggle) {
      toggle.style.display = 'block';
    }

    if (!count || !list) {
      return;
    }

    if (action) {
      action.onclick = () => this.prepareOfflineCache(true);
    }

    count.textContent = `(${this.syncQueue.length})`;

    if (this.syncQueue.length === 0) {
      list.innerHTML = '<div style="color:#6b7280;">Nenhum item pendente.</div>';
      return;
    }

    const itemsHtml = this.syncQueue.map((item) => {
      const date = new Date(item.timestamp).toLocaleString();
      let path = item.url;
      try {
        const parsed = new URL(item.url);
        path = parsed.pathname + parsed.search;
      } catch {
        path = item.url;
      }
      const status = item.retries > 0
        ? `Tentativas: ${item.retries}/${item.maxRetries}`
        : 'Pendente';
      return `
        <div style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
          <div style="font-weight: 600;">${item.method} ${path}</div>
          <div style="color:#6b7280;">${date} · ${status}</div>
        </div>
      `;
    }).join('');

    list.innerHTML = itemsHtml;
  }

  /**
   * Interceptar submit de formularios quando offline
   */
  async handleFormSubmit(event) {
    if (this.isOnline) {
      return;
    }

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const method = (form.method || 'POST').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return;
    }

    event.preventDefault();

    const action = form.action || window.location.href;
    const formData = new FormData(form);
    const bodyText = new URLSearchParams(formData).toString();

    const headers = {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
    };

    const request = new Request(action, {
      method,
      headers,
      body: bodyText,
      credentials: 'include'
    });

    await this.addToQueue(request);
    this.showSyncStatus('offline', 'Formulario salvo localmente. Vai sincronizar quando voltar online.');
  }

  /**
   * Registrar sync em background quando suportado
   */
  async registerBackgroundSync() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await registration.sync.register('sync-queue');
      }
    } catch (error) {
      console.warn('[Offline] Falha ao registrar background sync:', error);
    }
  }

  /**
   * Cachear resposta JSON para uso offline
   */
  async saveResponseToCache(requestUrl, data) {
    if (!this.db) {
      return;
    }

    const transaction = this.db.transaction([this.cacheStoreName], 'readwrite');
    const store = transaction.objectStore(this.cacheStoreName);
    store.put({
      url: requestUrl,
      timestamp: new Date().toISOString(),
      data
    });

    await new Promise((resolve) => {
      transaction.oncomplete = resolve;
      transaction.onerror = resolve;
    });

    await this.trimCacheStore();
  }

  async trimCacheStore() {
    if (!this.db) {
      return;
    }

    const transaction = this.db.transaction([this.cacheStoreName], 'readonly');
    const store = transaction.objectStore(this.cacheStoreName);
    const countRequest = store.count();

    const count = await new Promise((resolve) => {
      countRequest.onsuccess = () => resolve(countRequest.result || 0);
      countRequest.onerror = () => resolve(0);
    });

    if (count <= this.cacheMaxSize) {
      return;
    }

    const excess = count - this.cacheMaxSize;
    const cleanupTx = this.db.transaction([this.cacheStoreName], 'readwrite');
    const cleanupStore = cleanupTx.objectStore(this.cacheStoreName);
    const index = cleanupStore.index('timestamp');
    let removed = 0;

    await new Promise((resolve) => {
      index.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor || removed >= excess) {
          resolve();
          return;
        }
        cleanupStore.delete(cursor.primaryKey);
        removed += 1;
        cursor.continue();
      };
    });
  }

  async loadCachedResponse(requestUrl) {
    if (!this.db) {
      return null;
    }

    const transaction = this.db.transaction([this.cacheStoreName], 'readonly');
    const store = transaction.objectStore(this.cacheStoreName);
    const request = store.get(requestUrl);

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  /**
   * Pre-cache de rotas e endpoints criticos
   */
  async prepareOfflineCache(force = false) {
    if (!this.isOnline) {
      return;
    }

    if (!force && localStorage.getItem(this.preCacheKey) === 'done') {
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'CACHE_URLS',
            data: { urls: this.criticalRoutes }
          });
        }
      }

      await Promise.allSettled(
        this.criticalRoutes.map((url) => fetch(url, { credentials: 'include' }))
      );

      await Promise.allSettled(
        this.criticalApiUrls.map((url) => fetch(url, { credentials: 'include' }))
      );

      localStorage.setItem(this.preCacheKey, 'done');
    } catch (error) {
      console.warn('[Offline] Falha ao preparar cache offline:', error);
    }
  }
}

/**
 * Interceptar requisições AJAX (Fetch API)
 */
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [resource, config] = args;
  const request = new Request(resource, config);
  const queuedRequest = request.clone();

  // Sincronizar requisicoes que alteram dados
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return originalFetch.apply(this, args)
      .then(response => {
        // Se sucesso, retornar normalmente
        if (response.ok) {
          return response;
        }
        // Se erro de conexão, adicionar à fila
        if (!navigator.onLine) {
          syncManager.addToQueue(queuedRequest);
        }
        return response;
      })
      .catch(error => {
        // Se erro de rede, adicionar à fila
        if (!navigator.onLine) {
          syncManager.addToQueue(queuedRequest);
          // Retornar resposta falsa para o código continuar
          return new Response(
            JSON.stringify({
              error: true,
              message: 'Salvando localmente. Será sincronizado quando voltar online.',
              offline: true
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        throw error;
      });
  }

  // Para GET JSON, tentar cache local quando offline
  if (request.method === 'GET') {
    return originalFetch.apply(this, args)
      .then(async response => {
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const cloned = response.clone();
          try {
            const data = await cloned.json();
            syncManager.saveResponseToCache(request.url, data);
          } catch {
            // Ignorar falha de parsing
          }
        }
        return response;
      })
      .catch(async error => {
        if (!navigator.onLine) {
          const cached = await syncManager.loadCachedResponse(request.url);
          if (cached) {
            return new Response(JSON.stringify(cached.data), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' }
            });
          }
        }
        throw error;
      });
  }

  return originalFetch.apply(this, args);
};

// Inicializar quando o DOM estiver pronto
let syncManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    syncManager = new OfflineSyncManager();
  });
} else {
  syncManager = new OfflineSyncManager();
}

// Expor para uso global
window.OfflineSyncManager = OfflineSyncManager;
window.syncManager = syncManager;
