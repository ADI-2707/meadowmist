'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from '../marketing.module.css';

interface JournalCMSItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTime: string;
  isPublished: boolean;
  publishedAt: string;
}

export function JournalTab() {
  const [articles, setArticles] = useState<JournalCMSItem[]>([]);
  const [newArticle, setNewArticle] = useState({
    title: '',
    slug: '',
    category: 'Process',
    readTime: '4 min read',
    excerpt: '',
    content: '',
  });
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/content/journal');
      if (res.ok) {
        const d = await res.json();
        setArticles(d.articles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.content) {
      alert('Title and content are required');
      return;
    }

    try {
      const res = await fetch('/api/content/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newArticle,
          coverImage: '/images/products/rose-tower-candle.jpg',
        }),
      });

      if (res.ok) {
        setNewArticle({
          title: '',
          slug: '',
          category: 'Process',
          readTime: '4 min read',
          excerpt: '',
          content: '',
        });
        fetchArticles();
      } else {
        alert('Failed to publish article');
      }
    } catch {
      alert('Error creating article');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal article?')) return;
    try {
      const res = await fetch(`/api/content/journal?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchArticles();
    } catch {
      alert('Error deleting article');
    }
  };

  return (
    <div className={styles.splitGrid}>
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading journal articles...</div>
        ) : articles.length === 0 ? (
          <div className={styles.emptyState}>No journal articles published yet.</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title & Slug</th>
                  <th>Category</th>
                  <th>Read Time</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p style={{ fontWeight: 600, color: 'var(--color-forest)', margin: 0 }}>
                        {a.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>
                        /{a.slug}
                      </p>
                    </td>
                    <td>
                      <span className={styles.promoCode}>{a.category}</span>
                    </td>
                    <td>{a.readTime}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: a.isPublished ? '#E8F5E9' : '#FFF3E0',
                          color: a.isPublished ? '#2E7D32' : '#E65100',
                        }}
                      >
                        {a.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ color: '#888', whiteSpace: 'nowrap' }}>
                      {new Date(a.publishedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className={styles.deleteBtn}
                        title="Delete Article"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.formCard}>
        <h3 className={styles.sectionTitle}>Publish Journal Article</h3>
        <form onSubmit={handleCreateArticle}>
          <div className={styles.field}>
            <label className={styles.label}>Article Title</label>
            <input
              type="text"
              placeholder="e.g. The Science of Botanical Scent Throw"
              value={newArticle.title}
              onChange={(e) =>
                setNewArticle((prev) => ({ ...prev, title: e.target.value }))
              }
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Custom Slug (optional)</label>
            <input
              type="text"
              placeholder="e.g. botanical-scent-throw"
              value={newArticle.slug}
              onChange={(e) =>
                setNewArticle((prev) => ({ ...prev, slug: e.target.value }))
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select
              value={newArticle.category}
              onChange={(e) =>
                setNewArticle((prev) => ({ ...prev, category: e.target.value }))
              }
              className={styles.select}
            >
              <option value="Process">Artisan Process</option>
              <option value="Studio Notes">Studio Notes</option>
              <option value="Care Guide">Care Guide</option>
              <option value="Origins">Materials & Origins</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Excerpt</label>
            <input
              type="text"
              placeholder="Brief 1-2 sentence preview for search & social..."
              value={newArticle.excerpt}
              onChange={(e) =>
                setNewArticle((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Article Content</label>
            <textarea
              placeholder="Write story content..."
              value={newArticle.content}
              onChange={(e) =>
                setNewArticle((prev) => ({ ...prev, content: e.target.value }))
              }
              className={styles.textarea}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            <Plus size={16} />
            <span>Publish Article</span>
          </button>
        </form>
      </div>
    </div>
  );
}
