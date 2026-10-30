#!/usr/bin/env node
// 自包含检查器（零依赖，可直接在 CI 跑）
// 用法: node scripts/check.mjs posts/xxx.md [--json]
// 规则来自 x-article-factory（MIT）
import fs from 'fs';
import path from 'path';

const CN = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];
const BANNED = ['TODO', 'FIXME', '内部黑话'];
const RISK = ['成人', '赌博', '博彩', '盗版', '翻墙', '代注册', '荐股'];
const ABSOLUTE = ['全网第一', '100%有效', '永久有效', '保证赚钱'];

function parse(raw) {
  let fm = {}, body = raw;
  if (raw.startsWith('---')) {
    const end = raw.indexOf('\n---', 3);
    if (end > 0) {
      for (const line of raw.slice(3, end).split('\n')) {
        const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (m) fm[m[1]] = m[2].trim();
      }
      body = raw.slice(end + 4);
    }
  }
  const h1 = [...body.matchAll(/^#\s+(.+)$/gm)].map(m => m[1]);
  const h2 = [...body.matchAll(/^##\s+(.+)$/gm)].map(m => m[1]);
  const h3 = [...body.matchAll(/^###\s+/gm)];
  const images = [...body.matchAll(/!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g)].map(m => m[1] || m[2]);
  const plain = body.replace(/!\[\[[^\]]+\]\]/g, '').replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/```[\s\S]*?```/g, '');
  const chars = (plain.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = chars + (plain.match(/\b[A-Za-z]{2,}\b/g) || []).length;
  const tables = [...body.matchAll(/^\|.+\|$/gm)].length;
  const fences = Math.floor([...body.matchAll(/```/g)].length / 2);
  const notXY = (plain.match(/不是[^。，\n]{1,18}[，。]?\s*是/g) || []).length;
  return { fm, body, h1, h2, h3: h3.length, images, plain, words, tables, fences, notXY };
}

function pngSize(file) {
  try {
    const b = fs.readFileSync(file);
    if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) {
      return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    }
  } catch { }
  return null;
}

export function check(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) throw new Error('找不到文件: ' + file);
  const doc = parse(fs.readFileSync(abs, 'utf8'));
  const base = path.dirname(abs);
  const issues = [];
  const add = (level, code, msg) => issues.push({ level, code, msg });

  const title = doc.fm.title || doc.h1[0] || '';
  if (!title) add('error', 'title-required', '没有标题');
  if (doc.h1.length > 1) add('error', 'single-h1', `一级标题 ${doc.h1.length} 个`);
  if (doc.h2.length < 5) add('warn', 'h2-min', `二级标题 ${doc.h2.length} 个，建议 ≥5`);
  if (doc.h3) add('warn', 'no-h3', `三级标题 ${doc.h3} 个（多数平台不支持）`);
  if (doc.words < 2000) add('warn', 'word-min', `正文 ${doc.words} 字/词，建议 ≥2000`);
  if (doc.tables) add('warn', 'no-table', `含 ${doc.tables} 行表格`);
  if (doc.fences) add('warn', 'no-fence', `含 ${doc.fences} 个代码块`);

  const n = doc.images.length;
  if (n < 5) add('warn', 'image-min', `配图 ${n} 张，建议 ≥5`);
  if (n > 9) add('warn', 'image-max', `配图 ${n} 张，建议 ≤9`);
  for (const p of doc.images) {
    const full = path.isAbsolute(p) ? p : path.join(base, p);
    if (!fs.existsSync(full)) add('error', 'image-exists', `配图不存在: ${p}`);
  }
  if (doc.fm.cover_image) {
    const full = path.isAbsolute(doc.fm.cover_image) ? doc.fm.cover_image : path.join(base, doc.fm.cover_image);
    if (!fs.existsSync(full)) add('error', 'cover-exists', `封面不存在: ${doc.fm.cover_image}`);
    else {
      const s = pngSize(full);
      if (s) {
        const r = s.width / s.height;
        if (Math.abs(r - 2.5) > 0.05) add('warn', 'cover-ratio', `封面 ${s.width}×${s.height}（${r.toFixed(2)}），建议 5:2`);
      }
    }
  }

  // 二级标题编号：从「一」起、连续不跳号
  const heads = [...doc.plain.matchAll(/^##\s+([零一二三四五六七八九十]+)?[、.．]?\s*(.+)$/gm)];
  heads.forEach((m, idx) => {
    const want = CN[idx] ?? String(idx + 1);
    if (!m[1]) add('warn', 'no-heading-number', `第 ${idx + 1} 个二级标题没有编号`);
    else if (m[1] !== want) add('warn', 'heading-number-order', `标题编号「${m[1]}」应为「${want}」`);
  });

  if (doc.notXY > 3) add('warn', 'no-not-x-is-y', `「不是X，是Y」${doc.notXY} 次，建议 ≤3`);
  if (!/留言|评论|告诉我|你怎么/.test(doc.plain.slice(-320))) add('warn', 'cta-tail', '结尾没有提问');
  for (const w of BANNED) if (doc.plain.includes(w)) add('error', 'banned-words', `出现占位词: ${w}`);
  const hit = RISK.filter(w => doc.plain.includes(w));
  if (hit.length) add('warn', 'risk-words', `敏感词面: ${hit.join('、')}`);
  for (const w of ABSOLUTE) if (doc.plain.includes(w)) add('error', 'absolute-claim', `绝对化: ${w}`);

  const errors = issues.filter(i => i.level === 'error');
  return {
    ok: errors.length === 0,
    file: path.basename(file),
    title, words: doc.words, h2: doc.h2.length, images: n,
    issues,
    counts: { error: errors.length, warn: issues.filter(i => i.level === 'warn').length },
  };
}

// CLI
if (process.argv[1] && process.argv[1].endsWith('check.mjs')) {
  const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const json = process.argv.includes('--json');
  if (!files.length) { console.error('用法: node scripts/check.mjs posts/xxx.md [--json]'); process.exit(2); }
  let failed = 0;
  const results = [];
  for (const f of files) {
    try {
      const r = check(f);
      results.push(r);
      if (!r.ok) failed++;
      if (!json) {
        console.log(`\n${r.file}  标题: ${r.title || '(无)'}  字数: ${r.words}  小标题: ${r.h2}  配图: ${r.images}`);
        for (const i of r.issues) console.log(`  [${i.level}] ${i.code}: ${i.msg}`);
        console.log(`  ${r.counts.error} error / ${r.counts.warn} warn → ${r.ok ? '通过' : '不通过'}`);
      }
    } catch (e) { console.error(e.message); failed++; }
  }
  if (json) console.log(JSON.stringify(results, null, 2));
  process.exit(failed ? 1 : 0);
}
