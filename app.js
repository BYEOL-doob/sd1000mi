const grid = document.querySelector('#postGrid');
const empty = document.querySelector('#postEmpty');
const PLACEHOLDER = '<div class="post-placeholder">1000 MISO ART</div>';

function esc(v='') { const d=document.createElement('div'); d.textContent=v; return d.innerHTML; }
function formatDate(v='') { if(!v) return ''; const d=new Date(v); if(Number.isNaN(d.getTime())) return v; return new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(d); }
function card(post) {
  const thumb = post.thumbnail ? `<img src="${esc(post.thumbnail)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='${PLACEHOLDER.replace(/'/g,"\\'")}'">` : PLACEHOLDER;
  return `<article class="post-card"><a href="${esc(post.url || '#')}" target="_blank" rel="noopener noreferrer"><div class="post-thumb">${thumb}</div><div class="post-body"><h3>${esc(post.title || '송도 천년의미소 소식')}</h3><p>${esc(post.description || post.bodyText || '')}</p><span class="post-meta">${formatDate(post.date)}</span></div></a></article>`;
}

async function loadPosts(){
  try {
    const res = await fetch(`./data/posts.json?v=${Date.now()}`, {cache:'no-store'});
    if(!res.ok) throw new Error('posts.json load failed');
    const data = await res.json();
    const posts = Array.isArray(data) ? data : (data.posts || []);
    if(!posts.length) throw new Error('empty');
    grid.innerHTML = posts.slice(0,6).map(card).join('');
    empty.hidden = true;
  } catch(e) {
    grid.innerHTML = '';
    empty.textContent = '등록된 학원 소식이 없습니다.';
    empty.hidden = false;
  }
}
loadPosts();
