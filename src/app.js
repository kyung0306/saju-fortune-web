import { analyzeSaju, checkCompatibility, callSajuTool } from "saju-fortune";

const ELEMENT_META = {
  wood: { ko: "목", hanja: "木", color: "#7bc86c" },
  fire: { ko: "화", hanja: "火", color: "#ff6b6b" },
  earth: { ko: "토", hanja: "土", color: "#d9a95c" },
  metal: { ko: "금", hanja: "金", color: "#c9d1e0" },
  water: { ko: "수", hanja: "水", color: "#5aa9ff" }
};

const ELEMENT_ORDER = ["wood", "fire", "earth", "metal", "water"];

const STRENGTH_KO = {
  strong: { label: "강함", cls: "strength-strong" },
  weak: { label: "약함", cls: "strength-weak" },
  balanced: { label: "균형", cls: "strength-balanced" }
};

const TOPIC_TO_TYPE = {
  general: "general",
  love: "love",
  wealth: "wealth",
  career: "career",
  health: "health",
  year: "general"
};

function $(id) { return document.getElementById(id); }

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readGender(radioName) {
  const checked = document.querySelector(`input[name="${radioName}"]:checked`);
  return checked ? checked.value : "male";
}

function pillarHtml(pillar, role) {
  if (!pillar) {
    return `
      <div class="pillar unknown">
        <div class="pillar-role">${role}</div>
        <div class="pillar-hanja">–</div>
        <div class="pillar-korean">미확정</div>
      </div>`;
  }
  const el = ELEMENT_META[pillar.stemElement];
  return `
    <div class="pillar" style="border-top: 3px solid ${el.color}">
      <div class="pillar-role">${role}</div>
      <div class="pillar-hanja">${escapeHtml(pillar.hanja)}</div>
      <div class="pillar-korean">${escapeHtml(pillar.label)}</div>
      <div class="pillar-animal">${escapeHtml(pillar.branchAnimal)} · ${el.ko}</div>
    </div>`;
}

function pillarsPanel(result, title = "사주팔자") {
  const p = result.pillars;
  const roles = [
    ["year", "연주 (年柱)", "태어난 해"],
    ["month", "월주 (月柱)", "태어난 달"],
    ["day", "일주 (日柱)", "나를 나타냄"],
    ["hour", "시주 (時柱)", "태어난 시각"]
  ];
  const rows = roles.map(([key, role, hint]) => pillarHtml(p[key], `${role}`));
  const limitation = result.timeAccuracy === "unknown"
    ? '<p class="caveat">태어난 시간이 없어 시주는 확정하지 않고 연·월·일 중심으로 보수적으로 해석합니다.</p>'
    : "";
  return `
    <div class="panel">
      <h3 class="panel-title">${escapeHtml(title)}</h3>
      <p class="panel-sub">사주는 연주·월주·일주·시주 네 기둥으로 구성됩니다.</p>
      <div class="pillars-grid">${rows.join("")}</div>
      ${limitation}
    </div>`;
}

function elementsPanel(result) {
  const counts = result.fiveElements;
  const total = ELEMENT_ORDER.reduce((sum, e) => sum + counts[e], 0);
  const max = Math.max(...ELEMENT_ORDER.map((e) => counts[e]), 1);
  const rows = ELEMENT_ORDER.map((e) => {
    const meta = ELEMENT_META[e];
    const pct = total ? Math.round((counts[e] / max) * 100) : 0;
    return `
      <div class="element-row">
        <span class="element-name" style="color:${meta.color}">${meta.ko}${meta.hanja}</span>
        <div class="element-bar"><div class="element-fill" style="width:${pct}%;background:${meta.color}"></div></div>
        <span class="element-count">${counts[e]}</span>
      </div>`;
  }).join("");

  const dominant = result.dominantElements.map((e) => ELEMENT_META[e].ko + ELEMENT_META[e].hanja).join(", ");
  const weak = result.weakElements.map((e) => ELEMENT_META[e].ko + ELEMENT_META[e].hanja).join(", ");

  return `
    <div class="panel">
      <h3 class="panel-title">오행 분포</h3>
      <p class="panel-sub">사주팔자에 담긴 다섯 기운(목·화·토·금·수)의 비중입니다.</p>
      <div class="elements">${rows}</div>
      <div class="tag-row" style="margin-top:18px">
        <span class="tag">강한 기운: ${escapeHtml(dominant)}</span>
        <span class="tag">부족한 기운: ${escapeHtml(weak)}</span>
      </div>
    </div>`;
}

