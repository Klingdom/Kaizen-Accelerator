(function(){
  // Active nav link
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const href = (a.getAttribute('href')||'').toLowerCase();
    if(href === path) a.classList.add('active');
  });

  // Intake form handling: if Formspree placeholder remains, build mailto fallback.
  const form = document.querySelector('form[data-intake]');
  if(form){
    const action = form.getAttribute('action') || '';
    const isPlaceholder = action.includes('yourFormID') || action.includes('example.com');
    if(isPlaceholder){
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const fd = new FormData(form);
        const obj = {};
        fd.forEach((v,k)=>{ obj[k]=v; });
        const subject = encodeURIComponent('Kaizen Accelerator Intake');
        const body = encodeURIComponent(
          'KAIZEN ACCELERATOR INTAKE\n\n' +
          Object.entries(obj).map(([k,v])=>`${k}: ${v}`).join('\n')
        );
        const email = form.getAttribute('data-email') || 'your@email.com';
        location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        // Also route to thanks after initiating mailto
        setTimeout(()=>{ location.href='thanks.html'; }, 800);
      });
    }
  }
})();
