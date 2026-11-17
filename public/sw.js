// Service worker do app instalável (PWA). Não guarda cache de nada —
// tudo vem sempre da rede, então um deploy novo aparece na hora, sem
// versão velha presa no celular. Só serve pra o navegador oferecer a
// instalação e pra mostrar um aviso amigável quando estiver sem internet.

const PAGINA_OFFLINE = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AlphaData</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:#1f7fc4;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
  button{margin-top:20px;border:0;border-radius:8px;padding:12px 22px;font-size:15px;
  font-weight:600;background:#fff;color:#1f7fc4;cursor:pointer}
</style></head>
<body><div>
  <h1 style="font-size:20px;margin:0 0 8px">Sem conexão com a internet</h1>
  <p style="margin:0;opacity:.85">Verifique sua conexão e tente de novo.</p>
  <button onclick="location.reload()">Tentar novamente</button>
</div></body></html>`

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(PAGINA_OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
    ),
  )
})