function dayMasterPanel(result) {
  const dm = result.dayMaster;
  const meta = ELEMENT_META[dm.element];
  const strength = STRENGTH_KO[dm.strength] || { label: dm.strength, cls: "" };
  const yinYang = dm.yinYang === "yang" ? "양(陽)" : "음(陰)";
  return `
    <div class="panel">
      <h3 class="panel-title">나의 일간(日干)</h3>
      <p class="panel-sub">일주에서 나를 상징하는 기둥입니다.</p>
      <div class="daymaster">
        <div class="daymaster-badge">${escapeHtml(dm.stem)}</div>
        <div class="daymaster-info">
          <h4>${escapeHtml(dm.stem)} (${meta.ko}${meta.hanja}) 일간 <span class="strength-tag ${strength.cls}">${yinYang} · ${strength.label}</span></h4>
          <p style="margin:0;color:var(--text-dim);font-size:14px">${escapeHtml(result.yongsin.reasoning)}</p>
        </div>
      </div>
    </div>`;
}

function fortunePanel(result) {
  const f = result.fortune;
  if (!f) return "";
  const yearNote = f.targetYear ? ` · ${f.targetYear}년` : "";
  return `
    <div class="panel">
      <span class="fortune-topic">✨ ${escapeHtml(f.label)}${yearNote}</span>
      <p class="fortune-summary">${escapeHtml(f.summary)}</p>
      <ul class="guidance-list">${f.guidance.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
      <p class="caveat">${escapeHtml(f.caveat)}</p>
    </div>`;
}

function daeunPanel(args) {
  try {
    const daeun = callSajuTool("get_dae_un", args);
    const cycles = daeun.cycles.map((c) =>
      `<span class="tag" title="${escapeHtml(c.hanja)}">${escapeHtml(c.age)}세 ${escapeHtml(c.label)}</span>`
    ).join("");
    return `
      <div class="panel">
        <h3 class="panel-title">대운(大運) 흐름</h3>
        <p class="panel-sub">10년 단위로 바뀌는 큰 운의 흐름입니다. (근사값 참고용)</p>
        <div class="tag-row">${cycles}</div>
      </div>`;
  } catch (err) {
    return "";
  }
}

function renderSajuResult(result, args) {
  const name = result.input.name ? `${escapeHtml(result.input.name)}님의 ` : "";
  const sections = [
    `<div class="panel" style="background:linear-gradient(135deg,rgba(109,92,255,0.18),rgba(242,193,78,0.06))">
       <h3 class="panel-title">${name}사주 풀이 결과</h3>
       <p class="panel-sub">${escapeHtml(args.birthDate)} · ${args.birthTime ? escapeHtml(args.birthTime) : "시간 미상"} · ${args.gender === "male" ? "남성" : "여성"}</p>
     </div>`,
    pillarsPanel(result),
    elementsPanel(result),
    dayMasterPanel(result),
    fortunePanel(result),
    daeunPanel(args)
  ];
  return sections.join("");
}

function personSummaryHtml(person) {
  const dm = person.dayMaster;
  const meta = ELEMENT_META[dm.element];
  const pillars = [
    person.pillars.year,
    person.pillars.month,
    person.pillars.day,
    person.pillars.hour
  ].filter(Boolean).join(" · ");
  const name = person.name ? escapeHtml(person.name) : "사람";
  return `
    <div class="person-summary">
      <h4>${name} · ${escapeHtml(dm.stem)}(${meta.ko}) 일간</h4>
      <p class="pillars-inline">${escapeHtml(pillars)}</p>
      <div class="tag-row">
        <span class="tag">강: ${person.dominantElements.map((e) => ELEMENT_META[e].ko).join(", ")}</span>
        <span class="tag">약: ${person.weakElements.map((e) => ELEMENT_META[e].ko).join(", ")}</span>
      </div>
    </div>`;
}

