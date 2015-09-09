/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';


/**
 * An object which manages a collection of variable sized sections.
 *
 * A section list is well suited to managing row heights in virtually
 * scrolling list controls. In these controls, most rows are uniform
 * height while a handful of rows are variable sized. A pair of lists
 * can be used to efficiently manage a virtually scrolling data grid.
 *
 * A section list has guaranteed `O(log n)` worst-case performance for
 * most operations, where `n` is the number of variable sized sections.
 */
export
class SectionList {
  /**
   * Get the total number of sections in the list.
   *
   * #### Notes
   * This operation has `O(1)` complexity.
   */
  get count(): number {
    return this._root !== null ? this._root.count : 0;
  }

  /**
   * Get the total size of all sections in the list.
   *
   * #### Notes
   * This operation has `O(1)` complexity.
   */
  get size(): number {
    return this._root !== null ? this._root.size : 0;
  }

  /**
   * Find the index of the section which covers the given offset.
   *
   * @param offset - The positive offset position of interest.
   *
   * @returns The index of the section which covers the given offset,
   *   or `-1` if the offset is out of range.
   *
   * #### Notes
   * This operation has `O(log n)` complexity.
   */
  indexOf(offset: number): number {
    if (this._root === null || offset < 0 || offset >= this._root.size) {
      return -1;
    }
    return indexOf(this._root, offset);
  }

  /**
   * Find the offset position of the section at the given index.
   *
   * @param index - The index of the section of interest.
   *
   * @returns The offset position of the section at the given index,
   *   or `-1` if the index is out of range.
   *
   * #### Notes
   * This operation has `O(log n)` complexity.
   */
  offsetOf(index: number): number {
    if (this._root === null) {
      return -1;
    }
    var i = Math.floor(index);
    if (i < 0 || i >= this._root.count) {
      return -1;
    }
    return offsetOf(this._root, i);
  }

  /**
   * Find the size of the section at the given index.
   *
   * @param index - The index of the section of interest.
   *
   * @returns The size of the section at the given index, or `-1` if
   *   the index is out of range.
   *
   * #### Notes
   * This operation has `O(log n)` complexity.
   */
  sizeOf(index: number): number {
    if (this._root === null) {
      return -1;
    }
    var i = Math.floor(index);
    if (i < 0 || i >= this._root.count) {
      return -1;
    }
    return sizeOf(this._root, i);
  }

  /**
   * Insert new sections into the list.
   *
   * @param index - The index at which to insert the first section.
   *   This value is clamped to the bounds of the list.
   *
   * @param count - The number of sections to insert. This must be
   *   greater than zero.
   *
   * @param size - The size of each section. This value is clamped
   *   to a lower bound of `0`.
   *
   * @returns The index of the first inserted section, or -1 if
   *   the count is `<= 0`.
   *
   * #### Notes
   * This operation has `O(log n)` complexity.
   */
  insert(index: number, count: number, size: number): number {
    var ct = Math.floor(count);
    if (ct <= 0) {
      return -1;
    }
    if (this._root === null) {
      this._root = createLeaf(ct, ct * Math.max(0, size));
      return 0;
    }
    var i = Math.max(0, Math.min(Math.floor(index), this._root.count));
    this._root = insert(this._root, i, ct, Math.max(0, size));
    return i;
  }

  /**
   * Remove existing sections from the list.
   *
   * @param index - The index of the first section to remove.
   *
   * @param count - The number of sections to remove. This must
   *   be greater than zero.
   *
   * @returns The actual number of sections removed.
   *
   * #### Notes
   * This operation has `O(log n)` complexity.
   *
   * Any sections which are out of range will be ignored.
   */
  remove(index: number, count: number): number {
    if (this._root === null) {
      return 0;
    }
    var ct = Math.floor(count);
    if (ct <= 0) {
      return 0;
    }
    var s = Math.floor(index);
    var i = Math.max(0, s);
    var j = Math.min(s + ct - 1, this._root.count - 1);
    var n = j - i + 1;
    if (n <= 0) {
      return 0;
    }
    this._root = remove(this._root, i, n);
    return n;
  }

  /**
   * Resize existing sections in the list.
   *
   * @param index - The index of the first section to resize.
   *
   * @param count - The number of sections to resize. This must
   *   be greater than zero.
   *
   * @param size - The new size of each section. This value is clamped
   *   to a lower bound of `0`.
   *
   * @returns The actual number of sections resized.
   *
   * #### Notes
   * This operation has `O(log n)` complexity.
   *
   * Any sections which are out of range will be ignored.
   */
  resize(index: number, count: number, size: number): number {
    if (this._root === null) {
      return 0;
    }
    var ct = Math.floor(count);
    if (ct <= 0) {
      return 0;
    }
    var s = Math.floor(index);
    var i = Math.max(0, s);
    var j = Math.min(s + ct - 1, this._root.count - 1);
    var n = j - i + 1;
    if (n <= 0) {
      return 0;
    }
    this._root = remove(this._root, i, n);
    if (this._root === null) {
      this._root = createLeaf(n, n * Math.max(0, size));
    } else {
      this._root = insert(this._root, i, n, Math.max(0, size));
    }
    return n;
  }

