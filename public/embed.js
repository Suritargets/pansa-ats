/**
 * Pansa ATS — sollicitatieformulier embed.
 * Gebruik: <div data-pansa-apply></div> + <script src="https://pansa-ats.vercel.app/embed.js" async></script>
 */
(function () {
  var ORIGIN = 'https://pansa-ats.vercel.app'

  function init() {
    var containers = document.querySelectorAll('[data-pansa-apply]')
    containers.forEach(function (container) {
      if (container.dataset.pansaEmbedInit) return
      container.dataset.pansaEmbedInit = 'true'

      var iframe = document.createElement('iframe')
      iframe.src = ORIGIN + '/embed/apply'
      iframe.style.width = '100%'
      iframe.style.minHeight = '600px'
      iframe.style.border = '0'
      iframe.setAttribute('title', 'Pansa sollicitatieformulier')
      container.appendChild(iframe)

      window.addEventListener('message', function (event) {
        if (event.origin !== ORIGIN) return
        var data = event.data
        if (data && data.type === 'pansa-ats-embed-resize' && typeof data.height === 'number') {
          iframe.style.height = data.height + 'px'
        }
      })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
