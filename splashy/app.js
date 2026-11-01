/* =========================================================================
 * app.js — 四级背单词 · 全部交互逻辑
 * -------------------------------------------------------------------------
 * 文件分工：
 *   · index.html  只负责骨架（有哪些容器、按钮、弹窗）
 *   · data.js     只负责“单词数据”（baseWords / zhaoWords / customWords）
 *   · app.js      负责状态、渲染、事件、存储、快捷键（本文件）
 *
 * 【数据结构】localStorage 中保存的内容（键名 cet4-word-trainer-v1）：
 *   {
 *     version: 1,
 *     lang: 'zh' | 'en',            // 界面语言
 *     bank: 'base'|'zhao'|'custom', // 当前词库
 *     mode: 'card'|'choice'|'spell',// 当前学习模式
 *     banks: {                      // 每个词库各自独立的学习进度
 *       base: {
 *         index: 0,                 // 当前单词序号（指向下面的 order 数组）
 *         order: ['87','12'],       // 该词库的随机顺序（存单词 id，每次打开都按它出词）
 *         mastered: ['1','2'],      // 已掌握单词的 id（统一存字符串）
 *         wrong: ['3'],             // 错词 id
 *         favs: ['4'],              // 收藏 id
 *         seen: ['1','3'],          // 已学过的 id
 *         attempts: 10,             // 累计答题次数（选择/拼写）
 *         correct: 7                // 累计答对次数
 *       },
 *       zhao: {...}, custom: {...}
 *     },
 *     today: {                      // 今日数据，跨天自动清空
 *       date: '2026-10-29',         // 记录日期，用于判断是否跨天
 *       byBank: {
 *         base: { seen: ['1'], attempts: 4, correct: 3 },
 *         ...
 *       }
 *     },
 *     customWords: [ {...} ]        // 用户在网页里新增的自定义单词
 *   }
 *
 * 【如何添加新单词】
 *   方式一（推荐）：点页面底部「＋ 添加新词」，填表保存。
 *                   单词会写入 localStorage，并自动进入「我的自定义词库」。
 *   方式二：直接编辑 data.js 里的 customWords 数组（格式见该文件注释），
 *           刷新页面后生效。这种方式适合一次性批量导入。
 * ========================================================================= */

'use strict';