function renderCompatResult(res) {
  const score = Math.round(res.score);
  const scoreLevel = score >= 80 ? "아주 좋은 인연" : score >= 65 ? "좋은 인연" : score >= 50 ? "보통" : "조율이 필요한 인연";
  return `
    <div class="panel">
      <h3 class="panel-title">궁합 결과</h3>
      <p class="panel-sub">사주 오행과 일간을 비교해 산출한 참고 지표입니다.</p>
      <div class="score-wrap">
        <div class="score-ring" style="--pct:${score}">
          <div class="score-num">${score}<small>점</small></div>
        </div>
        <div class="score-text">
          <p class="summary"><strong>${scoreLevel}</strong> — ${escapeHtml(res.summary)}</p>
          <ul class="focus-list">${res.focusAreas.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
        </div>
      </div>
    </div>
    <div class="panel">
      <h3 class="panel-title">두 사람의 사주</h3>
      <p class="panel-sub">서로의 중심 기운과 사주팔자를 비교합니다.</p>
      <div class="people-grid">${res.people.map(personSummaryHtml).join("")}</div>
      <p class="caveat">궁합 점수는 관계를 돌아보는 대화 재료일 뿐, 이별·결혼 등 중대한 결정을 대신하지 않습니다.</p>
    </div>`;
}

function showError(el, message) {
  el.hidden = false;
  el.innerHTML = `<div class="error-box">⚠️ ${escapeHtml(message)}</div>`;
}

function setLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.querySelector("span").textContent = loading ? "풀이하는 중..." : label;
}

function readPersonInput(prefix) {
  const name = $(`${prefix}-name`).value.trim();
  const birthDate = $(`${prefix}-birthdate`).value;
  const birthTime = $(`${prefix}-birthtime`).value;
  const gender = readGender(`${prefix}-gender`);
  const person = { birthDate, gender };
  if (name) person.name = name;
  if (birthTime) person.birthTime = birthTime;
  person.calendar = "solar";
  return { person, hasBirthDate: !!birthDate };
}

// --- Wire up UI ---
function initNav() {
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      const view = link.dataset.view;
      $("view-saju").classList.toggle("active", view === "saju");
      $("view-compat").classList.toggle("active", view === "compat");
    });
  });
}

function initTopicToggle() {
  const topic = $("saju-topic");
  const yearWrap = $("saju-year-wrap");
  const yearInput = $("saju-year");
  if (!yearInput.value) yearInput.value = new Date().getFullYear();
  const sync = () => { yearWrap.hidden = topic.value !== "year"; };
  topic.addEventListener("change", sync);
  sync();
}

function initSajuForm() {
  const form = $("saju-form");
  const resultEl = $("saju-result");
  const btn = $("saju-submit");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const birthDate = $("saju-birthdate").value;
    const gender = readGender("saju-gender");
    if (!birthDate) {
      showError(resultEl, "생년월일(양력)을 입력해 주세요.");
      resultEl.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const args = { birthDate, gender, calendar: "solar" };
    const name = $("saju-name").value.trim();
    const birthTime = $("saju-birthtime").value;
    const birthCity = $("saju-birthcity").value.trim();
    if (name) args.name = name;
    if (birthTime) args.birthTime = birthTime;
    if (birthCity) args.birthCity = birthCity;

    const topic = $("saju-topic").value;
    const options = { analysisType: "fortune", fortuneType: TOPIC_TO_TYPE[topic] };
    if (topic === "year") {
      const year = parseInt($("saju-year").value, 10);
      if (year) options.targetYear = year;
    }

    setLoading(btn, true, "내 사주 풀이 받기");
    try {
      const result = analyzeSaju(args, options);
      resultEl.innerHTML = renderSajuResult(result, args);
      resultEl.hidden = false;
    } catch (err) {
      showError(resultEl, err.message || "풀이 중 오류가 발생했습니다.");
    } finally {
      setLoading(btn, false, "내 사주 풀이 받기");
      resultEl.scrollIntoView({ behavior: "smooth" });
    }
  });
}

function initCompatForm() {
  const form = $("compat-form");
  const resultEl = $("compat-result");
  const btn = $("compat-submit");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const p1 = readPersonInput("p1");
    const p2 = readPersonInput("p2");

    if (!p1.hasBirthDate || !p2.hasBirthDate) {
      showError(resultEl, "두 사람의 생년월일(양력)을 모두 입력해 주세요.");
      resultEl.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setLoading(btn, true, "궁합 확인하기");
    try {
      const res = checkCompatibility({ person1: p1.person, person2: p2.person });
      resultEl.innerHTML = renderCompatResult(res);
      resultEl.hidden = false;
    } catch (err) {
      showError(resultEl, err.message || "궁합 확인 중 오류가 발생했습니다.");
    } finally {
      setLoading(btn, false, "궁합 확인하기");
      resultEl.scrollIntoView({ behavior: "smooth" });
    }
  });
}

initNav();
initTopicToggle();
initSajuForm();
initCompatForm();
