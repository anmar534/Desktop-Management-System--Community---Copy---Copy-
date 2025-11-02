/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const { contextBridge, ipcRenderer } = require('electron')

const UPDATE_EVENT_CHANNELS = new Set(['update-available', 'update-downloaded'])

const subscribeToUpdateChannel = (channel, callback) => {
  if (!UPDATE_EVENT_CHANNELS.has(channel) || typeof callback !== 'function') {
    return () => {
      /* noop */
    }
  }

  const handler = (_event, payload) => {
    try {
      callback(payload)
    } catch (error) {
      console.warn(`⚠️ [preload] update handler for ${channel} threw:`, error)
    }
  }

  ipcRenderer.on(channel, handler)

  return () => {
    ipcRenderer.removeListener(channel, handler)
  }
}

// تعريض APIs آمنة للعملية المرئية
contextBridge.exposeInMainWorld('electronAPI', {
  // واجهة التخزين المحلي
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key),
    clear: () => ipcRenderer.invoke('store-clear')
  },

  // واجهة التخزين المؤمَّن
  secureStore: {
    get: (key) => ipcRenderer.invoke('secure-store-get', key),
    set: (key, value) => ipcRenderer.invoke('secure-store-set', key, value),
    delete: (key) => ipcRenderer.invoke('secure-store-delete', key),
    clear: () => ipcRenderer.invoke('secure-store-clear')
  },

  // واجهة التطبيق
  app: {
    quit: () => ipcRenderer.invoke('app-quit'),
    minimize: () => ipcRenderer.invoke('app-minimize'),
    maximize: () => ipcRenderer.invoke('app-maximize'),
    close: () => ipcRenderer.invoke('app-close'),
    getVersion: () => ipcRenderer.invoke('app-get-version')
  },

  lifecycle: {
    ack: (payload) => ipcRenderer.invoke('lifecycle-ack', payload)
  },

  // واجهة نظام الملفات
  fs: {
    readFile: (path) => ipcRenderer.invoke('fs-read-file', path),
    writeFile: (path, data) => ipcRenderer.invoke('fs-write-file', path, data),
    exists: (path) => ipcRenderer.invoke('fs-file-exists', path)
  },

  // واجهة الحوارات
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog-open-file', options),
    saveFile: (options) => ipcRenderer.invoke('dialog-save-file', options)
  },

  // واجهة ميزات سطح المكتب المؤمنة
  desktop: {
    secureAction: (payload) => ipcRenderer.invoke('desktop-secure-action', payload)
  },

  updates: {
    check: () => ipcRenderer.invoke('check-for-updates'),
    onAvailable: (callback) => subscribeToUpdateChannel('update-available', callback),
    onDownloaded: (callback) => subscribeToUpdateChannel('update-downloaded', callback)
  },

  // مستمعات الأحداث
  on: (channel, callback) => {
    const validChannels = [
      'navigate-to',
      'import-file', 
      'export-report',
      'update-available',
      'update-downloaded',
      'system-lifecycle'
    ]
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback)
    }
  },

  // إزالة مستمعات الأحداث
  removeListener: (channel, callback) => {
    const validChannels = [
      'navigate-to',
      'import-file',
      'export-report', 
      'update-available',
      'update-downloaded',
      'system-lifecycle'
    ]
    
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback)
    }
  },

  // إرسال أحداث للعملية الرئيسية
  send: (channel, data) => {
    const validChannels = [
      'window-ready',
      'section-changed',
      'data-updated'
    ]
    
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  }
})

// تعريض معلومات البيئة
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron
})

// إعداد معالجات الأحداث العامة
window.addEventListener('DOMContentLoaded', () => {
  // إعداد اللغة والاتجاه
  document.documentElement.setAttribute('dir', 'rtl')
  document.documentElement.setAttribute('lang', 'ar')
  
  // إضافة كلاس للتطبيق للتمييز عن بيئة المتصفح
  document.body.classList.add('electron-app')
  
  // منع السحب والإفلات للملفات على النافذة
  document.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })
  
  document.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })
  
  // منع قائمة النقر اليمين الافتراضية
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })
  
  // منع تحديد النصوص بالسحب (اختياري)
  document.onselectstart = () => false
  document.ondragstart = () => false
})

