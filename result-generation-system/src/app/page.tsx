"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth";

// Landing page markup, styles, and interactive behaviour are ported directly
// from the supplied static index.html (nav, hero, benefits, testimonials,
// partners, footer, WhatsApp float, and their original vanilla-JS behaviour).
const LANDING_STYLE = `
  /* ===== RESET & BASE ===== */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #131313; }
  a { text-decoration: none; color: inherit; }

  /* ===== STICKY FOOTER (removes white gap below footer on short pages) ===== */
  .landing-root { display: flex; flex-direction: column; min-height: 100vh; }
  .landing-root footer { margin-top: auto; }

  /* ===== PALETTE ===== */
  :root {
    --blue:       #0c0c0c;
    --blue-dark:  #101010;
    --blue-light: #EBF2FF;
    --bg-grad:    linear-gradient(160deg, #D6E8FF 0%, #EFF6FF 50%, #FFFFFF 100%);
    --bg-soft:    #EEF4FF;
    --card-bg:    #FFFFFF;
    --text-main:  #141515;
    --text-muted: #4B5563;
    --border:     #D1E3FF;
    --green:      #16A34A;
  }

  /* ===== NAV (RGS1) ===== */
  nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(219,234,254,.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px; position: relative;
  }
  .nav-logo { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.25rem; color: var(--blue); }
  .nav-logo svg { width: 36px; height: 36px; }
  .nav-links { display: flex; align-items: center; gap: 32px; font-size: 1.2rem; color: var(--text-main); position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
  .nav-links a { cursor: pointer; transition: color .2s; }
  .nav-links a:hover { color: var(--blue); }
  .nav-links .has-arrow::after { content: ' ▾'; font-size: .75rem; }
  .nav-item { position: relative; display: flex; align-items: center; }
  .dropdown-menu {
    position: absolute; top: 100%; left: 0; margin-top: 14px;
    background: #fff; border: 1px solid var(--border); border-radius: 12px;
    box-shadow: 0 12px 28px rgba(15,23,42,.12); padding: 8px; min-width: 190px;
    opacity: 0; visibility: hidden; transform: translateY(-6px);
    transition: opacity .2s ease, transform .2s ease, visibility .2s ease;
    z-index: 200;
  }
  .nav-item:hover .dropdown-menu, .nav-item:focus-within .dropdown-menu {
    opacity: 1; visibility: visible; transform: translateY(0);
  }
  .dropdown-menu a {
    display: block; padding: 10px 14px; border-radius: 8px;
    font-size: .92rem; font-weight: 500; color: var(--text-main); white-space: nowrap;
  }
  .dropdown-menu a:hover { background: var(--bg-soft); color: var(--blue); }
  .nav-cta { display: flex; align-items: center; gap: 12px; }
  .btn-outline {
    border: 2px solid var(--blue); color: var(--blue);
    padding: 8px 22px; border-radius: 999px; font-weight: 600; cursor: pointer;
    transition: background .2s, color .2s;
  }
  .btn-outline:hover { background: var(--blue); color: #fff; }
  .btn-solid {
    background: var(--blue); color: #fff;
    padding: 10px 24px; border-radius: 999px; font-weight: 600; cursor: pointer;
    border: none; transition: background .2s;
  }
  .btn-solid:hover { background: var(--blue-dark); }

  /* ===== HERO (RGS1) ===== */
  #hero {
    background: var(--bg-grad);
    padding: 80px 48px 0;
    text-align: center;
    overflow: hidden;
    min-height: 620px;
    position: relative;
  }
  .hero-eyebrow {
    display: inline-block;
    background: var(--blue-light); color: var(--blue);
    font-size: .82rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    padding: 5px 16px; border-radius: 999px; margin-bottom: 20px;
  }
  #hero h1 {
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 900; line-height: 1.12; color: var(--text-main);
    max-width: 760px; margin: 0 auto 20px;
  }
  #hero p {
    font-size: 1.1rem; color: var(--text-muted);
    max-width: 560px; margin: 0 auto 36px; line-height: 1.7;
  }
  .hero-btns { display: flex; gap: 14px; justify-content: center; margin-bottom: 56px; }
  .hero-btn-primary {
    background: var(--blue); color: #fff;
    padding: 14px 32px; border-radius: 999px; font-size: 1rem; font-weight: 700;
    cursor: pointer; border: none; transition: background .2s;
  }
  .hero-btn-primary:hover { background: var(--blue-dark); }
  .hero-btn-secondary {
    background: #fff; color: var(--blue);
    padding: 14px 32px; border-radius: 999px; font-size: 1rem; font-weight: 700;
    cursor: pointer; border: 2px solid var(--blue); transition: background .2s;
  }
  .hero-btn-secondary:hover { background: var(--blue-light); }
  .hero-mockup {
    display: flex; justify-content: center; align-items: flex-end; gap: 24px;
    max-width: 900px; margin: 0 auto;
  }
  .hero-mockup-card {
    background: #fff; border-radius: 16px 16px 0 0;
    box-shadow: 0 8px 40px rgba(26,86,219,.15);
    padding: 20px 24px 0; flex: 1; max-width: 340px;
  }
  .mockup-bar { height: 8px; border-radius: 4px; background: var(--blue-light); margin-bottom: 10px; }
  .mockup-row { display: flex; gap: 8px; margin-bottom: 8px; }
  .mockup-cell { height: 28px; border-radius: 6px; background: #EEF4FF; flex: 1; }
  .mockup-cell.green { background: #DCFCE7; }
  .mockup-cell.accent { background: var(--blue-light); }
  .mockup-label { font-size: .7rem; color: var(--text-muted); margin-bottom: 4px; }
  .hero-badge {
    position: absolute; right: calc(50% - 460px); top: 210px;
    background: var(--green); color: #fff;
    padding: 8px 18px; border-radius: 999px; font-size: .88rem; font-weight: 700;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 18px rgba(22,163,74,.3);
  }
  @media (max-width: 900px) { .hero-badge { display: none; } }

  /* ===== SECTION SHARED ===== */
  section { padding: 80px 48px; }
  .section-label {
    text-align: center; font-size: .82rem; font-weight: 700;
    color: var(--blue); letter-spacing: .08em; text-transform: uppercase;
    margin-bottom: 10px;
  }
  .section-title {
    text-align: center; font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 900; color: var(--text-main);
    max-width: 700px; margin: 0 auto 12px;
  }
  .section-sub {
    text-align: center; color: var(--text-muted); font-size: 1rem;
    max-width: 540px; margin: 0 auto 48px; line-height: 1.7;
  }
  .card {
    background: var(--card-bg); border: 1.5px solid var(--border);
    border-radius: 14px; padding: 28px 28px 32px;
    transition: box-shadow .25s, transform .25s;
  }
  .card:hover { box-shadow: 0 8px 32px rgba(26,86,219,.14); transform: translateY(-3px); }
  .card-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--blue-light); display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
  }
  .card-icon svg { width: 24px; height: 24px; color: var(--blue); }
  .card h3 { font-size: 1.05rem; font-weight: 800; margin-bottom: 10px; }
  .card p { font-size: .93rem; color: var(--text-muted); line-height: 1.65; }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 22px; }

  /* ===== RGS2 – TRUST LOGOS ===== */
  #trust { background: var(--bg-soft); padding: 48px 48px; }
  #trust h2 { text-align: center; font-size: 1.25rem; font-weight: 800; margin-bottom: 32px; color: var(--text-main); }
  .logo-scroll { display: flex; align-items: center; gap: 40px; overflow-x: auto; padding: 8px 0; justify-content: center; flex-wrap: wrap; }
  .school-logo {
    font-size: .85rem; font-weight: 800; color: var(--text-muted);
    padding: 10px 20px; border: 1.5px solid var(--border); border-radius: 10px;
    background: #fff; white-space: nowrap;
    transition: border-color .2s, color .2s;
  }
  .school-logo:hover { border-color: var(--blue); color: var(--blue); }

  /* ===== RGS4 – SCHOOL ADMIN ===== */
  #admin { background: var(--bg-soft); }
  .feature-split {
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px;
    align-items: center; max-width: 1100px; margin: 0 auto;
  }
  .feature-split.reverse { direction: rtl; }
  .feature-split.reverse > * { direction: ltr; }
  .feature-visual { position: relative; border-radius: 18px; overflow: visible; }
  .dashboard-mockup {
    background: #fff; border-radius: 14px;
    box-shadow: 0 12px 48px rgba(26,86,219,.18);
    padding: 20px; position: relative;
  }
  .dash-header { display: flex; gap: 8px; margin-bottom: 14px; }
  .dash-tab {
    padding: 5px 14px; border-radius: 6px; font-size: .75rem; font-weight: 600;
    background: var(--blue-light); color: var(--blue); cursor: pointer;
  }
  .dash-tab.active { background: var(--blue); color: #fff; }
  .dash-stat-row { display: flex; gap: 12px; margin-bottom: 14px; }
  .dash-stat {
    flex: 1; padding: 12px; border-radius: 10px;
    background: var(--blue-light); font-size: .75rem;
  }
  .dash-stat strong { display: block; font-size: 1.1rem; font-weight: 900; color: var(--blue); }
  .dash-bar-row { display: flex; gap: 4px; align-items: flex-end; height: 60px; }
  .dash-bar { flex: 1; border-radius: 4px 4px 0 0; background: var(--blue); opacity: .7; min-width: 18px; }
  .dash-bar.green { background: var(--green); opacity: .8; }
  .speed-badge {
    position: absolute; top: -18px; right: -18px;
    background: var(--green); color: #fff;
    padding: 8px 16px; border-radius: 999px; font-size: .85rem; font-weight: 700;
    box-shadow: 0 4px 16px rgba(22,163,74,.3);
    display: flex; align-items: center; gap: 6px;
  }
  .feature-text h2 { font-size: 1.8rem; font-weight: 900; margin-bottom: 16px; }
  .feature-text p { color: var(--text-muted); line-height: 1.7; margin-bottom: 20px; font-size: .97rem; }
  .feature-text ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .feature-text ul li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: .93rem; color: var(--text-muted);
  }
  .feature-text ul li::before {
    content: '✓'; color: var(--green); font-weight: 900; flex-shrink: 0; margin-top: 2px;
  }

  /* ===== RGS8 – STATISTICS ===== */
  #stats { background: #fff; }
  .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; max-width: 1100px; margin: 0 auto 22px; }
  .stats-grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 22px; max-width: 740px; margin: 0 auto; }
  .stat-card {
    border: 1.5px solid var(--border); border-radius: 14px;
    padding: 36px 28px; text-align: center;
    transition: box-shadow .25s, transform .25s;
  }
  .stat-card:hover { box-shadow: 0 10px 28px rgba(26,86,219,.14); transform: translateY(-4px); }
  .stat-icon { font-size: 2rem; margin-bottom: 14px; transition: transform .25s; }
  .stat-card:hover .stat-icon { transform: scale(1.15) rotate(-4deg); }
  .stat-number { font-size: 2.6rem; font-weight: 900; color: var(--text-main); margin-bottom: 8px; }
  .stat-label { font-size: .93rem; color: var(--text-muted); line-height: 1.5; }

  /* ===== RGS9 – TESTIMONIALS ===== */
  #testimonials { background: var(--bg-soft); }
  .testimonial-slider { position: relative; max-width: 720px; margin: 0 auto; }
  .testimonial-card {
    background: #fff; border-radius: 18px; padding: 44px 48px;
    box-shadow: 0 4px 24px rgba(26,86,219,.1);
    text-align: center; min-height: 200px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
  }
  .testimonial-text {
    font-size: 1.05rem; color: var(--text-muted); line-height: 1.8; font-style: italic;
  }
  .testimonial-author { display: flex; align-items: center; gap: 14px; }
  .author-avatar {
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--blue-light); border: 2px solid var(--blue);
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; color: var(--blue); font-size: 1.1rem;
  }
  .author-name { font-weight: 800; font-size: .97rem; }
  .author-role { font-size: .82rem; color: var(--blue); }
  .slider-controls {
    display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 28px;
  }
  .slider-btn {
    width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--border);
    background: #fff; cursor: pointer; font-size: 1.1rem; color: var(--blue);
    display: flex; align-items: center; justify-content: center;
    transition: background .2s, color .2s;
  }
  .slider-btn:hover { background: var(--blue); color: #fff; }
  .slider-dots { display: flex; gap: 8px; }
  .dot {
    width: 8px; height: 8px; border-radius: 50%; background: var(--border); cursor: pointer;
    transition: background .2s, transform .2s;
  }
  .dot.active { background: var(--blue); transform: scale(1.3); }

  /* ===== RGS10 – PARTNERS ===== */
  #partners { background: #fff; }
  .partners-logo-grid {
    display: flex; flex-wrap: wrap; justify-content: center;
    gap: 20px; max-width: 900px; margin: 0 auto;
  }
  .partner-logo {
    border: 1.5px solid var(--border); border-radius: 12px;
    padding: 16px 28px; font-weight: 800; font-size: .88rem;
    color: var(--text-muted); background: #fff;
    transition: border-color .2s, color .2s, box-shadow .2s;
  }
  .partner-logo:hover { border-color: var(--blue); color: var(--blue); box-shadow: 0 4px 12px rgba(26,86,219,.1); }

  /* ===== RGS11 – JOIN CTA ===== */
  #join { background: var(--bg-soft); padding: 80px 48px; }
  .join-inner {
    background: linear-gradient(135deg, #EBF2FF 0%, #DBEAFE 100%);
    border-radius: 24px; padding: 64px 80px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 40px; max-width: 1100px; margin: 0 auto;
    position: relative; overflow: hidden;
  }
  .join-inner::before {
    content: '';
    position: absolute; right: -60px; top: -60px;
    width: 300px; height: 300px; border-radius: 50%;
    background: rgba(19, 19, 19, 0.08);
  }
  .join-text h2 { font-size: 2.2rem; font-weight: 900; margin-bottom: 16px; }
  .join-text p { color: var(--text-muted); line-height: 1.7; max-width: 440px; margin-bottom: 28px; }
  .join-visual {
    font-size: 8rem; flex-shrink: 0;
    filter: drop-shadow(0 4px 24px rgba(26,86,219,.2));
  }

  /* ===== RGS12 – FOOTER ===== */
  footer { background: #131313; color: #CBD5E1; padding: 64px 48px 36px; }
  .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
  .footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .footer-logo span { font-weight: 900; font-size: 1.25rem; color: #fff; }
  .footer-tagline { font-size: .88rem; line-height: 1.7; margin-bottom: 20px; }
  .footer-address { font-size: .82rem; line-height: 1.8; }
  .footer-mail-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 50%; background: #FFFFFF;
    vertical-align: middle; margin-right: 4px;
  }
  .footer-col h4 { font-size: .95rem; font-weight: 800; color: #fff; margin-bottom: 16px; }
  .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .footer-col ul li a { font-size: .88rem; color: #94A3B8; transition: color .2s; }
  .footer-col ul li a:hover { color: #fff; }
  .footer-bottom {
    border-top: 1px solid #0f0f10; padding-top: 24px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: .82rem; color: #64748B;
  }
  .footer-social { display: flex; gap: 12px; }
  .social-icon {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: transform .2s ease, opacity .2s ease;
  }
  .social-icon:hover { transform: translateY(-3px); }
  .social-facebook, .social-instagram, .social-x, .social-linkedin {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    transition: background .2s ease, border-color .2s ease, transform .2s ease;
  }
  .social-icon svg { width: 16px; height: 16px; fill: #000000; transition: fill .2s ease; }
  .social-facebook:hover, .social-instagram:hover, .social-x:hover, .social-linkedin:hover {
    background: #000000;
    border-color: #000000;
  }
  .social-facebook:hover svg, .social-instagram:hover svg, .social-x:hover svg, .social-linkedin:hover svg {
    fill: #FFFFFF;
  }
  .footer-logo-rgs {
    display: inline-flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: 10px;
    background: #fff; color: #fff; font-weight: 900; font-size: 1rem;
  }

  /* ===== WHATSAPP FLOAT ===== */
  .whatsapp-float {
    position: fixed; bottom: 28px; right: 28px; z-index: 999;
    width: 52px; height: 52px; border-radius: 50%;
    background: #25D366; color: #fff; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(37,211,102,.4);
    font-size: 1.5rem; transition: transform .2s;
  }
  .whatsapp-float:hover { transform: scale(1.1); }

  /* ===== MAIL FLOAT ===== */
  .mail-float {
    position: fixed; bottom: 92px; right: 28px; z-index: 999;
    width: 52px; height: 52px; border-radius: 50%;
    background: #FFFFFF; color: #111827; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(0,0,0,.18); transition: transform .2s;
  }
  .mail-float:hover { transform: scale(1.1); }

  /* ===== ANIMATIONS ===== */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .6s ease both; }
  .delay-1 { animation-delay: .1s; }
  .delay-2 { animation-delay: .2s; }
  .delay-3 { animation-delay: .3s; }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 900px) {
    nav { padding: 0 70px; }
    .nav-links { display: none; }
    section { padding: 56px 20px; }
    .grid-3, .stats-grid, .footer-grid { grid-template-columns: 1fr; }
    .grid-2, .stats-grid-2 { grid-template-columns: 1fr; }
    .feature-split, .feature-split.reverse { grid-template-columns: 1fr; direction: ltr; }
    .join-inner { flex-direction: column; padding: 40px 28px; }
    .join-visual { font-size: 5rem; }
  }


  /* ===== ADDITIONAL STYLES MERGED FROM style.css ===== */
/* ============================================================
   RGS — Result Generation System
   style.css
   ============================================================ */

/* ── Reset & Base ─────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --blue-50:  #e6f1fb;
  --blue-100: #b5d4f4;
  --blue-600: #141515;
  --blue-700: #101111;
  --blue-800: #121314;
  --brand:    #101011;
  --brand-dark: #101012;
  --text-primary:   #111827;
  --text-secondary: #4b5563;
  --text-muted:     #6b7280;
  --border-light:   #c0d4ee;
  --border-mid:     #dde3ee;
  --bg-page:        #ffffff;
  --bg-surface:     #f5f8ff;
  --bg-hero:        #dce8f5;
  --bg-section-alt: #edf2fa;
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  20px;
  --radius-pill: 999px;
  --shadow-card: 0 1px 4px rgba(0, 0, 0, 0.06);
  --transition: 0.2s ease;

  /* Benefits section specific */
  --blue:       #0e0f10;
  --blue-dark:  #121213;
  --blue-light: #EBF2FF;
  --card-bg:    #FFFFFF;
  --border:     #D1E3FF;
  --green:      #16A34A;
  --bg-soft:    #EEF4FF;
}

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: var(--text-primary);
  background: #131313;
  line-height: 1.6;
}

a {
  text-decoration: none;
  color: inherit;
}

address {
  font-style: normal;
}

/* ── Typography helpers ───────────────────────────────────── */
.section-label {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 8px;
}

.section-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
  line-height: 1.25;
}

.muted    { color: var(--text-muted); }
.accent   { color: var(--brand); }
.danger   { color: #dc2626; }
.small    { font-size: 10px; }

/* ── Navigation ───────────────────────────────────────────── */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 62px;
  background: var(--bg-hero);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #0a0b0b;
}

.nav-logo-icon {
  width: 32px;
  height: 32px;
  background: var(--brand);
  border-radius: 50% 50% 50% 10%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
}

.nav-links {
  display: flex;
  gap: 28px;
  font-size: 1.15rem;
}

.nav-links a {
  color: var(--text-primary);
  transition: color var(--transition);
}

.nav-links a:hover,
.nav-links a.active {
  color: var(--brand);
}

.nav-links a.active {
  border-bottom: 2px solid var(--brand);
  padding-bottom: 2px;
}

.nav-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* ── Buttons ──────────────────────────────────────────────── */
.btn-login {
  border: 1.5px solid var(--brand);
  background: transparent;
  color: var(--brand);
  padding: 8px 22px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-size: 14px;
  transition: background var(--transition), color var(--transition);
}

.btn-login:hover {
  background: var(--black);
}

.btn-primary {
  background: var(--brand);
  color: #fff;
  padding: 8px 22px;
  border-radius: var(--radius-pill);
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background var(--transition);
}

.btn-primary:hover {
  background: var(--brand-dark);
}

.btn-cta {
  display: inline-block;
  background: var(--brand);
  color: #fff;
  padding: 13px 30px;
  border-radius: var(--radius-pill);
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  margin-top: 20px;
  transition: background var(--transition);
}

.btn-cta:hover {
  background: var(--brand-dark);
}

/* ── Section wrappers ─────────────────────────────────────── */
.section {
  padding: 64px 48px;
}

.section-white {
  background: var(--bg-page);
}

.designed-for-title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  margin-top: 52px;
  line-height: 1.3;
}

/* ── Hero (Section 1) ─────────────────────────────────────── */
.hero {
  text-align: center;
  padding: 64px 48px 32px;
  background: linear-gradient(180deg, var(--bg-hero) 0%, #f0f5fb 60%, #fff 100%);
}

.hero h1 {
  font-size: 46px;
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 18px;
}

.hero p {
  font-size: 16px;
  color: var(--text-secondary);
  max-width: 560px;
  margin: 0 auto 36px;
}

.hero-img-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.hero-img-box {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 32px;
  width: 520px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-mid);
  box-shadow: var(--shadow-card);
}

.hero-icon {
  font-size: 72px;
  color: rgba(26, 86, 219, 0.25);
}

.hero-img-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 10px;
}

/* ── Trust Bar (Section 2) ────────────────────────────────── */
.trust-bar {
  background: var(--bg-hero);
  text-align: center;
  padding: 36px 48px;
}

.trust-bar h2 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 22px;
}

.logo-scroll {
  display: flex;
  justify-content: center;
  gap: 36px;
  flex-wrap: wrap;
  align-items: center;
}

.school-logo {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
  font-size: 13px;
  color: #1a3a6b;
}

.school-logo-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(26, 86, 219, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--brand);
}

/* ===== RGS2 – TRUST LOGO CAROUSEL ===== */
#trust {
  background: #E8F0FB;
  padding: 52px 0 36px;
  text-align: center;
}

#trust h2 {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 36px;
  padding: 0 48px;
}

/* Outer container: clips the sliding track */
.trust-carousel-wrapper {
  overflow: hidden;
  width: 100%;
}

/* The sliding track holds all slides side by side */
.trust-track {
  display: flex;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* Each slide is exactly one viewport-width of the wrapper */
.trust-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 56px;
  padding: 8px 64px 28px;
  flex: 0 0 100%;          /* each slide = 100% of wrapper width */
  min-width: 0;
}

/* Individual logo cell */
.school-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.school-logo img {
  height: 56px;             /* uniform height; width scales naturally */
  width: auto;
  max-width: 180px;
  object-fit: contain;
  filter: grayscale(0%);
  opacity: 0.88;
  transition: opacity 0.2s, transform 0.2s;
}

.school-logo img:hover {
  opacity: 1;
  transform: scale(1.04);
}

/* Navigation dots */
.trust-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}

.trust-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: #B8CCEC;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s, transform 0.2s;
}

.trust-dot.active {
  background: #1A56DB;
  transform: scale(1.25);
}

/* Responsive */
@media (max-width: 700px) {
  .trust-slide {
    gap: 28px;
    padding: 8px 24px 24px;
    flex-wrap: wrap;
  }
  .school-logo img {
    height: 40px;
    max-width: 120px;
  }
}

/* ── Why RGS grid (Section 3) ─────────────────────────────── */
.why-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 32px;
}

.why-card {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 28px;
  background: #fff;
  transition: box-shadow var(--transition);
}

.why-card:hover {
  box-shadow: 0 4px 14px rgba(26, 86, 219, 0.1);
}

.why-card i {
  font-size: 28px;
  color: var(--brand);
  margin-bottom: 14px;
  display: block;
}

.why-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.why-card p {
  font-size: 14px;
  color: var(--text-secondary);
}

/* ── User sections (Sections 4–6) ─────────────────────────── */
.user-section {
  display: flex;
  align-items: center;
  gap: 52px;
  padding: 44px 0;
  border-bottom: 1px solid var(--border-mid);
}

.user-section:last-of-type {
  border-bottom: none;
}

.user-section.reverse {
  flex-direction: row-reverse;
}

.user-section-img {
  flex: 1;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  min-height: 290px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.user-section-bg-icon {
  font-size: 72px;
  color: rgba(26, 86, 219, 0.18);
}

.user-section-text {
  flex: 1;
}

.user-section-text h2 {
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 14px;
}

.user-section-text p {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.75;
}

/* Floating elements inside user-section-img */
.badge-float {
  position: absolute;
  top: 14%;
  right: 8%;
  background: #22c55e;
  color: #fff;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stars-float {
  position: absolute;
  bottom: 8%;
  right: 5%;
  background: #e91e8c;
  color: #fff;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  width: 170px;
}

.star-row {
  color: #FFD700;
  font-size: 14px;
  margin-bottom: 4px;
}

.mockup-card {
  position: absolute;
  left: 10%;
  bottom: 9%;
  background: #fff;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-mid);
  padding: 10px 12px;
  font-size: 10px;
  width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.mockup-card.mockup-right {
  left: auto;
  right: 10%;
}

.mockup-title {
  font-weight: 700;
  margin-bottom: 5px;
  font-size: 9px;
  color: var(--text-secondary);
}

.mockup-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
}

.mockup-table td {
  padding: 3px 4px;
  border-bottom: 1px solid #f0f0f0;
}

.mockup-bar {
  margin-top: 7px;
  height: 28px;
  background: linear-gradient(90deg, #22c55e 70%, #ef4444 30%);
  border-radius: 4px;
}

.fee-dots {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-top: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.dot-blue  { background: var(--brand); }
.dot-green { background: #22c55e; }
.dot-red   { background: #ef4444; }

.mockup-pay-btn {
  margin-top: 6px;
  background: #e6f1fb;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 8px;
  color: var(--brand);
  cursor: pointer;
  text-align: center;
}

/* ── Benefits Section (RGS7) ──────────────────────────────── */
#benefits {
  background: var(--bg-soft);
  padding: 80px 48px;
}

/* Outer grid: exactly 842.4px wide × 570px tall, 3 columns */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 254.14px);
  grid-template-rows: repeat(2, 265px);
  column-gap: 39.99px;
  row-gap: 39.99px;
  width: 842.4px;
  height: 570px;
  margin: 0 auto;
}

/* Each benefit card: 254.14px wide × 265px tall (two rows = 570px with gap) */
.benefit-card {
  background: var(--card-bg);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 24px 22px;
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.25s, border-color 0.25s;
  position: relative;
  overflow: hidden;
  width: 254.14px;
  height: 265px;
}

.benefit-card:hover {
  box-shadow: 0 8px 36px rgba(26, 86, 219, 0.18);
  transform: translateY(-4px);
  border-color: var(--blue);
}

/* Decorative 6th card spans the full height of both rows */
.benefit-card.benefit-card--tall {
  grid-row: span 2;
  height: 310px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--blue-light);
  border-color: var(--blue);
}

/* Hover overlay */
.benefit-card .hover-content {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%);
  border-radius: 14px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: #fff;
}

.benefit-card:hover .hover-content {
  opacity: 1;
}

/* Hover image: exactly 194px × 155px */
.benefit-card .hover-content img {
  width: 220px;
  height: 196px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
  display: block;
}

.benefit-card .hover-content h3 {
  font-size: 0.95rem;
  font-weight: 800;
  margin-bottom: 6px;
  text-align: center;
  line-height: 1.3;
}

.benefit-card .hover-content ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.benefit-card .hover-content ul li {
  font-size: 0.78rem;
  line-height: 1.4;
  opacity: 0.92;
  display: flex;
  gap: 6px;
}

.benefit-card .hover-content ul li::before {
  content: '→';
  flex-shrink: 0;
}

/* Card icon */
.benefit-card .card-icon {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  background: var(--blue-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.benefit-card .card-icon svg {
  width: 22px;
  height: 22px;
  color: var(--blue);
}

.benefit-card h3 {
  font-size: 0.98rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.benefit-card > p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

/* Hover overlay (legacy class kept for compatibility) */
.hover-card {
  cursor: pointer;
}

.hover-card:hover {
  box-shadow: 0 6px 20px rgba(26, 86, 219, 0.18);
}

.hover-overlay {
  display: none;
  position: absolute;
  inset: 0;
  background: var(--brand);
  border-radius: var(--radius-md);
  padding: 28px;
  color: #fff;
  flex-direction: column;
  justify-content: flex-start;
  z-index: 10;
}

.hover-card:hover .hover-overlay {
  display: flex;
}

.hover-overlay i {
  font-size: 28px;
  color: #fff;
  margin-bottom: 12px;
}

.hover-overlay h3 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #fff;
}

.hover-overlay ul {
  font-size: 13px;
  padding-left: 16px;
  opacity: 0.92;
  line-height: 2;
  color: #fff;
}

/* ── Stats (Sections 8–9) ─────────────────────────────────── */
.stats-section {
  background: var(--bg-page);
  padding: 64px 48px;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 32px auto 20px;
}

.stats-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 680px;
  margin: 0 auto;
}

.stat-card {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 32px 20px;
  transition: box-shadow var(--transition);
}

.stat-card:hover {
  box-shadow: 0 4px 14px rgba(26, 86, 219, 0.1);
}

.stat-card i {
  font-size: 28px;
  color: var(--brand);
  margin-bottom: 10px;
  display: block;
}

.stat-num {
  font-size: 34px;
  font-weight: 800;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}

/* ── Testimonials (Section 10) ────────────────────────────── */
.testimonial-section {
  background: var(--bg-surface);
  padding: 64px 48px;
  text-align: center;
}

.testimonial-sub {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 28px;
}

.testimonial-text {
  font-style: italic;
  font-size: 16px;
  color: var(--text-secondary);
  max-width: 640px;
  margin: 0 auto 28px;
  line-height: 1.85;
  border: none;
}

.testimonial-author {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--blue-50);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--brand);
}

.author-name {
  font-weight: 700;
  font-size: 15px;
  text-align: left;
}

.author-role {
  font-size: 13px;
  color: var(--brand);
  text-align: left;
}

/* ── Partners (Section 11) ────────────────────────────────── */
.partners-section {
  padding: 48px 48px 32px;
  background: var(--bg-page);
  text-align: center;
}

.partners-logos {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.partner-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.partner-item i {
  font-size: 28px;
  color: var(--blue-600);
}

/* ── CTA + Footer (Section 12) ────────────────────────────── */
.cta-wrapper {
  padding: 0 40px 40px;
  background: var(--bg-section-alt);
}

.cta-section {
  background: var(--bg-section-alt);
  border-radius: var(--radius-md);
  padding: 52px 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.cta-text h2 {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 14px;
}

.cta-text p {
  font-size: 15px;
  color: var(--text-secondary);
  max-width: 520px;
  line-height: 1.7;
}

.cta-illustration {
  font-size: 96px;
  color: rgba(26, 86, 219, 0.15);
  flex-shrink: 0;
}

/* ── Footer ───────────────────────────────────────────────── */
.footer {
  background: #0a1e3d;
  color: #b0bfd4;
  padding: 52px 48px 36px;
}

.footer-inner {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 36px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.footer-logo-icon {
  width: 34px;
  height: 34px;
  background: #22d3ee;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  color: #0a1e3d;
}

.footer-logo-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.footer-brand p {
  font-size: 13px;
  line-height: 1.6;
}

.footer-addr {
  font-size: 12px;
  margin-top: 16px;
  line-height: 1.85;
  color: #8899bb;
}

.footer h4 {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}

.footer ul {
  list-style: none;
}

.footer ul li {
  margin-bottom: 12px;
  font-size: 13px;
}

.footer ul li a {
  color: #b0bfd4;
  transition: color var(--transition);
}

.footer ul li a:hover {
  color: #fff;
}

/* ── WhatsApp FAB ─────────────────────────────────────────── */
.whatsapp-btn {
  position: fixed;
  bottom: 22px;
  right: 22px;
  width: 50px;
  height: 50px;
  background: #25d366;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  transition: transform var(--transition);
}

.whatsapp-btn:hover {
  transform: scale(1.08);
}

.whatsapp-btn i {
  font-size: 24px;
  color: #fff;
}

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 900px) {
  .nav { padding: 12px 20px; }
  .nav-links { display: none; }
  .section { padding: 44px 24px; }
  .hero { padding: 44px 24px 24px; }
  .hero h1 { font-size: 32px; }
  .why-grid,
  .stats-grid { grid-template-columns: 1fr; }
  .stats-grid-2 { grid-template-columns: 1fr; }
  .user-section,
  .user-section.reverse { flex-direction: column; }
  .footer-inner { grid-template-columns: 1fr 1fr; }
  .cta-section { flex-direction: column; }
  .trust-bar,
  .stats-section,
  .testimonial-section,
  .partners-section,
  .cta-wrapper { padding-left: 24px; padding-right: 24px; }

  /* Benefits responsive: stack to single column */
  .benefits-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    width: 100%;
    height: auto;
  }
  .benefit-card,
  .benefit-card.benefit-card--tall {
    width: 100%;
    height: auto;
    min-height: 220px;
    grid-row: span 1;
  }
  .benefit-card .hover-content img {
    width: 100%;
    max-width: 194px;
    height: 155px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; }
}`;
const LANDING_BODY = `

<!-- ===== NAV ===== -->
<nav>
  <div class="nav-logo">
    <svg viewBox="0 0 60 80" fill="none" width="51" height="260">

  <image href="image/rgs.png" width="65" height="91"  />
</svg>
      RGS
  </div>
  <div class="nav-links">
    <a href="#benefits">Benefits</a>
    <div class="nav-item">
      <a href="#features" class="has-arrow">Features</a>
      <div class="dropdown-menu">
        <a href="#features">For Schools</a>
        <a href="#features">For Teachers</a>
        <a href="#features">For Parents</a>
        <a href="#features">For Students</a>
      </div>
    </div>
    <a href="/pricing">Pricing</a>
    <div class="nav-item">
      <a href="#resources" class="has-arrow">Resources</a>
      <div class="dropdown-menu">
        <a href="#resources">Quickstart Tutorial</a>
        <a href="#resources">Help Center</a>
        <a href="#resources">Webinars</a>
        <a href="#resources">Case Studies</a>
        <a href="#resources">Blog</a>
      </div>
    </div>
    <a href="#refer">Refer &amp; Earn</a>
    <a href="#partners">Partner Schools</a>
  </div>
  <div class="nav-cta">
     <a href="/auth/login" class="btn-outline">Login</a>
    <a href="/auth/register" class="btn-solid">Get Started for Free</a>
  </div>
</nav>

<!-- ===== RGS1 – HERO ===== -->
<section id="hero">
  <div class="hero-eyebrow">🎓 Trusted by 787+ Schools Worldwide</div>
  <h1 class="fade-up">Smart Result<br>Generation System</h1>
  <p class="fade-up delay-1">RGS is designed to help schools generate accurate student results in minutes, eliminate errors, and keep every stakeholder informed — in real time.</p>
  <div class="hero-btns fade-up delay-2">
    <button class="hero-btn-primary">Get Started for Free</button>
    <button class="hero-btn-secondary">See How It Works</button>
  </div>
  <div class="hero-badge">⚡ 10× Faster Results</div>
  <div class="hero-mockup fade-up delay-3">
    <div class="hero-mockup-card">
      <div class="mockup-label">Student Broadsheet — SS1A</div>
      <div class="mockup-bar" style="width:80%;background:#DBEAFE;"></div>
      <div class="mockup-row">
        <div class="mockup-cell accent"></div>
        <div class="mockup-cell green"></div>
        <div class="mockup-cell"></div>
        <div class="mockup-cell green"></div>
      </div>
      <div class="mockup-row">
        <div class="mockup-cell"></div>
        <div class="mockup-cell green"></div>
        <div class="mockup-cell accent"></div>
        <div class="mockup-cell"></div>
      </div>
      <div class="mockup-row">
        <div class="mockup-cell green"></div>
        <div class="mockup-cell accent"></div>
        <div class="mockup-cell green"></div>
        <div class="mockup-cell"></div>
      </div>
    </div>
    <div class="hero-mockup-card" style="max-width:220px; margin-bottom:-12px;">
      <div class="mockup-label">Class Average</div>
      <div style="font-size:1.8rem;font-weight:900;color:#101011;margin-bottom:8px;">73.4%</div>
      <div class="dash-bar-row">
        <div class="dash-bar" style="height:30px;"></div>
        <div class="dash-bar green" style="height:55px;"></div>
        <div class="dash-bar" style="height:45px;"></div>
        <div class="dash-bar green" style="height:58px;"></div>
        <div class="dash-bar" style="height:38px;"></div>
      </div>
    </div>
  </div>
</section>

<!-- ===== RGS2 – TRUST LOGOS CAROUSEL ===== -->
<section id="trust">
  <div class="trust-carousel-wrapper">
    <div class="trust-track" id="trustTrack">
      <!-- Slide 1: logos 1–3 -->
      <div class="trust-slide">
        <div class="school-logo"><img src="image/I-SCHOLARS.png" alt="I-Scholars International Academy"></div>
        <div class="school-logo"><img src="image/EPITOME.png" alt="Epitome Model Islamic Schools"></div>
        <div class="school-logo"><img src="image/EDULYN.png" alt="Edulyn Schools"></div>
      </div>
      <!-- Slide 2: logos 4–6 -->
      <div class="trust-slide">
        <div class="school-logo"><img src="image/CHRYSOLITE.png" alt="Chrysolite Academy"></div>
        <div class="school-logo"><img src="image/ALMUSTAQEEM.png" alt="Al-Mustaqeem Integrated Schools"></div>
        <div class="school-logo"><img src="image/ACCE-Abuja.png" alt="ACCE Abuja"></div>
      </div>
      <!-- Slide 3: logos 7–9 -->
      <div class="trust-slide">
        <div class="school-logo"><img src="image/GREENFIELD.png" alt="Greenfield Academy"></div>
        <div class="school-logo"><img src="image/PINNACLE.png" alt="Pinnacle College"></div>
        <div class="school-logo"><img src="image/Stephelm.jpg" alt="Stephelm School"></div>
      </div>
    </div>
  </div>

  <!-- Dots -->
  <div class="trust-dots" id="trustDots">
    <button class="trust-dot active" onclick="goToSlide(0)" aria-label="Slide 1"></button>
    <button class="trust-dot" onclick="goToSlide(1)" aria-label="Slide 2"></button>
    <button class="trust-dot" onclick="goToSlide(2)" aria-label="Slide 3"></button>
  </div>
</section>

<!-- ===== RGS3 – WHY RGS ===== -->
<section id="why" style="background:#fff;">
  <div class="section-label">Why RGS</div>
  <div class="section-title">Why Top Schools Choose RGS?</div>
  <div class="section-sub">Built specifically for African schools, RGS removes the stress from result processing and puts accuracy first.</div>
  <div class="grid-3" style="max-width:1100px;margin:0 auto;">
    <div class="card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <h3>School-First Design</h3>
      <p>We put school administrators, teachers, and parents at the centre of every feature decision. Your workflow, your terms.</p>
    </div>
    <div class="card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <h3>10+ Years of Excellence</h3>
      <p>Over a decade serving hundreds of schools across 5 countries — we understand what result generation really demands.</p>
    </div>
    <div class="card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
      </div>
      <h3>Dedicated Support</h3>
      <p>Our team is available via phone, chat, or on-site visit to ensure your school always gets the help it needs, fast.</p>
    </div>
  </div>
  <div class="section-title" style="margin-top:72px;margin-bottom:0;">The Reliable Result System Designed For:</div>
</section>

<!-- ===== RGS4 – SCHOOL ADMIN ===== -->
<section id="admin" style="background:var(--bg-soft);">
  <div class="feature-split" style="max-width:1100px;margin:0 auto;">
    <div class="feature-visual">
      <div class="dashboard-mockup">
        <div class="dash-header">
          <div class="dash-tab active">Dashboard</div>
          <div class="dash-tab">Result List</div>
          <div class="dash-tab">Broadsheet</div>
        </div>
        <div class="dash-stat-row">
          <div class="dash-stat"><span>Total Students</span><strong>1,284</strong></div>
          <div class="dash-stat"><span>Results Processed</span><strong>1,241</strong></div>
          <div class="dash-stat"><span>Completion</span><strong>96.6%</strong></div>
        </div>
        <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:8px;">Result completion by class</div>
        <div class="dash-bar-row">
          <div class="dash-bar green" style="height:52px;"></div>
          <div class="dash-bar" style="height:38px;"></div>
          <div class="dash-bar green" style="height:60px;"></div>
          <div class="dash-bar" style="height:44px;"></div>
          <div class="dash-bar green" style="height:56px;"></div>
          <div class="dash-bar" style="height:30px;"></div>
          <div class="dash-bar green" style="height:48px;"></div>
        </div>
        <div class="speed-badge">⚡ Faster Processing</div>
      </div>
    </div>
    <div class="feature-text">
      <h2>School Administrator</h2>
      <p>RGS provides a comprehensive result management system that helps you efficiently coordinate result entry, sign-off, and distribution — all while reducing administrative overhead.</p>
      <ul>
        <li>Centralised result approval and publishing workflow</li>
        <li>Real-time completion tracking per class and subject</li>
        <li>Automated broadsheet generation in seconds</li>
        <li>Secure data storage with role-based access</li>
      </ul>
    </div>
  </div>
</section>

<!-- ===== RGS5 – TEACHERS ===== -->
<section id="teachers" style="background:#fff;">
  <div class="feature-split reverse" style="max-width:1100px;margin:0 auto;">
    <div class="feature-text">
      <h2>Teachers</h2>
      <p>RGS gives teachers a clean, intuitive interface to enter scores, view class statistics, and submit results — spending less time on admin and more time teaching.</p>
      <ul>
        <li>Enter CA and exam scores directly — no spreadsheets</li>
        <li>Instant grade computation with your school's grading system</li>
        <li>View class broadsheet before submission</li>
        <li>⭐⭐⭐⭐⭐ "Result compilation on RGS is AWESOME"</li>
      </ul>
    </div>
    <div class="feature-visual">
      <div class="dashboard-mockup">
        <div style="font-size:.8rem;font-weight:700;color:var(--text-main);margin-bottom:14px;">📋 Broadsheet — JSS 2B</div>
        <table style="width:100%;border-collapse:collapse;font-size:.75rem;">
          <thead>
            <tr style="background:var(--blue-light);">
              <th style="text-align:left;padding:6px 8px;border-radius:6px 0 0 6px;">Name</th>
              <th style="padding:6px 8px;">Math</th>
              <th style="padding:6px 8px;">Eng</th>
              <th style="padding:6px 8px;">Sci</th>
              <th style="padding:6px 8px;border-radius:0 6px 6px 0;">Avg</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #EEF4FF;">
              <td style="padding:7px 8px;color:var(--blue);font-weight:600;">Amaka O.</td>
              <td style="text-align:center;padding:7px 8px;">85</td>
              <td style="text-align:center;padding:7px 8px;">78</td>
              <td style="text-align:center;padding:7px 8px;">91</td>
              <td style="text-align:center;padding:7px 8px;font-weight:700;color:var(--green);">84.7</td>
            </tr>
            <tr style="border-bottom:1px solid #EEF4FF;">
              <td style="padding:7px 8px;color:var(--blue);font-weight:600;">Emeka T.</td>
              <td style="text-align:center;padding:7px 8px;">72</td>
              <td style="text-align:center;padding:7px 8px;">68</td>
              <td style="text-align:center;padding:7px 8px;">75</td>
              <td style="text-align:center;padding:7px 8px;font-weight:700;color:var(--blue);">71.7</td>
            </tr>
            <tr>
              <td style="padding:7px 8px;color:var(--blue);font-weight:600;">Fatima B.</td>
              <td style="text-align:center;padding:7px 8px;">90</td>
              <td style="text-align:center;padding:7px 8px;">88</td>
              <td style="text-align:center;padding:7px 8px;">95</td>
              <td style="text-align:center;padding:7px 8px;font-weight:700;color:var(--green);">91.0</td>
            </tr>
          </tbody>
        </table>
        <button class="btn-solid" style="margin-top:16px;font-size:.8rem;padding:8px 18px;">Submit Results</button>
      </div>
    </div>
  </div>
</section>

<!-- ===== RGS6 – PARENTS ===== -->
<section id="parents" style="background:var(--bg-soft);">
  <div class="feature-split" style="max-width:1100px;margin:0 auto;">
    <div class="feature-visual">
      <div class="dashboard-mockup">
        <div style="font-size:.8rem;font-weight:700;margin-bottom:14px;">📱 Parent Portal — School Fees &amp; Results</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="background:var(--blue-light);border-radius:8px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:.72rem;color:var(--text-muted);">1st Term Result</div>
              <div style="font-weight:700;font-size:.9rem;">Chidi Okonkwo</div>
            </div>
            <span style="background:#DCFCE7;color:#15803D;font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:999px;">✓ Published</span>
          </div>
          <div style="background:var(--blue-light);border-radius:8px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:.72rem;color:var(--text-muted);">2nd Term Result</div>
              <div style="font-weight:700;font-size:.9rem;">Chidi Okonkwo</div>
            </div>
            <span style="background:#FEF9C3;color:#92400E;font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:999px;">⏳ Pending</span>
          </div>
          <div style="background:#fff;border:1.5px solid var(--border);border-radius:8px;padding:12px 14px;">
            <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:4px;">Average Score — 1st Term</div>
            <div style="font-size:1.5rem;font-weight:900;color:var(--blue);">78.5%</div>
            <div style="font-size:.72rem;color:var(--green);">Position: 4th of 38</div>
          </div>
        </div>
      </div>
    </div>
    <div class="feature-text">
      <h2>Parents</h2>
      <p>RGS keeps parents fully involved in their child's academic journey — from instant result notifications to detailed performance breakdowns, all at their fingertips.</p>
      <ul>
        <li>Receive instant SMS/email when results are published</li>
        <li>View full report cards online, any time</li>
        <li>Track performance trends across terms</li>
        <li>Communicate directly with the school</li>
      </ul>
    </div>
  </div>
</section>

<!-- ===== RGS7 – BENEFITS WITH HOVER ===== -->
<section id="benefits">
  <div class="section-label">Benefits</div>
  <div class="section-title">Tap into the Benefits of RGS For Your School</div>
  <div class="section-sub">Everything your school needs to run a seamless, error-free result process — built in.</div>

  <!--
    Grid: 842.4px × 570px | 3 columns × 254.14px | 2 rows × 265px | gap 39.99px
    Cards 1–5 each occupy one cell (254.14 × 265px).
    Card 6 spans 2 rows → height = 265 + 39.99 + 265 = 570px (full column height).
    Hover images: 194px × 155px (fit inside 254.14 × 265 card with padding).
  -->
  <div class="benefits-grid">

    <!-- Card 1: Accurate Results -->
    <div class="benefit-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h3>Accurate Results</h3>
      <p>Eliminate manual computation errors with automated, validated score processing.</p>
      <div class="hover-content">
        <img src="image/financialleakages.png" alt="Accurate Results">
      </div>
    </div>

    <!-- Card 2: Stress-Free Compilation -->
    <div class="benefit-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </div>
      <h3>Stress-Free Compilation</h3>
      <p>Generate complete broadsheets and report cards in minutes, not weeks.</p>
      <div class="hover-content">
        <img src="image/resultcompilation.png" alt="Stress-Free Compilation">
      </div>
    </div>

    <!-- Card 3: Data Protection -->
    <div class="benefit-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
      </div>
      <h3>Data Protection</h3>
      <p>Your school's data is encrypted, backed up, and access-controlled.</p>
      <div class="hover-content">
        <img src="image/dataprotection.png" alt="Data Protection">
      </div>
    </div>

    <!-- Card 4: Instant Publishing -->
    <div class="benefit-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <h3>Instant Publishing</h3>
      <p>Push results live to parents the moment they're approved.</p>
      <div class="hover-content">
        <img src="image/easyfeespayment.png" alt="Instant Publishing">
      </div>
    </div>

    <!-- Card 5: Zero Paperwork -->
    <div class="benefit-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      <h3>Zero Paperwork</h3>
      <p>Go fully digital — no more lost, damaged, or misplaced result slips.</p>
      <div class="hover-content">
        <img src="image/zeropaperwork.png" alt="Zero Paperwork">
      </div>
    </div>

    <!-- Card 6: Decorative tall card (spans both rows) -->
    <div class="benefit-card benefit-card--tall">
      <div style="font-size:3.5rem;margin-bottom:14px;">📊</div>
      <h3 style="color:var(--blue);font-size:1.05rem;">All benefits, one platform</h3>
      <p style="color:var(--blue-dark);margin-top:8px;font-size:.88rem;line-height:1.55;">Hover each card to discover what RGS delivers for your school.</p>
    </div>

  </div>
</section>

<!-- ===== RGS8 – STATISTICS ===== -->
<section id="stats">
  <div class="section-title" style="margin-bottom:40px;">We are Trusted By:</div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon">🌍</div>
      <div class="stat-number" data-target="787">787</div>
      <div class="stat-label">Schools use RGS around the world</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">👩‍🏫</div>
      <div class="stat-number" data-target="12969">12,969</div>
      <div class="stat-label">Teachers using RGS to process their results</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎓</div>
      <div class="stat-number" data-target="146000">146,000</div>
      <div class="stat-label">Students get their results in the shortest possible time</div>
    </div>
  </div>
  <div class="stats-grid-2" style="margin-top:22px;">
    <div class="stat-card">
      <div class="stat-icon">📱</div>
      <div class="stat-number" data-target="43000">43,000</div>
      <div class="stat-label">Parents access results easily from their mobile devices</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🌐</div>
      <div class="stat-number" data-target="5">5</div>
      <div class="stat-label">Countries with active RGS-powered schools</div>
    </div>
  </div>
</section>

<!-- ===== RGS9 – TESTIMONIALS ===== -->
<section id="testimonials">
  <div class="section-title" style="margin-bottom:12px;">Testimonials</div>
  <div class="section-sub">Don't just take our word for it. See what our satisfied school communities have to say.</div>
  <div class="testimonial-slider">
    <div class="testimonial-card" id="testimonialCard">
      <div class="testimonial-text" id="testimonialText">
        "RGS is very easy to use. The support team ensures our problems are resolved quickly — either online or by visiting our school on request. Result compilation has never been this smooth."
      </div>
      <div class="testimonial-author">
        <div class="author-avatar" id="authorInitial">AT</div>
        <div>
          <div class="author-name" id="authorName">Ahmed Tani</div>
          <div class="author-role" id="authorRole">Academic Staff, Al-Mustaqeem Integrated Schools</div>
        </div>
      </div>
    </div>
    <div class="slider-controls">
      <button class="slider-btn" onclick="changeTestimonial(-1)">‹</button>
      <div class="slider-dots">
        <div class="dot active" onclick="goToTestimonial(0)"></div>
        <div class="dot" onclick="goToTestimonial(1)"></div>
        <div class="dot" onclick="goToTestimonial(2)"></div>
        <div class="dot" onclick="goToTestimonial(3)"></div>
      </div>
      <button class="slider-btn" onclick="changeTestimonial(1)">›</button>
    </div>
  </div>
</section>

<!-- ===== RGS10 – PARTNERS ===== -->
<section id="partners">
  <div class="section-title" style="margin-bottom:40px;">Our Valuable Partner Schools</div>
  <div class="partners-logo-grid">
   <div class="partner-logo"><img src="image/I-SCHOLARS.png"   alt="I-Scholars International Academy"></div>
        <div class="partner-logo"><img src="image/EPITOME.png"      alt="Epitome Model Islamic Schools"></div>
        <div class="partner-logo"><img src="image/EDULYN.png"       alt="Edulyn Schools"></div>
        <div class="partner-logo"><img src="image/CHRYSOLITE.png"   alt="Chrysolite Academy"></div>
        <div class="partner-logo"><img src="image/ALMUSTAQEEM.png" alt="Al-Mustaqeem Integrated Schools"></div>
        <div class="partner-logo"><img src="image/ACCE-Abuja.png"         alt="ACCE Abuja"></div>
        <div class="partner-logo"><img src="image/GREENFIELD.png"   width="80" height="75" alt="Greenfield Academy"></div>
        <div class="partner-logo"><img src="image/PINNACLE.png"     alt="Pinnacle College"></div>
        <div class="partner-logo"><img src="image/Stephelm.jpg" width="67" height="80" alt="Stephelm School"></div>
  </div>
</section>

<!-- ===== RGS11 – JOIN CTA ===== -->
<section id="join">
  <div class="join-inner">
    <div class="join-text">
      <h2>Join the Schools Getting Results Right</h2>
      <p>With tools designed to make every part of result generation faster and more accurate, and a support team always ready to help — we invite your school to get started for free today.</p>
      <button class="btn-solid" style="font-size:1rem;padding:14px 32px;">Get Started for Free</button>
    </div>
    <div class="join-visual">🎉</div>
  </div>
</section>

<!-- ===== RGS12 – FOOTER ===== -->
<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="footer-logo">
        <div class="footer-logo-rgs">
           <rect width="38" height="56" rx="9" color:#94A3B8;/>
          <img src="image/rgs.png" width="36" height="54" rx="9" alt="RGS">
        </div>
        <span>Result Generation System</span>
      </div>
      <p class="footer-tagline">RGS is a product of TunzSoft — built to power accurate, stress-free result processing for schools across Africa and beyond.</p>
      <div class="footer-address">
        <strong style="color:#94A3B8;">Nigeria:</strong><br>
        3, Egbedi Close, Off Ladoke Akintola Boulevard,<br>
        Garki, Abuja, Nigeria.<br><br>
        <strong style="color:#94A3B8;">UK:</strong><br>
        167-169 Great Portland Street, 5th Floor,<br>
        London, W1W 5PF<br><br>
         <span class="footer-mail-icon"><svg viewBox="0 0 24 24" width="13" height="13" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#111827" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 6-10 7L2 6"></path></svg></span> <a href="mailto:Tunzsoft@gmail.com">Tunzsoft@gmail.com</a>
      </div>
    </div>
    <div class="footer-col">
      <h4>Product</h4>
      <ul>
        <li><a href="#">About Us</a></li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="#">Contact Us</a></li>
        <li><a href="#">Refer &amp; Earn</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Resources</h4>
      <ul>
        <li><a href="#">Blog</a></li>
        <li><a href="#">Help Centre</a></li>
        <li><a href="#">Video Tutorials</a></li>
        <li><a href="#">System Status</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Legal</h4>
      <ul>
        <li><a href="#">Privacy Policy</a></li>
        <li><a href="#">Terms of Use</a></li>
        <li><a href="#">Data Processing</a></li>
        <li><a href="#">Cookie Policy</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2025 Result Generation System — TunzSoft. All rights reserved.</span>
    <div class="footer-social">
      <a href="#" class="social-icon social-facebook" aria-label="Facebook" title="Facebook">
        <svg viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>
      </a>
      <a href="#" class="social-icon social-instagram" aria-label="Instagram" title="Instagram">
        <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
      </a>
      <a href="#" class="social-icon social-x" aria-label="X (formerly Twitter)" title="X">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>
      </a>
      <a href="#" class="social-icon social-linkedin" aria-label="LinkedIn" title="LinkedIn">
        <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"/></svg>
      </a>
    </div>
  </div>
</footer>

<!-- Mail Float -->
<a class="mail-float" href="mailto:Tunzsoft@gmail.com" title="Email us" aria-label="Email us">
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
    <path d="m22 6-10 7L2 6"></path>
  </svg>
</a>

<!-- WhatsApp Float -->
<a class="whatsapp-float" href="https://wa.me/2349125174767" target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp" aria-label="Chat on WhatsApp">
  <svg viewBox="0 0 32 32" width="30" height="30" xmlns="http://www.w3.org/2000/svg" fill="#fff">
    <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.386.7 4.607 1.902 6.48L4 29l7.72-1.87A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3zm0 21.86c-1.99 0-3.85-.58-5.41-1.58l-.388-.24-4.58 1.11 1.22-4.46-.253-.4A9.83 9.83 0 0 1 5.14 15c0-5.99 4.874-10.86 10.864-10.86 5.99 0 10.86 4.87 10.86 10.86 0 5.99-4.87 10.86-10.86 10.86zm5.94-8.14c-.325-.163-1.924-.95-2.222-1.058-.298-.108-.515-.163-.732.163-.217.325-.84 1.058-1.03 1.276-.19.217-.38.244-.705.081-.325-.163-1.372-.505-2.613-1.61-.966-.861-1.618-1.925-1.808-2.25-.19-.325-.02-.5.143-.663.146-.146.325-.38.488-.57.163-.19.217-.325.325-.542.108-.217.054-.407-.027-.57-.081-.163-.732-1.765-1.003-2.418-.264-.635-.532-.55-.732-.56l-.624-.011c-.217 0-.57.081-.868.407-.298.325-1.137 1.112-1.137 2.71 0 1.6 1.164 3.146 1.327 3.363.163.217 2.29 3.5 5.55 4.907.775.334 1.38.534 1.852.683.778.247 1.486.212 2.046.129.624-.093 1.924-.786 2.196-1.546.271-.76.271-1.412.19-1.546-.08-.135-.298-.217-.623-.38z"/>
  </svg>
</a>

<!-- ===== SCRIPTS ===== -->
`;
const LANDING_SCRIPT = `
  // Testimonials
  const testimonials = [
    {
      text: "RGS is very easy to use. The support team ensures our problems are resolved quickly — either online or by visiting our school on request. Result compilation has never been this smooth.",
      name: "Ahmed Tani",
      role: "Academic Staff, Al-Mustaqeem Integrated Schools",
      initial: "AT"
    },
    {
      text: "Before RGS, compiling results for 800 students took us 3 weeks of stress. Now we do it in 2 days with zero errors. The broadsheet feature alone is worth it.",
      name: "Mrs. Ngozi Eze",
      role: "Vice Principal, Chrysolite Academy",
      initial: "NE"
    },
    {
      text: "Parents love that they can check their children's results online the same day they are published. RGS has transformed how we communicate with families.",
      name: "Mr. Yusuf Bello",
      role: "School Director, Pinnacle College",
      initial: "YB"
    },
    {
      text: "RGS has taken the guesswork out of result processing for us. What used to be a nerve-wracking, error-prone task is now fast, accurate, and stress-free — our teachers and parents couldn't be happier.",
      name: "Mrs. Adenike Otunla",
      role: "Proprietor, Stephelm Model School",
      initial: "AO"
    }
  ];
  let current = 0;

  function renderTestimonial() {
    const t = testimonials[current];
    document.getElementById('testimonialText').textContent = \`"\${t.text}"\`;
    document.getElementById('authorName').textContent = t.name;
    document.getElementById('authorRole').textContent = t.role;
    document.getElementById('authorInitial').textContent = t.initial;
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function changeTestimonial(dir) {
    current = (current + dir + testimonials.length) % testimonials.length;
    renderTestimonial();
  }

  function goToTestimonial(i) {
    current = i;
    renderTestimonial();
  }

  // Auto-advance
  setInterval(() => changeTestimonial(1), 5000);

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.card, .benefit-card, .stat-card, .feature-split, .testimonial-card, .section-title, .join-inner, .partner-logo').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = \`opacity .5s ease \${(i % 6) * 0.06}s, transform .5s ease \${(i % 6) * 0.06}s\`;
    observer.observe(el);
  });

  // ── Number count-up animation (Statistics section) ──────────
  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target)) return;
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString('en-US');
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString('en-US');
      }
    }
    requestAnimationFrame(step);
  }

  const countEls = document.querySelectorAll('.stat-number[data-target]');
  countEls.forEach(el => { el.textContent = '0'; });

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.counted) {
        e.target.dataset.counted = 'true';
        animateCount(e.target);
      }
    });
  }, { threshold: 0.4 });

  countEls.forEach(el => countObserver.observe(el));

  // ── Trust logo carousel ──────────────────────────────────
let trustCurrent = 0;
const trustSlides = document.querySelectorAll('.trust-slide');
const trustTotal  = trustSlides.length;

function goToSlide(index) {
  trustCurrent = (index + trustTotal) % trustTotal;
  document.getElementById('trustTrack').style.transform =
    \`translateX(-\${trustCurrent * 100}%)\`;
  document.querySelectorAll('.trust-dot').forEach((d, i) =>
    d.classList.toggle('active', i === trustCurrent));
}

// Auto-advance every 4 seconds
setInterval(() => goToSlide(trustCurrent + 1), 4000);
`;

export default function Home() {
  const router = useRouter();

  // If someone is already logged in, skip the marketing page and take them
  // straight to their dashboard, same as the app previously did on "/".
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!cancelled && user) {
          router.replace(`/${user.role}/dashboard`);
        }
      } catch {
        // Not logged in — stay on the landing page.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Re-run the landing page's own vanilla-JS (testimonial slider, trust
  // carousel, scroll-in animations) after the markup is mounted. It's
  // injected as a real <script> element because React ignores <script>
  // tags set via dangerouslySetInnerHTML.
  useEffect(() => {
    const script = document.createElement("script");
    script.text = LANDING_SCRIPT;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_STYLE }} />
      <div className="landing-root" dangerouslySetInnerHTML={{ __html: LANDING_BODY }} />
    </>
  );
}