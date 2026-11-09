(function(){
  var API = (document.documentElement.getAttribute('data-root')||'') + 'api/inquiry.php';
  var hd=document.querySelector('.hd'), tb=document.querySelector('.topbar');
  function setTop(){var h=(tb?tb.offsetHeight:0)+(hd?hd.offsetHeight:0);document.documentElement.style.setProperty('--hdtop',(hd?hd.getBoundingClientRect().bottom:h)+'px')}
  setTop();addEventListener('resize',setTop);addEventListener('scroll',setTop,{passive:true});
  var gnb=document.querySelector('.gnb'),mb=document.querySelector('.mbtn');
  if(mb){mb.addEventListener('click',function(){setTop();var o=gnb.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
    gnb.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){gnb.classList.remove('open');mb.setAttribute('aria-expanded','false')})});}

  // tabs
  var tabs=document.querySelectorAll('.tabs button');
  function showTab(id){tabs.forEach(function(b){var on=b.getAttribute('aria-controls')===id;b.setAttribute('aria-selected',on);var p=document.getElementById(b.getAttribute('aria-controls'));if(p)p.hidden=!on})}
  tabs.forEach(function(b){b.addEventListener('click',function(){showTab(b.getAttribute('aria-controls'))})});

  // prefill links: data-tab, data-type, data-item
  document.querySelectorAll('[data-tab]').forEach(function(a){a.addEventListener('click',function(){
    var t=a.getAttribute('data-tab');if(document.getElementById(t))showTab(t);
    var f=document.getElementById(t);if(!f)return;
    var ty=a.getAttribute('data-type'),it=a.getAttribute('data-item');
    var q=function(n){return f.querySelector('[name="'+n+'"]')};
    var fo=q('org_type'),fi=q('item'),fm=q('message');
    if(ty&&fo){fo.value=ty}
    if(it){ if(fi){fi.value=it} else if(fm&&!fm.value){fm.value='['+it+'] 문의드립니다.\n'} }
    if(ty&&fm&&!fi&&!fm.value){fm.value='['+ty+'] '}
  })});

  // typing hides mobile bar
  document.addEventListener('focusin',function(e){if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))document.body.classList.add('typing')});
  document.addEventListener('focusout',function(){document.body.classList.remove('typing')});

  // quick panel
  var qb=document.querySelector('.qbtn'),qp=document.querySelector('.qpanel');
  if(qb&&qp){qb.addEventListener('click',function(){qp.hidden=!qp.hidden;qb.setAttribute('aria-expanded',!qp.hidden);if(!qp.hidden){var i=qp.querySelector('input:not(.hp input)');if(i)i.focus()}});
    qp.querySelector('.x').addEventListener('click',function(){qp.hidden=true;qb.setAttribute('aria-expanded','false')});}

  // floating quick: after hero, hide when contact visible
  if(qb){var hero=document.querySelector('.hero,.ph'),ct=document.getElementById('contact'),pastHero=false,ctVis=false;
    function upd(){var off=!pastHero||ctVis;qb.classList.toggle('off',off);if(off&&qp&&!qp.hidden&&ctVis){qp.hidden=true}}
    if('IntersectionObserver' in window){
      if(hero)new IntersectionObserver(function(es){pastHero=!es[0].isIntersecting;upd()}).observe(hero);else pastHero=true;
      if(ct)new IntersectionObserver(function(es){ctVis=es[0].isIntersecting;upd()},{threshold:.15}).observe(ct);
    }else{pastHero=true}
    upd();}
  // quick tab: scroll to contact title
  document.querySelectorAll('a[href="#contact"]').forEach(function(a){a.addEventListener('click',function(e){var c=document.getElementById('contact');if(c){e.preventDefault();c.scrollIntoView({behavior:'smooth'});history.replaceState(null,'','#contact')}})});

  // phone format
  document.querySelectorAll('input[type=tel]').forEach(function(i){i.addEventListener('input',function(){
    var d=i.value.replace(/\D/g,'').slice(0,11),o=d;
    if(d.indexOf('02')===0){o=d.length>9?d.replace(/(\d{2})(\d{4})(\d{4})/,'$1-$2-$3'):d.replace(/(\d{2})(\d{3})(\d{0,4})/,'$1-$2-$3')}
    else if(d.length>=10){o=d.length===11?d.replace(/(\d{3})(\d{4})(\d{4})/,'$1-$2-$3'):d.replace(/(\d{3})(\d{3})(\d{4})/,'$1-$2-$3')}
    i.value=o.replace(/-$/,'')})});

  // submit
  document.querySelectorAll('form.inq').forEach(function(f){
    var started=Date.now();
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var box=f.querySelector('.msg');if(!box){box=document.createElement('div');f.appendChild(box)}
      box.className='msg';box.hidden=true;
      var bad=null;
      f.querySelectorAll('[required]').forEach(function(el){
        var v=el.type==='checkbox'?el.checked:String(el.value||'').trim();
        if(!v&&!bad)bad=el});
      if(bad){box.hidden=false;box.className='msg err';
        var lab=bad.type==='checkbox'?'개인정보 수집·이용 동의':(bad.getAttribute('data-label')||'필수 항목');
        box.textContent=lab+'을(를) 확인해 주세요.';bad.focus();return}
      var fp=f.querySelector('[name=phone]'),tel=fp&&fp.value.replace(/\D/g,'');
      if(tel&&(tel.length<9||tel.length>11)){box.hidden=false;box.className='msg err';box.textContent='회신 연락처를 정확히 입력해 주세요.';fp.focus();return}
      var fd=new FormData(f);fd.append('elapsed',String(Date.now()-started));fd.append('page',location.pathname);
      var btn=f.querySelector('button[type=submit]'),txt=btn.textContent;btn.disabled=true;btn.textContent='접수 중';
      fetch(API,{method:'POST',body:fd,headers:{'Accept':'application/json'}})
        .then(function(r){return r.json().catch(function(){return {ok:false}})})
        .then(function(j){
          box.hidden=false;
          if(j&&j.ok&&j.no){box.className='msg ok';box.textContent='접수되었습니다. 접수번호 '+j.no+'. 담당자가 확인 후 연락드립니다.';
            f.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea').forEach(function(el){el.value=''});
            f.querySelectorAll('input[type=checkbox]').forEach(function(el){el.checked=false});
            if(window.gtag)gtag('event','generate_lead',{form:f.id});
            if(window.wcs&&window.wcs.trans)try{wcs.trans({type:'lead'})}catch(_){}
          }else{throw new Error((j&&j.error)||'fail')}
        })
        .catch(function(err){
          var m=err&&err.message;
          if(m&&m!=='fail'&&m.length<80&&!/Failed to fetch|JSON|NetworkError|Load failed/i.test(m)){box.hidden=false;box.className='msg err';box.textContent=m;return}
          // 접수 서버가 없는 환경: 입력 내용으로 메일 작성 화면을 연다
          var L={kind:'구분',org_type:'기관 유형',name:'이름/기관명',phone:'연락처',email:'이메일',item:'품목/모델',qty:'수량',area:'납품지',due:'희망 납기',install:'설치',message:'내용'};
          var body='',subj='[메디팔로워 '+(f.querySelector('[name=kind]')||{}).value+'] '+((f.querySelector('[name=name]')||{}).value||'');
          Object.keys(L).forEach(function(k){var el=f.querySelector('[name="'+k+'"]:checked')||f.querySelector('[name="'+k+'"]:not([type=radio])');if(el&&el.value&&el.value.trim())body+='['+L[k]+'] '+el.value.trim()+'\n'});
          location.href='mailto:dark0036@hanmail.net?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
          box.hidden=false;box.className='msg ok';
          box.textContent='메일 작성 화면으로 연결했습니다. 보내기를 누르시면 문의가 전달됩니다. 바로 상담은 051-581-2357로 전화해 주세요.'})
        .finally(function(){btn.disabled=false;btn.textContent=txt});
    });
  });
})();