(function () {
  /* =====================================================================
   * 1. 常量与国际化文案
   * ===================================================================== */

  // localStorage 的键名；换名字相当于换一套全新的学习记录
  const STORAGE_KEY = 'cet4-word-trainer-v1';
  const BANKS = ['base', 'zhao', 'custom'];
  const MODES = ['card', 'choice', 'spell'];

  // data.js 会把数据挂到 window 上；这里做一次安全兜底，防止文件缺失时白屏
  const BASE_WORDS = Array.isArray(window.baseWords) ? window.baseWords : [];
  const ZHAO_WORDS = Array.isArray(window.zhaoWords) ? window.zhaoWords : [];

  /**
   * 界面文案字典：
   *   zh → 中文界面；en → 英文界面。
   * 所有静态文字通过 HTML 的 data-i18n 属性绑定，
   * 动态拼接的文字通过 t('key') 获取。
   */
  const I18N = {
    zh: {
      appTitle: '四级背单词',
      appSubtitle: 'CET-4 / 专业词汇 · 离线本地版',
      bank: '词库',
      bankBase: '基础四级词库',
      bankZhao: '赵振博专属词库',
      bankCustom: '我的自定义词库',
      modeCard: '卡片',
      modeChoice: '选择',
      modeSpell: '拼写',
      statProgress: '学习进度',
      statToday: '今日已学',
      statAccuracy: '今日正确率',
      statMastered: '已掌握',
      statWrong: '错词',
      statFav: '收藏',
      prev: '上一个',
      next: '下一个',
      dontKnow: '不认识',
      know: '认识 / 掌握',
      fav: '收藏',
      unfav: '取消收藏',
      wrongBook: '错词本',
      favList: '收藏夹',
      addWord: '添加新词',
      reset: '重置进度',
      shortcuts: '快捷键：空格 显示/提交 · ←/→ 切换 · 1–4 选择答案',
      cardHintShow: '点击卡片或按空格显示答案',
      cardHintNext: '按空格或 → 进入下一个单词',
      choiceQuestion: '选择正确的释义',
      choiceQuestionReverse: '选择正确的英文单词',
      spellQuestion: '根据中文释义拼写英文',
      spellPlaceholder: '输入英文单词后按 Enter',
      submit: '提交',
      correct: '回答正确',
      incorrect: '回答错误',
      answerIs: '正确答案：',
      continueHint: '按空格继续',
      spellCorrect: '拼写正确！',
      spellWrong: '拼写错误',
      statusMastered: '已掌握',
      statusWrong: '错词',
      statusSeen: '已学',
      statusNew: '未学习',
      statusFav: '已收藏',
      answerLabel: '释义',
      answerLabelWord: '单词',
      emptyCustomTitle: '自定义词库还是空的',
      emptyCustomDesc: '点击下方按钮添加你的第一个单词，数据会保存在本机浏览器中。',
      emptyBankTitle: '这个词库还没有单词',
      emptyBankDesc: '请切换其他词库，或添加新的自定义单词。',
      goAdd: '添加新词',
      wrongDesc: '在本词库中点击「不认识」或答错的单词，会自动收集到这里。',
      favDesc: '在本词库中收藏的单词会出现在这里。',
      emptyWrong: '暂无错词，继续保持！',
      emptyFav: '还没有收藏任何单词。',
      remove: '移出',
      markMastered: '标记掌握',
      delete: '删除',
      addTitle: '添加新词',
      addDesc: '新词会保存到浏览器 localStorage，并加入「我的自定义词库」。',
      fWord: '单词 *',
      fPhonetic: '音标',
      fPos: '词性',
      fMeaning: '中文释义 *',
      fExample: '英文例句',
      fExampleCn: '例句翻译',
      cancel: '取消',
      save: '保存单词',
      myWords: '我的自定义单词',
      noCustom: '还没有添加过单词。',
      required: '单词和中文释义为必填项',
      toastAdded: '已添加到「我的自定义词库」',
      toastDeleted: '已删除该自定义单词',
      toastFav: '已收藏',
      toastUnfav: '已取消收藏',
      toastReset: '当前词库进度已重置',
      toastRemoved: '已移出错词本',
      toastMastered: '已标记为掌握',
      resetConfirm:
        '确定重置当前词库的学习进度吗？\n（错词本和收藏会保留，今日统计将清零）',
      deleteConfirm: '确定删除这个自定义单词吗？此操作不可撤销。',
      speak: '朗读单词',
      speakUnsupported: '当前浏览器不支持语音朗读',
    },
    en: {
      appTitle: 'Word Trainer',
      appSubtitle: 'CET-4 & Academic Vocabulary · Offline',
      bank: 'Word bank',
      bankBase: 'CET-4 Core',
      bankZhao: "Zhao's List",
      bankCustom: 'My Words',
      modeCard: 'Cards',
      modeChoice: 'Quiz',
      modeSpell: 'Spelling',
      statProgress: 'Progress',
      statToday: 'Today',
      statAccuracy: 'Accuracy',
      statMastered: 'Mastered',
      statWrong: 'Mistakes',
      statFav: 'Saved',
      prev: 'Prev',
      next: 'Next',
      dontKnow: 'Don’t know',
      know: 'I know it',
      fav: 'Save',
      unfav: 'Unsave',
      wrongBook: 'Mistake book',
      favList: 'Saved words',
      addWord: 'Add word',
      reset: 'Reset progress',
      shortcuts: 'Space reveal/submit · ←/→ navigate · 1–4 choose',
      cardHintShow: 'Click the card or press Space to reveal',
      cardHintNext: 'Press Space or → for the next word',
      choiceQuestion: 'Choose the correct meaning',
      choiceQuestionReverse: 'Choose the correct English word',
      spellQuestion: 'Type the English word for this meaning',
      spellPlaceholder: 'Type the word and press Enter',
      submit: 'Submit',
      correct: 'Correct',
      incorrect: 'Incorrect',
      answerIs: 'Answer: ',
      continueHint: 'Press Space to continue',
      spellCorrect: 'Spelled correctly!',
      spellWrong: 'Misspelled',
      statusMastered: 'Mastered',
      statusWrong: 'Mistake',
      statusSeen: 'Studied',
      statusNew: 'New',
      statusFav: 'Saved',
      answerLabel: 'Meaning',
      answerLabelWord: 'Word',
      emptyCustomTitle: 'Your word bank is empty',
      emptyCustomDesc: 'Add your first word below. Everything is stored in this browser.',
      emptyBankTitle: 'No words in this bank',
      emptyBankDesc: 'Switch to another bank or add a custom word.',
      goAdd: 'Add a word',
      wrongDesc: 'Words you mark as “Don’t know” or answer incorrectly are collected here.',
      favDesc: 'Words you save in this bank appear here.',
      emptyWrong: 'No mistakes yet. Keep going!',
      emptyFav: 'Nothing saved yet.',
      remove: 'Remove',
      markMastered: 'Mark known',
      delete: 'Delete',
      addTitle: 'Add a word',
      addDesc: 'The word is saved to localStorage and added to “My Words”.',
      fWord: 'Word *',
      fPhonetic: 'Phonetic',
      fPos: 'Part of speech',
      fMeaning: 'Meaning (Chinese) *',
      fExample: 'Example sentence',
      fExampleCn: 'Example translation',
      cancel: 'Cancel',
      save: 'Save word',
      myWords: 'My custom words',
      noCustom: 'No custom words yet.',
      required: 'Word and meaning are required',
      toastAdded: 'Added to “My Words”',
      toastDeleted: 'Custom word deleted',
      toastFav: 'Saved',
      toastUnfav: 'Removed from saved',
      toastReset: 'Progress for this bank has been reset',
      toastRemoved: 'Removed from mistake book',
      toastMastered: 'Marked as known',
      resetConfirm:
        'Reset learning progress for this bank?\n(Mistake book and saved words are kept; today’s stats will be cleared.)',
      deleteConfirm: 'Delete this custom word? This cannot be undone.',
      speak: 'Pronounce the word',
      speakUnsupported: 'Speech synthesis is not supported in this browser',
    },
  };

  /* =====================================================================
   * 2. 运行时状态
   * ===================================================================== */

  /** 每个词库独立的进度结构 */
  function makeBankState() {
    return {
      index: 0, // 当前显示到 order 数组的第几个
      order: [], // 随机出词顺序（单词 id），首次使用时洗牌生成
      mastered: [],
      wrong: [],
      favs: [],
      seen: [],
      attempts: 0,
      correct: 0,
    };
  }

  /** 某词库“今日”的数据 */
  function makeTodayBank() {
    return { seen: [], attempts: 0, correct: 0 };
  }

  /** 今日数据（跨天时整个替换） */
  function makeToday() {
    return {
      date: todayKey(),
      byBank: {
        base: makeTodayBank(),
        zhao: makeTodayBank(),
        custom: makeTodayBank(),
      },
    };
  }

  /** 需要持久化的主状态 */
  const state = {
    version: 1,
    lang: 'zh',
    bank: 'base',
    mode: 'card',
    banks: {
      base: makeBankState(),
      zhao: makeBankState(),
      custom: makeBankState(),
    },
    today: makeToday(),
    customWords: [],
  };

  /**
   * 只影响当前页面、不需要落盘的临时 UI 状态：
   *   revealed — 卡片模式下答案是否已展开
   *   choice   — 当前选择题的选项与已选下标
   *   spell    — 当前拼写题的输入值与判分结果
   */
  const ui = {
    revealed: false,
    choice: null,
    spell: null,
  };

  /** 缓存所有需要操作的 DOM 节点，避免反复查询 */
  const els = {};

  let toastTimer = null;

  /* =====================================================================
   * 3. 工具函数
   * ===================================================================== */

  /** 取本地日期 YYYY-MM-DD（用本地时区，避免 UTC 造成的“跨天”误差） */
  function todayKey() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /** 取当前语言下的一条文案 */
  function t(key) {
    const dict = I18N[state.lang] || I18N.zh;
    return dict[key] != null ? dict[key] : I18N.zh[key] != null ? I18N.zh[key] : key;
  }

  /** 转义 HTML，防止自定义单词里的 < > & " ' 破坏页面结构（XSS 防护） */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 统一的 id 字符串化：data.js 里基础词用数字 id，这里统一成字符串比较 */
  function wordId(word) {
    return word && word.id != null ? String(word.id) : '';
  }

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** 去重并转成字符串数组（读取 localStorage 时做一次清洗） */
  function cleanIds(value) {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.filter((v) => v != null).map((v) => String(v))));
  }

  function cleanCount(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  /** 把任意来源的自定义单词整理成统一格式；缺关键字段则丢弃 */
  function normalizeCustomWord(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const word = String(raw.word || '').trim();
    const meaning = String(raw.meaning || '').trim();
    if (!word || !meaning) return null;
    const id =
      raw.id != null && String(raw.id).trim()
        ? String(raw.id).trim()
        : 'seed-' + word.toLowerCase();
    return {
      id,
      word,
      phonetic: String(raw.phonetic || '').trim(),
      pos: String(raw.pos || '').trim(),
      meaning,
      example: String(raw.example || '').trim(),
      exampleCn: String(raw.exampleCn || '').trim(),
    };
  }

  /* =====================================================================
   * 4. 词库访问
   * ===================================================================== */

  /** 当前词库的单词数组 */
  function bankWords(bank) {
    if (bank === 'base') return BASE_WORDS;
    if (bank === 'zhao') return ZHAO_WORDS;
    return customBankWords();
  }

  function currentWords() {
    return bankWords(state.bank);
  }

  /**
   * 保证某个词库的「随机顺序」可用（这是“单词页面随机顺序”的核心）：
   *   1. 先过滤掉 order 里已经不存在的 id（例如自定义词被删除）；
   *   2. 把还没进入 order 的新词随机插入，并跳到最靠前的新词，
   *      这样在 data.js 里补充词汇后，刷新页面马上就能看到新词；
   *   3. 如果是第一次使用该词库（order 为空），用 Fisher–Yates 整体洗牌；
   *   4. 修正 index，防止越界。
   *
   * 顺序会随进度一起存进 localStorage，所以刷新后仍停在同一位置，
   * 不会每次刷新都重新打乱；点“重置进度”时会重新洗牌。
   */
  function ensureOrder(bank) {
    const key = bank || state.bank;
    const bs = state.banks[key];
    const words = bankWords(key);

    const valid = new Set();
    const ids = [];
    words.forEach((word) => {
      const id = wordId(word);
      if (id && !valid.has(id)) {
        valid.add(id);
        ids.push(id);
      }
    });

    const previous = Array.isArray(bs.order) ? bs.order : [];
    const order = [];
    const used = new Set();
    previous.forEach((raw) => {
      const id = String(raw);
      if (valid.has(id) && !used.has(id)) {
        used.add(id);
        order.push(id);
      }
    });

    const hadPrevious = previous.some((raw) => valid.has(String(raw)));

    if (hadPrevious) {
      // 新词（手动改 data.js / 刚添加的自定义词）随机插入，而不是固定塞在末尾
      const missing = ids.filter((id) => !used.has(id));
      if (missing.length) {
        shuffle(missing).forEach((id) => {
          const position = Math.floor(Math.random() * (order.length + 1));
          order.splice(position, 0, id);
        });
        // 直接定位到最靠前的新词，保证刷新后能看到新增内容
        bs.index = Math.min(...missing.map((id) => order.indexOf(id)));
      }
      bs.order = order;
    } else {
      // 首次进入 / 旧数据没有顺序：整体洗牌
      bs.order = shuffle(ids);
    }

    if (!Number.isInteger(bs.index) || bs.index < 0) bs.index = 0;
    if (!bs.order.length) bs.index = 0;
    else if (bs.index >= bs.order.length) bs.index = bs.order.length - 1;
  }

  /** 按“随机顺序”取某个位置的单词 */
  function wordAt(bank, position) {
    ensureOrder(bank);
    const bs = state.banks[bank];
    const id = bs.order[position];
    if (!id) return null;
    return bankWords(bank).find((word) => wordId(word) === id) || null;
  }

  function currentWord() {
    const bs = state.banks[state.bank];
    return wordAt(state.bank, bs.index);
  }

  /**
   * 自定义词库 = data.js 里的种子数据 + localStorage 里网页新增的数据。
   * 用 id 去重，保证同一批种子词不会因为刷新而重复。
   */
  function customBankWords() {
    const seeds = Array.isArray(window.customWords) ? window.customWords : [];
    const map = new Map();
    [...seeds, ...state.customWords].forEach((raw) => {
      const word = normalizeCustomWord(raw);
      if (word) map.set(String(word.id), word);
    });
    return Array.from(map.values());
  }

  /** 该词是否只存在于 localStorage（可以删除）；data.js 里的种子词不提供删除 */
  function isDeletableCustom(id) {
    return state.customWords.some((w) => String(w.id) === String(id));
  }

  function bankLabel(bank) {
    return t(bank === 'base' ? 'bankBase' : bank === 'zhao' ? 'bankZhao' : 'bankCustom');
  }

  /* =====================================================================
   * 5. 进度操作
   * ===================================================================== */

  function ensureToday() {
    // 跨天（或数据损坏）时，整块今日数据重置
    if (!state.today || state.today.date !== todayKey() || !state.today.byBank) {
      state.today = makeToday();
    }
    BANKS.forEach((key) => {
      if (!state.today.byBank[key]) state.today.byBank[key] = makeTodayBank();
    });
  }

  function todayBank(bank) {
    ensureToday();
    return state.today.byBank[bank || state.bank];
  }

  /** 记录“这个单词今天学过了”（同一单词一天只计一次） */
  function markSeen(word, bank) {
    if (!word) return;
    const key = bank || state.bank;
    const id = wordId(word);
    if (!id) return;
    const bs = state.banks[key];
    if (!bs.seen.includes(id)) bs.seen.push(id);
    const tb = todayBank(key);
    if (!tb.seen.includes(id)) tb.seen.push(id);
  }

  function addWrong(word, bank) {
    if (!word) return;
    const key = bank || state.bank;
    const id = wordId(word);
    if (!id) return;
    const bs = state.banks[key];
    if (!bs.wrong.includes(id)) bs.wrong.push(id);
  }

  /** 让某个词回到“未掌握”，用于点击“不认识”时降级 */
  function unmaster(word, bank) {
    if (!word) return;
    const key = bank || state.bank;
    const id = wordId(word);
    state.banks[key].mastered = state.banks[key].mastered.filter((x) => x !== id);
  }

  /* =====================================================================
   * 6. 持久化：localStorage 读写
   * ===================================================================== */

  /** 写盘：任何异常（隐私模式、容量满）都只警告，不影响页面继续用 */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('[word-trainer] 无法写入 localStorage：', err);
    }
  }

  /** 读盘：逐字段校验 + 合并，避免旧版本/损坏数据导致页面崩溃 */
  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[word-trainer] 无法读取 localStorage：', err);
      return;
    }
    if (!raw) return;

    let saved = null;
    try {
      saved = JSON.parse(raw);
    } catch (err) {
      console.warn('[word-trainer] 本地数据不是合法 JSON，已忽略：', err);
      return;
    }
    if (!saved || typeof saved !== 'object') return;

    if (saved.lang === 'zh' || saved.lang === 'en') state.lang = saved.lang;
    if (BANKS.includes(saved.bank)) state.bank = saved.bank;
    if (MODES.includes(saved.mode)) state.mode = saved.mode;

    BANKS.forEach((key) => {
      const src = saved.banks && saved.banks[key];
      if (!src || typeof src !== 'object') return;
      const dst = state.banks[key];
      dst.index =
        Number.isFinite(Number(src.index)) && Number(src.index) >= 0
          ? Math.floor(Number(src.index))
          : 0;
      dst.order = cleanIds(src.order);
      dst.mastered = cleanIds(src.mastered);
      dst.wrong = cleanIds(src.wrong);
      dst.favs = cleanIds(src.favs);
      dst.seen = cleanIds(src.seen);
      dst.attempts = cleanCount(src.attempts);
      dst.correct = Math.min(cleanCount(src.correct), dst.attempts);
    });

    if (Array.isArray(saved.customWords)) {
      state.customWords = saved.customWords
        .map(normalizeCustomWord)
        .filter(Boolean);
    }

    // 只有“日期是今天”的今日数据才恢复，否则保持 makeToday() 的全新状态
    if (saved.today && saved.today.date === todayKey() && saved.today.byBank) {
      BANKS.forEach((key) => {
        const src = saved.today.byBank[key];
        if (!src) return;
        const dst = state.today.byBank[key];
        dst.seen = cleanIds(src.seen);
        dst.attempts = cleanCount(src.attempts);
        dst.correct = Math.min(cleanCount(src.correct), dst.attempts);
      });
    }
  }

  /* =====================================================================
   * 7. 渲染：统计区
   * ===================================================================== */

  function renderStats() {
    const words = currentWords();
    const existing = new Set(words.map(wordId));
    const bs = state.banks[state.bank];
    const tb = todayBank();

    const seenCount = bs.seen.filter((id) => existing.has(id)).length;
    const masteredCount = bs.mastered.filter((id) => existing.has(id)).length;
    const wrongCount = bs.wrong.filter((id) => existing.has(id)).length;
    const favCount = bs.favs.filter((id) => existing.has(id)).length;
    const todayCount = tb.seen.filter((id) => existing.has(id)).length;

    const percent = words.length ? Math.round((seenCount / words.length) * 100) : 0;
    const accuracy = tb.attempts
      ? Math.round((tb.correct / tb.attempts) * 100) + '%'
      : '—';

    els.statProgress.textContent = percent + '%';
    els.statToday.textContent = String(todayCount);
    els.statAccuracy.textContent = accuracy;
    els.statMastered.textContent = String(masteredCount);
    els.statWrong.textContent = String(wrongCount);
    els.statFav.textContent = String(favCount);

    els.miniBarFill.style.width = percent + '%';
    els.progressFill.style.width = percent + '%';
    els.progressBar.setAttribute('aria-valuenow', String(percent));

    // 页脚工具条上的数量角标
    els.wrongCount.textContent = String(wrongCount);
    els.favCount.textContent = String(favCount);
  }

  /* =====================================================================
   * 8. 渲染：主卡片
   * ===================================================================== */

  function statusChips(word) {
    const bs = state.banks[state.bank];
    const id = wordId(word);
    const chips = [];
    if (bs.mastered.includes(id)) {
      chips.push('<span class="chip chip-ok">✓ ' + esc(t('statusMastered')) + '</span>');
    } else if (bs.wrong.includes(id)) {
      chips.push('<span class="chip chip-bad">! ' + esc(t('statusWrong')) + '</span>');
    } else if (bs.seen.includes(id)) {
      chips.push('<span class="chip">' + esc(t('statusSeen')) + '</span>');
    } else {
      chips.push('<span class="chip">' + esc(t('statusNew')) + '</span>');
    }
    if (bs.favs.includes(id)) {
      chips.push('<span class="chip chip-fav">★ ' + esc(t('statusFav')) + '</span>');
    }
    return chips.join('');
  }

  function speakButton() {
    return (
      '<button type="button" class="speak-btn" data-action="speak" aria-label="' +
      esc(t('speak')) +
      '" title="' +
      esc(t('speak')) +
      '">🔊</button>'
    );
  }

  function exampleHTML(word) {
    if (!word.example && !word.exampleCn) return '';
    return (
      '<div class="example">' +
      (word.example ? '<p class="ex-en">' + esc(word.example) + '</p>' : '') +
      (word.exampleCn ? '<p class="ex-cn">' + esc(word.exampleCn) + '</p>' : '') +
      '</div>'
    );
  }

  /** 空词库占位 */
  function emptyHTML() {
    const isCustom = state.bank === 'custom';
    return (
      '<div class="empty">' +
      '<div class="empty-icon">' + (isCustom ? '✎' : '📖') + '</div>' +
      '<p class="empty-title">' +
      esc(t(isCustom ? 'emptyCustomTitle' : 'emptyBankTitle')) +
      '</p>' +
      '<p class="empty-desc">' +
      esc(t(isCustom ? 'emptyCustomDesc' : 'emptyBankDesc')) +
      '</p>' +
      (isCustom
        ? '<button type="button" class="btn primary" data-action="go-add">＋ ' +
          esc(t('goAdd')) +
          '</button>'
        : '') +
      '</div>'
    );
  }

  /** 卡片模式 */
  function renderCardMode(word, index, total) {
    const frontIsWord = state.lang === 'zh'; // 中看英，英看中
    const front = frontIsWord ? word.word : word.meaning;
    const answerMain = frontIsWord ? word.meaning : word.word;
    const answerSub = frontIsWord ? word.pos : word.phonetic;
    const revealed = ui.revealed;

    return (
      '<div class="card-head">' +
      '<span class="chip">' + (index + 1) + ' / ' + total + '</span>' +
      '<div class="chip-group">' + statusChips(word) + '</div>' +
      '</div>' +
      '<div class="card-body">' +
      '<div class="word-line">' +
      '<h2 class="word' + (frontIsWord ? '' : ' is-zh') + '">' + esc(front) + '</h2>' +
      (frontIsWord ? speakButton() : '') +
      '</div>' +
      (frontIsWord && word.phonetic
        ? '<p class="phonetic">' + esc(word.phonetic) + '</p>'
        : '') +
      (word.pos ? '<span class="pos-line">' + esc(word.pos) + '</span>' : '') +
      '<div class="answer' + (revealed ? ' is-open' : '') + '">' +
      '<p class="answer-label">' + esc(t(frontIsWord ? 'answerLabel' : 'answerLabelWord')) + '</p>' +
      '<p class="answer-main">' + esc(answerMain) + '</p>' +
      (answerSub ? '<p class="answer-sub">' + esc(answerSub) + '</p>' : '') +
      exampleHTML(word) +
      '</div>' +
      '<p class="hint">' + esc(t(revealed ? 'cardHintNext' : 'cardHintShow')) + '</p>' +
      '</div>'
    );
  }

  /** 生成 4 个不重复选项（不足时从全部词库补足） */
  function buildChoice() {
    const word = currentWord();
    if (!word) return null;

    const frontIsWord = state.lang === 'zh';
    const key = frontIsWord ? 'meaning' : 'word';
    const correctText = String(word[key] || '');

    const collect = (pool) => {
      const used = new Set([correctText]);
      const result = [];
      shuffle(pool).forEach((item) => {
        if (wordId(item) === wordId(word)) return;
        const text = String(item[key] || '');
        if (!text || used.has(text)) return;
        used.add(text);
        result.push(text);
      });
      return result;
    };

    let candidates = collect(currentWords());
    if (candidates.length < 3) {
      // 自定义词库很少时，用全部词库来凑够 4 个选项
      candidates = collect(BASE_WORDS.concat(ZHAO_WORDS, customBankWords()));
    }
    if (candidates.length < 3) {
      // 兜底：理论上不会发生（基础词库固定有 300 个词）
      candidates = candidates.concat(['—', '— —', '— — —']);
    }

    const options = [correctText]
      .concat(candidates.slice(0, 3))
      .map((text, i) => ({ text, correct: i === 0 }));

    return { options: shuffle(options), picked: null };
  }

  function ensureChoice() {
    if (!ui.choice) ui.choice = buildChoice();
    return ui.choice;
  }

  /** 选择题模式 */
  function renderChoiceMode(word, index, total) {
    const frontIsWord = state.lang === 'zh';
    const front = frontIsWord ? word.word : word.meaning;
    const choice = ensureChoice();
    if (!choice) return emptyHTML();

    const picked = choice.picked;
    const correctIndex = choice.options.findIndex((o) => o.correct);
    const correctText = correctIndex >= 0 ? choice.options[correctIndex].text : '';
    const isRight = picked !== null && !!choice.options[picked].correct;

    const optionsHTML = choice.options
      .map((option, i) => {
        let cls = 'option';
        if (picked !== null) {
          if (option.correct) cls += ' is-correct';
          else if (i === picked) cls += ' is-wrong';
        }
        const mark =
          picked === null
            ? ''
            : option.correct
            ? '<span class="opt-mark">✓</span>'
            : i === picked
            ? '<span class="opt-mark">✕</span>'
            : '';
        return (
          '<button type="button" class="' + cls + '" data-choice="' + i + '"' +
          (picked !== null ? ' disabled' : '') + '>' +
          '<span class="opt-key">' + (i + 1) + '</span>' +
          '<span class="opt-text">' + esc(option.text) + '</span>' +
          mark +
          '</button>'
        );
      })
      .join('');

    const feedback =
      picked === null
        ? ''
        : '<div class="feedback is-show ' + (isRight ? 'ok' : 'bad') + '">' +
          '<strong>' + (isRight ? '✓ ' + esc(t('correct')) : '✕ ' + esc(t('incorrect'))) + '</strong>' +
          '<span>' +
          (isRight
            ? esc(correctText)
            : esc(t('answerIs')) + '<b>' + esc(correctText) + '</b> · ' + esc(t('continueHint'))) +
          '</span>' +
          '</div>';

    return (
      '<div class="card-head">' +
      '<span class="chip">' + (index + 1) + ' / ' + total + '</span>' +
      '<div class="chip-group"><span class="chip chip-soft">' + esc(t('modeChoice')) + '</span>' +
      statusChips(word) + '</div>' +
      '</div>' +
      '<div class="quiz">' +
      '<p class="quiz-label">' +
      esc(t(frontIsWord ? 'choiceQuestion' : 'choiceQuestionReverse')) +
      '</p>' +
      '<div class="word-line">' +
      '<h2 class="word' + (frontIsWord ? '' : ' is-zh') + '">' + esc(front) + '</h2>' +
      (frontIsWord ? speakButton() : '') +
      '</div>' +
      (frontIsWord && word.phonetic
        ? '<p class="phonetic">' + esc(word.phonetic) + '</p>'
        : word.pos
        ? '<span class="pos-line">' + esc(word.pos) + '</span>'
        : '') +
      '<div class="options">' + optionsHTML + '</div>' +
      feedback +
      '</div>'
    );
  }

  /** 拼写模式：始终“看中文拼英文” */
  function renderSpellMode(word, index, total) {
    const spell = ui.spell || { value: '', checked: false, correct: false };
    const disabled = spell.checked ? ' disabled' : '';

    const feedback = spell.checked
      ? '<div class="feedback is-show ' + (spell.correct ? 'ok' : 'bad') + '">' +
        '<strong>' +
        (spell.correct ? '✓ ' + esc(t('spellCorrect')) : '✕ ' + esc(t('spellWrong'))) +
        '</strong>' +
        '<span>' +
        (spell.correct
          ? esc(word.word)
          : '<b>' + esc(word.word) + '</b> · ' + esc(t('continueHint'))) +
        '</span>' +
        '</div>' +
        exampleHTML(word)
      : '';

    return (
      '<div class="card-head">' +
      '<span class="chip">' + (index + 1) + ' / ' + total + '</span>' +
      '<div class="chip-group"><span class="chip chip-soft">' + esc(t('modeSpell')) + '</span>' +
      statusChips(word) + '</div>' +
      '</div>' +
      '<div class="quiz">' +
      '<p class="quiz-label">' + esc(t('spellQuestion')) + '</p>' +
      '<div class="word-line"><h2 class="word is-zh">' + esc(word.meaning) + '</h2></div>' +
      (word.pos ? '<span class="pos-line">' + esc(word.pos) + '</span>' : '') +
      '<form class="spell-form" id="spellForm" autocomplete="off">' +
      '<input class="spell-input" id="spellInput" type="text" name="spell" ' +
      'value="' + esc(spell.value) + '" placeholder="' + esc(t('spellPlaceholder')) + '" ' +
      'autocapitalize="off" autocorrect="off" spellcheck="false"' + disabled + ' />' +
      '<button type="submit" class="btn primary"' + disabled + '>' + esc(t('submit')) + '</button>' +
      '</form>' +
      feedback +
      '</div>'
    );
  }

  function renderCard() {
    const words = currentWords();

    if (!words.length) {
      els.card.classList.remove('is-clickable');
      els.card.innerHTML = emptyHTML();
      return;
    }

    // 按随机顺序取当前单词；order 在 render() 里已经保证可用
    const word = currentWord();
    if (!word) {
      els.card.classList.remove('is-clickable');
      els.card.innerHTML = emptyHTML();
      return;
    }

    const bs = state.banks[state.bank];
    const index = bs.index;
    const total = bs.order.length || words.length;

    els.card.classList.toggle('is-clickable', state.mode === 'card');

    if (state.mode === 'choice') {
      els.card.innerHTML = renderChoiceMode(word, index, total);
    } else if (state.mode === 'spell') {
      els.card.innerHTML = renderSpellMode(word, index, total);
    } else {
      els.card.innerHTML = renderCardMode(word, index, total);
    }
  }

  /** 同步收藏按钮的图标/文字/高亮 */
  function syncFavButton() {
    const word = currentWord();
    const bs = state.banks[state.bank];
    const saved = word ? bs.favs.includes(wordId(word)) : false;
    els.favBtn.classList.toggle('is-on', saved);
    const star = els.favBtn.querySelector('.fav-star');
    if (star) star.textContent = saved ? '★' : '☆';
    els.favBtnLabel.textContent = t(saved ? 'unfav' : 'fav');
  }

  function syncActionButtons() {
    const hasWords = currentWords().length > 0;
    [els.prevBtn, els.nextBtn, els.knowBtn, els.dontKnowBtn, els.favBtn].forEach((btn) => {
      if (btn) btn.disabled = !hasWords;
    });
    syncFavButton();
  }

  function syncToolbar() {
    els.bankSelect.value = state.bank;
    els.modeTabs.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.mode === state.mode);
      btn.setAttribute('aria-selected', btn.dataset.mode === state.mode ? 'true' : 'false');
    });
    els.langBtnText.textContent = state.lang === 'zh' ? '中 / EN' : 'EN / 中';
  }

  /**
   * 总渲染入口：任何会改变界面的操作最后都调用它。
   * 顺序很重要：先修正日期/索引，再画统计、卡片、按钮，最后落盘。
   */
  function render() {
    ensureToday();
    ensureOrder(state.bank);
    const bs = state.banks[state.bank];
    const total = currentWords().length;
    if (!Number.isInteger(bs.index) || bs.index < 0) bs.index = 0;
    if (total === 0) bs.index = 0;
    else if (bs.index >= total) bs.index = total - 1;

    syncToolbar();
    renderStats();
    renderCard();
    syncActionButtons();
    save();
  }

  /* =====================================================================
   * 9. 渲染：三个弹窗中的列表
   * ===================================================================== */

  function wordItemHTML(word, actions) {
    return (
      '<div class="word-item">' +
      '<div class="word-item-main">' +
      '<div class="word-item-top">' +
      '<span class="word-item-word">' + esc(word.word) + '</span>' +
      (word.phonetic
        ? '<span class="word-item-phonetic">' + esc(word.phonetic) + '</span>'
        : '') +
      (word.pos ? '<span class="word-item-pos">' + esc(word.pos) + '</span>' : '') +
      '</div>' +
      '<p class="word-item-meaning">' + esc(word.meaning) + '</p>' +
      '</div>' +
      '<div class="word-item-actions">' + actions + '</div>' +
      '</div>'
    );
  }

  function miniButton(label, attr, value, extraClass) {
    return (
      '<button type="button" class="mini-btn' + (extraClass ? ' ' + extraClass : '') +
      '" ' + attr + '="' + esc(value) + '">' + esc(label) + '</button>'
    );
  }

  function renderWrongList() {
    const words = currentWords();
    const map = new Map(words.map((w) => [wordId(w), w]));
    const items = state.banks[state.bank].wrong
      .map((id) => map.get(id))
      .filter(Boolean);

    els.wrongSub.textContent = bankLabel(state.bank) + ' · ' + items.length;

    if (!items.length) {
      els.wrongList.innerHTML =
        '<div class="empty"><div class="empty-icon">✓</div>' +
        '<p class="empty-title">' + esc(t('emptyWrong')) + '</p></div>';
      return;
    }

    els.wrongList.innerHTML = items
      .map((word) =>
        wordItemHTML(
          word,
          miniButton(t('markMastered'), 'data-master', wordId(word)) +
            miniButton(t('remove'), 'data-remove-wrong', wordId(word), 'danger')
        )
      )
      .join('');
  }

  function renderFavList() {
    const words = currentWords();
    const map = new Map(words.map((w) => [wordId(w), w]));
    const items = state.banks[state.bank].favs
      .map((id) => map.get(id))
      .filter(Boolean);

    els.favSub.textContent = bankLabel(state.bank) + ' · ' + items.length;

    if (!items.length) {
      els.favList.innerHTML =
        '<div class="empty"><div class="empty-icon">☆</div>' +
        '<p class="empty-title">' + esc(t('emptyFav')) + '</p></div>';
      return;
    }

    els.favList.innerHTML = items
      .map((word) =>
        wordItemHTML(
          word,
          miniButton(t('remove'), 'data-remove-fav', wordId(word), 'danger')
        )
      )
      .join('');
  }

  function renderCustomList() {
    const words = customBankWords();

    if (!words.length) {
      els.customList.innerHTML =
        '<div class="empty"><div class="empty-icon">✎</div>' +
        '<p class="empty-title">' + esc(t('noCustom')) + '</p></div>';
      return;
    }

    els.customList.innerHTML = words
      .map((word) => {
        const actions = isDeletableCustom(wordId(word))
          ? miniButton(t('delete'), 'data-delete-custom', wordId(word), 'danger')
          : '<span class="chip">data.js</span>';
        return wordItemHTML(word, actions);
      })
      .join('');
  }

  /* =====================================================================
   * 10. 弹窗控制
   * ===================================================================== */

  function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    if (!document.querySelector('.modal:not([hidden])')) {
      document.body.classList.remove('no-scroll');
    }
  }

  function closeAllModals() {
    document.querySelectorAll('.modal:not([hidden])').forEach((modal) => {
      modal.hidden = true;
    });
    document.body.classList.remove('no-scroll');
  }

  function openWrongModal() {
    renderWrongList();
    openModal(els.wrongModal);
  }

  function openFavModal() {
    renderFavList();
    openModal(els.favModal);
  }

  function openAddModal() {
    renderCustomList();
    openModal(els.addModal);
    // 桌面端自动聚焦，移动端不强行弹键盘
    if (window.matchMedia('(min-width: 700px)').matches) {
      const input = els.addForm.querySelector('input[name="word"]');
      if (input) input.focus();
    }
  }

  /* =====================================================================
   * 11. 业务动作
   * ===================================================================== */

  function resetUI() {
    ui.revealed = false;
    ui.choice = null;
    ui.spell = null;
  }

  /** 前后切换；沿着随机顺序走，对长度取模实现首尾循环 */
  function go(step) {
    const words = currentWords();
    if (!words.length) return;
    const bs = state.banks[state.bank];
    const total = bs.order.length || words.length;
    bs.index = ((bs.index + step) % total + total) % total;
    resetUI();
    render();
  }

  /** 卡片点击：展开 / 收起答案 */
  function toggleReveal() {
    if (state.mode !== 'card') return;
    if (!ui.revealed) {
      ui.revealed = true;
      markSeen(currentWord());
    } else {
      ui.revealed = false;
    }
    render();
  }

  /** 点击“认识 / 掌握” */
  function markKnown() {
    const word = currentWord();
    if (!word) return;
    const bs = state.banks[state.bank];
    const id = wordId(word);
    if (!bs.mastered.includes(id)) bs.mastered.push(id);
    bs.wrong = bs.wrong.filter((x) => x !== id); // 掌握后自动移出错词本
    markSeen(word);
    go(1);
  }

  /** 点击“不认识”：加入错词本并降级 */
  function markUnknown() {
    const word = currentWord();
    if (!word) return;
    addWrong(word);
    unmaster(word);
    markSeen(word);
    go(1);
  }

  /** 收藏 / 取消收藏（不跳转，让用户停留在这个词上） */
  function toggleFav() {
    const word = currentWord();
    if (!word) return;
    const bs = state.banks[state.bank];
    const id = wordId(word);
    const at = bs.favs.indexOf(id);
    if (at >= 0) {
      bs.favs.splice(at, 1);
      toast(t('toastUnfav'));
    } else {
      bs.favs.push(id);
      toast(t('toastFav'));
    }
    render();
  }

  /** 选择题点选 */
  function pickChoice(value) {
    if (state.mode !== 'choice') return;
    const choice = ui.choice;
    if (!choice || choice.picked !== null) return;
    const index = Number(value);
    if (!Number.isInteger(index) || !choice.options[index]) return;

    const word = currentWord();
    if (!word) return;

    choice.picked = index;
    const isRight = !!choice.options[index].correct;

    markSeen(word);
    const bs = state.banks[state.bank];
    const tb = todayBank();
    bs.attempts += 1;
    tb.attempts += 1;
    if (isRight) {
      bs.correct += 1;
      tb.correct += 1;
    } else {
      addWrong(word);
    }

    render();
  }

  /** 拼写提交 */
  function submitSpell() {
    if (state.mode !== 'spell') return;
    if (ui.spell && ui.spell.checked) return;

    const word = currentWord();
    if (!word) return;

    const input = document.getElementById('spellInput');
    if (!input) return;

    const value = input.value.trim();
    const isRight = value.toLowerCase() === String(word.word).trim().toLowerCase();

    ui.spell = { value, checked: true, correct: isRight };

    markSeen(word);
    const bs = state.banks[state.bank];
    const tb = todayBank();
    bs.attempts += 1;
    tb.attempts += 1;
    if (isRight) {
      bs.correct += 1;
      tb.correct += 1;
    } else {
      addWrong(word);
    }

    render();
  }

  /** 空格键的总调度 */
  function handleSpace() {
    if (state.mode === 'card') {
      if (!ui.revealed) {
        ui.revealed = true;
        markSeen(currentWord());
        render();
      } else {
        go(1);
      }
      return;
    }

    if (state.mode === 'choice') {
      if (ui.choice && ui.choice.picked !== null) go(1);
      return;
    }

    if (state.mode === 'spell') {
      if (ui.spell && ui.spell.checked) {
        go(1);
      } else {
        const input = document.getElementById('spellInput');
        if (input) input.focus();
      }
    }
  }

  /** 重置当前词库进度（保留错词本与收藏） */
  function resetProgress() {
    if (!window.confirm(t('resetConfirm'))) return;

    const bs = state.banks[state.bank];
    bs.index = 0;
    bs.order = shuffle(bs.order); // 重置时重新洗牌，避免每次都是同一顺序
    bs.mastered = [];
    bs.seen = [];
    bs.attempts = 0;
    bs.correct = 0;
    state.today.byBank[state.bank] = makeTodayBank();

    resetUI();
    render();
    toast(t('toastReset'));
  }

  /* =====================================================================
   * 12. 自定义单词：新增 / 删除
   * ===================================================================== */

  function onAddSubmit(event) {
    event.preventDefault();

    const form = els.addForm;
    const data = new FormData(form);
    const word = String(data.get('word') || '').trim();
    const meaning = String(data.get('meaning') || '').trim();

    if (!word || !meaning) {
      toast(t('required'));
      return;
    }

    const now = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 6);
    const entry = {
      id: 'u' + now + rand,
      word,
      phonetic: String(data.get('phonetic') || '').trim(),
      pos: String(data.get('pos') || '').trim(),
      meaning,
      example: String(data.get('example') || '').trim(),
      exampleCn: String(data.get('exampleCn') || '').trim(),
    };

    state.customWords.push(entry);
    form.reset();

    // 新增后自动切到自定义词库，并跳到刚添加的单词
    state.bank = 'custom';
    state.mode = 'card';
    resetUI();

    // ensureOrder 会把新词追加到随机顺序末尾，再把 index 指向它
    ensureOrder('custom');
    const position = state.banks.custom.order.indexOf(entry.id);
    state.banks.custom.index = position >= 0 ? position : 0;

    render();
    closeModal(els.addModal);
    toast(t('toastAdded'));
  }

  function deleteCustomWord(id) {
    if (!isDeletableCustom(id)) return;
    if (!window.confirm(t('deleteConfirm'))) return;

    state.customWords = state.customWords.filter((w) => String(w.id) !== String(id));

    // 同时清理所有词库进度/今日数据/随机顺序中对这个 id 的引用
    BANKS.forEach((bank) => {
      const bs = state.banks[bank];
      const idStr = String(id);
      const at = Array.isArray(bs.order) ? bs.order.indexOf(idStr) : -1;
      if (at !== -1) {
        bs.order.splice(at, 1);
        // 删除的是当前词之前的词，当前位置要前移，避免“跳过”一个词
        if (at < bs.index) bs.index -= 1;
        else if (bs.index >= bs.order.length) bs.index = Math.max(0, bs.order.length - 1);
      }
      bs.mastered = bs.mastered.filter((x) => x !== idStr);
      bs.wrong = bs.wrong.filter((x) => x !== idStr);
      bs.favs = bs.favs.filter((x) => x !== idStr);
      bs.seen = bs.seen.filter((x) => x !== idStr);
      state.today.byBank[bank].seen = state.today.byBank[bank].seen.filter(
        (x) => x !== idStr
      );
    });

    render();
    renderCustomList();
    toast(t('toastDeleted'));
  }

  /* =====================================================================
   * 13. 事件绑定
   * ===================================================================== */

  /** 词库切换 */
  function onBankChange() {
    state.bank = els.bankSelect.value;
    resetUI();
    render();
  }

  /** 模式切换 */
  function onModeClick(event) {
    const btn = event.target.closest('[data-mode]');
    if (!btn) return;
    const mode = btn.dataset.mode;
    if (!MODES.includes(mode) || mode === state.mode) return;
    state.mode = mode;
    resetUI();
    render();
  }

  /** 中 / EN 切换：界面文字和卡片正反面同时切换 */
  function onLangToggle() {
    state.lang = state.lang === 'zh' ? 'en' : 'zh';
    ui.revealed = false;
    ui.choice = null; // 选项方向变了（释义↔单词），必须重新生成
    applyLang();
    render();
    if (!els.wrongModal.hidden) renderWrongList();
    if (!els.favModal.hidden) renderFavList();
    if (!els.addModal.hidden) renderCustomList();
  }

  /** 卡片区域的事件委托：发音 / 添加 / 选项 / 翻面 */
  function onCardClick(event) {
    const target = event.target;

    if (target.closest('[data-action="speak"]')) {
      speakWord();
      return;
    }

    if (target.closest('[data-action="go-add"]')) {
      openAddModal();
      return;
    }

    const option = target.closest('[data-choice]');
    if (option) {
      pickChoice(option.dataset.choice);
      return;
    }

    if (state.mode === 'card') toggleReveal();
  }

  function onCardSubmit(event) {
    if (event.target && event.target.id === 'spellForm') {
      event.preventDefault();
      submitSpell();
    }
  }

  function onWrongListClick(event) {
    const master = event.target.closest('[data-master]');
    if (master) {
      const id = master.dataset.master;
      const word = currentWords().find((w) => wordId(w) === id);
      const bs = state.banks[state.bank];
      if (!bs.mastered.includes(id)) bs.mastered.push(id);
      bs.wrong = bs.wrong.filter((x) => x !== id);
      if (word) markSeen(word);
      render();
      renderWrongList();
      toast(t('toastMastered'));
      return;
    }

    const remove = event.target.closest('[data-remove-wrong]');
    if (remove) {
      const id = remove.dataset.removeWrong;
      state.banks[state.bank].wrong = state.banks[state.bank].wrong.filter(
        (x) => x !== id
      );
      render();
      renderWrongList();
      toast(t('toastRemoved'));
    }
  }

  function onFavListClick(event) {
    const remove = event.target.closest('[data-remove-fav]');
    if (!remove) return;
    const id = remove.dataset.removeFav;
    state.banks[state.bank].favs = state.banks[state.bank].favs.filter(
      (x) => x !== id
    );
    render();
    renderFavList();
    toast(t('toastUnfav'));
  }

  function onCustomListClick(event) {
    const btn = event.target.closest('[data-delete-custom]');
    if (!btn) return;
    deleteCustomWord(btn.dataset.deleteCustom);
  }

  /** 全站快捷键：空格 / ← → / 1–4 / Esc */
  function onKeyDown(event) {
    if (event.key === 'Escape') {
      closeAllModals();
      return;
    }

    // 有弹窗打开时，把键盘交给弹窗（表单输入、按钮操作）
    if (document.querySelector('.modal:not([hidden])')) return;

    const target = event.target instanceof Element ? event.target : document.body;
    const isTyping =
      target.matches('input, textarea, select') || target.isContentEditable;
    if (isTyping) return;

    if (event.code === 'Space' || event.key === ' ') {
      event.preventDefault();
      handleSpace();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
      return;
    }

    if (state.mode === 'choice' && /^[1-4]$/.test(event.key)) {
      event.preventDefault();
      pickChoice(Number(event.key) - 1);
    }
  }

  /** 浏览器内置语音合成朗读（无需任何第三方库） */
  function speakWord() {
    const word = currentWord();
    if (!word) return;

    if (!('speechSynthesis' in window)) {
      toast(t('speakUnsupported'));
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.92;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[word-trainer] 朗读失败：', err);
    }
  }

  /* =====================================================================
   * 14. 国际化应用 & 轻提示
   * ===================================================================== */

  /** 把 data-i18n 标记的静态文字替换成当前语言 */
  function applyLang() {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
    document.title =
      state.lang === 'zh' ? '四级背单词 · Word Trainer' : 'Word Trainer · CET-4';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const text = t(key);
      if (text) el.textContent = text;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    els.langBtnText.textContent = state.lang === 'zh' ? '中 / EN' : 'EN / 中';
    syncFavButton();
  }

  function toast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add('is-show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove('is-show');
    }, 2200);
  }

  /* =====================================================================
   * 15. 初始化
   * ===================================================================== */

  function cacheEls() {
    els.bankSelect = document.getElementById('bankSelect');
    els.modeTabs = document.getElementById('modeTabs');
    els.langBtn = document.getElementById('langBtn');
    els.langBtnText = document.getElementById('langBtnText');

    els.statProgress = document.getElementById('statProgress');
    els.statToday = document.getElementById('statToday');
    els.statAccuracy = document.getElementById('statAccuracy');
    els.statMastered = document.getElementById('statMastered');
    els.statWrong = document.getElementById('statWrong');
    els.statFav = document.getElementById('statFav');

    els.miniBarFill = document.getElementById('miniBarFill');
    els.progressBar = document.getElementById('progressBar');
    els.progressFill = document.getElementById('progressFill');

    els.card = document.getElementById('card');

    els.prevBtn = document.getElementById('prevBtn');
    els.nextBtn = document.getElementById('nextBtn');
    els.knowBtn = document.getElementById('knowBtn');
    els.dontKnowBtn = document.getElementById('dontKnowBtn');
    els.favBtn = document.getElementById('favBtn');
    els.favBtnLabel = document.getElementById('favBtnLabel');

    els.wrongBtn = document.getElementById('wrongBtn');
    els.favListBtn = document.getElementById('favListBtn');
    els.addBtn = document.getElementById('addBtn');
    els.resetBtn = document.getElementById('resetBtn');
    els.wrongCount = document.getElementById('wrongCount');
    els.favCount = document.getElementById('favCount');

    els.wrongModal = document.getElementById('wrongModal');
    els.wrongSub = document.getElementById('wrongSub');
    els.wrongList = document.getElementById('wrongList');
    els.favModal = document.getElementById('favModal');
    els.favSub = document.getElementById('favSub');
    els.favList = document.getElementById('favList');
    els.addModal = document.getElementById('addModal');
    els.addForm = document.getElementById('addForm');
    els.customList = document.getElementById('customList');

    els.toast = document.getElementById('toast');
  }

  function bindEvents() {
    els.bankSelect.addEventListener('change', onBankChange);
    els.modeTabs.addEventListener('click', onModeClick);
    els.langBtn.addEventListener('click', onLangToggle);

    els.card.addEventListener('click', onCardClick);
    els.card.addEventListener('submit', onCardSubmit);

    els.prevBtn.addEventListener('click', () => go(-1));
    els.nextBtn.addEventListener('click', () => go(1));
    els.knowBtn.addEventListener('click', markKnown);
    els.dontKnowBtn.addEventListener('click', markUnknown);
    els.favBtn.addEventListener('click', toggleFav);

    els.wrongBtn.addEventListener('click', openWrongModal);
    els.favListBtn.addEventListener('click', openFavModal);
    els.addBtn.addEventListener('click', openAddModal);
    els.resetBtn.addEventListener('click', resetProgress);

    els.addForm.addEventListener('submit', onAddSubmit);

    els.wrongList.addEventListener('click', onWrongListClick);
    els.favList.addEventListener('click', onFavListClick);
    els.customList.addEventListener('click', onCustomListClick);

    // 点击遮罩或 × / 取消，都能关闭对应弹窗
    document.querySelectorAll('.modal').forEach((modal) => {
      modal.addEventListener('click', (event) => {
        if (event.target.closest('[data-close]')) closeModal(modal);
      });
    });

    document.addEventListener('keydown', onKeyDown);
  }

  function init() {
    cacheEls();
    load();
    ensureToday();
    // 先建立（或恢复）随机顺序，后面的 applyLang / render 才能取到当前单词
    ensureOrder(state.bank);

    applyLang();
    bindEvents();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
