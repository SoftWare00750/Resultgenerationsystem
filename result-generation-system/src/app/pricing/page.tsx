"use client";

// Pricing page markup and styles follow the same pattern as the marketing
// landing page (src/app/page.tsx): the original static design is ported
// as plain HTML/CSS strings and mounted via dangerouslySetInnerHTML so the
// visual language (nav, footer, WhatsApp float, palette, spacing) stays in
// sync with the rest of the site.
//
// NOTE: The "Not sure which plan is right for you?" section currently
// renders a dashed-border placeholder box in place of the photo shown in
// the design. Swap it for a real <img src="image/your-photo.jpg" .../> once
// the final image asset is available (see the PLACEHOLDER comment below).

const PRICING_STYLE = `
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
    transition: box-shadow .2s;
  }
  .stat-card:hover { box-shadow: 0 6px 24px rgba(26,86,219,.12); }
  .stat-icon { font-size: 2rem; margin-bottom: 14px; }
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


  /* ===== PRICING PAGE — ADDITIONAL STYLES ===== */

  /* Active nav link (Pricing) */
  .nav-links a.active-link {
    color: var(--blue);
    border-bottom: 2px solid var(--blue);
    padding-bottom: 4px;
  }

  /* ---- Trusted-by strip ---- */
  #pricing-trust { background: var(--bg-soft); text-align: center; }
  #pricing-trust .section-title { margin-bottom: 40px; }
  .pricing-trust-carousel { overflow: hidden; width: 100%; max-width: 1100px; margin: 0 auto; -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
  .pricing-trust-track {
    display: flex; align-items: center; gap: 56px;
    width: max-content;
    animation: pricingTrustScroll 22s linear infinite;
  }
  .pricing-trust-track img { height: 44px; width: auto; object-fit: contain; flex-shrink: 0; }
  @keyframes pricingTrustScroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .pricing-trust-track { animation: none; }
  }

  /* ---- Plan cards ---- */
  #pricing-plans { background: #fff; }
  .pricing-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
    max-width: 1160px; margin: 0 auto; align-items: stretch;
  }
  .pricing-card {
    background: var(--card-bg); border: 1.5px solid var(--border);
    border-radius: 16px; padding: 32px 28px; display: flex; flex-direction: column;
    transition: box-shadow .2s, transform .2s;
  }
  .pricing-card:hover { box-shadow: 0 12px 28px rgba(12,12,12,.08); transform: translateY(-4px); }
  .pricing-card.featured { border-color: var(--blue); position: relative; }
  .pricing-card-name { font-size: 1.3rem; font-weight: 900; color: var(--text-main); margin-bottom: 10px; }
  .pricing-card-desc { font-size: .93rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 22px; min-height: 72px; }
  .pricing-card-label { font-size: .95rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px; }
  .pricing-card-price { font-size: 2rem; font-weight: 900; color: var(--text-main); }
  .pricing-card-unit { font-size: .88rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px; }
  .pricing-card-note { font-size: .82rem; color: var(--text-muted); margin-bottom: 22px; }
  .pricing-card-cta {
    display: inline-block; text-align: center; background: var(--blue); color: #fff;
    font-weight: 700; font-size: .95rem; padding: 13px 0; border-radius: 999px;
    border: none; cursor: pointer; margin-bottom: 22px; transition: background .2s;
  }
  .pricing-card-cta:hover { background: var(--blue-dark); }
  .pricing-card-divider { border: none; border-top: 1px solid var(--border); margin-bottom: 20px; }
  .pricing-feature-list { list-style: none; display: flex; flex-direction: column; gap: 16px; }
  .pricing-feature-list li { display: flex; align-items: center; gap: 12px; font-size: .93rem; color: var(--text-main); }
  .pricing-feature-list .tick {
    flex-shrink: 0; width: 18px; height: 18px; color: var(--blue);
  }
  .pricing-feature-list .tick svg { width: 100%; height: 100%; }
  .pricing-feature-list li.placeholder-row {
    height: 18px;
  }
  .pricing-feature-list li.placeholder-row .tick-empty {
    flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%;
    border: 1.5px dashed var(--border);
  }

  /* ---- Comparison table ---- */
  #pricing-comparison { background: var(--bg-soft); overflow-x: auto; }
  .comparison-wrap { max-width: 1160px; margin: 0 auto; overflow-x: auto; }
  .comparison-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px; overflow: hidden; min-width: 720px; }
  .comparison-table th {
    text-align: left; font-size: 1.05rem; font-weight: 800; color: var(--text-main);
    padding: 20px 20px; border-bottom: 1px solid var(--border);
  }
  .comparison-table th:not(:first-child) { text-align: center; }
  .comparison-table td {
    font-size: .93rem; color: var(--text-main); padding: 16px 20px;
    border-bottom: 1px solid #EEF2F7; text-align: center;
  }
  .comparison-table td:first-child { text-align: left; color: var(--text-muted); }
  .comparison-table tr:last-child td { border-bottom: none; }
  .status-check, .status-x {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 50%;
  }
  .status-check { background: var(--blue); }
  .status-check svg { width: 13px; height: 13px; color: #fff; }
  .status-x { background: #9CA3AF; }
  .status-x svg { width: 11px; height: 11px; color: #fff; }

  /* ---- "Not sure which plan" CTA ---- */
  #pricing-help { background: #fff; }
  .pricing-help-inner {
    max-width: 1100px; margin: 0 auto; display: flex; align-items: center;
    justify-content: space-between; gap: 40px; flex-wrap: wrap;
  }
  .pricing-help-text { flex: 1 1 320px; }
  .pricing-help-text h2 { font-size: 1.9rem; font-weight: 900; color: var(--text-main); margin-bottom: 14px; }
  .pricing-help-text p { font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 28px; }
  .pricing-help-visual { position: relative; width: 320px; height: 320px; flex: 0 0 auto; }
  .pricing-help-photo {
    width: 300px; height: 300px; border-radius: 50%; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-soft); border: 2px dashed var(--border);
    position: absolute; left: 10px; top: 10px; color: var(--text-muted);
    font-size: .85rem; text-align: center;
  }
  .pricing-help-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
  .pricing-help-dot { position: absolute; border-radius: 50%; }
  .pricing-help-dot.d1 { width: 200px; height: 200px; background: var(--blue); top: 0; right: 0; z-index: -1; opacity: .95; }
  .pricing-help-dot.d2 { width: 24px; height: 24px; background: #22D3EE; top: 10px; left: 90px; }
  .pricing-help-dot.d3 { width: 22px; height: 22px; background: var(--blue); left: 0; top: 110px; }
  .pricing-help-dot.d4 { width: 20px; height: 20px; background: #FB923C; right: 10px; bottom: 40px; }

  @media (max-width: 900px) {
    .pricing-grid { grid-template-columns: 1fr; }
    .pricing-trust-logos { gap: 28px; }
    .pricing-help-inner { flex-direction: column; }
    .pricing-help-visual { margin: 0 auto; }
  }
`;

