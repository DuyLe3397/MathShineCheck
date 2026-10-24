// Công thức trong nội dung (\(…LaTeX…\), xem docs/adr/0006) → một dòng chữ dễ đọc cho Email thông báo.
// Bản sao của src/app/shared/math/math-text.ts (latexToLine, toPlainText) — sửa ở đó thì sửa cả ở đây.

const FORMULA_RE = /\\\(([\s\S]*?)\\\)/g;

export function hasFormula(text) {
  return !!text && /\\\([\s\S]*?\\\)/.test(text);
}

const SUP = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
  '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', '°': '°', '′': '′',
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ',
  n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
};
const SUB = {
  0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉',
  '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ',
  t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
};
const SYM = {
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', pm: '±', mp: '∓', times: '×', div: '÷', cdot: '·',
  infty: '∞', pi: 'π', to: '→', rightarrow: '→', Rightarrow: '⇒', Leftrightarrow: '⇔', in: '∈', notin: '∉',
  subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩', emptyset: '∅', varnothing: '∅', forall: '∀', exists: '∃',
  angle: '∠', triangle: '△', perp: '⊥', parallel: '∥', circ: '°', degree: '°', approx: '≈', equiv: '≡',
  cong: '≅', sim: '∼', backsim: '∽', prime: '′', square: '▢', ldots: '…', cdots: '⋯', setminus: '\\',
  backslash: '\\', lbrace: '{', rbrace: '}', vert: '|', mid: '|', lvert: '|', rvert: '|', '{': '{', '}': '}',
  '|': '‖', '%': '%',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', vartheta: 'ϑ', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', rho: 'ρ', varrho: 'ϱ',
  sigma: 'σ', varsigma: 'ς', tau: 'τ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', varpi: 'ϖ',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ',
  Psi: 'Ψ', Omega: 'Ω', sum: '∑', prod: '∏', int: '∫',
};
const WORDS = new Set(['sin', 'cos', 'tan', 'cot', 'log', 'ln', 'lim', 'max', 'min', 'exp']);
const SPACE = { ',': '', ';': ' ', ':': ' ', '!': '', ' ': ' ', quad: ' ', qquad: ' ' };
const BB = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ' };
const IGNORE = new Set(['displaystyle', 'textstyle', 'limits', 'nolimits', 'mathstrut']);
const TEXTLIKE = new Set(['mathrm', 'text', 'textrm', 'operatorname', 'mathit', 'mathbf', 'boldsymbol', 'bm', 'underline', 'textbf', 'textit']);

const isSimple = (s) => /^[\p{L}\p{N}.,′]+$/u.test(s) || /^\(.*\)$/.test(s);
const wrap = (s) => (isSimple(s) ? s : '(' + s + ')');
function script(s, table, ch) {
  const plain = s.replace(/\s+/g, '');
  if (plain && [...plain].every((c) => table[c])) return [...plain].map((c) => table[c]).join('');
  return [...plain].length === 1 ? ch + plain : ch + '(' + s + ')';
}

