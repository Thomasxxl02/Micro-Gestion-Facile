import fs from 'node:fs';
const coverage = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'));

const results = {};

Object.entries(coverage).forEach(([filePath, file]) => {
  const shortPath = filePath.split('\\').slice(-2).join('/');
  const totalStmt = Object.keys(file.s || {}).length;
  const coveredStmt = Object.values(file.s || {}).filter(v => v > 0).length;
  const stmtPct = totalStmt > 0 ? ((coveredStmt / totalStmt) * 100).toFixed(1) : 0;

  if (totalStmt > 0) {
    results[shortPath] = { stmtPct: Number.parseFloat(stmtPct), covered: coveredStmt, total: totalStmt };
  }
});

// Sort by coverage percentage and get lowest coverage
const sorted = Object.entries(results)
  .sort((a, b) => a[1].stmtPct - b[1].stmtPct)
  .slice(0, 20);

console.info('\n=== LOWEST COVERAGE FILES (Top 20) ===\n');
sorted.forEach(([file, data]) => {
  const pct = data.stmtPct.toFixed(1).padStart(5);
  console.info(`${pct}% - ${file} (${data.covered}/${data.total})`);
});

console.info('\n=== HIGHEST COVERAGE FILES (Top 10) ===\n');
const sortedHigh = Object.entries(results)
  .sort((a, b) => b[1].stmtPct - a[1].stmtPct)
  .slice(0, 10);

sortedHigh.forEach(([file, data]) => {
  const pct = data.stmtPct.toFixed(1).padStart(5);
  console.info(`${pct}% - ${file} (${data.covered}/${data.total})`);
});
