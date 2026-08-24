function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(value: string): string {
  const escaped = escapeHtml(value);

  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderTable(lines: string[]): string | null {
  if (lines.length < 2 || !/^\s*\|?[\s:-]+\|/.test(lines[1])) {
    return null;
  }

  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => renderInline(cell.trim()))
  );
  const [head, , ...body] = rows;

  return `<div class="markdown-table-wrap"><table><thead><tr>${head
    .map((cell) => `<th>${cell}</th>`)
    .join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

export function renderSafeMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let list: string[] = [];

  function flushList() {
    if (list.length) {
      html.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.includes("|") && lines[index + 1]?.includes("|")) {
      const tableLines = [trimmed, lines[index + 1].trim()];
      let cursor = index + 2;

      while (lines[cursor]?.includes("|")) {
        tableLines.push(lines[cursor].trim());
        cursor += 1;
      }

      const table = renderTable(tableLines);

      if (table) {
        flushList();
        html.push(table);
        index = cursor - 1;
        continue;
      }
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      html.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      html.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      html.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushList();
      html.push(`<blockquote>${renderInline(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);

    if (bullet) {
      list.push(bullet[1]);
      continue;
    }

    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);

    if (numbered) {
      list.push(numbered[1]);
      continue;
    }

    flushList();
    html.push(`<p>${renderInline(trimmed)}</p>`);
  }

  flushList();

  return html.join("\n");
}
