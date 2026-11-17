/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /article-card.js                                                      *
 * Purpose: Defines article preview data and creates reusable article summary  *
 *          cards.                                                             *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

// Article content is data; createArticlePreviewCard owns the repeated card structure.
const ARTICLE_PREVIEWS = Object.freeze([
  {
    meta: 'Alysha Pursley',
    title: 'A Simpler Way to Keep Track of What Matters',
    summary: 'My original product vision: the people I designed for, the essential screens, and the technical plan that guided the first implementation.',
    href: 'article-product-vision.html',
  },
  {
    meta: 'Alysha Pursley',
    title: 'The Early Decisions Behind PunctuOwlity',
    summary: 'Why I chose a personal event tracker, prioritized a compact grid, and kept the feature set deliberately focused.',
    href: 'article-early-decisions.html',
  },
  {
    meta: 'Alysha Pursley',
    title: 'Designing Reminders People Can Trust',
    summary: 'An in-depth look at event validation, user consent, Android alarm scheduling, ' +
      'notification limitations, and the design choices that make reminders trustworthy.',
    href: 'article-useful-reminders.html',
  },
  {
    meta: 'Alysha Pursley',
    title: 'Responsive Conversion Without Losing Product Identity',
    summary: 'How I translated a Java/Android event tracker into a responsive web companion, ' +
      'preserving its visual identity while adapting layout, state, and platform behavior.',
    href: 'article-responsive-conversion.html',
  },
]);
function createArticlePreviewCard(article) {
  const card = document.createElement('article');
  card.className = 'article-preview';
  const meta = document.createElement('p');
  meta.className = 'article-meta';
  meta.textContent = article.meta;
  const title = document.createElement('h2');
  title.textContent = article.title;
  const summary = document.createElement('p');
  summary.textContent = article.summary;
  const link = document.createElement('a');
  link.className = 'read-link';
  link.href = article.href;
  link.textContent = 'Read the article';
  card.append(meta, title, summary, link);
  return card;
}
function initializeArticleList() {
  const list = document.querySelector('[data-article-list]');
  if (!list) {
    return;
  }
  list.replaceChildren(...ARTICLE_PREVIEWS.map(createArticlePreviewCard));
}
