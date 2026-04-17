// Compute the "Best Argument Path" from trunk root to a leaf node.
// Each node must have its children and vote totals available.

export type NodeWithScore = {
  id: string;
  score: number; // upvotes - downvotes
  children: NodeWithScore[];
};

/**
 * Returns the ordered list of node IDs on the highest-cumulative-score path.
 */
export function computeBestPath(roots: NodeWithScore[]): string[] {
  if (!roots.length) return [];

  function dfs(node: NodeWithScore, pathSoFar: string[], scoreSoFar: number): { path: string[]; score: number } {
    const newPath = [...pathSoFar, node.id];
    const newScore = scoreSoFar + node.score;

    if (!node.children.length) return { path: newPath, score: newScore };

    let best: { path: string[]; score: number } = { path: newPath, score: newScore };
    for (const child of node.children) {
      const result = dfs(child, newPath, newScore);
      if (result.score > best.score) best = result;
    }
    return best;
  }

  let best: { path: string[]; score: number } = { path: [], score: -Infinity };
  for (const root of roots) {
    const result = dfs(root, [], 0);
    if (result.score > best.score) best = result;
  }
  return best.path;
}
