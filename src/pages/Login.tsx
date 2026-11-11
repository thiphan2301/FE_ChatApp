import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import { wsService } from '../services/websocketService';


export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const handlerRef = useRef<((data: unknown) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        wsService.off('LOGIN', handlerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    setIsLoading(true);

    try {
      await wsService.connect();

      const handler = (data: unknown) => {
        const msg = data as { status: string; data?: { RE_LOGIN_CODE: string }; mes?: string };
        setIsLoading(false);
        wsService.off('LOGIN', handler);

        if (msg.status === 'success' && msg.data?.RE_LOGIN_CODE) {
          localStorage.setItem('username', username);
          localStorage.setItem('re_login_code', msg.data.RE_LOGIN_CODE);
          if (rememberMe) {
            localStorage.setItem('remember_me', 'true');
          }
          navigate('/chat');
        } else {
          setError(msg.mes ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
        }
      };

      handlerRef.current = handler;
      wsService.on('LOGIN', handler);
      wsService.sendAction('LOGIN', { user: username, pass: password });
    } catch {
      setIsLoading(false);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    }
  };

  return (
    <AuthLayout>
      {/* Page label */}
      <p className="text-[#2D5A45]/50 text-sm font-semibold tracking-widest uppercase mb-6 -mt-2">
        Chào bạn trở lại
      </p>

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
        Chuyện mình còn dài.
      </h1>
      <p className="text-[#6B6B6B] text-base mb-8 leading-relaxed">
        Đăng nhập để tiếp tục những cuộc trò chuyện...
      </p>

      {/* Error */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username */}
        <div>
          <label htmlFor="login-username" className="block text-base font-medium text-[#1A1A1A] mb-2">
            Tên đăng nhập
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ten_nguoi_dung"
            autoComplete="username"
            className="w-full px-4 py-3.5 rounded-xl border border-[#D9D4CC] bg-white text-[#1A1A1A] placeholder-[#B0A9A0] text-base
                       focus:outline-none focus:ring-2 focus:ring-[#2D5A45]/30 focus:border-[#2D5A45]
                       transition-all duration-200"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="block text-base font-medium text-[#1A1A1A] mb-2">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-[#D9D4CC] bg-white text-[#1A1A1A] placeholder-[#B0A9A0] text-base
                         focus:outline-none focus:ring-2 focus:ring-[#2D5A45]/30 focus:border-[#2D5A45]
                         transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9690] hover:text-[#2D5A45] transition-colors p-1"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-200
                  ${rememberMe
                    ? 'bg-[#2D5A45] border-[#2D5A45]'
                    : 'bg-white border-[#D9D4CC] group-hover:border-[#2D5A45]'
                  }`}
                onClick={() => setRememberMe(!rememberMe)}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-[#6B6B6B] select-none">Ghi nhớ đăng nhập</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm text-[#2D5A45] font-medium hover:underline transition-all"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          id="login-submit"
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
              Đang đăng nhập...
            </>
          ) : (
            <>
              <span>→</span> Đăng nhập
            </>
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-[#6B6B6B]">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          className="text-[#2D5A45] font-semibold hover:underline transition-all"
        >
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  );
}