import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FaqAccordion } from './FaqAccordion';

describe('FaqAccordion Component', () => {
  const mockFaqs = [
    {
      id: 'faq-1',
      question: 'What type of wax is used in Meadow Mist candles?',
      answer: 'We exclusively use 100% natural, ethically sourced soy wax infused with pure botanical extracts.',
      category: 'Candle Care & Craft',
    },
    {
      id: 'faq-2',
      question: 'How do I prevent candle tunneling?',
      answer: 'Allow the melt pool to reach all edges on the first burn.',
      category: 'Candle Care & Craft',
    },
    {
      id: 'faq-3',
      question: 'Are ceramic tableware pieces food safe?',
      answer: 'Yes, each vessel is glazed with non-toxic, lead-free glazes and fired at high temperatures.',
      category: 'Ceramics & Care',
    },
    {
      id: 'faq-4',
      question: 'Where do you ship?',
      answer: 'We currently deliver throughout India.',
      category: '',
    },
  ];

  it('renders all category headings and question triggers', () => {
    render(<FaqAccordion faqs={mockFaqs} />);

    expect(screen.getByText('Candle Care & Craft')).toBeDefined();
    expect(screen.getByText('Ceramics & Care')).toBeDefined();
    expect(screen.getByText('General')).toBeDefined();

    expect(screen.getByText('What type of wax is used in Meadow Mist candles?')).toBeDefined();
    expect(screen.getByText('Are ceramic tableware pieces food safe?')).toBeDefined();
    expect(screen.getByText('Where do you ship?')).toBeDefined();
  });

  it('initially hides answers and sets aria-expanded to false', () => {
    render(<FaqAccordion faqs={mockFaqs} />);

    const trigger = screen.getByRole('button', {
      name: /what type of wax is used in meadow mist candles\?/i,
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/we exclusively use 100% natural/i)).toBeNull();
  });

  it('expands answer on click and collapses on subsequent click', () => {
    render(<FaqAccordion faqs={mockFaqs} />);

    const trigger = screen.getByRole('button', {
      name: /what type of wax is used in meadow mist candles\?/i,
    });

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/we exclusively use 100% natural/i)).toBeDefined();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/we exclusively use 100% natural/i)).toBeNull();
  });

  it('allows multiple independent items to be toggled open', () => {
    render(<FaqAccordion faqs={mockFaqs} />);

    const trigger1 = screen.getByRole('button', {
      name: /what type of wax is used in meadow mist candles\?/i,
    });
    const trigger3 = screen.getByRole('button', {
      name: /are ceramic tableware pieces food safe\?/i,
    });

    fireEvent.click(trigger1);
    fireEvent.click(trigger3);

    expect(trigger1.getAttribute('aria-expanded')).toBe('true');
    expect(trigger3.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/we exclusively use 100% natural/i)).toBeDefined();
    expect(screen.getByText(/glazed with non-toxic/i)).toBeDefined();
  });
});
