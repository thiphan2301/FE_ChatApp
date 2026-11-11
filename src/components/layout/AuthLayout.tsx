import { useState, useEffect, type ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

type ModalType = 'terms' | 'privacy' | 'lang' | null;

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedLang, setSelectedLang] = useState('vi');

  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<ModalType>;
      if (customEvent.detail) {
        setActiveModal(customEvent.detail);
      }
    };

    window.addEventListener('open-auth-modal', handleOpenModal);
    return () => window.removeEventListener('open-auth-modal', handleOpenModal);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        background: '#F0EBE0',
      }}
    >
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
            borderRadius: '0 20px 20px 0',
            padding: '40px 36px',
            background: 'linear-gradient(160deg, #3B6B53 0%, #2D5A45 50%, #1E3D2F 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="26" height="20" rx="8" fill="white" fillOpacity="0.18" />
                <rect x="2" y="2" width="26" height="20" rx="8" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
                <circle cx="10" cy="12" r="2" fill="white" fillOpacity="0.9" />
                <circle cx="15" cy="12" r="2" fill="white" fillOpacity="0.9" />
                <circle cx="20" cy="12" r="2" fill="white" fillOpacity="0.9" />
                <path d="M10 22 L7 29 L16 24" fill="white" fillOpacity="0.18" />
                <path d="M10 22 L7 29 L16 24" stroke="white" strokeOpacity="0.5" strokeWidth="1.2" strokeLinejoin="round" />
                <rect x="16" y="14" width="18" height="14" rx="6" fill="white" fillOpacity="0.1" />
                <rect x="16" y="14" width="18" height="14" rx="6" stroke="white" strokeOpacity="0.3" strokeWidth="1.2" />
                <circle cx="22" cy="21" r="1.5" fill="white" fillOpacity="0.6" />
                <circle cx="27" cy="21" r="1.5" fill="white" fillOpacity="0.6" />
              </svg>
              <span
                style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                ChatApp
              </span>
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

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '28px 0' }}>
            <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', aspectRatio: '4/3' }}>
              <img
                src="/room-bg.jpg"
                alt="Cozy room"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Chuyện trò, theo cách của bạn.
            </span>
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              title="Tìm hiểu thêm về ứng dụng"
              className="text-white/40 hover:text-white/90 transition-colors p-1"
            >
              ↗
            </button>
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.07) 0%, transparent 60%)',
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          minWidth: 0,
          background: '#F0EBE0',
        }}
      >
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

        <div style={{ padding: '16px 80px', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            style={{
              fontSize: '12px',
              color: 'rgba(45,90,69,0.5)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            className="hover:underline hover:text-[#2D5A45] transition-colors"
          >
            Quyền riêng tư
          </button>
          <span style={{ fontSize: '12px', color: '#ccc' }}>·</span>
          <button
            type="button"
            onClick={() => setActiveModal('terms')}
            style={{
              fontSize: '12px',
              color: 'rgba(45,90,69,0.5)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            className="hover:underline hover:text-[#2D5A45] transition-colors"
          >
            Điều khoản
          </button>
          <span style={{ fontSize: '12px', color: '#ccc' }}>·</span>
          <button
            type="button"
            onClick={() => setActiveModal('lang')}
            style={{
              fontSize: '12px',
              color: 'rgba(45,90,69,0.5)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            className="hover:underline hover:text-[#2D5A45] transition-colors"
          >
            {selectedLang === 'vi' ? 'Tiếng Việt ↓' : 'English ↓'}
          </button>
        </div>
      </div>

      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[#FBF9F5] border border-[#D9D4CC] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="px-6 py-4 border-b border-[#E5E0D8] flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                {activeModal === 'terms' && 'Điều khoản dịch vụ'}
                {activeModal === 'privacy' && 'Chính sách quyền riêng tư'}
                {activeModal === 'lang' && 'Lựa chọn ngôn ngữ'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F0EBE0] transition-colors"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto space-y-4 text-sm text-[#4A4A4A] leading-relaxed">
              {activeModal === 'terms' && (
                <>
                  <div>
                    <h4 className="font-semibold text-[#2D5A45] mb-1">1. Chấp thuận điều khoản</h4>
                    <p>Bằng việc đăng ký tài khoản và sử dụng ChatApp, bạn đồng ý tuân thủ đầy đủ các quy định và chuẩn mực giao tiếp trong ứng dụng.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2D5A45] mb-1">2. Bảo vệ tài khoản</h4>
                    <p>Bạn có trách nhiệm bảo mật mật khẩu cá nhân. Mọi hoạt động phát sinh từ tài khoản của bạn sẽ do bạn chịu trách nhiệm.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2D5A45] mb-1">3. Chuẩn mực ứng xử</h4>
                    <p>Nghiêm cấm gửi tin nhắn quấy rối, truyền bá văn hóa phẩm độc hại, mạo danh cá nhân hoặc tổ chức khác trong các cuộc trò chuyện.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2D5A45] mb-1">4. Giới hạn dịch vụ</h4>
                    <p>ChatApp là hệ thống tin nhắn học tập và trải nghiệm thực hành. Quản trị viên có quyền hạn chế các tài khoản có hành vi bất thường.</p>
                  </div>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <div>
                    <h4 className="font-semibold text-[#2D5A45] mb-1">1. Dữ liệu thu thập</h4>
                    <p>Hệ thống chỉ lưu trữ tên đăng nhập (username) và nội dung các cuộc hội thoại nhằm phục vụ tính năng truyền gửi tin nhắn trực tuyến.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2D5A45] mb-1">2. Mã hóa kết nối</h4>
                    <p>Toàn bộ gói tin và giao tiếp đều được truyền qua kênh bảo mật WebSocket (WSS), ngăn chặn các hành vi đọc trộm dữ liệu đường truyền.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2D5A45] mb-1">3. Phiên đăng nhập cục bộ</h4>
                    <p>Mã phiên Re-login được lưu an toàn trong trình duyệt (LocalStorage) của bạn và có thể xóa bất cứ lúc nào khi đăng xuất.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2D5A45] mb-1">4. Cam kết bảo mật</h4>
                    <p>Chúng tôi tuyệt đối không cung cấp hay chia sẻ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào.</p>
                  </div>
                </>
              )}

              {activeModal === 'lang' && (
                <div className="space-y-3 py-2">
                  <label
                    onClick={() => setSelectedLang('vi')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedLang === 'vi'
                        ? 'border-[#2D5A45] bg-[#E8F2EC] text-[#2D5A45] font-semibold'
                        : 'border-[#D9D4CC] bg-white text-[#1A1A1A] hover:bg-[#F0EBE0]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-lg">🇻🇳</span> Tiếng Việt (Mặc định)
                    </span>
                    {selectedLang === 'vi' && <span className="text-base font-bold">✓</span>}
                  </label>

                  <label
                    onClick={() => setSelectedLang('en')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedLang === 'en'
                        ? 'border-[#2D5A45] bg-[#E8F2EC] text-[#2D5A45] font-semibold'
                        : 'border-[#D9D4CC] bg-white text-[#1A1A1A] hover:bg-[#F0EBE0]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-lg">🇺🇸</span> English (Sắp ra mắt)
                    </span>
                    {selectedLang === 'en' && <span className="text-base font-bold">✓</span>}
                  </label>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E5E0D8] flex justify-end bg-white">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-white text-sm transition-all hover:shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #3B6B53 0%, #2D5A45 100%)',
                }}
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
