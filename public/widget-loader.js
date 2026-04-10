(function () {
  // Read chatbotId from the URL query string: ?id=YOUR_CHATBOT_ID
  // This approach is needed because document.currentScript is null
  // when the script is loaded asynchronously (async attribute).
  var scripts = document.querySelectorAll('script[src*="widget-loader.js"]');
  var scriptSrc = '';
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('widget-loader.js') !== -1) {
      scriptSrc = scripts[i].src;
      break;
    }
  }

  if (!scriptSrc) return;

  var url = new URL(scriptSrc);
  var chatbotId = url.searchParams.get('id');
  var origin = url.origin;

  if (!chatbotId) return;

  // Avoid loading twice
  if (document.getElementById('unibot-widget-container')) return;

  // Create container
  var container = document.createElement('div');
  container.id = 'unibot-widget-container';
  container.style.cssText =
    'position:fixed;bottom:24px;right:24px;z-index:999999;font-family:system-ui,-apple-system,sans-serif;';

  // Chat bubble button
  var bubble = document.createElement('button');
  bubble.id = 'unibot-bubble';
  bubble.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
  bubble.style.cssText =
    'width:56px;height:56px;border-radius:16px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(0,0,0,0.15);transition:transform 0.2s;background:#6366f1;';
  bubble.onmouseenter = function () {
    bubble.style.transform = 'scale(1.05)';
  };
  bubble.onmouseleave = function () {
    bubble.style.transform = 'scale(1)';
  };

  // Chat window
  var chatWindow = document.createElement('div');
  chatWindow.id = 'unibot-chat';
  chatWindow.style.cssText =
    'display:none;width:400px;height:600px;border-radius:16px;overflow:hidden;box-shadow:0 8px 48px rgba(0,0,0,0.15);margin-bottom:12px;background:white;';

  var iframe = document.createElement('iframe');
  iframe.src = origin + '/widget/' + chatbotId;
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.allow = 'clipboard-write';
  chatWindow.appendChild(iframe);

  container.appendChild(chatWindow);
  container.appendChild(bubble);
  document.body.appendChild(container);

  var isOpen = false;
  bubble.onclick = function () {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? 'block' : 'none';
    bubble.innerHTML = isOpen
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
  };
})();
