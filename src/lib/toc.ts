export interface TocItem {
  level: 2 | 3;
  text: string;
  id: string;
  children?: TocItem[];
}

function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "section"
  );
}

interface Result {
  htmlWithIds: string;
  toc: TocItem[];
}

/**
 * Reads h2/h3 from HTML, injects unique IDs and returns a flat-then-nested TOC.
 * Uses string parsing (avoids needing a DOM lib). Skips headings already with id.
 */
export function buildToc(html: string): Result {
  const used = new Set<string>();
  const flat: { level: 2 | 3; text: string; id: string }[] = [];

  const htmlWithIds = html.replace(
    /<h(2|3)([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, levelStr, attrs, inner) => {
      const level = Number(levelStr) as 2 | 3;
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const existingIdMatch = attrs.match(/\bid\s*=\s*['"]([^'"]+)['"]/i);
      let id = existingIdMatch ? existingIdMatch[1] : slugifyHeading(text);
      // de-dupe
      let candidate = id;
      let n = 2;
      while (used.has(candidate)) {
        candidate = `${id}-${n++}`;
      }
      id = candidate;
      used.add(id);
      flat.push({ level, text, id });
      if (existingIdMatch) {
        return match;
      }
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    },
  );

  // Nest h3 under last h2
  const toc: TocItem[] = [];
  let lastH2: TocItem | null = null;
  for (const item of flat) {
    if (item.level === 2) {
      lastH2 = { level: 2, text: item.text, id: item.id, children: [] };
      toc.push(lastH2);
    } else if (item.level === 3) {
      const child: TocItem = { level: 3, text: item.text, id: item.id };
      if (lastH2) {
        lastH2.children = lastH2.children ?? [];
        lastH2.children.push(child);
      } else {
        toc.push(child);
      }
    }
  }

  return { htmlWithIds, toc };
}
