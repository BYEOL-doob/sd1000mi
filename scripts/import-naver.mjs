import * as cheerio from 'cheerio';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const BLOG_ID = process.env.NAVER_BLOG_ID || 'songdo1000miso';
const CATEGORY_NO = process.env.NAVER_CATEGORY_NO || '71';
const MAX_POSTS = Number(process.env.MAX_POSTS || 12);
const ROOT = process.cwd();
const DATA = path.join(ROOT, 'data', 'posts.json');
const IMG_DIR = path.join(ROOT, 'assets', 'blog');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36';

await fs.mkdir(path.dirname(DATA), {recursive:true});
await fs.mkdir(IMG_DIR, {recursive:true});

async function get(url) {
  const r = await fetch(url, {headers:{'user-agent':UA,'accept-language':'ko-KR,ko;q=0.9,en;q=0.8'}});
  if(!r.ok) throw new Error(`${r.status} ${url}`);
  return r;
}
const abs = (u='') => { try { return new URL(u, 'https://blog.naver.com').href; } catch { return ''; } };
const meta = ($, key) => $(`meta[property="${key}"]`).attr('content') || $(`meta[name="${key}"]`).attr('content') || '';

function imageFrom($) {
  const candidates=[meta($,'og:image')];
  $('.se-main-container img, .se_component_wrap img, #postViewArea img, .post-view img, article img').each((_,el)=>{
    const i=$(el); candidates.push(i.attr('data-lazy-src'),i.attr('data-src'),i.attr('data-original'),i.attr('src'));
  });
  return abs(candidates.find(x=>x && !x.startsWith('data:') && !/transparent|blank\.gif|spacer/i.test(x)) || '');
}
async function saveImage(url, logNo) {
  if(!url) return '';
  try {
    const r=await get(url); const ct=r.headers.get('content-type')||'';
    if(!ct.startsWith('image/')) return '';
    const ext = ct.includes('png')?'.png':ct.includes('webp')?'.webp':ct.includes('gif')?'.gif':'.jpg';
    const hash=crypto.createHash('sha1').update(url).digest('hex').slice(0,10);
    const name=`${logNo}-${hash}${ext}`; await fs.writeFile(path.join(IMG_DIR,name), Buffer.from(await r.arrayBuffer()));
    return `./assets/blog/${name}`;
  } catch { return ''; }
}
function normalizePostUrl(u='') {
  const m=u.match(/(?:logNo=|\/)(\d{5,})/); return m?`https://blog.naver.com/${BLOG_ID}/${m[1]}`:abs(u);
}

async function listUrls() {
  const urls=new Set();
  const api=`https://blog.naver.com/PostTitleListAsync.naver?blogId=${BLOG_ID}&viewdate=&currentPage=1&categoryNo=${CATEGORY_NO}&parentCategoryNo=&countPerPage=${Math.max(MAX_POSTS,30)}`;
  try {
    const txt=await (await get(api)).text();
    const obj=JSON.parse(txt);
    const arr=obj.postList || obj.postListView || [];
    for(const p of arr){ const logNo=String(p.logNo||p.logno||''); if(logNo) urls.add(`https://blog.naver.com/${BLOG_ID}/${logNo}`); }
  } catch {}
  if(urls.size<MAX_POSTS){
    const page=`https://blog.naver.com/PostList.naver?blogId=${BLOG_ID}&categoryNo=${CATEGORY_NO}&from=postList`;
    const html=await (await get(page)).text(); const $=cheerio.load(html);
    $('a[href]').each((_,a)=>{ const u=normalizePostUrl($(a).attr('href')||''); if(u.includes(`/${BLOG_ID}/`)) urls.add(u); });
  }
  return [...urls].slice(0,MAX_POSTS);
}

async function parsePost(url) {
  const logNo=(url.match(/(\d{5,})/)||[])[1]||Date.now();
  let html=await (await get(url)).text(); let $=cheerio.load(html);
  const frame=$('#mainFrame').attr('src');
  if(frame){ html=await (await get(abs(frame))).text(); $=cheerio.load(html); }
  const title=meta($,'og:title') || $('.se-title-text, .pcol1 .itemSubjectBoldfont, h3').first().text().trim();
  const description=meta($,'og:description') || $('.se-main-container, #postViewArea').text().replace(/\s+/g,' ').trim().slice(0,180);
  const remoteThumb=imageFrom($); const thumbnail=await saveImage(remoteThumb,logNo);
  const date=$('.se_publishDate, .se_publishDate.pcol2, .date, .se-date').first().text().trim();
  return {title,description,date,url,thumbnail,sourceThumbnail:remoteThumb};
}

const urls=await listUrls();
const posts=[];
for(const u of urls){ try { const p=await parsePost(u); if(p.title) posts.push(p); } catch(e){ console.warn('skip',u,e.message); } }
await fs.writeFile(DATA, JSON.stringify(posts,null,2)+'\n');
console.log(`saved ${posts.length} posts`);