// مساعدات للتطبيق
contextBridge.exposeInMainWorld('appHelpers', {
  // تنسيق العملة
  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return '0'
    
    const formatter = new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
    
    return formatter.format(amount)
  },

  // تنسيق التاريخ
  formatDate: (date, options = {}) => {
    if (!date) return ''
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    }
    
    const formatter = new Intl.DateTimeFormat('ar-SA', {
      ...defaultOptions,
      ...options
    })
    
    return formatter.format(new Date(date))
  },

  // تنسيق الأرقام
  formatNumber: (number, options = {}) => {
    if (!number && number !== 0) return '0'
    
    const formatter = new Intl.NumberFormat('ar-SA', options)
    return formatter.format(number)
  },

  // تحويل الأرقام إلى نص عربي
  numberToArabicText: (number) => {
    // تنفيذ مبسط - يمكن توسيعه
    const ones = [
      '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 
      'ستة', 'سبعة', 'ثمانية', 'تسعة'
    ]
    
    const tens = [
      '', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون',
      'ستون', 'سبعون', 'ثمانون', 'تسعون'
    ]
    
    if (number < 10) return ones[number]
    if (number < 20) {
      const teens = [
        'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر',
        'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'
      ]
      return teens[number - 10]
    }
    if (number < 100) {
      return tens[Math.floor(number / 10)] + (number % 10 ? ' ' + ones[number % 10] : '')
    }
    
    return number.toString() // للأرقام الكبيرة، استخدم الرقم كما هو
  },

  // حساب النسبة المئوية
  calculatePercentage: (value, total) => {
    if (!total || total === 0) return 0
    return Math.round((value / total) * 100)
  },

  // تحويل التاريخ الهجري
  toHijriDate: (gregorianDate) => {
    try {
      const date = new Date(gregorianDate)
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      return formatter.format(date)
    } catch {
      return ''
    }
  }
})

contextBridge.exposeInMainWorld('security', {
  getCspNonce: () => ipcRenderer.invoke('security-get-csp-nonce')
})

