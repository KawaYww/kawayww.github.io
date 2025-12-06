(function() {
  // 配置项
  const CONFIG = {
    delay: 100,          // 延迟触发时间(ms)
    indexFile: 'index.html',
    exclude: [
      /^mailto:/i,
      /^tel:/i,
      /^javascript:/i,
      /#.*$/,
      /\.(pdf|docx?|xlsx?|zip|tar|gz|png|jpe?g|gif|webp|json|xml)$/i
    ],
    debug: false        // 开启调试日志
  };

  // 工具函数：安全URL处理
  function normalizeUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // 跳过已有扩展名的文件
      if (/\.[a-zA-Z0-9]+$/.test(urlObj.pathname)) {
        return urlObj.href;
      }
      
      // 添加index.html
      if (!urlObj.pathname.endsWith(CONFIG.indexFile)) {
        urlObj.pathname = urlObj.pathname.replace(/\/?$/, `/${CONFIG.indexFile}`);
      }
      
      return urlObj.href;
    } catch (e) {
      CONFIG.debug && console.warn('Prefetch URL normalize failed:', url, e);
      return null;
    }
  }

  // 主预加载函数
  function prefetch(originalUrl) {
    const url = normalizeUrl(originalUrl);
    if (!url || !shouldPrefetch(url)) return;

    CONFIG.debug && console.log('[Prefetch]', originalUrl, '→', url);

    // 方法1: <link rel="prefetch"> (最高效)
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);

    // 方法2: fetch备用方案
    fetch(url, {
      cache: 'force-cache',
      mode: 'no-cors',
      credentials: 'same-origin'
    }).catch(() => {});
  }

  // 检查是否应该预加载
  function shouldPrefetch(url) {
    if (!url) return false;
    return !CONFIG.exclude.some(regex => regex.test(url));
  }

  // 初始化事件监听
  function init() {
    const links = document.querySelectorAll('a[href]:not([data-no-prefetch])');
    
    links.forEach(link => {
      // 清理旧监听器
      link._prefetchHandlers?.remove();
      
      // 创建新监听器
      let timeout;
      const handlers = {
        mouseenter: () => handleHover(link),
        touchstart: () => handleHover(link)
      };
      
      // 添加监听
      Object.entries(handlers).forEach(([event, handler]) => {
        link.addEventListener(event, handler, { passive: true });
      });
      
      // 保存引用
      link._prefetchHandlers = {
        remove: () => {
          clearTimeout(timeout);
          Object.entries(handlers).forEach(([event, handler]) => {
            link.removeEventListener(event, handler);
          });
        }
      };
    });
  }

  // 处理悬停/触摸
  function handleHover(link) {
    clearTimeout(link._prefetchTimeout);
    link._prefetchTimeout = setTimeout(() => {
      if (link.href && !link.href.startsWith('javascript:')) {
        prefetch(link.href);
      }
    }, CONFIG.delay);
  }

  // 启动初始化
  function run() {
    if (document.readyState !== 'loading') {
      init();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
    
    // HTMX兼容
    if (typeof htmx !== 'undefined') {
      document.addEventListener('htmx:afterSwap', init);
      document.addEventListener('htmx:contentProcessed', init);
    }
  }

  // 执行
  run();
})();

