"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

type Entry = { id: number; type: "weight" | "meal" | "exercise"; title: string; detail: string; calories?: number; date: string };

const starterEntries: Entry[] = [
  { id: 1, type: "exercise", title: "晨间快走", detail: "32 分钟 · 轻中强度", date: "今天 08:10" },
  { id: 2, type: "meal", title: "早餐", detail: "燕麦、蓝莓、酸奶", calories: 410, date: "今天 09:02" },
  { id: 3, type: "weight", title: "体重更新", detail: "68.4 kg", date: "昨天 07:45" },
];

const icon = { weight: "↘", meal: "◒", exercise: "✓" };

export default function HealthCoachApp() {
  const [tab, setTab] = useState<"today" | "summary">("today");
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Entry[]>(starterEntries);
  const [notice, setNotice] = useState("有任何记录，直接告诉我");
  const [listening, setListening] = useState(false);
  const [preview, setPreview] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mori-health-entries");
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  function save(next: Entry[]) {
    setEntries(next);
    localStorage.setItem("mori-health-entries", JSON.stringify(next));
  }

  function addEntry(entry: Omit<Entry, "id" | "date">) {
    save([{ ...entry, id: Date.now(), date: "刚刚" }, ...entries]);
  }

  function understand(value: string) {
    const input = value.trim();
    if (!input) return;
    const number = Number(input.match(/\d+(?:\.\d+)?/)?.[0]);
    const exerciseWords = /跑|走|瑜伽|游泳|健身|运动|深蹲|cycling|run|walk/i;
    const mealWords = /吃|喝|早餐|午餐|晚餐|饭|面|鸡|沙拉|咖啡|apple|meal/i;
    if (!Number.isNaN(number) && (/^(\d+(\.\d+)?)\s*(kg|公斤|斤|lb|lbs|磅)?$/i.test(input))) {
      let kg = number;
      let source = "kg";
      if (/斤/.test(input)) { kg = number / 2; source = "斤"; }
      else if (/lb|磅/i.test(input) || number > 140) { kg = number * 0.453592; source = "lb"; }
      addEntry({ type: "weight", title: "体重更新", detail: `${kg.toFixed(1)} kg` });
      setNotice(source === "kg" ? "已记录为公斤" : `判断为 ${source}，已换算为公斤`);
    } else if (exerciseWords.test(input)) {
      addEntry({ type: "exercise", title: input, detail: number ? `${number} 分钟 · 已打卡` : "运动 · 已打卡" });
      setNotice("运动打卡完成，很棒");
    } else if (mealWords.test(input)) {
      const calories = number && /卡|kcal/i.test(input) ? number : 520;
      addEntry({ type: "meal", title: "饮食记录", detail: input, calories });
      setNotice(`已估算 ${calories} kcal 并记录`);
    } else {
      setNotice("我还不太确定，请补充“吃了”或“运动”等信息");
      return;
    }
    setText("");
  }

  function submit(e: FormEvent) { e.preventDefault(); understand(text); }

  function voice() {
    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; start(): void; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onend: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setNotice("当前浏览器不支持语音识别，可以直接输入文字"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.onresult = (e) => { const words = e.results[0][0].transcript; setText(words); understand(words); };
    recognition.onend = () => setListening(false);
    setListening(true); recognition.start();
  }

  function imagePicked(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setPreview(URL.createObjectURL(file));
    const isExercise = /run|gym|yoga|sport|exercise|跑|运动/i.test(file.name);
    window.setTimeout(() => {
      if (isExercise) {
        addEntry({ type: "exercise", title: "图片识别 · 运动", detail: "户外运动 · 已打卡" });
        setNotice("看起来是一次运动，已为你打卡");
      } else {
        addEntry({ type: "meal", title: "图片识别 · 一餐", detail: "主食、蛋白质与蔬菜", calories: 620 });
        setNotice("识别为饮食，估算 620 kcal");
      }
    }, 700);
  }

  const weight = entries.find((e) => e.type === "weight")?.detail || "68.4 kg";
  const calories = entries.filter((e) => e.type === "meal" && /今天|刚刚/.test(e.date)).reduce((n, e) => n + (e.calories || 0), 0);

  return (
    <main className="health-page">
      <div className="phone-app">
        <header className="health-header">
          <div><p className="brand">MORI</p><p className="hello">早上好，Qin</p></div>
          <button className="avatar" aria-label="个人设置">Q</button>
        </header>

        {tab === "today" ? <>
          <section className="hero-copy">
            <p>今天感觉怎么样？</p>
            <h1>记录，让身体<br />慢慢变好。</h1>
          </section>

          <section className="composer">
            {preview && <img className="photo-preview" src={preview} alt="准备分析的健康记录" />}
            <form onSubmit={submit}>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="输入体重、说一顿饭，或记录一次运动…" aria-label="健康记录" />
              <div className="composer-actions">
                <div>
                  <button type="button" className="round-button" onClick={() => fileRef.current?.click()} aria-label="添加照片">＋</button>
                  <button type="button" className={`round-button ${listening ? "listening" : ""}`} onClick={voice} aria-label="语音输入">{listening ? "●" : "⌁"}</button>
                </div>
                <button className="send-button" aria-label="发送">↑</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={imagePicked} />
            </form>
          </section>
          <p className="ai-note"><span>✦</span>{notice}</p>

          <section className="today-section">
            <div className="section-title"><h2>今天</h2><span>{entries.length} 条记录</span></div>
            <div className="entries">
              {entries.slice(0, 4).map((entry) => <article className="entry" key={entry.id}>
                <span className={`entry-icon ${entry.type}`}>{icon[entry.type]}</span>
                <div><h3>{entry.title}</h3><p>{entry.detail}</p></div>
                <div className="entry-meta">{entry.calories ? <strong>{entry.calories}<small> kcal</small></strong> : null}<time>{entry.date}</time></div>
              </article>)}
            </div>
          </section>
        </> : <Summary weight={weight} calories={calories} />}

        <nav className="bottom-nav" aria-label="主导航">
          <button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}><span>○</span>记录</button>
          <button className="capture" onClick={() => { setTab("today"); document.querySelector("textarea")?.focus(); }}>＋</button>
          <button className={tab === "summary" ? "active" : ""} onClick={() => setTab("summary")}><span>⌁</span>总结</button>
        </nav>
      </div>
    </main>
  );
}

