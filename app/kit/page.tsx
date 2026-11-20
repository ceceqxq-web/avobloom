import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "Kit — Built for creators" },
  description: "Grow, connect, automate, and monetize. The email-first operating system for creators who mean business.",
};

const features = [
  { title: "Grow", description: "Reach your audience and turn subscribers into customers", items: ["Unlimited landing pages", "Unlimited opt-in forms", "Landing page & form templates", "Newsletter feed & website", "Custom domain", "List growth reporting", "Creator Network", "Recommendations"] },
  { title: "Connect", description: "Create deeper connections that drive real results", items: ["Unlimited email sends", "Custom email templates", "Email template library", "Deliver opt-in incentives", "Subscriber tagging", "A/B split testing", "Conditional email content", "Resend unopened campaigns", "In-email polls"] },
  { title: "Automate", description: "Do more with less while your business runs itself", items: ["Visual automation builder", "Visual automation templates", "Automated email sequences", "Content snippets", "Kit App Store", "RSS Campaigns", "API documentation"] },
  { title: "Monetize", description: "Multiple ways to earn from every email you send", items: ["Sell digital products", "Run paid newsletters", "Offer recurring subscriptions", "Setup virtual tip jars", "Kit Ads", "Paid Recommendations"] },
];

function FeatureIcon({ index }: { index: number }) {
  return <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <defs><linearGradient id={`blue-${index}`} x1="25" y1="20" x2="90" y2="110" gradientUnits="userSpaceOnUse"><stop stopColor="#a6e1ff"/><stop offset=".45" stopColor="#35b3ff"/><stop offset="1" stopColor="#063cbd"/></linearGradient></defs>
    {index === 0 && <g fill={`url(#blue-${index})`}><path d="M15 78h22v27H15zM49 51h22v54H49zM83 24h22v81H83z"/><path d="M37 78h6v27h-6zM71 51h6v54h-6zM105 24h6v81h-6z" fill="#06354e"/></g>}
    {index === 1 && <><path d="m12 50 48-41 48 41v62H12z" fill={`url(#blue-${index})`}/><path d="M20 32h80v59H20z" fill="#155580"/><path d="M29 40h52M29 52h62M29 64h62" stroke="#9edbff" strokeWidth="7"/><path d="M26 64h68v34H26z" fill="#f4f0e6"/><path d="m12 50 48 38 48-38v62H12z" fill={`url(#blue-${index})`}/></>}
    {index === 2 && <><path d="M60 43v24H29v25m31-25h31v25" stroke="#16628c" strokeWidth="12" strokeLinejoin="round"/><path d="M36 20h49v23H36zM6 83h49v23H6zM68 83h49v23H68z" fill={`url(#blue-${index})`}/><path d="M42 31h24M12 94h24M74 94h24" stroke="#c6eeff" strokeWidth="5"/><g fill="#f1f0e9"><circle cx="76" cy="31" r="6"/><circle cx="46" cy="94" r="6"/><circle cx="108" cy="94" r="6"/></g></>}
    {index === 3 && <><path d="M9 39c39-27 62 12 102-20v77c-40 31-63-8-102 19z" fill={`url(#blue-${index})`}/><path d="M25 45c27-11 44 11 70-2v49c-26 12-43-10-70 2z" fill="#a1ddf9" opacity=".8"/><g fill="#075680"><ellipse cx="17" cy="48" rx="4" ry="7"/><ellipse cx="17" cy="96" rx="4" ry="7"/><ellipse cx="103" cy="37" rx="4" ry="7"/><ellipse cx="103" cy="84" rx="4" ry="7"/></g></>}
  </svg>;
}

function Gears() {
  return <svg className={styles.gears} viewBox="0 0 400 340" fill="none" aria-hidden="true">
    <defs><linearGradient id="gear" x1="80" y1="0" x2="320" y2="260" gradientUnits="userSpaceOnUse"><stop stopColor="#c3eaff"/><stop offset=".5" stopColor="#54b9f2"/><stop offset="1" stopColor="#167dbd"/></linearGradient><linearGradient id="belt" x1="30" y1="100" x2="270" y2="300"><stop stopColor="#ff9b57"/><stop offset=".5" stopColor="#ff6e31"/><stop offset="1" stopColor="#ffd0a4"/></linearGradient><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".17"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter></defs>
    <g filter="url(#grain)"><g transform="translate(239 124) rotate(24)"><g fill="#247fab" transform="translate(-10 13)"><path d="m-28-116 56 0 8 24 28 13 26-9 28 48-18 19v35l18 19-28 48-26-9-28 13-8 24h-56l-8-24-28-13-26 9-28-48 18-19v-35l-18-19 28-48 26 9 28-13z"/></g><path d="m-28-116 56 0 8 24 28 13 26-9 28 48-18 19v35l18 19-28 48-26-9-28 13-8 24h-56l-8-24-28-13-26 9-28-48 18-19v-35l-18-19 28-48 26 9 28-13z" fill="url(#gear)"/><circle r="67" fill="#248dc8"/><circle r="47" fill="#93d4f8"/><ellipse cy="7" rx="29" ry="34" fill="#176b97"/></g>
    <g transform="translate(84 25) rotate(25)"><path d="m-16-52 32 0 4 14 13 8 15-4 16 27-10 11v16l10 11-16 27-15-4-13 8-4 14h-32l-4-14-13-8-15 4-16-27 10-11V4L-64-7l16-27 15 4 13-8z" fill="url(#gear)"/><circle cy="10" r="28" fill="#97d7fa"/><circle cy="10" r="13" fill="#126695"/></g>
    <path d="M269 67 79 170c-42 23-46 65-7 83l141 65c39 18 68-33 37-54L112 189" stroke="#a95217" strokeWidth="26"/><path d="M278 60 89 162c-42 23-46 65-7 83l141 65c39 18 68-33 37-54L122 181" stroke="url(#belt)" strokeWidth="17"/><ellipse cx="104" cy="182" rx="46" ry="30" transform="rotate(-22 104 182)" fill="url(#gear)"/><ellipse cx="277" cy="64" rx="30" ry="21" transform="rotate(22 277 64)" fill="#9bdbfc"/><ellipse cx="244" cy="270" rx="32" ry="24" transform="rotate(23 244 270)" fill="url(#gear)"/></g>
  </svg>;
}

export default function KitPage() {
  return <main className={styles.page} lang="en">
    <section className={styles.hero} aria-labelledby="kit-heading">
      <Gears />
      <h1 id="kit-heading">Kit is the <span>email-first operating system</span> for creators who mean business</h1>
    </section>
    <section className={styles.grid} aria-label="Everything you need to build your business">
      {features.map((feature, index) => <article className={styles.card} key={feature.title}>
        <div className={styles.icon}><FeatureIcon index={index}/></div>
        <h2>{feature.title}</h2>
        <p>{feature.description}</p>
        <ul>{feature.items.map(item => <li key={item}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 12 5 5L21 5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg><span>{item}</span></li>)}</ul>
      </article>)}
    </section>
  </main>;
}
