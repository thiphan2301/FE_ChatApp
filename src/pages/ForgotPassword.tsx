import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';

export default function ForgotPassword() {
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
        Không sao đâu, chúng mình sẽ giúp bạn lấy lại tài khoản.
      </p>

      {/* Info card */}
      <div
        className="rounded-2xl p-5 space-y-4 mb-6"
        style={{ backgroundColor: '#E8F2EC', border: '1px solid rgba(45,90,69,0.2)' }}
      >
        {/* Step 1 */}
        <div className="flex gap-3 items-start">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold text-white"
            style={{ backgroundColor: '#2D5A45' }}
          >
            1
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Liên hệ quản trị viên</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">
              Hệ thống chưa hỗ trợ tự đặt lại mật khẩu. Vui lòng liên hệ giảng viên / admin để được cấp lại mật khẩu.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-3 items-start">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold text-white"
            style={{ backgroundColor: '#2D5A45' }}
          >
            2
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Cung cấp tên đăng nhập</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">
              Cho admin biết tên đăng nhập của bạn để xác minh tài khoản.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-3 items-start">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold text-white"
            style={{ backgroundColor: '#2D5A45' }}
          >
            3
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Nhận mật khẩu mới</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">
              Admin sẽ cấp mật khẩu tạm thời. Sau khi đăng nhập, hãy đổi lại mật khẩu của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* CTA: quay lại đăng nhập */}
      <Link
        to="/login"
        className="w-full py-3.5 px-6 rounded-xl font-semibold text-white text-base
                   flex items-center justify-center gap-2 transition-all duration-200
                   hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        style={{
          background: 'linear-gradient(135deg, #3B6B53 0%, #2D5A45 100%)',
          boxShadow: '0 4px 20px rgba(45,90,69,0.35)',
        }}
      >
        → Quay lại đăng nhập
      </Link>

      <p className="mt-5 text-center text-xs text-[#9E9690]">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-[#2D5A45] font-medium hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  );
}
