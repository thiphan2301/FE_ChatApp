import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        background: '#F0EBE0',   /* nền kem bao toàn bộ, giống Figma */
      }}
    >
      {/* ===== CỘT TRÁI: Card xanh — 40% ===== */}
      <div
        style={{
          width: '40%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '0 20px 20px 0',  /* chỉ bo góc bên phải */
            padding: '40px 36px',
            background: 'linear-gradient(160deg, #3B6B53 0%, #2D5A45 50%, #1E3D2F 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Logo + Tagline */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '18px', fontStyle: 'italic', marginBottom: '24px' }}>
              Logo
            </div>
            <h2
              style={{
                color: '#fff',
                fontFamily: "'Playfair Display', serif",
                fontSize: '36px',
                lineHeight: 1.25,
                fontWeight: 500,
                margin: '0 0 14px 0',
              }}
            >
              Một lời chào,<br />cả một câu chuyện.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px', lineHeight: 1.65, margin: 0 }}>
              Một khoảng riêng để kết nối, sẻ chia và ở gần những người bạn quý.
            </p>
          </div>

          {/* Ảnh phòng */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '28px 0' }}>
            <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', aspectRatio: '4/3' }}>
              <img
                src="/room-bg.jpg"
                alt="Cozy room"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Footer slogan */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Chuyện trò, theo cách của bạn.
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>↗</span>
          </div>

          {/* Decorative glow */}
          <div
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.07) 0%, transparent 60%)',
            }}
          />
        </div>
      </div>

      {/* ===== CỘT PHẢI: nền kem, Form ===== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          minWidth: 0,
          background: '#F0EBE0',  /* nền kem riêng cho cột phải */
        }}
      >
        {/* Form area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '50px 60px',
          }}
        >
          <div style={{ width: '100%', maxWidth: '500px' }}>
            {children}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 80px', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
          <Link to="#" style={{ fontSize: '12px', color: 'rgba(45,90,69,0.4)', textDecoration: 'none' }}>Quyền riêng tư</Link>
          <span style={{ fontSize: '12px', color: '#ccc' }}>·</span>
          <Link to="#" style={{ fontSize: '12px', color: 'rgba(45,90,69,0.4)', textDecoration: 'none' }}>Điều khoản</Link>
          <span style={{ fontSize: '12px', color: '#ccc' }}>·</span>
          <span style={{ fontSize: '12px', color: 'rgba(45,90,69,0.4)', cursor: 'pointer' }}>Tiếng Việt ↓</span>
        </div>
      </div>
    </div>
  );
}
