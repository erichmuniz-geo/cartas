
const CACHE='cartas-extratos-shell-v2';
const RUNTIME='cartas-extratos-runtime-v2';
const SHELL=['./','./index.html','./styles.css','./app.js','./library-data.js','./manifest.webmanifest','./assets/capa-cartas.jpg','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>![CACHE,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin) return;
  if(url.pathname.includes('/acervo/')){
    event.respondWith(caches.open(RUNTIME).then(async cache=>{
      const hit=await cache.match(event.request); if(hit) return hit;
      const res=await fetch(event.request);
      if(res.ok){ cache.put(event.request,res.clone()); trimCache(cache,60); }
      return res;
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{
    if(res.ok) caches.open(CACHE).then(c=>c.put(event.request,res.clone()));
    return res;
  }).catch(()=>caches.match('./index.html'))));
});
async function trimCache(cache,max){
  const keys=await cache.keys();
  if(keys.length>max) await cache.delete(keys[0]).then(()=>trimCache(cache,max));
}