  private _root: ISpan = null;
}


/**
 * The node type used in the SectionList AVL tree.
 */
interface ISpan {
  /**
   * The total number of sections contained by the subtree.
   *
   * If the span is a leaf, this is the number of equal sized
   * sections covered by the span. This is always `> 0`.
   */
  count: number;

  /**
   * The total size of all sections contained by the subtree.
   *
   * If the span is a leaf, this is the total size of the equal sized
   * sections covered by the span and the individual section size can
   * be computed via `size / count`.
   */
  size: number;

  /**
   * The level of the span in the tree.
   *
   * A `0` level indicates the span is a leaf. This is always `>= 0`.
   */
  level: number;

  /**
   * The left subtree of the span.
   *
   * This will be null IFF the span is a leaf.
   */
  left: ISpan;

  /**
   * The right subtree of the span.
   *
   * This will be null IFF the span is a leaf.
   */
  right: ISpan;
}


/**
 * Create a new leaf span with the given count and total size.
 */
function createLeaf(count: number, size: number): ISpan {
  return { count: count, size: size, level: 0, left: null, right: null };
}


/**
 * Create a new branch span from the given left and right children.
 */
function createBranch(left: ISpan, right: ISpan): ISpan {
  var count = left.count + right.count;
  var size = left.size + right.size;
  var level = Math.max(left.level, right.level) + 1;
  return { count: count, size: size, level: level, left: left, right: right };
}


/**
 * Update a span to be branch with the given left and right children.
 *
 * This returns the updated span as a convenience.
 */
function updateBranch(span: ISpan, left: ISpan, right: ISpan): ISpan {
  span.count = left.count + right.count;
  span.size = left.size + right.size;
  span.level = Math.max(left.level, right.level) + 1;
  span.left = left;
  span.right = right;
  return span;
}


/**
 * Find the index of the section which covers the given offset.
 *
 * The offset must be within range of the given span.
 */
function indexOf(span: ISpan, offset: number): number {
  var index = 0;
  while (span.level !== 0) {
    var left = span.left;
    if (offset < left.size) {
      span = left;
    } else {
      span = span.right;
      index += left.count;
      offset -= left.size;
    }
  }
  return index + Math.floor(offset * span.count / span.size);
}


/**
 * Find the offset of the section at the given index.
 *
 * The index must be an integer and within range of the given span.
 */
function offsetOf(span: ISpan, index: number): number {
  var offset = 0;
  while (span.level !== 0) {
    var left = span.left;
    if (index < left.count) {
      span = left;
    } else {
      span = span.right;
      index -= left.count;
      offset += left.size;
    }
  }
  return offset + index * span.size / span.count;
}


/**
 * Find the size of the section at the given index.
 *
 * The index must be an integer and within range of the given span.
 */
function sizeOf(span: ISpan, index: number): number {
  while (span.level !== 0) {
    var left = span.left;
    if (index < left.count) {
      span = left;
    } else {
      span = span.right;
      index -= left.count;
    }
  }
  return span.size / span.count;
}


/**
 * Insert new sections into the given subtree.
 *
 * The index must be an integer within range of the span, and the
 * count must be an integer greater than zero.
 *
 * The return value is the span which should take the place of the
 * original span in the tree. Due to tree rebalancing, this may or
 * may not be the same as the original span.
 */
function insert(span: ISpan, index: number, count: number, size: number): ISpan {
  // If the span is a leaf, the insert target has been found. There are
  // four possibilities for the insert: extend, before, after, and split.
  if (span.level === 0) {
    // If the size of each new section is the same as the current size,
    // the existing span can be extended by simply adding the sections.
    if (size === span.size / span.count) {
      span.count += count;
      span.size += count * size;
      return span;
    }
    // If the index is zero, the new span goes before the current span,
    // which requires a new branch node to be added to the tree.
    if (index === 0) {
      return createBranch(createLeaf(count, count * size), span);
    }
    // If the index is greater than the span count, the new span goes
    // after the current span, which also requires a new branch node.
    if (index >= span.count) {
      return createBranch(span, createLeaf(count, count * size));
    }
    // Otherwise, the current span must be split and the new span
    // added to the middle. This requires several new nodes.
    var rest = span.count - index;
    var each = span.size / span.count;
    var subLeft = createLeaf(count, count * size);
    var subRight = createLeaf(rest, rest * each);
    var newLeft = createLeaf(index, index * each);
    var newRight = createBranch(subLeft, subRight);
    return updateBranch(span, newLeft, newRight);
  }
  // Otherwise, recurse down the appropriate branch.
  if (index < span.left.count) {
    span.left = insert(span.left, index, count, size);
  } else {
    span.right = insert(span.right, index - span.left.count, count, size);
  }
  // Always rebalance the branch after an insert.
  return rebalance(span);
}


