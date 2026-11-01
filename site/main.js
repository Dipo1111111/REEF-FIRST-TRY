const bar = document.querySelector('.bar');
const onScroll = () => bar.classList.toggle('stuck', window.scrollY > 6);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const targets = document.querySelectorAll('.reveal');

if (reduced || !('IntersectionObserver' in window)) {
  targets.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  targets.forEach((el) => io.observe(el));
}

const copy = document.querySelector('.copy');
if (copy) {
  const source = document.getElementById('install-cmd');
  const label = copy.textContent;
  copy.addEventListener('click', async () => {
    const text = source.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(source);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
    }
    copy.textContent = 'Copied';
    copy.classList.add('copied');
    window.setTimeout(() => {
      copy.textContent = label;
      copy.classList.remove('copied');
    }, 1800);
  });
}