const ensureStyleNoncePropagation = async () => {
  try {
    const requestNonceSync = () => {
      try {
        const value = ipcRenderer.sendSync('security-get-csp-nonce-sync')
        if (typeof value === 'string' && value.trim() !== '') {
          return value
        }
      } catch {
        /* ignore sync retrieval failure */
      }
      return null
    }

    let nonce = requestNonceSync()

    if (typeof nonce !== 'string' || nonce.trim() === '') {
      nonce = await ipcRenderer.invoke('security-get-csp-nonce')
    }

    if (typeof nonce !== 'string' || nonce.trim() === '') {
      return
    }

    const applyNonce = (styleElement) => {
      if (!styleElement) {
        return
      }

      if (!styleElement.nonce) {
        styleElement.setAttribute('nonce', nonce)
        try {
          styleElement.nonce = nonce
        } catch {
          /* ignore property assignment issues */
        }
      }
    }

    const injectNonceIntoStyleMarkup = (markup) => {
      if (typeof markup !== 'string' || markup.indexOf('<style') === -1) {
        return markup
      }

      return markup.replace(/<style\b(?![^>]*\bnonce=)/gi, (match) => {
        return `${match} nonce="${nonce}"`
      })
    }

    const applyNonceDeep = (node) => {
      if (!node || typeof node !== 'object') {
        return
      }

      const ELEMENT_NODE = 1
      const DOCUMENT_FRAGMENT_NODE = 11

      if (node.nodeType === ELEMENT_NODE) {
        const tagName = typeof node.tagName === 'string' ? node.tagName.toUpperCase() : ''
        if (tagName === 'STYLE' || (tagName === 'LINK' && node.rel === 'stylesheet')) {
          applyNonce(node)
        }
      }

      if (node.nodeType === DOCUMENT_FRAGMENT_NODE || typeof node.querySelectorAll === 'function') {
        try {
          node.querySelectorAll?.('style,link[rel="stylesheet"]').forEach(applyNonce)
        } catch {
          /* ignore fragment iteration issues */
        }
      }
    }

    const processExistingStyles = () => {
  applyNonceDeep(document)
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', processExistingStyles, {
        once: true
      })
    } else {
      processExistingStyles()
    }

    if (typeof Document !== 'undefined') {
      const originalCreateElement = Document.prototype.createElement
      if (typeof originalCreateElement === 'function') {
        Document.prototype.createElement = function (tagName, options) {
          const element = originalCreateElement.call(this, tagName, options)
          if (typeof tagName === 'string' && tagName.toLowerCase() === 'style') {
            applyNonce(element)
          }
          return element
        }
      }

      const originalCreateElementNS = Document.prototype.createElementNS
      if (typeof originalCreateElementNS === 'function') {
        Document.prototype.createElementNS = function (namespaceURI, qualifiedName, options) {
          const element = originalCreateElementNS.call(this, namespaceURI, qualifiedName, options)
          if (typeof qualifiedName === 'string' && qualifiedName.toLowerCase() === 'style') {
            applyNonce(element)
          }
          return element
        }
      }
    }

    const originalInsertAdjacentHTML = Element?.prototype?.insertAdjacentHTML
    if (typeof originalInsertAdjacentHTML === 'function') {
      Element.prototype.insertAdjacentHTML = function (position, text) {
        return originalInsertAdjacentHTML.call(this, position, injectNonceIntoStyleMarkup(text))
      }
    }

    const elementInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')
    if (elementInnerHTMLDescriptor && typeof elementInnerHTMLDescriptor.set === 'function') {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        ...elementInnerHTMLDescriptor,
        set(value) {
          elementInnerHTMLDescriptor.set.call(this, injectNonceIntoStyleMarkup(value))
        }
      })
    }

    const shadowInnerHTMLDescriptor = typeof ShadowRoot !== 'undefined'
      ? Object.getOwnPropertyDescriptor(ShadowRoot.prototype, 'innerHTML')
      : null

    if (shadowInnerHTMLDescriptor && typeof shadowInnerHTMLDescriptor.set === 'function') {
      Object.defineProperty(ShadowRoot.prototype, 'innerHTML', {
        ...shadowInnerHTMLDescriptor,
        set(value) {
          shadowInnerHTMLDescriptor.set.call(this, injectNonceIntoStyleMarkup(value))
        }
      })
    }

    const hookNodeMethod = (prototype, methodName, transformArgs) => {
      const original = prototype?.[methodName]
      if (typeof original !== 'function') {
        return
      }

      prototype[methodName] = function (...args) {
        const updatedArgs = transformArgs ? transformArgs(args) : args
        return original.apply(this, updatedArgs)
      }
    }

    hookNodeMethod(Node.prototype, 'appendChild', (args) => {
      const [node] = args
      applyNonceDeep(node)
      return args
    })

    hookNodeMethod(Node.prototype, 'insertBefore', (args) => {
      const [node] = args
      applyNonceDeep(node)
      return args
    })

    hookNodeMethod(Node.prototype, 'replaceChild', (args) => {
      const [node] = args
      applyNonceDeep(node)
      return args
    })

    hookNodeMethod(Element.prototype, 'replaceChildren', (args) => {
      args.forEach((arg) => {
        if (typeof arg === 'string') {
          return
        }
        applyNonceDeep(arg)
      })
      return args
    })

    hookNodeMethod(Element.prototype, 'append', (args) => {
      args.forEach((arg, index) => {
        if (typeof arg === 'string') {
          args[index] = injectNonceIntoStyleMarkup(arg)
          return
        }
        applyNonceDeep(arg)
      })
      return args
    })

    hookNodeMethod(Element.prototype, 'prepend', (args) => {
      args.forEach((arg, index) => {
        if (typeof arg === 'string') {
          args[index] = injectNonceIntoStyleMarkup(arg)
          return
        }
        applyNonceDeep(arg)
      })
      return args
    })

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!node || typeof node !== 'object') {
            return
          }

              applyNonceDeep(node)
        })
      }
    })

    const startObserving = () => {
      const target = document.head || document.documentElement || document.body
      if (!target || typeof target !== 'object') {
        return false
      }

      observer.observe(target, {
        childList: true,
        subtree: true
      })

      return true
    }

    if (!startObserving()) {
      const initObserver = () => {
        startObserving()
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initObserver, { once: true })
      } else {
        window.requestAnimationFrame(initObserver)
      }
    }

    Object.defineProperty(window, '__CSP_NONCE__', {
      value: nonce,
      configurable: false,
      enumerable: false,
      writable: false
    })
  } catch (error) {
    console.warn('[preload] Failed to propagate CSP nonce to style tags:', error)
  }
}

void ensureStyleNoncePropagation()

// حماية من إعادة تعريف المتغيرات
Object.freeze(window.electronAPI)
Object.freeze(window.platform)
Object.freeze(window.appHelpers)
Object.freeze(window.security)

console.log('Preload script loaded successfully')