const base = new URL('./', self.location.href);
const SCOPE = encodeURIComponent(base.pathname);
const CACHE = 'stellar-voyager-immersive-v3-' + SCOPE;
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async()=>{
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if(event.data?.type!=='PREPARE_OFFLINE')return;
  event.waitUntil((async()=>{
    try {
      const manifest=await fetch(new URL('offline-assets.json',base),{cache:'no-store'});
      if(!manifest.ok)throw new Error('Asset list could not be loaded.');
      const assets=await manifest.json();const cache=await caches.open(CACHE);
      // Fetch all assets first, so network failures leave existing cached files intact.
      const responses=[];
      for(const asset of assets){
        const url=new URL(asset,base);
        if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))throw new Error('Invalid offline asset.');
        const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('Could not download '+asset);
        responses.push([url.href,response]);
      }
      for(const [url,response] of responses)await cache.put(url,response);
      await cache.put(new URL('offline-assets.json',base),new Response(JSON.stringify(assets),{headers:{'Content-Type':'application/json'}}));
      for(const key of await caches.keys())if(key.startsWith('stellar-voyager-immersive-')&&key.endsWith('-'+SCOPE)&&key!==CACHE)await caches.delete(key);
      event.ports[0]?.postMessage({ok:true,count:responses.length});
    } catch(error) {event.ports[0]?.postMessage({ok:false,error:error.message});}
  })());
});
async function cachedResponse(request, cache) {
  const url=new URL(request.url);url.search='';
  const response=await cache.match(url.href);
  if(!response)return null;
  const range=request.headers.get('range');
  if(!range)return response;
  const bytes=await response.arrayBuffer(),length=bytes.byteLength,match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
  const start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
  const end=match[1]?(match[2]?Math.min(Number(match[2]),length-1):length-1):length-1;
  if(start>end||start>=length)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
  const headers=new Headers(response.headers);headers.set('Content-Range',`bytes ${start}-${end}/${length}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
  return new Response(bytes.slice(start,end+1),{status:206,headers});
}
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
  event.respondWith((async()=>{
    try{return await fetch(event.request);}catch{
      const keys=[CACHE,...(await caches.keys()).filter(key=>key!==CACHE&&key.startsWith('stellar-voyager-immersive-')&&key.endsWith('-'+SCOPE)).reverse()];
      for(const key of keys){const response=await cachedResponse(event.request,await caches.open(key));if(response)return response;}
      return new Response('This asset is not downloaded. Reconnect and prepare offline access.',{status:503,headers:{'Content-Type':'text/plain'}});
    }
  })());
});
