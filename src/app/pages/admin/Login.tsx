import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../../api';
import { useAuth } from '../../auth/AuthProvider';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user?.roles.includes('admin')) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      toast.error('관리자 이메일을 입력해 주세요.');
      return;
    }

    if (!password) {
      toast.error('비밀번호를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.loginWithEmail({
        email: normalizedEmail,
        password,
      });

      if (!response.data.roles.includes('admin')) {
        toast.error('관리자 권한이 없는 계정입니다.');
        return;
      }

      signIn(response.data);
      toast.success('관리자 로그인에 성공했습니다.');
      navigate('/admin', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '관리자 로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fafe_0%,#eef3f8_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)] lg:items-stretch">
        <section className="rounded-[32px] border border-[#d7dde9] bg-[linear-gradient(135deg,#001e40_0%,#17375f_100%)] p-8 text-white shadow-[0_18px_42px_rgba(0,30,64,0.16)] md:p-10">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.08em]">
                <ShieldCheck className="size-4" strokeWidth={1.7} />
                관리자 전용 로그인
              </span>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">
                  복지몰 운영 콘솔은
                  <br />
                  관리자 계정으로만 접근합니다
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/78">
                  상품, 주문, 승인 대기 회원 관리는 관리자 권한이 있는 계정으로만 가능합니다.
                  일반 임직원 계정은 사용자 화면에서만 이용해 주세요.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: '회원 승인', copy: '승인 대기 계정을 활성화하고 로그인 가능 상태로 전환합니다.' },
                { title: '주문 운영', copy: '배송 등록, 취소 처리, 주문 상태 변경을 한 곳에서 관리합니다.' },
                { title: '상품 관리', copy: '대표 이미지, 상세 이미지, 포인트 가격과 추가금을 함께 조정합니다.' },
              ].map((item) => (
                <div key={item.title} className="rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/74">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#d7dde9] bg-white p-6 shadow-[0_18px_42px_rgba(23,28,31,0.06)] md:p-8">
          <div className="space-y-3">
            <h2 className="text-[28px] font-extrabold tracking-tight text-[#001e40]">관리자 로그인</h2>
            <p className="text-sm leading-6 text-[#667386]">
              등록된 관리자 이메일과 비밀번호를 입력해 운영 콘솔로 이동하세요.
            </p>
          </div>

          {user ? (
            <div className="mt-6 rounded-[22px] border border-[#d7dde9] bg-[#f4f7fb] p-4">
              <p className="text-sm font-semibold text-[#001e40]">현재 로그인된 계정</p>
              <p className="mt-2 text-base font-bold text-[#17212e]">{user.email}</p>
              <p className="mt-1 text-sm text-[#667386]">
                이 계정은 관리자 권한이 없습니다. 다른 관리자 계정으로 다시 로그인해 주세요.
              </p>
              <button
                type="button"
                onClick={signOut}
                className="mt-4 rounded-[14px] border border-[#c9d3e3] px-4 py-2 text-sm font-semibold text-[#17375f] transition-colors hover:bg-white"
              >
                현재 계정 로그아웃
              </button>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#17212e]">관리자 이메일</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#667386]" strokeWidth={1.6} />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@welfaremall.co.kr"
                  className="h-12 w-full rounded-[16px] border border-[#d7dde9] bg-white pl-12 pr-4 text-base outline-none transition-colors focus:border-[#8ea9d2] focus:ring-2 focus:ring-[#d8e5f8]"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#17212e]">비밀번호</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#667386]" strokeWidth={1.6} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력해 주세요"
                  className="h-12 w-full rounded-[16px] border border-[#d7dde9] bg-white pl-12 pr-4 text-base outline-none transition-colors focus:border-[#8ea9d2] focus:ring-2 focus:ring-[#d8e5f8]"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-[16px] bg-[#001e40] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#17375f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? '확인 중...' : '관리자 로그인'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
