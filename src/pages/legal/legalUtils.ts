export interface TocItem {
  id: string;
  title: string;
  level: 2 | 3;
}

export const LEGAL_TABS = [
  { label: 'Overview',          path: '/legal' },
  { label: 'Privacy Policy',    path: '/legal/privacy' },
  { label: 'Terms of Service',  path: '/legal/terms' },
  { label: 'Data Deletion',     path: '/legal/data-deletion' },
];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[*`[\]()]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function extractToc(md: string): TocItem[] {
  const items: TocItem[] = [];
  for (const line of md.split('\n')) {
    const h2 = line.match(/^## (.+)/);
    if (h2) { items.push({ id: slugify(h2[1]), title: h2[1], level: 2 }); continue; }
    const h3 = line.match(/^### (.+)/);
    if (h3) { items.push({ id: slugify(h3[1]), title: h3[1], level: 3 }); }
  }
  return items;
}

export function mdToHtml(md: string): string {
  const out: string[] = [];
  let inUl = false, inOl = false, inSubUl = false, inTable = false;
  let tableRows: string[][] = [];

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const inline = (raw: string): string => {
    let s = esc(raw);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`,
    );
    return s;
  };

  const closeAll = () => {
    if (inSubUl) { out.push('</ul>'); inSubUl = false; }
    if (inUl)    { out.push('</ul>'); inUl = false; }
    if (inOl)    { out.push('</ol>'); inOl = false; }
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    out.push('<div class="overflow-x-auto my-4"><table>');
    const [header, , ...body] = tableRows;
    out.push('<thead><tr>');
    header.forEach(c => out.push(`<th>${inline(c.trim())}</th>`));
    out.push('</tr></thead><tbody>');
    body.forEach(row => {
      out.push('<tr>');
      row.forEach(c => out.push(`<td>${inline(c.trim())}</td>`));
      out.push('</tr>');
    });
    out.push('</tbody></table></div>');
    tableRows = [];
    inTable = false;
  };

  for (const line of md.split('\n')) {
    if (/^\|/.test(line)) {
      if (!inTable) { closeAll(); inTable = true; }
      const cells = line.trim().replace(/^\||\|$/g, '').split('|');
      tableRows.push(cells);
      continue;
    }
    if (inTable) flushTable();

    let m: RegExpMatchArray | null;

    if ((m = line.match(/^#### (.+)/))) {
      closeAll(); out.push(`<h4>${inline(m[1])}</h4>`); continue;
    }
    if ((m = line.match(/^### (.+)/))) {
      closeAll();
      out.push(`<h3 id="${slugify(m[1])}">${inline(m[1])}</h3>`);
      continue;
    }
    if ((m = line.match(/^## (.+)/))) {
      closeAll();
      out.push(`<h2 id="${slugify(m[1])}">${inline(m[1])}</h2>`);
      continue;
    }
    if ((m = line.match(/^# (.+)/))) {
      closeAll(); out.push(`<h1>${inline(m[1])}</h1>`); continue;
    }
    if (/^---+$/.test(line.trim())) { closeAll(); out.push('<hr>'); continue; }

    if ((m = line.match(/^ {2,}- (.+)/))) {
      if (inOl && !inSubUl) { out.push('<ul>'); inSubUl = true; }
      else if (!inSubUl && !inUl) { closeAll(); out.push('<ul>'); inUl = true; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    if (inSubUl && !/^ {2,}/.test(line)) { out.push('</ul>'); inSubUl = false; }

    if ((m = line.match(/^- (.+)/))) {
      if (!inUl) { if (inOl) { out.push('</ol>'); inOl = false; } out.push('<ul>'); inUl = true; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    if ((m = line.match(/^\d+\. (.+)/))) {
      if (!inOl) { if (inUl) { out.push('</ul>'); inUl = false; } out.push('<ol>'); inOl = true; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    if (!line.trim()) { closeAll(); continue; }
    closeAll();
    out.push(`<p>${inline(line.trim())}</p>`);
  }

  closeAll();
  if (inTable) flushTable();
  return out.join('');
}
