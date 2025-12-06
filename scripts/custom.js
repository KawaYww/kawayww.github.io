hljs.highlightAll();
document.addEventListener('DOMContentLoaded', function(event) {
  hljs.highlightAll();
});
window.addEventListener('pageshow', function(event) {
  // 如果页面是从 bfcache (Back-Forward Cache) 中恢复的
  if (event.persisted) {
    hljs.highlightAll();
  }
});
document.addEventListener('htmx:afterSwap', function(event) {
  hljs.highlightAll();
});

