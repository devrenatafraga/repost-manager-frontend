import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { createPost, getPost, updatePost, type UpsertPostRequest } from "../api/posts";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY: UpsertPostRequest = {
  slug: "",
  title: "",
  excerpt: "",
  contentMd: "",
  status: "draft",
};

export function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { accessToken, clearSession } = useAuth();

  const [form, setForm] = useState<UpsertPostRequest>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !accessToken || !id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const post = await getPost(accessToken, id);
        if (!cancelled) {
          setForm({
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt ?? "",
            contentMd: post.contentMd,
            status: post.status,
            publishedAt: post.publishedAt ?? undefined,
          });
          setSlugTouched(true);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          return;
        }
        setError(err instanceof ApiError && err.status === 404 ? "Post não encontrado." : "Falha ao carregar o post.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearSession, id, isNew]);

  function updateField<K extends keyof UpsertPostRequest>(key: K, value: UpsertPostRequest[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !slugTouched && typeof value === "string") {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    const payload: UpsertPostRequest = {
      ...form,
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt?.trim() || null,
      contentMd: form.contentMd ?? "",
    };
    try {
      if (isNew) {
        const created = await createPost(accessToken, payload);
        navigate(`/posts/${created.id}`, { replace: true });
      } else if (id) {
        const updated = await updatePost(accessToken, id, payload);
        setForm({
          slug: updated.slug,
          title: updated.title,
          excerpt: updated.excerpt ?? "",
          contentMd: updated.contentMd,
          status: updated.status,
          publishedAt: updated.publishedAt ?? undefined,
        });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setError("Este slug já está em uso.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError("Dados inválidos. Confira slug (a-z, 0-9, hífens), título e status.");
      } else {
        setError("Não foi possível salvar o post.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title={isNew ? "Novo post" : "Editar post"}>
      <p className="lede">
        <Link to="/">← Voltar à lista</Link>
      </p>
      {loading ? <p className="muted">Carregando…</p> : null}
      {!loading ? (
        <form className="post-form" onSubmit={onSubmit}>
          <label>
            Título
            <input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
              autoFocus={isNew}
            />
          </label>
          <label>
            Slug
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                updateField("slug", e.target.value);
              }}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Apenas letras minúsculas, números e hífens"
            />
          </label>
          <label>
            Excerpt
            <textarea
              rows={2}
              value={form.excerpt ?? ""}
              onChange={(e) => updateField("excerpt", e.target.value)}
            />
          </label>
          <label>
            Conteúdo (Markdown)
            <textarea
              className="md-editor"
              rows={16}
              value={form.contentMd ?? ""}
              onChange={(e) => updateField("contentMd", e.target.value)}
              spellCheck
            />
          </label>
          <label>
            Status
            <select
              value={form.status ?? "draft"}
              onChange={(e) =>
                updateField("status", e.target.value as UpsertPostRequest["status"])
              }
            >
              <option value="draft">Rascunho</option>
              <option value="scheduled">Agendado</option>
              <option value="published">Publicado</option>
            </select>
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <Link to="/" className="ghost-link">
              Cancelar
            </Link>
          </div>
        </form>
      ) : null}
    </AppShell>
  );
}