const PRICING_BODY = `

<!-- ===== NAV ===== -->
<nav>
  <div class="nav-logo">
    <svg viewBox="0 0 60 80" fill="none" width="51" height="260">

  <image href="image/rgs.png" width="65" height="91"  />
</svg>
      RGS
  </div>
  <div class="nav-links">
    <a href="/#benefits">Benefits</a>
    <div class="nav-item">
      <a href="/#features" class="has-arrow">Features</a>
      <div class="dropdown-menu">
        <a href="/#features">For Schools</a>
        <a href="/#features">For Teachers</a>
        <a href="/#features">For Parents</a>
        <a href="/#features">For Students</a>
      </div>
    </div>
    <a href="/pricing" class="active-link">Pricing</a>
    <div class="nav-item">
      <a href="/#resources" class="has-arrow">Resources</a>
      <div class="dropdown-menu">
        <a href="/#resources">Quickstart Tutorial</a>
        <a href="/#resources">Help Center</a>
        <a href="/#resources">Webinars</a>
        <a href="/#resources">Case Studies</a>
        <a href="/#resources">Blog</a>
      </div>
    </div>
    <a href="/#refer">Refer &amp; Earn</a>
    <a href="/#partners">Partner Schools</a>
  </div>
  <div class="nav-cta">
     <a href="/auth/login" class="btn-outline">Login</a>
    <a href="/auth/register" class="btn-solid">Get Started for Free</a>
  </div>
</nav>

<!-- ===== PRICING 1 – TRUSTED BY / PLAN CARDS ===== -->
<section id="pricing-trust" class="fade-up">
  <div class="section-title">Trusted by over 700 schools</div>
  <div class="pricing-trust-carousel">
    <div class="pricing-trust-track">
      <img src="image/I-SCHOLARS.png" alt="I-Scholars International Academy">
      <img src="image/EPITOME.png" alt="Epitome Model Islamic Schools">
      <img src="image/EDULYN.png" alt="Edulyn Schools">
      <img src="image/CHRYSOLITE.png" alt="Chrysolite Academy">
      <img src="image/ALMUSTAQEEM.png" alt="Al-Mustaqeem Integrated Schools">
      <img src="image/ACCE-Abuja.png" alt="ACCE Abuja">
      <img src="image/I-SCHOLARS.png" alt="I-Scholars International Academy">
      <img src="image/EPITOME.png" alt="Epitome Model Islamic Schools">
      <img src="image/Stephelm.jpg" alt="Stephelm School">
      <img src="image/EDULYN.png" alt="Edulyn Schools">
      <img src="image/CHRYSOLITE.png" alt="Chrysolite Academy">
      <img src="image/ALMUSTAQEEM.png" alt="Al-Mustaqeem Integrated Schools">
      <img src="image/ACCE-Abuja.png" alt="ACCE Abuja">
    </div>
  </div>
</section>

<section id="pricing-plans">
  <div class="pricing-grid">

    <!-- School Starter -->
    <div class="pricing-card">
      <div class="pricing-card-name">School starter</div>
      <div class="pricing-card-desc">For new and small schools that need to simplify fees management and efficiently track student progress.</div>
      <div class="pricing-card-label">Starting from</div>
      <div class="pricing-card-price">&#8358; 1,000</div>
      <div class="pricing-card-unit">per student per term</div>
      <div class="pricing-card-note">Price is free for up to 50 students</div>
      <a href="/auth/register" class="pricing-card-cta">Get started for free</a>
      <hr class="pricing-card-divider">
      <ul class="pricing-feature-list">
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Unlimited students</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>School fees management</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Student progress report</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Dashboard</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Attendance management</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Communication</li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
      </ul>
    </div>

    <!-- School Standard -->
    <div class="pricing-card featured">
      <div class="pricing-card-name">School standard</div>
      <div class="pricing-card-desc">For Growing Schools: Simplify Fee Management, Track Student Progress, and Communicate Efficiently with Parents.</div>
      <div class="pricing-card-label">Starting from</div>
      <div class="pricing-card-price">&#8358;2,000</div>
      <div class="pricing-card-unit">per student per term</div>
      <div class="pricing-card-note">Price reduces as the number of students increase</div>
      <a href="/auth/register" class="pricing-card-cta">Start free trial</a>
      <hr class="pricing-card-divider">
      <ul class="pricing-feature-list">
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Unlimited students</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>School fees management</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Student progress report</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Dashboard</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Attendance management</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Communication</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>CBT (Quizzes, Assignment, Exams)</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Lesson plan</li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
        <li class="placeholder-row"><span class="tick-empty"></span></li>
      </ul>
    </div>

    <!-- School Premium -->
    <div class="pricing-card">
      <div class="pricing-card-name">School premium</div>
      <div class="pricing-card-desc">Perfect for schools who want to collect and manage Fees, conduct CBT Assessments, create and track Lesson plans.</div>
      <div class="pricing-card-label">Starting from</div>
      <div class="pricing-card-price">&#8358;3,000</div>
      <div class="pricing-card-unit">per student per term</div>
      <div class="pricing-card-note">Price reduces as the number of students increase</div>
      <a href="/auth/register" class="pricing-card-cta">Start free trial</a>
      <hr class="pricing-card-divider">
      <ul class="pricing-feature-list">
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Unlimited students</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>School fees management</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Student progress report</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Dashboard</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Attendance management</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Communication</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>CBT (Quizzes, Assignment, Exams)</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Lesson plan</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Expenses tracking</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Staff Payroll Management</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Stores and Inventory Management</li>
        <li><span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>AI</li>
      </ul>
    </div>

  </div>
</section>

<!-- ===== PRICING 2 – FULL PLAN COMPARISON TABLE ===== -->
<section id="pricing-comparison">
  <div class="comparison-wrap">
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Plan Comparison</th>
          <th>School starter</th>
          <th>School standard</th>
          <th>School premium</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Students Enrolment</td>
          <td>Up to 50 students</td>
          <td>Unlimited students</td>
          <td>Unlimited students</td>
        </tr>
        <tr>
          <td>Teachers Enrolment</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Fees Invoice Configuration</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Parent Invoice Notification</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>School Fees payment</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Behaviour Assessment</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Student Progress Reports</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Students' Performance Analysis</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>School Fees Payment Analysis</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Configuration Reminders</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Subject Attendance</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Class Attendance</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Attendance Report &amp; Analysis</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Event Reminders</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Instant messaging</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Scheduled Messaging</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Communication Book</td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Quizzes &amp; Assignments</td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Questions Bank</td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Lesson Planning</td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Lesson Assisted Delivery</td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Lessons Tracking</td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Expenses Tracking</td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Staff Payroll Management</td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
        <tr>
          <td>Stores &amp; Inventory Management</td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></td>
          <td><span class="status-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<!-- ===== PRICING 3 – NOT SURE WHICH PLAN / SCHEDULE MEETING CTA ===== -->
<section id="pricing-help">
  <div class="pricing-help-inner">
    <div class="pricing-help-text">
      <h2>Not sure which plan is right for you?</h2>
      <p>Schedule a meeting with us</p>
      <a href="https://wa.me/2349125174767" class="btn-solid" style="font-size:1rem;padding:14px 32px;display:inline-block;">Schedule a meeting now</a>
    </div>
    <div class="pricing-help-visual">
      <div class="pricing-help-dot d1"></div>
      <div class="pricing-help-dot d2"></div>
      <div class="pricing-help-dot d3"></div>
      <div class="pricing-help-dot d4"></div>
      <div class="pricing-help-photo">
        <img src="image/image2.png" alt="Talk to our team">
      </div>
    </div>
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
        <li><a href="/#why">About Us</a></li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="/#join">Contact Us</a></li>
        <li><a href="/#refer">Refer &amp; Earn</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Resources</h4>
      <ul>
        <li><a href="/#resources">Blog</a></li>
        <li><a href="/#resources">Help Centre</a></li>
        <li><a href="/#resources">Video Tutorials</a></li>
        <li><a href="/#resources">System Status</a></li>
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
`;

export default function Pricing() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRICING_STYLE }} />
      <div className="landing-root" dangerouslySetInnerHTML={{ __html: PRICING_BODY }} />
    </>
  );
}