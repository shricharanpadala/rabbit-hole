import {wikiUrl} from './core.js';
import {relevance} from './engine.js';
const ENDPOINT='https://en.wikipedia.org/w/api.php';
const cache=new Map();const pending=new Map();
export async function request(params,{signal}={}) {
  const key=JSON.stringify(params);if(cache.has(key))return cache.get(key);
  const controller=new AbortController();const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted)controller.abort();const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const url=new URL(ENDPOINT);url.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',origin:'*',...params});
    const response=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok)throw new Error(response.status===429?'Wikipedia is busy. Try again in a moment.':'Wikipedia could not be reached.');
    const data=await response.json();if(data.error)throw new Error('Wikipedia could not complete that request.');
    cache.set(key,data);if(cache.size>100)cache.delete(cache.keys().next().value);return data;
  }catch(error){if(error.name==='AbortError'&&!signal?.aborted)throw new Error('Wikipedia took too long to respond. The starter map still works.');throw error;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export async function searchWikipedia(query,signal){const data=await request({list:'search',srsearch:query,srlimit:'8',srprop:'snippet|wordcount'}, {signal});return data.query?.search||[];}
export function articleNode(page){return {id:`wiki:${page.title}`,title:page.title,category:'Wikipedia',summary:page.extract||'No introductory extract is available. Open the source article for its full text and references.',question:'Which connection would you follow next, and what evidence would you look for?',links:[],kind:'live',source:{label:'Wikipedia · source article',url:wikiUrl(page.title)},fetchedAt:new Date().toISOString(),revision:page.revisions?.[0]?.revid||null};}
export async function loadArticle(title){
  if(pending.has(title))return pending.get(title);
  const task=(async()=>{const data=await request({prop:'extracts|links|revisions|pageprops',titles:title,exintro:'1',explaintext:'1',exchars:'1800',plnamespace:'0',pllimit:'max',rvprop:'ids',redirects:'1'});const page=data.query?.pages?.[0];if(!page||page.missing)throw new Error('No article was found for this topic. Try a different search.');return {node:articleNode(page),linkTitles:(page.links||[]).map(x=>x.title).filter(t=>! /^(List of|Outline of|Index of|Glossary of|ISBN|International Standard|Wikipedia:|Help:)/i.test(t)),disambiguation:Object.hasOwn(page.pageprops||{},'disambiguation')};})();
  pending.set(title,task);try{return await task;}finally{pending.delete(title);}
}
export async function relatedArticles(title){
  const {node,linkTitles}=await loadArticle(title);
  // All candidates are actual links from the article. A transparent lexical
  // ranking favours overlap with the intro; it does not infer causation.
  const candidates=linkTitles.map((t,index)=>({title:t,summary:'',index})).sort((a,b)=>relevance(node,b)-relevance(node,a)||a.index-b.index).slice(0,18);
  if(!candidates.length)return {node,related:[]};
  const data=await request({prop:'extracts|revisions|pageprops',titles:candidates.map(n=>n.title).join('|'),exintro:'1',explaintext:'1',exchars:'900',exlimit:'20',rvprop:'ids',redirects:'1'});
  const related=(data.query?.pages||[]).filter(p=>!p.missing&&!Object.hasOwn(p.pageprops||{},'disambiguation')&&p.title!==node.title).map(articleNode).sort((a,b)=>relevance(node,b)-relevance(node,a)).slice(0,8);
  return {node,related};
}
