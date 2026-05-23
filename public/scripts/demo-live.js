function initCrowdConnectLiveDemo() {
  const tvEl = document.getElementById('demo-tv-screen');
  const p7 = document.getElementById('demo-phone-7');
  const p12 = document.getElementById('demo-phone-12');
  const p4 = document.getElementById('demo-phone-4');
  const hintEl = document.getElementById('demo-hint');
  const resetBtn = document.getElementById('demo-reset');
  const tabs = document.querySelectorAll('.demo-tab');

  if (!tvEl || !p7 || !p12 || !p4 || !hintEl || !resetBtn || tabs.length === 0) {
    return false;
  }

  const phones = { 7: p7, 12: p12, 4: p4 };

  const EMOJIS = ['🍻', '🔥', '✨', '🥂', '😎', '💯'];
  const QUIZ = { q: 'Welche Farbe hat ein Aperol Spritz?', options: ['A: Rot', 'B: Orange', 'C: Gelb', 'D: Pink'], correct: 1 };
  const TRACKS = [
    { id: 'aperol', name: 'Aperol Anthem', votes: 12 },
    { id: 'sunset', name: 'Sunset Lounge', votes: 8 },
    { id: 'friday', name: 'Friday Night', votes: 5 }
  ];
  const DRINKS = [
    { id: 'spritz', name: 'Aperol Spritz', price: '9,80', emoji: '🥂' },
    { id: 'old', name: 'Old Fashioned', price: '12,00', emoji: '🥃' },
    { id: 'hugo', name: 'Hugo', price: '8,50', emoji: '🍹' }
  ];

  let state = null;
  let scenario = 'emoji';

  // -----------------------------------------------------
  // Scenario setup
  // -----------------------------------------------------
  function reset() {
    if (scenario === 'emoji') {
      state = {
        senderTable: null,
        selectedEmoji: null,
        receivedAt: {},  // { tableId: { from, emoji } }
        blocked: {},     // { receiverTable: Set<senderTable> }
        tvLog: []
      };
    } else if (scenario === 'quiz') {
      state = { picks: {}, revealed: false };
    } else if (scenario === 'music') {
      state = {
        votes: TRACKS.reduce((acc, t) => ({ ...acc, [t.id]: t.votes }), {}),
        voted: {}
      };
    } else if (scenario === 'drink') {
      state = { senderTable: null, selectedDrink: null, sentTo: null };
    }
    render();
  }

  function setScenario(name) {
    scenario = name;
    tabs.forEach(t => {
      const isActive = t.dataset.scenario === name;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', isActive);
    });
    reset();
  }

  // -----------------------------------------------------
  // Rendering helpers
  // -----------------------------------------------------
  function clearAll() {
    tvEl.innerHTML = '';
    Object.values(phones).forEach(p => p.innerHTML = '');
  }

  function renderHint(scenarioKey) {
    const hints = {
      emoji_choose: ['So funktioniert es', 'Tippe auf Tisch 7 ein Emoji an. Wähle dann einen Empfänger-Tisch. Der Empfänger sieht die Geste, kann zurück-feiern oder Tisch 7 für Emojis blocken.'],
      emoji_choose_target: ['Nun den Tisch', 'Welcher Tisch soll dein Emoji bekommen? Tippe Tisch 12 oder Tisch 4.'],
      emoji_sent: ['Gesendet', 'Empfänger sieht das Emoji am Phone, gleichzeitig erscheint es auf dem TV im Social Mode. Empfänger kann mit einem Tap blocken.'],
      emoji_blocked_test: ['Block aktiv', 'Schicke nochmal ein Emoji vom selben Sender an denselben Empfänger. Es landet nicht mehr, kein Spam, kein Pop-up.'],
      quiz_start: ['Quiz läuft', 'Auf dem TV läuft die Frage. Alle drei Phones haben dieselben Antworten. Tippe eine Antwort auf einem oder mehreren Phones.'],
      quiz_done: ['Auflösung', 'Tippe auf dem TV, um die richtige Antwort zu zeigen. Leaderboard sieht jeder.'],
      music_start: ['Music Voting läuft', 'Drei Track-Kandidaten, drei Tische voten. Jedes Phone hat eine Stimme. Vote-Balken auf dem TV passen sich live an.'],
      drink_pick: ['Drink wählen', 'Tisch 7 schickt einen Drink an einen anderen Tisch. Wähle erst den Drink, dann den Empfänger-Tisch.'],
      drink_target: ['Empfänger wählen', 'An welchen Tisch soll der Drink? 12 oder 4? Tippe einen an.'],
      drink_done: ['Drink unterwegs', 'Crew sieht die Bestellung mit Tischnummer. TV zeigt die Drink-from-Table-Animation. Empfänger sieht eingehende Geste.']
    };
    const [head, body] = hints[scenarioKey] || hints.emoji_choose;
    hintEl.innerHTML = '<strong>' + head + '</strong>' + body;
  }

  // -----------------------------------------------------
  // EMOJI scenario
  // -----------------------------------------------------
  function renderEmoji() {
    // TV
    if (state.tvLog.length === 0) {
      tvEl.innerHTML = `
        <span class="tv-mode-pill">SOCIAL MODE</span>
        <div class="tv-corner">LOUNGE · 22:47</div>
        <div class="tv-flex">
          <div class="tv-social-card">
            <div class="tv-h" style="font-size: 22px; opacity: 0.5;">Bereit für den ersten Gruss.</div>
            <div class="tv-sub">Tippe ein Emoji auf Tisch 7.</div>
          </div>
        </div>
      `;
    } else {
      const last = state.tvLog[state.tvLog.length - 1];
      const blockedNote = last.blocked ? '<div class="tv-block-note">○ BLOCKIERT · NICHTS ZUGESTELLT</div>' : '';
      tvEl.innerHTML = `
        <span class="tv-mode-pill">SOCIAL MODE</span>
        <div class="tv-corner">LOUNGE · 22:47</div>
        <div class="tv-flex">
          <div class="tv-social-card">
            ${last.blocked ? '' : `<div class="tv-emoji-big">${last.emoji}</div>`}
            <div class="tv-social-line">${last.blocked ? 'Stille.' : 'Tisch&nbsp;' + last.from + ' &rarr; Tisch&nbsp;' + last.to}</div>
            ${blockedNote}
          </div>
        </div>
      `;
    }

    // Phone 7: sender UI
    p7.innerHTML = senderEmojiUI(7);
    p12.innerHTML = receiverUI(12);
    p4.innerHTML = receiverUI(4);

    // Wire events
    p7.querySelectorAll('.phone-emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.senderTable = 7;
        state.selectedEmoji = btn.dataset.emoji;
        renderEmoji();
        renderHint('emoji_choose_target');
      });
    });
    p7.querySelectorAll('.phone-target-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.dataset.target);
        sendEmoji(7, target, state.selectedEmoji);
      });
    });
    [p12, p4].forEach(p => {
      const blockBtn = p.querySelector('.js-block');
      if (blockBtn) blockBtn.addEventListener('click', () => {
        const receiver = parseInt(blockBtn.dataset.receiver);
        const blocked = state.blocked[receiver] || new Set();
        blocked.add(7);
        state.blocked[receiver] = blocked;
        delete state.receivedAt[receiver];
        renderEmoji();
        renderHint('emoji_blocked_test');
      });
      const dismissBtn = p.querySelector('.js-dismiss');
      if (dismissBtn) dismissBtn.addEventListener('click', () => {
        const receiver = parseInt(dismissBtn.dataset.receiver);
        delete state.receivedAt[receiver];
        renderEmoji();
      });
    });
  }

  function senderEmojiUI(table) {
    const opts = EMOJIS.map(e => `<button type="button" class="phone-emoji-btn ${state.selectedEmoji === e ? 'is-selected' : ''}" data-emoji="${e}">${e}</button>`).join('');
    let targetBlock = '';
    if (state.selectedEmoji) {
      targetBlock = `
        <div class="phone-target-row" style="margin-top: 8px;">
          <button type="button" class="phone-target-btn" data-target="12">→ Tisch 12</button>
          <button type="button" class="phone-target-btn" data-target="4">→ Tisch 4</button>
        </div>
      `;
    }
    return `
      <p class="phone-h">Geste senden</p>
      <p style="font-family: var(--font-body); font-size: 11px; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">Tippe ein Emoji, dann wähle einen Tisch.</p>
      <div class="phone-emoji-grid">${opts}</div>
      ${targetBlock}
    `;
  }

  function receiverUI(table) {
    const received = state.receivedAt[table];
    if (received) {
      return `
        <p class="phone-h">Bar Map</p>
        <div class="phone-incoming">
          <span class="phone-incoming-label">▮ EINGEHEND</span>
          <span class="phone-incoming-from">Von Tisch ${received.from}</span>
          <span class="phone-incoming-emoji">${received.emoji}</span>
          <div class="phone-incoming-actions">
            <button type="button" class="phone-mini-btn js-dismiss" data-receiver="${table}">OK</button>
            <button type="button" class="phone-mini-btn danger js-block" data-receiver="${table}">Tisch ${received.from} blocken</button>
          </div>
        </div>
      `;
    }
    const blocked = state.blocked[table];
    let footer = '';
    if (blocked && blocked.size > 0) {
      footer = `<div class="phone-status is-blocked">${Array.from(blocked).map(t => 'Tisch ' + t).join(', ')} blockiert. Keine Gesten mehr.</div>`;
    } else {
      footer = `<div class="phone-status">Wartet auf Gesten von anderen Tischen.</div>`;
    }
    return `
      <p class="phone-h">Bar Map</p>
      <p style="font-family: var(--font-body); font-size: 11px; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">Empfangs-Tisch in dieser Demo.</p>
      ${footer}
    `;
  }

  function sendEmoji(from, to, emoji) {
    const blocked = state.blocked[to];
    const isBlocked = blocked && blocked.has(from);
    state.tvLog.push({ from, to, emoji, blocked: isBlocked });
    if (!isBlocked) {
      state.receivedAt[to] = { from, emoji };
    }
    state.senderTable = null;
    state.selectedEmoji = null;
    renderEmoji();
    renderHint(isBlocked ? 'emoji_blocked_test' : 'emoji_sent');
  }

  // -----------------------------------------------------
  // QUIZ scenario
  // -----------------------------------------------------
  function renderQuiz() {
    // TV
    if (!state.revealed) {
      tvEl.innerHTML = `
        <span class="tv-mode-pill">GAME MODE</span>
        <div class="tv-corner">RUNDE 03 · 4 SEK</div>
        <div class="tv-flex">
          <div style="text-align: center;">
            <div class="tv-h tv-quiz-q">${QUIZ.q}</div>
            <div class="tv-quiz-timer">Tische antworten am Phone</div>
          </div>
        </div>
        <button type="button" id="quiz-reveal" style="position: absolute; bottom: 14px; right: 14px; background: var(--mint); color: var(--bg-deep); border: 0; padding: 6px 14px; border-radius: 4px; font-family: var(--font-body); font-size: 11px; font-weight: 600; cursor: pointer;">Auflösen →</button>
      `;
      const btn = document.getElementById('quiz-reveal');
      if (btn) btn.addEventListener('click', () => {
        state.revealed = true;
        renderQuiz();
      });
    } else {
      // Leaderboard
      const scores = Object.entries(state.picks).filter(([_, v]) => v === QUIZ.correct).map(([t]) => t);
      const rows = [7, 12, 4].map(t => {
        const ok = state.picks[t] === QUIZ.correct;
        return `<div style="display:flex;justify-content:space-between;padding:4px 0;font-family: var(--font-mono); font-size: 12px;"><span style="color: ${ok ? 'var(--mint)' : 'var(--text-muted)'}">TISCH ${t}</span><span style="color: ${ok ? 'var(--mint)' : 'var(--text-muted)'}">${ok ? '+10 PTS' : '· · ·'}</span></div>`;
      }).join('');
      tvEl.innerHTML = `
        <span class="tv-mode-pill">GAME MODE · ERGEBNIS</span>
        <div class="tv-corner">RUNDE 03</div>
        <div class="tv-flex" style="flex-direction: column; gap: 14px;">
          <div class="tv-quiz-reveal">RICHTIG: ${QUIZ.options[QUIZ.correct]}</div>
          <div style="min-width: 220px;">${rows}</div>
        </div>
      `;
    }

    // Phones: all three have the same UI
    [7, 12, 4].forEach(t => {
      phones[t].innerHTML = quizPhoneUI(t);
      phones[t].querySelectorAll('.phone-quiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          state.picks[t] = idx;
          renderQuiz();
        });
      });
    });
  }

  function quizPhoneUI(table) {
    const pick = state.picks[table];
    const opts = QUIZ.options.map((o, i) => {
      let cls = 'phone-quiz-btn';
      if (state.revealed) {
        if (i === QUIZ.correct) cls += ' is-correct';
        else if (i === pick) cls += ' is-wrong';
        else cls += ' is-wrong';
      } else if (pick === i) {
        cls += ' is-picked';
      }
      return `<button type="button" class="${cls}" data-idx="${i}"><span class="phone-quiz-letter">${String.fromCharCode(65 + i)}</span>${o.replace(/^[A-D]: /, '')}</button>`;
    }).join('');
    return `
      <p class="phone-h">Quiz</p>
      <div class="phone-quiz-q">${QUIZ.q}</div>
      <div class="phone-quiz-options">${opts}</div>
      ${pick !== undefined && !state.revealed ? '<div class="phone-status is-success" style="margin-top: 8px;">Geantwortet, Auswertung kommt.</div>' : ''}
    `;
  }

  // -----------------------------------------------------
  // MUSIC scenario
  // -----------------------------------------------------
  function renderMusic() {
    const total = Object.values(state.votes).reduce((a, b) => a + b, 0);
    const rows = TRACKS.map(t => {
      const v = state.votes[t.id];
      const pct = total > 0 ? Math.round((v / total) * 100) : 0;
      return `
        <div class="tv-music-row">
          <div class="tv-music-name">${t.name}</div>
          <div class="tv-music-bar"><div style="width: ${pct}%;"></div></div>
          <div class="tv-music-votes">${v}</div>
        </div>
      `;
    }).join('');
    tvEl.innerHTML = `
      <span class="tv-mode-pill">MUSIC MODE</span>
      <div class="tv-corner">NEXT UP · VOTING LIVE</div>
      <div class="tv-flex" style="align-items: stretch; flex-direction: column; justify-content: center; padding: 10px 0;">
        <div class="tv-music-list">${rows}</div>
      </div>
    `;
    [7, 12, 4].forEach(t => {
      phones[t].innerHTML = musicPhoneUI(t);
      phones[t].querySelectorAll('.phone-music-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (state.voted[t]) return;
          state.voted[t] = btn.dataset.id;
          state.votes[btn.dataset.id] += 1;
          renderMusic();
        });
      });
    });
  }

  function musicPhoneUI(table) {
    const voted = state.voted[table];
    const opts = TRACKS.map(t => {
      const cls = voted === t.id ? 'phone-music-btn is-voted' : 'phone-music-btn';
      return `<button type="button" class="${cls}" data-id="${t.id}" ${voted ? 'disabled' : ''}>${t.name}</button>`;
    }).join('');
    return `
      <p class="phone-h">Music Voting</p>
      <p style="font-family: var(--font-body); font-size: 11px; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">${voted ? 'Stimme abgegeben.' : 'Tippe deinen Favoriten.'}</p>
      <div class="phone-music-options">${opts}</div>
    `;
  }

  // -----------------------------------------------------
  // DRINK scenario
  // -----------------------------------------------------
  function renderDrink() {
    if (state.sentTo) {
      const drink = DRINKS.find(d => d.id === state.selectedDrink);
      tvEl.innerHTML = `
        <span class="tv-mode-pill">SOCIAL MODE</span>
        <div class="tv-corner">DRINK FROM TABLE 7</div>
        <div class="tv-flex">
          <div class="tv-drink-illustration">
            <span>TISCH 7</span>
            <span class="arrow">→</span>
            <span class="tv-drink-glass">${drink.emoji}</span>
            <span class="arrow">→</span>
            <span>TISCH ${state.sentTo}</span>
          </div>
        </div>
      `;
    } else {
      tvEl.innerHTML = `
        <span class="tv-mode-pill">SOCIAL MODE</span>
        <div class="tv-corner">LOUNGE · 22:47</div>
        <div class="tv-flex">
          <div class="tv-social-card">
            <div class="tv-h" style="font-size: 22px; opacity: 0.5;">Bereit für den nächsten Drink.</div>
            <div class="tv-sub">Tisch 7 sucht einen Empfänger.</div>
          </div>
        </div>
      `;
    }
    p7.innerHTML = drinkSenderUI();
    p12.innerHTML = drinkReceiverUI(12);
    p4.innerHTML = drinkReceiverUI(4);
    p7.querySelectorAll('.phone-drink-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedDrink = btn.dataset.id;
        renderDrink();
        renderHint('drink_target');
      });
    });
    p7.querySelectorAll('.phone-target-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.sentTo = parseInt(btn.dataset.target);
        renderDrink();
        renderHint('drink_done');
      });
    });
  }

  function drinkSenderUI() {
    const drinks = DRINKS.map(d => {
      const cls = state.selectedDrink === d.id ? 'phone-drink-btn is-selected' : 'phone-drink-btn';
      return `<button type="button" class="${cls}" data-id="${d.id}"><span>${d.emoji} ${d.name}</span><span class="phone-drink-price">${d.price}&thinsp;€</span></button>`;
    }).join('');
    let target = '';
    if (state.selectedDrink && !state.sentTo) {
      target = `
        <div class="phone-target-row" style="margin-top: 8px;">
          <button type="button" class="phone-target-btn" data-target="12">→ Tisch 12</button>
          <button type="button" class="phone-target-btn" data-target="4">→ Tisch 4</button>
        </div>
      `;
    } else if (state.sentTo) {
      target = `<div class="phone-status is-success" style="margin-top: 8px;">${DRINKS.find(d => d.id === state.selectedDrink).name} an Tisch ${state.sentTo}. Crew benachrichtigt.</div>`;
    }
    return `
      <p class="phone-h">Drink-to-Table</p>
      <p style="font-family: var(--font-body); font-size: 11px; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">Drink wählen, dann Empfänger.</p>
      <div class="phone-drink-list">${drinks}</div>
      ${target}
    `;
  }

  function drinkReceiverUI(table) {
    if (state.sentTo === table) {
      const drink = DRINKS.find(d => d.id === state.selectedDrink);
      return `
        <p class="phone-h">Bar Map</p>
        <div class="phone-incoming">
          <span class="phone-incoming-label">▮ EINGEHENDER DRINK</span>
          <span class="phone-incoming-from">Von Tisch 7</span>
          <span class="phone-incoming-emoji">${drink.emoji}</span>
          <div style="font-family: var(--font-body); font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${drink.name}</div>
          <div class="phone-incoming-actions">
            <button type="button" class="phone-mini-btn">Danke</button>
            <button type="button" class="phone-mini-btn danger">Ablehnen</button>
          </div>
        </div>
      `;
    }
    return `
      <p class="phone-h">Bar Map</p>
      <p style="font-family: var(--font-body); font-size: 11px; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">Empfangs-Tisch in dieser Demo.</p>
      <div class="phone-status">Bereit für einen Drink.</div>
    `;
  }

  // -----------------------------------------------------
  // Dispatcher
  // -----------------------------------------------------
  function render() {
    clearAll();
    if (scenario === 'emoji') { renderEmoji(); renderHint('emoji_choose'); }
    else if (scenario === 'quiz') { renderQuiz(); renderHint('quiz_start'); }
    else if (scenario === 'music') { renderMusic(); renderHint('music_start'); }
    else if (scenario === 'drink') { renderDrink(); renderHint('drink_pick'); }
  }

  tabs.forEach(t => t.addEventListener('click', () => setScenario(t.dataset.scenario)));
  resetBtn.addEventListener('click', reset);

  // Initial render
  setScenario('emoji');
  return true;
}

(function scheduleLiveDemoInit(attempt) {
  if (initCrowdConnectLiveDemo()) {
    return;
  }
  if (attempt > 80) {
    return;
  }
  requestAnimationFrame(function () {
    scheduleLiveDemoInit(attempt + 1);
  });
})(0);