function Summary({ weight, calories }: { weight: string; calories: number }) {
  return <section className="summary-page">
    <div className="summary-heading"><p>2026年 7月</p><h1>这个月，<br />你照顾得很好。</h1></div>
    <div className="summary-grid">
      <article className="metric dark"><p>运动打卡</p><strong>12<small> 天</small></strong><span>比上月多 3 天 ↗</span></article>
      <article className="metric"><p>当前体重</p><strong>{weight.replace(" kg", "")}<small> kg</small></strong><span>本月 −0.8 kg</span></article>
      <article className="metric wide"><p>今日摄入</p><strong>{calories || 1030}<small> kcal</small></strong><div className="calorie-bar"><i /></div><span>目标 1,850 kcal</span></article>
    </div>
    <article className="insight-card"><p className="insight-label">✦ 本周饮食分析</p><h2>蛋白质不错，蔬菜还可以再多一点。</h2><p>本周早餐规律，晚餐碳水占比偏高。无需大改，从明天午餐多加一份深色蔬菜开始。</p></article>
    <section className="suggestions"><div className="section-title"><h2>建议补充</h2><span>本周</span></div>
      {[['西兰花或菠菜','深色蔬菜 · 3 份'],['三文鱼或核桃','Omega-3 · 2 份'],['无糖酸奶','钙与益生菌 · 3 次']].map(([a,b],i) => <article key={a}><span>{i+1}</span><div><h3>{a}</h3><p>{b}</p></div><button aria-label={`添加${a}`}>＋</button></article>)}
    </section>
  </section>;
}
