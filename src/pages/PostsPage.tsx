import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { deletePost, listPosts, type PostResponse } from "../api/posts";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
};

export function PostsPage() {
  const { accessToken, clearSession } = useAuth();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await listPosts(accessToken);
        if (!cancelled) {
          setPosts(data.items);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          return;
        }
        setError("Não foi possível carregar os posts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearSession]);

  async function onDelete(post: PostResponse) {
    if (!accessToken) return;
    if (!window.confirm(`Excluir “${post.title}”?`)) return;
    setDeletingId(post.id);
    try {
      await deletePost(accessToken, post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        return;
      }
      setError("Falha ao excluir o post.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell
      title="Posts"
      actions={
        <Link to="/posts/new" className="button-link">
          Novo post
        </Link>
      }
    >
      <p className="lede">Crie e edite o conteúdo do blog em Markdown.</p>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="muted">Carregando…</p> : null}
      {!loading && posts.length === 0 ? <p className="muted">Nenhum post ainda.</p> : null}
      {posts.length > 0 ? (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.id} className="post-row">
              <div>
                <Link to={`/posts/${post.id}`} className="post-title">
                  {post.title}
                </Link>
                <p className="muted meta">
                  <span className={`status status-${post.status}`}>
                    {STATUS_LABEL[post.status] ?? post.status}
                  </span>
                  · <code>{post.slug}</code>
                </p>
              </div>
              <div className="row-actions">
                <Link to={`/posts/${post.id}`}>Editar</Link>
                <button
                  type="button"
                  className="ghost danger"
                  disabled={deletingId === post.id}
                  onClick={() => onDelete(post)}
                >
                  {deletingId === post.id ? "Excluindo…" : "Excluir"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AppShell>
  );
}
