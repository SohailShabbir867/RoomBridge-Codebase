"use strict";

/**
 * LRU Cache with TTL — zero npm dependencies
 *
 * Algorithm: doubly-linked list + HashMap
 *   - get:    O(1)  — hash lookup + move-to-front
 *   - set:    O(1)  — hash insert + move-to-front + optional LRU eviction
 *   - delete: O(1)  — hash lookup + node removal
 *   - has:    O(1)  — hash lookup + TTL check
 *
 * Each node: { key, value, expiresAt, prev, next }
 */

class LRUCache {
  /**
   * @param {object} opts
   * @param {number} opts.max     - Maximum number of entries (default 500)
   * @param {number} opts.ttl     - Default TTL in milliseconds (default 60_000)
   */
  constructor({ max = 500, ttl = 60_000 } = {}) {
    this.max = max;
    this.ttl = ttl;
    this.map = new Map(); // key → node

    // Sentinel head and tail (no data — just structural anchors)
    this._head = {
      key: null,
      value: null,
      expiresAt: Infinity,
      prev: null,
      next: null,
    };
    this._tail = {
      key: null,
      value: null,
      expiresAt: Infinity,
      prev: null,
      next: null,
    };
    this._head.next = this._tail;
    this._tail.prev = this._head;

    this._size = 0;
  }

  /* ── Internal list helpers ─────────────────────────────── */

  /** Detach a node from the list (O(1)) */
  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  /** Insert node right after head (most-recently-used position, O(1)) */
  _insertFront(node) {
    node.next = this._head.next;
    node.prev = this._head;
    this._head.next.prev = node;
    this._head.next = node;
  }

  /* ── Public API ─────────────────────────────────────────── */

  /**
   * Retrieve a cached value. Returns undefined on miss or expired entry.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    const node = this.map.get(key);
    if (!node) return undefined;

    // Expired? evict and return undefined
    if (Date.now() > node.expiresAt) {
      this._evict(node);
      return undefined;
    }

    // Move to front (most recently used)
    this._remove(node);
    this._insertFront(node);
    return node.value;
  }

  /**
   * Store a value.
   * @param {string} key
   * @param {*}      value
   * @param {number} [ttl] - Override default TTL in ms
   */
  set(key, value, ttl) {
    const expiresAt = Date.now() + (ttl ?? this.ttl);

    if (this.map.has(key)) {
      // Update existing node in-place and move to front
      const node = this.map.get(key);
      node.value = value;
      node.expiresAt = expiresAt;
      this._remove(node);
      this._insertFront(node);
      return;
    }

    // Evict LRU entry if at capacity
    if (this._size >= this.max) {
      const lru = this._tail.prev;
      if (lru !== this._head) this._evict(lru);
    }

    const node = { key, value, expiresAt, prev: null, next: null };
    this._insertFront(node);
    this.map.set(key, node);
    this._size++;
  }

  /**
   * Check existence without updating LRU order.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const node = this.map.get(key);
    if (!node) return false;
    if (Date.now() > node.expiresAt) {
      this._evict(node);
      return false;
    }
    return true;
  }

  /**
   * Delete a specific key.
   * @param {string} key
   */
  delete(key) {
    const node = this.map.get(key);
    if (node) this._evict(node);
  }

  /**
   * Delete ALL keys that include the given substring.
   * Used to invalidate listing cache on mutation (e.g. city filter keys).
   * O(n) — acceptable since cache is small and mutations are infrequent.
   * @param {string} pattern
   */
  invalidateMatching(pattern) {
    for (const [key, node] of this.map.entries()) {
      if (key.includes(pattern)) this._evict(node);
    }
  }

  /** Remove all entries. */
  clear() {
    this.map.clear();
    this._head.next = this._tail;
    this._tail.prev = this._head;
    this._size = 0;
  }

  /** Current number of live (non-expired) entries. */
  get size() {
    return this._size;
  }

  /* ── Internal eviction ─────────────────────────────────── */
  _evict(node) {
    this._remove(node);
    this.map.delete(node.key);
    this._size--;
  }
}

/* ── Shared cache instances ────────────────────────────────────────
   Centralised so any controller can import and use them without
   creating multiple instances that would disagree on state.         */

/** Public listings browse cache — 60 second TTL, max 200 entries */
const listingsCache = new LRUCache({ max: 200, ttl: 60_000 });

/** Admin dashboard stats cache — 30 second TTL */
const statsCache = new LRUCache({ max: 10, ttl: 30_000 });

module.exports = { LRUCache, listingsCache, statsCache };
