import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, ImageIcon, Undo2, Redo2, Minus,
  Heading1, Heading2, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const COLORS = [
  "#000000", "#374151", "#6b7280", "#ffffff",
  "#1d4ed8", "#0891b2", "#059669", "#65a30d",
  "#d97706", "#dc2626", "#9333ea", "#c5ff4a",
];

function ToolbarBtn({
  onClick, active, title, disabled, children,
}: {
  onClick: () => void; active?: boolean; title?: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
        active && "bg-gray-200 text-gray-900"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />;
}

function ColorPicker({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentColor = (editor?.getAttributes("textStyle")?.color as string | undefined) ?? "#000000";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        title="Couleur du texte"
        className="p-1.5 rounded hover:bg-gray-100 transition-colors flex flex-col items-center gap-0.5"
      >
        <span className="text-xs font-bold text-gray-700 leading-none" style={{ fontFamily: "serif" }}>A</span>
        <span className="w-4 h-1 rounded-sm" style={{ backgroundColor: currentColor }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-xl shadow-lg z-30 w-36">
          <p className="text-[10px] text-gray-400 font-semibold uppercase mb-2">Couleur texte</p>
          <div className="grid grid-cols-4 gap-1.5">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  editor?.chain().focus().setColor(c).run();
                  setOpen(false);
                }}
                className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">Hex</span>
            <input
              type="color"
              defaultValue={currentColor}
              onChange={e => editor?.chain().focus().setColor(e.target.value).run()}
              className="w-8 h-6 rounded cursor-pointer border border-gray-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LinkDialog({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openDialog = () => {
    const prev = editor?.getAttributes("link")?.href as string | undefined;
    setUrl(prev ?? "https://");
    setOpen(true);
  };

  const apply = () => {
    if (!url.trim() || url === "https://") {
      editor?.chain().focus().unsetLink().run();
    } else {
      editor?.chain().focus().setLink({ href: url.trim(), target: "_blank" }).run();
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <ToolbarBtn onClick={openDialog} active={editor?.isActive("link")} title="Lien">
        <LinkIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 p-3 w-64">
          <p className="text-xs font-semibold text-gray-700 mb-2">URL du lien</p>
          <input
            autoFocus
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && apply()}
            placeholder="https://drimpay.com"
            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2 mt-2">
            <button type="button" onMouseDown={e => { e.preventDefault(); apply(); }}
              className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
              Appliquer
            </button>
            {editor?.isActive("link") && (
              <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetLink().run(); setOpen(false); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-red-600 hover:bg-red-50">
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageDialog({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const insert = () => {
    if (!url.trim()) return;
    editor?.chain().focus().setImage({ src: url.trim(), alt: alt.trim() || undefined } as any).run();
    setUrl(""); setAlt(""); setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <ToolbarBtn onClick={() => setOpen(v => !v)} title="Insérer une image">
        <ImageIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 p-3 w-72">
          <p className="text-xs font-semibold text-gray-700 mb-2">Insérer une image</p>
          <input
            autoFocus
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://... (URL de l'image)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
          />
          <input
            value={alt}
            onChange={e => setAlt(e.target.value)}
            placeholder="Texte alternatif (optionnel)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button type="button" onMouseDown={e => { e.preventDefault(); insert(); }}
            disabled={!url.trim()}
            className="mt-2 w-full py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40">
            Insérer
          </button>
        </div>
      )}
    </div>
  );
}

function ButtonDialog({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("https://");
  const [color, setColor] = useState("#1a7a3c");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const insert = () => {
    if (!text.trim() || !url.trim()) return;
    const btnHtml = `<a href="${url.trim()}" target="_blank" style="display:inline-block;background:${color};color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;font-family:Arial,sans-serif;">${text.trim()}</a>`;
    editor?.chain().focus().insertContent(btnHtml + "<p></p>").run();
    setText(""); setUrl("https://"); setColor("#1a7a3c"); setOpen(false);
  };

  const BUTTON_COLORS = [
    { label: "Vert DrimPay", value: "#1a7a3c" },
    { label: "Lime accent", value: "#65a30d" },
    { label: "Bleu", value: "#1d4ed8" },
    { label: "Cyan", value: "#0891b2" },
    { label: "Rouge", value: "#dc2626" },
    { label: "Orange", value: "#d97706" },
    { label: "Violet", value: "#9333ea" },
    { label: "Noir", value: "#111827" },
  ];

  return (
    <div className="relative" ref={ref}>
      <ToolbarBtn onClick={() => setOpen(v => !v)} title="Insérer un bouton">
        <Square className="w-3.5 h-3.5" />
      </ToolbarBtn>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 p-4 w-72">
          <p className="text-xs font-semibold text-gray-700 mb-3">Insérer un bouton</p>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-gray-500 font-medium uppercase block mb-1">Texte du bouton</label>
              <input
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Ex : Accéder au tableau de bord"
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-medium uppercase block mb-1">Lien (URL)</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && insert()}
                placeholder="https://drimpay.com/dashboard"
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-medium uppercase block mb-1.5">Couleur du bouton</label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {BUTTON_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); setColor(c.value); }}
                    title={c.label}
                    className={cn(
                      "h-7 rounded-md border-2 transition-all hover:scale-105",
                      color === c.value ? "border-gray-900 scale-105" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Personnalisée</span>
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-8 h-6 rounded cursor-pointer border border-gray-200"
                />
                <span className="text-[10px] font-mono text-gray-500">{color}</span>
              </div>
            </div>
            <div className="pt-1">
              <p className="text-[10px] text-gray-400 mb-1.5">Aperçu :</p>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span
                  style={{ display: "inline-block", background: color, color: "#fff", padding: "8px 20px", borderRadius: "6px", fontWeight: "bold", fontSize: "12px" }}
                >
                  {text || "Texte du bouton"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); insert(); }}
            disabled={!text.trim() || !url.trim() || url === "https://"}
            className="mt-3 w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40"
          >
            Insérer le bouton
          </button>
        </div>
      )}
    </div>
  );
}

export default function RichEditor({ value, onChange, placeholder, minHeight = 220 }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3 text-gray-800",
        style: `min-height:${minHeight}px`,
      },
    },
  });

  const setEditorContent = useCallback((html: string) => {
    if (editor && editor.getHTML() !== html) {
      editor.commands.setContent(html);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    if (!value || value === "<p></p>") return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Souligné">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Titre 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Titre 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Aligner à gauche">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centrer">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Aligner à droite">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Divider />

        <ColorPicker editor={editor} />

        <Divider />

        <LinkDialog editor={editor} />
        <ImageDialog editor={editor} />
        <ButtonDialog editor={editor} />

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Ligne de séparation">
          <Minus className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler">
            <Undo2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir">
            <Redo2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
        </div>
      </div>

      {/* Editor area */}
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <p className="absolute top-3 left-4 text-sm text-gray-400 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
