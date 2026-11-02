import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';

const RESEND_SECONDS = 45;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    setCountdown(RESEND_SECONDS);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Vui lòng nhập email của bạn.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ.');
      return;
    }

    setIsLoading(true);
    // Simulate sending (API không hỗ trợ forgot password)
    await new Promise((res) => setTimeout(res, 1200));
    setIsLoading(false);
    setSubmitted(true);
    startCountdown();
  };

  const handleResend = () => {
    if (!canResend) return;
    startCountdown();
    // Simulate resend
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <AuthLayout>
      {/* Back link */}
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#2D5A45] transition-colors mb-8 -mt-2 group"
      >
        <svg
          className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại đăng nhập
      </Link>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          color: '#1A1A1A',
          fontSize: '48px',
          fontWeight: 600,
          lineHeight: 1.1,
          marginBottom: '10px',
        }}
      >
        Quên mật khẩu?
      </h1>
      <p className="text-[#6B6B6B] text-base mb-8 leading-relaxed">
        Không sao đâu. Nhập email của bạn, thì sẽ gửi hướng dẫn để bạn đặt lại mật khẩu.
      </p>

      {/* Error */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      {!submitted ? (
        /* === Form trước khi submit === */
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="block text-base font-medium text-[#1A1A1A] mb-2">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="an.nguyen@gmail.com"
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-xl border border-[#D9D4CC] bg-white text-[#1A1A1A] placeholder-[#B0A9A0] text-base
                         focus:outline-none focus:ring-2 focus:ring-[#2D5A45]/30 focus:border-[#2D5A45]
                         transition-all duration-200"
            />
          </div>

          <button
            id="forgot-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white text-sm
                       flex items-center justify-center gap-2 transition-all duration-200
                       disabled:opacity-60 disabled:cursor-not-allowed
                       hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            style={{
              background: isLoading
                ? '#5A8A6A'
                : 'linear-gradient(135deg, #3B6B53 0%, #2D5A45 100%)',
              boxShadow: '0 4px 20px rgba(45,90,69,0.35)',
            }}
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang gửi...
              </>
            ) : (
              'Gửi hướng dẫn'
            )}
          </button>
        </form>
      ) : (
        /* === Trạng thái sau khi submit === */
        <div className="space-y-5">
          {/* Success notice */}
          <div
            className="px-4 py-4 rounded-xl border flex items-start gap-3"
            style={{ backgroundColor: '#E8F2EC', borderColor: 'rgba(45,90,69,0.25)' }}
          >
            <div className="mt-0.5 shrink-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(45,90,69,0.15)' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#2D5A45">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2D5A45] mb-1">Hướng dẫn đã được gửi</p>
              <p className="text-xs text-[#2D5A45]/70 leading-relaxed">
                Kiểm tra hộp thư <span className="font-medium">{email}</span> và làm theo hướng dẫn.
                Liên kết có hiệu lực trong 15 phút.
              </p>
            </div>
          </div>

          {/* Open mailbox button */}
          <a
            id="open-mailbox"
            href={`mailto:`}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white text-sm
                       flex items-center justify-center gap-2 transition-all duration-200
                       hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            style={{
              background: 'linear-gradient(135deg, #3B6B53 0%, #2D5A45 100%)',
              boxShadow: '0 4px 20px rgba(45,90,69,0.35)',
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Mở hộp thư
          </a>

          {/* Resend */}
          <div className="text-center space-y-1.5">
            <p className="text-sm text-[#6B6B6B]">
              Chưa nhận được? Thử kiểm tra thư rác nhé.
            </p>
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-sm text-[#2D5A45] font-semibold hover:underline transition-all"
              >
                Gửi lại ngay
              </button>
            ) : (
              <p className="text-sm text-[#2D5A45] font-medium">
                Gửi lại sau{' '}
                <span className="font-bold tabular-nums">{formatTime(countdown)}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
