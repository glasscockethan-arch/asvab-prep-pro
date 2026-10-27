export function mountLayout(page, storage, notice = () => {}) {
 document.querySelector('#site-header').innerHTML=`<a class="brand" href="./index.html"><span class="brand-icon" aria-hidden="true">✦</span>Aptitude Beacon</a><nav aria-label="Main navigation"><a ${page==='catalog'?'aria-current="page"':''} href="./catalog.html">Explore learning</a><a ${page==='dashboard'?'aria-current="page"':''} href="./dashboard.html">My learning</a><a href="./practice.html">ASVAB practice</a></nav><button class="theme-button" id="theme" aria-label="Switch color theme">◐ <span>Theme</span></button>`;
 document.querySelector('#site-footer').innerHTML=`<div><a class="brand" href="./index.html">✦ Aptitude Beacon</a><p>Independent learning. Clear next steps.</p><p class="fine">No affiliation with schools, credential providers, the military, OSHA, EPA, NCCER or ASE. No credit, license or certification is awarded. Practice scores are not official AFQT percentiles.</p></div><nav aria-label="Footer"><a href="./exam-pass.html">Exam Pass study tools</a><a href="./beta.html">Free ASVAB beta</a><a href="./account.html">Beta account</a><a href="./about.html">About</a><a href="./privacy.html">Privacy & data</a><a href="./terms.html">Terms</a><a href="./contact.html">Contact</a><a href="./references.html">References & content status</a></nav>`;
 let theme; try {theme=storage.getItem('aptitude-beacon-theme');}catch{}
 const darkQuery=matchMedia('(prefers-color-scheme: dark)');
 document.documentElement.dataset.theme=theme==='dark'||theme==='light'?theme:darkQuery.matches?'dark':'light';
 document.querySelector('#theme').addEventListener('click',()=>{
  const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;theme=next;
  try{storage.setItem('aptitude-beacon-theme',next);}catch{notice('Theme changed for this page; browser storage is unavailable.');}
 });
 darkQuery.addEventListener('change',event=>{if(!theme)document.documentElement.dataset.theme=event.matches?'dark':'light';});
}
