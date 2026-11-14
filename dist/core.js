export const LIMITS = { trail: 40, saved: 50, graph: 45 };
export const wikiUrl = title => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
export function safeUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; }
}
export function cleanText(value, max = 1200) { return typeof value === 'string' ? value.slice(0, max) : ''; }
export function decodeTrail(hash) {
  try { const q = new URLSearchParams(hash.replace(/^#/, '')); const titles = JSON.parse(q.get('trail') || '[]');
    return Array.isArray(titles) ? titles.filter(x => typeof x === 'string' && x.trim()).slice(0, LIMITS.trail).map(x => x.slice(0, 180)) : [];
  } catch { return []; }
}
export function encodeTrail(titles) { return '#'+ new URLSearchParams({trail: JSON.stringify(titles.slice(0,LIMITS.trail))}).toString(); }
export function appendTrail(trail, title) { return trail.at(-1) === title ? trail : [...trail, title].slice(-LIMITS.trail); }
export function uniqueTitles(items) { return [...new Set(items.filter(x => typeof x === 'string' && x.trim()))]; }
export function sanitizeSaves(data) {
  if (!Array.isArray(data)) return [];
  return data.slice(0,LIMITS.saved).filter(x => x && Array.isArray(x.titles)).map(x => ({
    id: cleanText(x.id,80), name: cleanText(x.name,100) || 'An untitled trail', date: cleanText(x.date,80),
    titles: x.titles.filter(t => typeof t === 'string' && t.trim()).map(t => t.slice(0,180)).slice(0,LIMITS.trail),
  })).filter(x => x.id && x.titles.length);
}
export function searchLocal(nodes, query) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return nodes.map(n => ({node:n,score:words.reduce((sum,w)=>sum+(n.title.toLowerCase().includes(w)?4:0)+(n.category.toLowerCase().includes(w)?2:0)+(n.summary.toLowerCase().includes(w)?1:0),0)})).filter(n=>n.score>0).sort((a,b)=>b.score-a.score).map(n=>n.node).slice(0,8);
}
export function toMarkdown(name, titles, nodes) {
  return `# ${name.replace(/[\r\n]/g,' ')}\n\nA reading trail from Rabbit Hole. Connections suggest further exploration, not proof of causation.\n\n` + titles.map((title,i)=>{
    const n=nodes.find(x=>x.title===title);
    return `## ${i+1}. ${title.replace(/[\r\n]/g,' ')}\n\n${n?.summary || 'Explore the linked encyclopedia article.'}\n\nSource: ${safeUrl(n?.source?.url)||wikiUrl(title)}\n`;
  }).join('\n') + '\nLive Wikipedia extracts, when included, are from Wikipedia contributors under CC BY-SA 4.0. See source pages for revision histories.\n';
}
export function selectLinkTitles(links, current) {
  return uniqueTitles((links||[]).filter(x=>x.ns===0).map(x=>x.title)).filter(t=>t!==current&&!/^(List of|Outline of|Index of|Glossary of|ISBN|International Standard|Help:|Wikipedia:)/i.test(t)).slice(0,8);
}
