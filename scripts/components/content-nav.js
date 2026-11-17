/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /content-nav.js                                                       *
 * Purpose: Builds consistent navigation links among the case study, articles, *
 *          and event list.                                                    *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

// Pages declare destination keys while this component owns link construction and labels.
const CONTENT_LINKS = Object.freeze({
  events: ['Upcoming Events', 'events.html'],
  caseStudy: ['Case Study', 'case-study.html'],
  articles: ['All Articles', 'articles.html'],
  relatedArticles: ['Related Articles', 'articles.html'],
});
function initializeContentNavigation() {
  document.querySelectorAll('[data-content-nav]').forEach((navigation) => {
    const keys = navigation.dataset.contentNav
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
    navigation.replaceChildren();
    keys.forEach((key) => {
      const definition = CONTENT_LINKS[key];
      if (!definition) {
        return;
      }
      const [label, href] = definition;
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      navigation.append(link);
    });
  });
}
