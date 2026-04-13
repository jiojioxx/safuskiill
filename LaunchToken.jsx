import React, { useState, useRef } from "react";

const styles = {
  root: {
    margin: 0,
    padding: 0,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "#e0e0e0",
  },

  /* ─── NAV ─── */
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    height: 64,
    background: "#111111",
    borderBottom: "1px solid #222",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    fontSize: 18,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: "#fff",
    fontWeight: 800,
  },
  navLinks: {
    display: "flex",
    gap: 4,
  },
  navLink: {
    padding: "6px 16px",
    borderRadius: 8,
    fontSize: 14,
    color: "#9ca3af",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    fontFamily: "inherit",
    transition: "color .2s, background .2s",
  },
  navLinkActive: {
    color: "#d4a017",
    background: "rgba(212,160,23,.12)",
    fontWeight: 600,
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  langBtn: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: 13,
    color: "#ccc",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  bellBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    color: "#9ca3af",
    padding: 4,
    lineHeight: 1,
  },
  walletBadge: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 20,
    padding: "5px 14px",
    fontSize: 13,
    color: "#d4a017",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 500,
  },
  walletDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22c55e",
  },

  /* ─── PAGE ─── */
  page: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "48px 24px 80px",
  },
  backRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    cursor: "pointer",
    width: "fit-content",
  },
  backArrow: {
    fontSize: 20,
    color: "#9ca3af",
    lineHeight: 1,
  },
  backText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 36,
  },

  /* ─── STEPS ─── */
  stepsRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 36,
    gap: 0,
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  stepCircle: (active) => ({
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    border: active ? "2px solid #d4a017" : "2px solid #333",
    background: active ? "rgba(212,160,23,.15)" : "transparent",
    color: active ? "#d4a017" : "#555",
    zIndex: 1,
  }),
  stepLabel: (active) => ({
    marginTop: 8,
    fontSize: 12,
    color: active ? "#d4a017" : "#555",
    fontWeight: active ? 600 : 400,
    textAlign: "center",
    whiteSpace: "nowrap",
  }),
  stepLine: {
    flex: 1,
    height: 2,
    background: "#222",
    position: "relative",
    top: -10,
    margin: "0 -2px",
  },

  /* ─── CARD ─── */
  card: {
    background: "#1a1a1a",
    borderRadius: 16,
    border: "1px solid #2a2a2a",
    padding: 32,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: "#fff",
    marginBottom: 28,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  cardTitleIcon: {
    fontSize: 16,
  },

  /* ─── FORM ─── */
  formGroup: {
    marginBottom: 24,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#d1d5db",
    marginBottom: 8,
  },
  required: {
    color: "#d4a017",
    marginLeft: 2,
  },
  input: {
    width: "100%",
    background: "#111",
    border: "1px solid #2e2e2e",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 14,
    color: "#e0e0e0",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color .2s",
  },
  textarea: {
    width: "100%",
    background: "#111",
    border: "1px solid #2e2e2e",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 14,
    color: "#e0e0e0",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 160,
    transition: "border-color .2s",
  },

  /* ─── LOGO UPLOAD ─── */
  logoUploadRow: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  logoPreview: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#111",
    border: "2px dashed #333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    color: "#555",
    flexShrink: 0,
    overflow: "hidden",
  },
  logoPreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
  },
  uploadMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  chooseFileBtn: {
    background: "linear-gradient(135deg,#d4a017,#c9961a)",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    fontSize: 13,
    fontWeight: 600,
    color: "#000",
    cursor: "pointer",
    fontFamily: "inherit",
    width: "fit-content",
    transition: "opacity .2s",
  },
  noFileText: {
    fontSize: 12,
    color: "#555",
  },

  /* ─── NEXT BUTTON ─── */
  nextBtn: {
    marginTop: 36,
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg,#d4a017,#c9961a)",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    color: "#000",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: 0.3,
    transition: "opacity .2s, transform .1s",
  },

  /* ─── FOOTER ─── */
  footer: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 12,
    color: "#444",
  },
  footerDot: {
    margin: "0 6px",
  },
};

const STEPS = ["代币信息", "选择技能", "审核 & 部署"];

export default function LaunchToken() {
  const [activeNav, setActiveNav] = useState("发射台");
  const [logoPreview, setLogoPreview] = useState(null);
  const [fileName, setFileName] = useState("未选择任何文件");
  const fileRef = useRef();

  const [focusedField, setFocusedField] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const focusStyle = (field) =>
    focusedField === field ? { borderColor: "#d4a017" } : {};

  return (
    <div style={styles.root}>
      {/* ── NAV ── */}
      <nav style={styles.nav}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>S</div>
          SafuSkill
        </div>

        {/* Nav Links */}
        <div style={styles.navLinks}>
          {["技能市场", "发射台", "文档", "开发者"].map((item) => (
            <button
              key={item}
              style={
                activeNav === item
                  ? { ...styles.navLink, ...styles.navLinkActive }
                  : styles.navLink
              }
              onClick={() => setActiveNav(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right */}
        <div style={styles.navRight}>
          <button style={styles.langBtn}>中文 ▾</button>
          <button style={styles.bellBtn}>🔔</button>
          <div style={styles.walletBadge}>
            <div style={styles.walletDot} />
            0x168a...c6e6
          </div>
        </div>
      </nav>

      {/* ── PAGE ── */}
      <div style={styles.page}>
        {/* Back */}
        <div style={styles.backRow}>
          <span style={styles.backArrow}>←</span>
          <span style={styles.backText}>返回</span>
        </div>

        {/* Title */}
        <div style={styles.pageTitle}>发射代币</div>
        <div style={styles.pageSubtitle}>
          通过 Flap 协议为您的 AI 技能创建 BEP-20 代币
        </div>

        {/* Steps */}
        <div style={styles.stepsRow}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div style={styles.stepItem}>
                <div style={styles.stepCircle(i === 0)}>{i + 1}</div>
                <div style={styles.stepLabel(i === 0)}>{step}</div>
              </div>
              {i < STEPS.length - 1 && <div style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span style={styles.cardTitleIcon}>📋</span> 代币信息
          </div>

          {/* Token Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              代币名称<span style={styles.required}>*</span>
            </label>
            <input
              style={{ ...styles.input, ...focusStyle("name") }}
              placeholder="例如 Code Review Agent Token"
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          {/* Token Symbol */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              代币符号<span style={styles.required}>*</span>
            </label>
            <input
              style={{ ...styles.input, ...focusStyle("symbol") }}
              placeholder="例如 CRVW"
              onFocus={() => setFocusedField("symbol")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>描述</label>
            <textarea
              style={{ ...styles.textarea, ...focusStyle("desc") }}
              placeholder="描述您的代币及其用途..."
              onFocus={() => setFocusedField("desc")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          {/* Logo Upload */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              代币标志<span style={styles.required}>*</span>
            </label>
            <div style={styles.logoUploadRow}>
              {/* Circle preview */}
              <div style={styles.logoPreview}>
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" style={styles.logoPreviewImg} />
                ) : (
                  "🪙"
                )}
              </div>

              {/* Upload controls */}
              <div style={styles.uploadMeta}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <button
                  style={styles.chooseFileBtn}
                  onClick={() => fileRef.current.click()}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  选择文件
                </button>
                <span style={styles.noFileText}>{fileName}</span>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            style={styles.nextBtn}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.99)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            下一步：选择技能 →
          </button>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          技术支持
          <span style={styles.footerDot}>·</span>
          Flap Protocol
          <span style={styles.footerDot}>|</span>
          BNB Chain
        </div>
      </div>
    </div>
  );
}
