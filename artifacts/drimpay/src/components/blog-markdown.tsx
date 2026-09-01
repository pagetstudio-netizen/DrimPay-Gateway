import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g);

  return tokens.filter((token) => token !== undefined && token !== "").map((token, index) => {
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={index} className="rounded-md bg-[#F0EEE8] px-1.5 py-0.5 font-mono text-[0.9em] text-[#3a7a00]">{token.slice(1, -1)}</code>;
    }

    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = /^(https?:\/\/|\/|#)/.test(link[2]) ? link[2] : "#";
      return <a key={index} href={href} className="font-semibold text-[#3a7a00] underline decoration-[#B5F03C] underline-offset-2 hover:text-[#0f0f0f]" rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>{link[1]}</a>;
    }

    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      return <strong key={index} className="font-bold text-[#0f0f0f]">{token.slice(2, -2)}</strong>;
    }

    if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }

    return <span key={index}>{token}</span>;
  });
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

export function BlogMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let blockKey = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const language = fence[1] || "text";
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={blockKey++} className="my-7 overflow-x-auto rounded-2xl bg-[#111814] p-5 text-left text-sm leading-7 text-[#E7F7DB] shadow-sm">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B5F03C]/70">{language}</div>
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
      const className = level === 1
        ? "mt-12 mb-4 text-2xl font-extrabold tracking-tight text-[#0f0f0f] first:mt-0"
        : level === 2
          ? "mt-9 mb-3 text-xl font-extrabold tracking-tight text-[#0f0f0f]"
          : "mt-7 mb-2 text-lg font-bold text-[#0f0f0f]";
      blocks.push(<Tag key={blockKey++} className={className}>{renderInline(heading[2])}</Tag>);
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].startsWith(">")) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote key={blockKey++} className="my-6 border-l-4 border-[#B5F03C] bg-[#F5F3EC] px-5 py-4 text-lg italic leading-8 text-[#3d403b]">
          {renderInline(quoteLines.join(" "))}
        </blockquote>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={blockKey++} className="my-5 list-disc space-y-2 pl-6 text-[1.04rem] leading-8 text-[#484b45] marker:text-[#79a823]">
          {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={blockKey++} className="my-5 list-decimal space-y-2 pl-6 text-[1.04rem] leading-8 text-[#484b45] marker:font-bold marker:text-[#79a823]">
          {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
        </ol>,
      );
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const headers = splitTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div key={blockKey++} className="my-7 overflow-x-auto rounded-2xl border border-[#E5E3DC]">
          <table className="min-w-full divide-y divide-[#E5E3DC] text-left text-sm">
            <thead className="bg-[#F5F3EC] text-xs uppercase tracking-wide text-[#60645c]">
              <tr>{headers.map((header, headerIndex) => <th key={headerIndex} className="px-4 py-3 font-bold">{renderInline(header)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#E5E3DC] bg-white text-[#484b45]">
              {rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top">{renderInline(cell)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,3}\s+/.test(lines[index]) &&
      !/^```/.test(lines[index]) &&
      !/^>\s?/.test(lines[index]) &&
      !/^[-*]\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={blockKey++} className="my-5 text-[1.06rem] leading-8 text-[#484b45]">{renderInline(paragraph.join(" "))}</p>);
  }

  return <div className="blog-markdown">{blocks}</div>;
}