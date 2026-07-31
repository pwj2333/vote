# Public Results Top Three Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show only the top three departments on the public results page while preserving complete statistics for the API and admin views.

**Architecture:** Keep `/api/public-stats` unchanged. Add a small pure browser utility that returns the first three entries, load it before the existing results renderer, and use the filtered list only when creating public table rows.

**Tech Stack:** Browser JavaScript, Node.js built-in test runner, existing HTML page.

---

### Task 1: Add the failing top-three behavior test

**Files:**
- Create: `test/results-utils.test.js`
- Create: `public/js/results-utils.js`

- [x] **Step 1: Write the failing test**

Create `test/results-utils.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { getVisibleStats } = require('../public/js/results-utils');

test('returns only the first three departments for the public results page', () => {
  const stats = [
    { name: '一', votes: 5 },
    { name: '二', votes: 4 },
    { name: '三', votes: 3 },
    { name: '四', votes: 2 },
  ];

  assert.deepEqual(getVisibleStats(stats), stats.slice(0, 3));
});

test('keeps shorter and empty result sets unchanged', () => {
  const stats = [{ name: '一', votes: 1 }];

  assert.deepEqual(getVisibleStats(stats), stats);
  assert.deepEqual(getVisibleStats([]), []);
});
```

- [x] **Step 2: Run the test to verify it fails for the missing utility**

Run: `node --test test/results-utils.test.js`

Expected: FAIL because `public/js/results-utils.js` does not exist yet.

### Task 2: Implement and connect the top-three filter

**Files:**
- Modify: `public/js/results-utils.js`
- Modify: `public/js/results.js`
- Modify: `views/results.html`

- [x] **Step 1: Add the minimal utility implementation**

Create `public/js/results-utils.js`:

```js
function getVisibleStats(stats) {
  return Array.isArray(stats) ? stats.slice(0, 3) : [];
}

if (typeof module !== 'undefined') {
  module.exports = { getVisibleStats };
}
```

- [x] **Step 2: Render only the filtered entries**

In `public/js/results.js`, change the row loop to:

```js
getVisibleStats(data.stats).forEach((item, index) => {
```

- [x] **Step 3: Load the utility before the renderer**

In `views/results.html`, load both scripts in this order:

```html
<script src="/js/results-utils.js"></script>
<script src="/js/results.js"></script>
```

- [x] **Step 4: Run the focused test and verify it passes**

Run: `node --test test/results-utils.test.js`

Expected: 2 passing tests and 0 failures.

### Task 3: Verify the page contract

**Files:**
- Verify: `public/js/results.js`, `public/js/results-utils.js`, `views/results.html`

- [x] **Step 1: Check the working tree diff**

Run: `git diff --check; git diff -- public/js/results-utils.js public/js/results.js views/results.html`

Expected: no whitespace errors; only the public results rendering path changes.

- [x] **Step 2: Confirm the API and admin files are untouched**

Run: `git status --short`

Expected: no changes under `server.js` or admin files.
