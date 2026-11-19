const $=id=>document.getElementById(id);let items=[];
const kb=n=>n>1048576?(n/1048576).toFixed(2)+' МБ':Math.round(n/1024)+' КБ',EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
$('f').onchange=()=>add($('f').files);
function add(fl){const bad=[];[...fl].forEach(f=>{if(!/^image\/(jpeg|png|webp|gif|bmp)$/.test(f.type))bad.push(f.name);else if(f.size>30e6)bad.push(f.name+' (больше 30 МБ)');else items.push({f,o:null})});
$('msg').textContent=bad.length?'Не поддерживается: '+bad.join(', ')+'. HEIC в большинстве браузеров не открывается.':'';render()}
function render(){$('list').innerHTML=items.length?'<table><tr><th>Файл</th><th>Было</th><th>Стало</th><th></th></tr>'+items.map((it,i)=>`<tr><td>${it.f.name.replace(/[<>&"]/g,'')}</td><td>${kb(it.f.size)}</td><td>${it.o?kb(it.o.blob.size):'—'}</td><td>${it.o?`<button class="alt" data-i="${i}">Скачать</button>`:''}</td></tr>`).join('')+'</table>':'';
$('list').querySelectorAll('button').forEach(b=>b.onclick=()=>{const o=items[b.dataset.i].o;dl(o.blob,o.name)});$('zip').style.display=items.some(i=>i.o)&&items.length>1?'':'none'}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
$('go').onclick=async()=>{if(!items.length){$('msg').textContent='Сначала выберите файлы.';return}
const type=$('fmt').value,q=$('q').value/100,mx=parseInt($('mx').value)||0;$('msg').textContent='Обработка…';let fail=0;
for(const it of items){try{const bm=await createImageBitmap(it.f);let w=bm.width,h=bm.height;if(mx>0&&Math.max(w,h)>mx){const k=mx/Math.max(w,h);w=Math.round(w*k);h=Math.round(h*k)}
if(w*h>64e6)throw 0;const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(type=='image/jpeg'){g.fillStyle='#fff';g.fillRect(0,0,w,h)}g.drawImage(bm,0,0,w,h);
const blob=await new Promise(r=>c.toBlob(r,type,q));if(!blob||blob.type!=type)throw 0;it.o={blob,name:it.f.name.replace(/\.[^.]+$/,'')+'.'+EXT[type]}}catch(x){fail++;it.o=null}}
$('msg').textContent=fail?`Не удалось обработать файлов: ${fail}. Ваш браузер может не поддерживать выбранный формат.`:'Готово ✓';render()};
function crc(u){const t=crc.t||(crc.t=[...Array(256)].map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0}));let r=-1;for(const b of u)r=t[(r^b)&255]^(r>>>8);return(r^-1)>>>0}
function makeZip(files){const en=new TextEncoder(),parts=[],cd=[];let off=0,cs=0;
for(const{name,data}of files){const n=en.encode(name),c=crc(data),h=new DataView(new ArrayBuffer(30));
h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint32(14,c,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,n.length,true);parts.push(h.buffer,n,data);
const d=new DataView(new ArrayBuffer(46));d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint32(16,c,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,n.length,true);d.setUint32(42,off,true);cd.push(d.buffer,n);cs+=46+n.length;off+=30+n.length+data.length}
const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);return new Blob([...parts,...cd,e.buffer],{type:'application/zip'})}
$('zip').onclick=async()=>{const used={},fs=[];for(const it of items)if(it.o){let n=it.o.name;while(used[n])n='1_'+n;used[n]=1;fs.push({name:n,data:new Uint8Array(await it.o.blob.arrayBuffer())})}dl(makeZip(fs),'images.zip')};
$('clr').onclick=()=>{items=[];$('f').value='';$('msg').textContent='';render()};
$('q').oninput=()=>$('qv').textContent=$('q').value+'%';
