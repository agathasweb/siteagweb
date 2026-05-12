"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";

interface Props {
  value: string;
  onChange: (html: string) => void;
  postSlug?: string;
  placeholder?: string;
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? "bg-voyia-blue text-white"
          : "bg-transparent text-gray-300 hover:bg-gray-700"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 w-px h-5 bg-gray-700" aria-hidden="true" />;
}

function Toolbar({ editor, postSlug, onUpload }: { editor: Editor; postSlug?: string; onUpload: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-gray-800 border-b border-gray-600">
      <ToolbarButton
        title="Negrito (Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <b>B</b>
      </ToolbarButton>
      <ToolbarButton
        title="Itálico (Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i>I</i>
      </ToolbarButton>
      <ToolbarButton
        title="Riscado"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        title="Código inline"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <code>{"</>"}</code>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Heading 2 (subseção)"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3 (sub-subseção)"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        title="Heading 4"
        active={editor.isActive("heading", { level: 4 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      >
        H4
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Lista com marcadores"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        title="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        title="Citação"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        title="Bloco de código"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {"{ }"}
      </ToolbarButton>
      <ToolbarButton
        title="Linha horizontal"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        —
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Link (Ctrl+K)"
        active={editor.isActive("link")}
        onClick={() => {
          const previous = editor.getAttributes("link").href ?? "";
          const url = window.prompt("URL do link:", previous);
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url, rel: "noopener", target: "_blank" }).run();
        }}
      >
        🔗
      </ToolbarButton>
      <ToolbarButton title="Inserir imagem (upload)" onClick={onUpload}>
        🖼️
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Desfazer (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        title="Refazer (Ctrl+Shift+Z)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        ↷
      </ToolbarButton>

      <div className="ml-auto text-[10px] text-gray-500 font-mono">
        Slug: {postSlug || "—"}
      </div>
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  postSlug,
  placeholder,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({
        HTMLAttributes: { loading: "lazy", decoding: "async" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Comece a escrever…",
      }),
      Typography,
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-4",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function handleUploadFile(file: File) {
    if (!editor) return;
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("post_slug", postSlug || "post");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const alt = window.prompt(
        "Texto alternativo (alt) — descreva a imagem em 8-15 palavras:",
        "",
      );
      editor
        .chain()
        .focus()
        .setImage({ src: data.path_large || data.path, alt: alt ?? "" })
        .run();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }

  if (!editor) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center text-gray-500">
        Carregando editor…
      </div>
    );
  }

  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
      <Toolbar
        editor={editor}
        postSlug={postSlug}
        onUpload={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFile(file);
          if (e.target) e.target.value = "";
        }}
      />
      {uploading && (
        <div className="px-4 py-2 bg-voyia-blue/20 text-voyia-blue text-sm border-b border-voyia-blue/30">
          Convertendo imagem para WebP…
        </div>
      )}
      {uploadError && (
        <div className="px-4 py-2 bg-red-900/30 text-red-200 text-sm border-b border-red-500/40">
          ⚠ {uploadError}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