/**
 * Remove a number of sections from the given subtree.
 *
 * The index must be an integer within range of the span, the
 * count must be an integer greater than zero, and the relation
 * `index + count <= span.count` must hold.
 *
 * The return value is the span which should take the place of the
 * original span in the tree. Due to tree rebalancing, this may or
 * may not be the same as the original span. It may also be null.
 */
function remove(span: ISpan, index: number, count: number): ISpan {
  // If the range covers the entire span, there is no need to do
  // any extra checking, since the whole subtree can be removed.
  if (count === span.count) {
    return null;
  }
  // If the span is a leaf, then sections are removed starting at
  // the index. The span's size is updated to reflect its new count.
  if (span.level === 0) {
    var rest = span.count - count;
    var each = span.size / span.count;
    span.size = rest * each;
    span.count = rest;
    return span;
  }
  // Otherwise, remove the sections from the children of the branch
  // recursively. The range will either cross both of the children
  // or be contained completely by one of them.
  if (index < span.left.count && index + count > span.left.count) {
    var tail = span.left.count - index;
    span.left = remove(span.left, index, tail);
    span.right = remove(span.right, 0, count - tail);
  } else if (index < span.left.count) {
    span.left = remove(span.left, index, count);
  } else {
    span.right = remove(span.right, index - span.left.count, count);
  }
  // After the remove, either child may be null, but not both, since
  // the first clause of this method handles the case where the range
  // covers the entire span. If one child was deleted, the remaining
  // child is hoisted to become the current span.
  if (span.left === null) {
    span = span.right;
  } else if (span.right === null) {
    span = span.left;
  }
  // If the span is still a branch, it must be rebalanced. If the range
  // was large, it's possible that the span's balance factor exceeds the
  // [-2, 2] threshold, and will require multiple passes to rebalance.
  if (span.level > 0) {
    do {
      span = rebalance(span);
    } while (Math.abs(span.left.level - span.right.level) > 1);
  }
  return span;
}


/**
 * Rebalance a span so that it maintains the AVL balance invariant.
 *
 * The given span must be a branch. If the span is already balanced,
 * no rotations will be made. The branch data is always updated to
 * be current based on the current children.
 *
 * This assumes the balance factor for the span will be within the
 * range of [-2, 2]. If the balance factor is outside this range,
 * the branch will need to be rebalanced multiple times in order
 * to maintain the AVL balance invariant.
 *
 * The return value is the span which should take the place of the
 * original span in the tree, and may or may not be a different span.
 *
 * Four unbalanced conditions are possible:
 *
 * Left-Left
 * -------------------------------------
 *        span                span
 *        /  \                /  \
 *       /    \              /    \
 *      1      D            2      1
 *     / \          =>     / \    / \
 *    /   \               A   B  C   D
 *   2     C
 *  / \
 * A   B
 *
 * Left-Right
 * -------------------------------------
 *     span                span
 *     /  \                /  \
 *    /    \              /    \
 *   1      D            1      2
 *  / \          =>     / \    / \
 * A   \               A   B  C   D
 *      2
 *     / \
 *    B   C
 *
 * Right-Right
 * -------------------------------------
 *   span                     span
 *   /  \                     /  \
 *  /    \                   /    \
 * A      1                 1      2
 *       / \        =>     / \    / \
 *      /   \             A   B  C   D
 *     B     2
 *          / \
 *         C   D
 *
 * Right-Left
 * -------------------------------------
 *   span                   span
 *   /  \                   /  \
 *  /    \                 /    \
 * A      1               2      1
 *       / \      =>     / \    / \
 *      /   \           A   B  C   D
 *     2     D
 *    / \
 *   B   C
 */
function rebalance(span: ISpan): ISpan {
  var left = span.left;
  var right = span.right;
  var balance = left.level - right.level;
  if (balance > 1) {
    var subLeft = left.left;
    var subRight = left.right;
    if (subLeft.level > subRight.level) {
      // Left-Left
      span.left = subLeft;
      span.right = updateBranch(left, subRight, right);
    } else {
      // Left-Right
      span.left = updateBranch(left, subLeft, subRight.left);
      span.right = updateBranch(subRight, subRight.right, right);
    }
  } else if (balance < -1) {
    var subLeft = right.left;
    var subRight = right.right;
    if (subRight.level > subLeft.level) {
      // Right-Right
      span.right = subRight;
      span.left = updateBranch(right, left, subLeft);
    } else {
      // Right-Left
      span.right = updateBranch(right, subLeft.right, subRight);
      span.left = updateBranch(subLeft, left, subLeft.left);
    }
  }
  return updateBranch(span, span.left, span.right);
}
