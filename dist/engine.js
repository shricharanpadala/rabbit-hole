import {cleanText, safeUrl, LIMITS} from './core.js';
const STOP = new Set('the a an of in on to is and or for as with by from at it this that its are was were be has have how why what does do can into about your you'.split(' '));
export function tokens(text) { return new Set(String(text).toLowerCase().match(/[a-z]{3,}/g)?.filter(w=>!STOP.has(w))||[]); }
export function relevance(origin, candidate) {
  const a=tokens(`${origin.title} ${origin.summary}`), b=tokens(`${candidate.title} ${candidate.summary}`);
  const title=tokens(candidate.title); let overlap=0;
  for(const t of b) if(a.has(t)) overlap+=title.has(t)?3:1;
  return overlap/Math.sqrt(Math.max(1,a.size)*Math.max(1,b.size));
}
export function shortestPath(edges, start, end) {
  if(start===end)return [start]; const neighbors=new Map();
  for(const e of edges){ if(!neighbors.has(e.from))neighbors.set(e.from,[]); if(!neighbors.has(e.to))neighbors.set(e.to,[]);neighbors.get(e.from).push(e.to);neighbors.get(e.to).push(e.from); }
  const queue=[start], previous=new Map([[start,null]]);
  for(let i=0;i<queue.length;i++){for(const n of neighbors.get(queue[i])||[]){if(previous.has(n))continue;previous.set(n,queue[i]);if(n===end){const path=[end];let p=end;while(previous.get(p)!==null){p=previous.get(p);path.unshift(p);}return path;}queue.push(n);}}
  return null;
}
export function mergeEdge(edges, incoming) { if(incoming.from===incoming.to)return edges;return edges.some(e=>e.from===incoming.from&&e.to===incoming.to&&e.kind===incoming.kind)?edges:[...edges,incoming]; }
export function safeNode(n) {
  if(!n||typeof n.id!=='string'||typeof n.title!=='string'||!n.title.trim())return null;
  const url=safeUrl(n.source?.url);if(!url)return null;
  return {id:cleanText(n.id,200),title:cleanText(n.title,180),category:cleanText(n.category,60)||'Wikipedia',summary:cleanText(n.summary,4000),question:cleanText(n.question,350),eyebrow:cleanText(n.eyebrow,180),kind:n.kind==='live'?'live':'curated',links:Array.isArray(n.links)?n.links.filter(x=>typeof x==='string').slice(0,20):[],source:{label:cleanText(n.source?.label,100)||'Source',url},fetchedAt:cleanText(n.fetchedAt,80),revision:Number.isSafeInteger(n.revision)?n.revision:null};
}
export function validateWorkspace(input) {
  if(!input||input.version!==1||!Array.isArray(input.nodes)||!Array.isArray(input.edges))throw new Error('This is not a Rabbit Hole workspace file.');
  if(input.nodes.length>180||input.edges.length>1600)throw new Error('Workspace exceeds the 180 idea / 1,600 connection limit.');
  const nodes=input.nodes.map(safeNode).filter(Boolean);const ids=new Set(nodes.map(n=>n.id));if(ids.size!==nodes.length)throw new Error('Workspace contains duplicate idea IDs.');
  const edges=input.edges.filter(e=>e&&ids.has(e.from)&&ids.has(e.to)&&e.from!==e.to).map(e=>({from:e.from,to:e.to,kind:e.kind==='article'?'article':'thematic',source:safeUrl(e.source)||'',label:cleanText(e.label,140)}));
  const notes=Array.isArray(input.notes)?input.notes.filter(n=>n&&typeof n.id==='string'&&n.id.trim()&&ids.has(n.nodeId)&&typeof n.text==='string').slice(0,300).map(n=>({id:cleanText(n.id,100),nodeId:n.nodeId,text:n.text.slice(0,5000),date:cleanText(n.date,80)})):[];
  return {version:1,nodes,edges,notes,trail:Array.isArray(input.trail)?input.trail.filter(t=>typeof t==='string'&&nodes.some(n=>n.title===t)).slice(-LIMITS.trail):[],selected:ids.has(input.selected)?input.selected:nodes[0]?.id,root:ids.has(input.root)?input.root:nodes[0]?.id};
}
// Deterministic force layout: stable start positions, repulsion, spring edges,
// damping, a central gravity term and bounded movement. No external runtime.
export function layoutGraph(nodes,edges,width=900,height=590) {
  const positions=new Map(nodes.map((n,i)=>[n.id,{x:width/2+Math.cos(i*2.39996)*Math.sqrt(i+1)*40,y:height/2+Math.sin(i*2.39996)*Math.sqrt(i+1)*30,vx:0,vy:0}]));
  for(let tick=0;tick<150;tick++){
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=positions.get(nodes[i].id),b=positions.get(nodes[j].id);let dx=a.x-b.x,dy=a.y-b.y;const dist=Math.max(25,Math.hypot(dx,dy));const force=4600/(dist*dist);a.vx+=dx/dist*force;a.vy+=dy/dist*force;b.vx-=dx/dist*force;b.vy-=dy/dist*force;
    }
    for(const e of edges){const a=positions.get(e.from),b=positions.get(e.to);if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,dist=Math.max(1,Math.hypot(dx,dy)),force=(dist-145)*.007;a.vx+=dx/dist*force;a.vy+=dy/dist*force;b.vx-=dx/dist*force;b.vy-=dy/dist*force;}
    for(const p of positions.values()){p.vx+=(width/2-p.x)*.0012;p.vy+=(height/2-p.y)*.0012;p.vx*=.8;p.vy*=.8;p.x=Math.max(90,Math.min(width-90,p.x+p.vx));p.y=Math.max(120,Math.min(height-80,p.y+p.vy));}
  }return positions;
}
