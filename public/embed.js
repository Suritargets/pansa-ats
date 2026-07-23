/**
 * Pansa ATS — embeddable forms & chat widget.
 * Formulieren: <div data-pansa-embed="apply"></div> + <script src="https://pansa-ats.vercel.app/embed.js" async></script>
 * Chat-widget (geen div nodig): <script data-pansa-embed="chat" src="https://pansa-ats.vercel.app/embed.js" async></script>
 * Beschikbare types: "apply" (sollicitatieformulier), "vacancy-request" (personeel aanvragen), "chat" (chatbot).
 */
(function () {
  var ORIGIN = 'https://pansa-ats.vercel.app'
  var ROUTES = {
    apply: '/embed/apply',
    'vacancy-request': '/embed/vacancy-request',
    chat: '/embed/chat',
  }

  function mountIframe(container, type) {
    var path = ROUTES[type]
    if (!path) {
      console.error('[pansa-embed] onbekend type: ' + type)
      return
    }

    var isChat = type === 'chat'
    var iframe = document.createElement('iframe')
    iframe.src = ORIGIN + path
    iframe.style.border = '0'
    iframe.style.display = 'block'
    if (isChat) {
      iframe.style.width = '64px'
      iframe.style.height = '64px'
      iframe.style.transition = 'width 150ms ease, height 150ms ease'
    } else {
      iframe.style.width = '100%'
      iframe.style.minHeight = '600px'
    }
    iframe.setAttribute('title', 'Pansa ATS — ' + type)
    container.appendChild(iframe)

    window.addEventListener('message', function (event) {
      if (event.origin !== ORIGIN) return
      var data = event.data
      if (!data || data.type !== 'pansa-ats-embed-resize') return
      if (typeof data.height === 'number') iframe.style.height = data.height + 'px'
      if (isChat && typeof data.width === 'number') iframe.style.width = data.width + 'px'
    })
  }

  function init() {
    var containers = document.querySelectorAll('[data-pansa-embed]')
    containers.forEach(function (container) {
      if (container.dataset.pansaEmbedInit) return
      container.dataset.pansaEmbedInit = 'true'
      mountIframe(container, container.getAttribute('data-pansa-embed'))
    })

    // Chat-widget kan ook zonder een geplaatste <div> — direct via het <script>-tag.
    var currentScript = document.currentScript
    if (currentScript && currentScript.getAttribute('data-pansa-embed') === 'chat') {
      var floating = document.createElement('div')
      floating.style.position = 'fixed'
      floating.style.bottom = '20px'
      floating.style.right = '20px'
      floating.style.zIndex = '2147483000'
      document.body.appendChild(floating)
      mountIframe(floating, 'chat')
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
