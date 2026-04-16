import React, { useState } from "react";

/* ─── Icons ─── */
const ShieldCheckIcon = ({ size = 15, color = "#4ade80" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M8 1.5L2.5 4v3.8C2.5 11.1 4.9 13.8 8 14.5c3.1-.7 5.5-3.4 5.5-6.7V4L8 1.5z"
      stroke={color} strokeWidth="1.35" strokeLinejoin="round"
    />
    <path
      d="M5.5 8.2l1.6 1.6L10.8 6"
      stroke={color} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = ({ size = 18, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M9 3.5v11M3.5 9h11" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const WalletIcon = ({ size = 15, color = "#f59e0b" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="4.5" width="13" height="9" rx="1.5" stroke={color} strokeWidth="1.3"/>
    <path d="M1.5 7.5h13" stroke={color} strokeWidth="1.3"/>
    <circle cx="11.5" cy="10" r="1" fill={color}/>
    <path d="M4.5 2.5h7" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const ExternalLinkIcon = ({ size = 12, color = "#555" }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path
      d="M5 2H2a1.5 1.5 0 00-1.5 1.5v7A1.5 1.5 0 002 12h7a1.5 1.5 0 001.5-1.5V7.5"
      stroke={color} strokeWidth="1.2" strokeLinecap="round"
    />
    <path d="M7 1h4v4" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 1L5.5 6.5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

/* ─── Row Component ─── */
function DataRow({ label, value, hasBorder }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "9px 0",
      borderBottom: hasBorder ? "1px solid #242424" : "none",
    }}>
      <span style={{ fontSize: 13, color: "#777" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/* ─── Main Card ─── */
export default function VerifiedAuthorCard({
  walletAddress = "0x168af1...bbc6e6",
  taxRate       = "1%",
  devFundShare  = "100%",
  onEditWallet  = () => {},
  onOpenWallet  = () => {},
}) {
  const [walletHovered, setWalletHovered] = useState(false);

  return (
    <div style={{
      background:    "#1a1a1a",
      borderRadius:  12,
      border:        "1px solid #242424",
      padding:       20,
      width:         320,
      boxSizing:     "border-box",
      fontFamily:    "'Inter','Segoe UI',sans-serif",
      color:         "#e0e0e0",
    }}>

      {/* ── 验证状态 ── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
        <ShieldCheckIcon size={15} color="#4ade80"/>
        <span style={{ fontSize:14, fontWeight:600, color:"#fff", letterSpacing:.1 }}>
          已验证作者
        </span>
        {/* green dot */}
        <div style={{
          marginLeft:"auto",
          width:7, height:7, borderRadius:"50%",
          background:"#4ade80",
          boxShadow:"0 0 6px rgba(74,222,128,.5)",
        }}/>
      </div>

      {/* ── 头像 ── */}
      <div style={{ marginBottom:18 }}>
        <div style={{
          width:44, height:44, borderRadius:"50%",
          background:"linear-gradient(135deg,#22c55e,#16a34a)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 0 0 3px rgba(34,197,94,.15)",
        }}>
          <PlusIcon size={18} color="#fff"/>
        </div>
      </div>

      {/* ── 每笔交易收益 ── */}
      <div style={{ fontSize:12, color:"#555", marginBottom:4, letterSpacing:.05 }}>
        每笔交易收益
      </div>
      <DataRow label="税率"           value={taxRate}      hasBorder={true}/>
      <DataRow label="开发者基金份额" value={devFundShare}  hasBorder={false}/>

      {/* ── Divider ── */}
      <div style={{ height:1, background:"#222", margin:"14px 0" }}/>

      {/* ── 受益人钱包 ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:9 }}>
        <span style={{ fontSize:12, color:"#555" }}>受益人钱包</span>
        <span
          onClick={onEditWallet}
          style={{
            fontSize:12, color:"#d4a017", fontWeight:600,
            cursor:"pointer", letterSpacing:.1,
          }}
          onMouseOver={e => e.currentTarget.style.opacity = ".75"}
          onMouseOut={e  => e.currentTarget.style.opacity = "1"}
        >
          修改
        </span>
      </div>

      {/* Wallet address row */}
      <div
        onMouseEnter={() => setWalletHovered(true)}
        onMouseLeave={() => setWalletHovered(false)}
        style={{
          display:"flex", alignItems:"center", gap:9,
          background: walletHovered ? "#1e1e1e" : "#111",
          border:`1px solid ${walletHovered ? "#2e2e2e" : "#1c1c1c"}`,
          borderRadius:8,
          padding:"9px 12px",
          transition:"background .15s, border-color .15s",
        }}
      >
        <WalletIcon size={15} color="#f59e0b"/>
        <span style={{
          flex:1,
          fontSize:13, color:"#ddd",
          fontFamily:"'SF Mono','Fira Code','Consolas',monospace",
          letterSpacing:.3,
        }}>
          {walletAddress}
        </span>
        <div
          onClick={onOpenWallet}
          style={{
            cursor:"pointer",
            opacity: walletHovered ? 1 : 0.45,
            transition:"opacity .15s",
            display:"flex", alignItems:"center",
          }}
        >
          <ExternalLinkIcon size={12} color={walletHovered ? "#d4a017" : "#555"}/>
        </div>
      </div>

    </div>
  );
}
