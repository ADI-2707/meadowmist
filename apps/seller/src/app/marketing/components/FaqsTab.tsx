'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from '../marketing.module.css';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export function FaqsTab() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    category: 'Candle Care',
  });
  const [loading, setLoading] = useState(true);

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/content/faqs');
      if (res.ok) {
        const d = await res.json();
        setFaqs(d.faqs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaq.question || !newFaq.answer) {
      alert('Question and answer are required');
      return;
    }

    try {
      const res = await fetch('/api/content/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaq),
      });

      if (res.ok) {
        setNewFaq({
          question: '',
          answer: '',
          category: 'Candle Care',
        });
        fetchFaqs();
      } else {
        alert('Failed to add FAQ');
      }
    } catch {
      alert('Error saving FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      const res = await fetch(`/api/content/faqs?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchFaqs();
    } catch {
      alert('Error deleting FAQ');
    }
  };

  return (
    <div className={styles.splitGrid}>
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className={styles.emptyState}>No FAQs added yet.</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Question & Answer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((f) => (
                  <tr key={f.id}>
                    <td style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      <span className={styles.promoCode}>{f.category}</span>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600, color: 'var(--color-forest)', margin: 0 }}>
                        {f.question}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#555', marginTop: '4px' }}>
                        {f.answer}
                      </p>
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(f.id)}
                        className={styles.deleteBtn}
                        title="Delete FAQ"
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
        <h3 className={styles.sectionTitle}>Add New FAQ Item</h3>
        <form onSubmit={handleAddFaq}>
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select
              value={newFaq.category}
              onChange={(e) =>
                setNewFaq((prev) => ({ ...prev, category: e.target.value }))
              }
              className={styles.select}
            >
              <option value="Candle Care">Candle Care & Burn Time</option>
              <option value="Ceramic Care">Ceramic Care & Food Safety</option>
              <option value="Shipping & Delivery">Shipping & Delivery</option>
              <option value="Custom Orders">Gifting & Custom Orders</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Question</label>
            <input
              type="text"
              placeholder="e.g. How do I prevent tunneling on my first burn?"
              value={newFaq.question}
              onChange={(e) =>
                setNewFaq((prev) => ({ ...prev, question: e.target.value }))
              }
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Answer</label>
            <textarea
              placeholder="Provide clear, concise guidance..."
              value={newFaq.answer}
              onChange={(e) =>
                setNewFaq((prev) => ({ ...prev, answer: e.target.value }))
              }
              className={styles.textarea}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            <Plus size={16} />
            <span>Add FAQ</span>
          </button>
        </form>
      </div>
    </div>
  );
}

