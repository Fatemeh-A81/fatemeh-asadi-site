// Hungarian Algorithm for min-cost assignment (n x n)
// Supports floats/negatives. Complexity O(n^3).
// Implementation based on classic potentials u,v and augmenting with way[].

function parseMatrix(text) {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) throw new Error("ماتریس خالی است.");

  const rows = lines.map(line => {
    const parts = line.split(/[\s,;]+/).filter(Boolean);
    if (parts.length === 0) throw new Error("یک سطر خالی یا نامعتبر وجود دارد.");
    const nums = parts.map(p => {
      const x = Number(p);
      if (!Number.isFinite(x)) throw new Error(`عدد نامعتبر: ${p}`);
      return x;
    });
    return nums;
  });

  const n = rows.length;
  const m = rows[0].length;
  for (let i = 0; i < n; i++) {
    if (rows[i].length !== m) throw new Error("همهٔ سطرها باید تعداد ستون یکسان داشته باشند.");
  }
  return { rows, n, m };
}

function hungarian(cost) {
  const n = cost.length;
  // 1-indexed arrays for convenience
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);     // matching for columns: p[j] = row assigned to column j
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    // augmenting
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  // Result: assignment row -> column
  const assignmentRowToCol = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) {
    const i = p[j];
    assignmentRowToCol[i - 1] = j - 1;
  }

  let minCost = 0;
  for (let i = 0; i < n; i++) minCost += cost[i][assignmentRowToCol[i]];

  return { minCost, assignmentRowToCol };
}

function setMsg(html, isError=false){
  const el = document.getElementById("msg");
  el.innerHTML = isError ? `<div class="error">${html}</div>` : `<div class="ok">${html}</div>`;
}

function renderAssignment(cost, assignment) {
  const n = cost.length;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const j = assignment[i];
    rows.push({
      row: i + 1,
      col: j + 1,
      cost: cost[i][j]
    });
  }

  const table = `
    <table>
      <thead>
        <tr>
          <th>سطر</th>
          <th>ستون</th>
          <th>هزینه</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.row}</td>
            <td>${r.col}</td>
            <td>${Number.isInteger(r.cost) ? r.cost : r.cost.toFixed(6).replace(/\.?0+$/,'')}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
  document.getElementById("assignmentTable").innerHTML = table;
  return rows;
}

function downloadJSON(obj, filename="result.json"){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text){
  return navigator.clipboard?.writeText(text) ??
    Promise.reject(new Error("Clipboard API در این مرورگر در دسترس نیست."));
}

function solveNow(){
  const t0 = performance.now();

  const nInput = document.getElementById("n").value.trim();
  const text = document.getElementById("matrix").value;

  const parsed = parseMatrix(text);
  let n = parsed.n, m = parsed.m;

  if (nInput.length > 0) {
    const nUser = Number(nInput);
    if (!Number.isInteger(nUser) || nUser <= 0) throw new Error("n باید یک عدد صحیح مثبت باشد.");
    n = nUser;
  }

  if (parsed.n !== n) throw new Error(`تعداد سطرها باید دقیقاً n باشد. (n=${n} ولی سطرها=${parsed.n})`);
  if (parsed.m !== n) throw new Error(`ماتریس باید n×n باشد. (ستون‌ها=${parsed.m} ولی n=${n})`);

  const cost = parsed.rows;

  const out = hungarian(cost);

  const t1 = performance.now();
  const ms = Math.round((t1 - t0) * 1000) / 1000;

  document.getElementById("minCost").textContent =
    Number.isInteger(out.minCost) ? String(out.minCost) : out.minCost.toFixed(6).replace(/\.?0+$/,'');
  document.getElementById("nOut").textContent = String(n);
  document.getElementById("timeMs").textContent = String(ms);

  const rows = renderAssignment(cost, out.assignmentRowToCol);

  const result = {
    n,
    minCost: out.minCost,
    assignmentRowToCol: out.assignmentRowToCol, // 0-based
    assignment1Based: out.assignmentRowToCol.map(c => c + 1),
    detailed: rows
  };

  window.__LAST_RESULT__ = result;
  setMsg("با موفقیت حل شد ✅");

  return result;
}

document.getElementById("solve").addEventListener("click", () => {
  try { solveNow(); } catch (e) { setMsg(e.message || String(e), true); }
});

document.getElementById("fillExample").addEventListener("click", () => {
  const ex = [
    [9,2,7,8],
    [6,4,3,7],
    [5,8,1,8],
    [7,6,9,4]
  ];
  document.getElementById("n").value = 4;
  document.getElementById("matrix").value = ex.map(r => r.join(" ")).join("\n");
  setMsg("نمونه بارگذاری شد. حالا روی «حل کن» بزن.");
});

document.getElementById("downloadJson").addEventListener("click", () => {
  if (!window.__LAST_RESULT__) return setMsg("اول مسئله را حل کن تا JSON آماده شود.", true);
  downloadJSON(window.__LAST_RESULT__, "assignment-result.json");
});

document.getElementById("copyResult").addEventListener("click", async () => {
  if (!window.__LAST_RESULT__) return setMsg("اول مسئله را حل کن تا نتیجه کپی شود.", true);
  const r = window.__LAST_RESULT__;
  const text =
`minCost: ${r.minCost}
assignment (row->col) 1-based: ${r.assignment1Based.join(", ")}
details:
${r.detailed.map(d => `row ${d.row} -> col ${d.col} (cost ${d.cost})`).join("\n")}`;
  try{
    await copyToClipboard(text);
    setMsg("نتیجه کپی شد ✅");
  }catch(e){
    setMsg(e.message || String(e), true);
  }
});

// Auto-load example on first visit
(function(){
  document.getElementById("fillExample").click();
})();
