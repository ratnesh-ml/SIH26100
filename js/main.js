/* VigilBid blueprint viewer: loads the markdown parts, renders them, builds a TOC. */
(function () {
  const PARTS = [
    { id: 'part-status', file: 'docs/BUILD-STATUS.md', label: 'Build Status & Baseline' },
    { id: 'part-00', file: 'docs/00-research-audit.md', label: '00 · Research Audit' },
    { id: 'part-01', file: 'docs/01-understanding-requirements-architecture.md', label: '01–04 · Understanding → Architecture' },
    { id: 'part-02', file: 'docs/02-ai-docai-rag-er-compliance-risk.md', label: '05–10 · AI, DocAI, RAG, ER, Rules, Risk' },
    { id: 'part-03', file: 'docs/03-frontend-backend-db-api.md', label: '11–14 · Frontend, Backend, DB, API' },
    { id: 'part-04', file: 'docs/04-dataset-mockapi-security-devops-mvpcut-team.md', label: '15–20 · Data, Mocks, Security, DevOps, Cut, Team' },
    { id: 'part-05', file: 'docs/05-dependencies-timeline-checklists-skills-git.md', label: '21–25 · Dependencies, Timeline, Checklists' },
    { id: 'part-06', file: 'docs/06-demo-judges-claims-stack-spec-strategy.md', label: '26–32 · Demo, Judges, Claims, Stack, Spec, Strategy' }
  ];

  const content = document.getElementById('content');
  const tocList = document.getElementById('toc-list');
  const toc = document.getElementById('toc');
  const navToggle = document.getElementById('nav-toggle');

  navToggle.addEventListener('click', () => toc.classList.toggle('open'));
  tocList.addEventListener('click', (e) => { if (e.target.tagName === 'A') toc.classList.remove('open'); });

  marked.setOptions({ gfm: true, breaks: false });

  function slugify(text, used) {
    const base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
    let slug = base, n = 2;
    while (used.has(slug)) slug = base + '-' + n++;
    used.add(slug);
    return slug;
  }

  function colorizeStatuses(root) {
    const map = { PASS: 'status-pass', WARN: 'status-warn', REVIEW: 'status-review', FAIL: 'status-fail' };
    root.querySelectorAll('td').forEach((td) => {
      const t = td.textContent.trim();
      if (map[t]) td.innerHTML = '<span class="' + map[t] + '">' + t + '</span>';
    });
  }

  async function loadPart(part, used) {
    const res = await fetch(part.file);
    if (!res.ok) throw new Error('Failed to load ' + part.file);
    const md = await res.text();
    const section = document.createElement('section');
    section.className = 'doc-part';
    section.id = part.id;
    section.innerHTML = marked.parse(md);

    const partLi = document.createElement('li');
    partLi.className = 'part';
    partLi.innerHTML = '<a href="#' + part.id + '">' + part.label + '</a>';
    tocList.appendChild(partLi);

    section.querySelectorAll('h2').forEach((h2) => {
      h2.id = slugify(h2.textContent, used);
      const li = document.createElement('li');
      li.className = 'h2';
      li.innerHTML = '<a href="#' + h2.id + '">' + h2.textContent + '</a>';
      tocList.appendChild(li);
    });
    colorizeStatuses(section);
    return section;
  }

  function trackActive() {
    const links = Array.from(tocList.querySelectorAll('li.h2 a'));
    const headings = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const onScroll = () => {
      let current = headings[0];
      for (const h of headings) { if (h.getBoundingClientRect().top <= 110) current = h; else break; }
      links.forEach((a) => a.classList.toggle('active', !!current && a.getAttribute('href') === '#' + current.id));
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  (async function init() {
    const used = new Set();
    const sections = [];
    try {
      for (const part of PARTS) sections.push(await loadPart(part, used));
      document.getElementById('loading').remove();
      sections.forEach((s) => content.appendChild(s));
      trackActive();
      if (location.hash) {
        const target = document.querySelector(location.hash);
        if (target) target.scrollIntoView();
      }
    } catch (err) {
      document.getElementById('loading').innerHTML = '<p style="color:#dc2626">Could not load blueprint files: ' + err.message + '</p>';
    }
  })();
})();