/** LaTeX → một dòng chữ: \frac{x+1}{2x-3} → (x+1)/(2x−3). */
export function latexToLine(src) {
  let i = 0;
  let out = '';
  let lastCmd = null;
  const skipWs = () => { while (src[i] === ' ') i++; };
  const readCmd = () => {
    const m = /^\\([A-Za-z]+|.)/.exec(src.slice(i));
    i += m ? m[0].length : 1;
    return m ? m[1] : '';
  };
  const readGroup = () => {
    skipWs();
    if (src[i] === '{') {
      let depth = 0;
      const start = i + 1;
      for (; i < src.length; i++) {
        if (src[i] === '\\') { i++; continue; }
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) { const g = src.slice(start, i); i++; return g; }
      }
      return src.slice(start);
    }
    if (src[i] === '\\') { const s0 = i; readCmd(); return src.slice(s0, i); }
    return src[i++] ?? '';
  };
  const readOpt = () => {
    skipWs();
    if (src[i] !== '[') return null;
    const end = src.indexOf(']', i);
    const g = src.slice(i + 1, end);
    i = end + 1;
    return g;
  };
  const readDelim = () => {
    skipWs();
    if (src[i] === '\\') { const n = readCmd(); return n === '.' ? '' : (SYM[n] ?? n); }
    const c = src[i++];
    return c === '.' ? '' : (c ?? '');
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      const name = readCmd();
      let cmd = null;
      if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
        const a = latexToLine(readGroup()), b = latexToLine(readGroup());
        out += wrap(a) + '/' + wrap(b);
      } else if (name === 'sqrt') {
        const n = readOpt();
        const a = latexToLine(readGroup());
        const p = n == null ? '√' : n === '3' ? '∛' : n === '4' ? '∜' : script(latexToLine(n), SUP, '^') + '√';
        out += p + wrap(a);
      } else if (name === 'left' || name === 'right' || name === 'bigl' || name === 'bigr') out += readDelim();
      else if (name === 'overrightarrow' || name === 'vec') out += 'vt ' + latexToLine(readGroup());
      else if (name === 'widehat' || name === 'hat') out += 'góc ' + latexToLine(readGroup());
      else if (name === 'overline' || name === 'bar') {
        const a = latexToLine(readGroup());
        out += [...a].length === 1 ? a + '̄' : '(' + a + ')‾';
      } else if (name === 'mathbb') { const g = latexToLine(readGroup()); out += BB[g] ?? g; }
      else if (TEXTLIKE.has(name)) out += latexToLine(readGroup());
      else if (name === 'vphantom' || name === 'phantom') readGroup();
      else if (name === 'placeholder') { readGroup(); out += '▢'; }
      else if (name === 'begin') {
        const env = readGroup();
        if (env === 'array') readGroup();
        const endTag = '\\end{' + env + '}';
        const idx = src.indexOf(endTag, i);
        const body = src.slice(i, idx < 0 ? src.length : idx);
        i = idx < 0 ? src.length : idx + endTag.length;
        const rows = body.split('\\\\').map((r) => latexToLine(r).trim()).filter(Boolean);
        if (env === 'cases') out += '{ ' + rows.join('; ') + ' }';
        else if (env.endsWith('matrix')) out += '(' + rows.join('; ') + ')';
        else if (out.endsWith('[')) out += ' ' + rows.join('; ') + ' ]';
        else if (env === 'array') out += rows.join('\n');
        else out += rows.join('; ');
      } else if (name === '\\') out += '; ';
      else if (name in SPACE) out += SPACE[name];
      else if (IGNORE.has(name)) { /* bỏ */ }
      else if (WORDS.has(name)) { out += name; if (/[A-Za-z0-9]/.test(src[i] ?? '')) out += ' '; cmd = name; }
      else if (name in SYM) out += SYM[name];
      else out += name;
      lastCmd = cmd;
      continue;
    }
    if (c === '^' || c === '_') {
      i++;
      const inner = latexToLine(readGroup());
      out += c === '_' && lastCmd === 'lim' ? '(' + inner + ') ' : script(inner, c === '^' ? SUP : SUB, c);
      lastCmd = null;
      continue;
    }
    if (c === '{') { out += latexToLine(readGroup()); lastCmd = null; continue; }
    i++;
    if (c === '}') continue;
    out += c === '&' || c === '~' ? ' ' : c === '-' ? '−' : c === "'" ? '′' : c;
    if (c !== ' ') lastCmd = null;
  }
  return out.replace(/ {2,}/g, ' ').trim();
}

/** Nội dung có công thức → chữ thường (mỗi công thức thành một dòng chữ). */
export function toPlainText(text) {
  if (!text) return '';
  if (!hasFormula(text)) return text;
  return text.replace(new RegExp(FORMULA_RE.source, 'g'), (_, latex) => latexToLine(latex));
}
