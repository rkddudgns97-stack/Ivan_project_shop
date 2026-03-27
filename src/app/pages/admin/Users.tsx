import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCheck, Coins, Search, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../api';
import type { User } from '../../types';

const STATUS_LABELS: Record<User['status'], string> = {
  active: '승인 완료',
  inactive: '승인 대기',
  leave: '이용 중지',
};

const STATUS_COLORS: Record<User['status'], string> = {
  active: 'bg-[var(--success-soft)] text-success',
  inactive: 'bg-[var(--warning-soft)] text-warning',
  leave: 'bg-muted/30 text-foreground/70',
};

const FILTER_OPTIONS = [
  { value: 'inactive', label: '승인 대기' },
  { value: 'all', label: '전체' },
  { value: 'active', label: '승인 완료' },
  { value: 'leave', label: '이용 중지' },
] as const;

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof FILTER_OPTIONS)[number]['value']>('inactive');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers({
        query: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setUsers(response.data.items);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [statusFilter]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadUsers();
  };

  const handleBulkGrant = async () => {
    try {
      await adminApi.grantPoints({
        batchKey: `2026-annual-grant-${Date.now()}`,
        amount: 300000,
        targetStatus: 'active',
        expiresAt: '2026-12-31T14:59:59Z',
        description: '2026 연간 복지 포인트 지급',
      });

      toast.success('포인트 일괄 지급을 완료했습니다.');
      setShowGrantModal(false);
      await loadUsers();
    } catch (error) {
      console.error('Failed to grant points:', error);
      toast.error('포인트 지급에 실패했습니다.');
    }
  };

  const handleUpdateStatus = async (userId: string, status: User['status']) => {
    setUpdatingUserId(userId);
    try {
      await adminApi.updateUserStatus(userId, status);
      toast.success(
        status === 'active' ? '가입 신청을 승인했습니다.' : '회원 상태를 변경했습니다.',
      );
      await loadUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error(error instanceof Error ? error.message : '회원 상태 변경에 실패했습니다.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const summary = useMemo(() => {
    return users.reduce(
      (result, user) => {
        result.total += 1;
        result[user.status] += 1;
        return result;
      },
      { total: 0, active: 0, inactive: 0, leave: 0 },
    );
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>회원 관리</h1>
          <p className="mt-1 text-muted-foreground">
            가입 신청, 승인 상태, 포인트 지급 대상을 한 번에 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGrantModal(true)}
          className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
        >
          <Coins className="size-5" strokeWidth={1.5} />
          포인트 일괄 지급
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: '현재 목록', value: summary.total },
          { label: '승인 대기', value: summary.inactive },
          { label: '승인 완료', value: summary.active },
          { label: '이용 중지', value: summary.leave },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-card)] border border-border bg-card p-4"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="이름, 사번, 이메일 검색"
              className="w-full rounded-[var(--radius)] border border-border bg-input-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
          >
            검색
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-[var(--radius-button)] px-4 py-1.5 text-sm transition-colors ${
                statusFilter === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/20 text-foreground/75 hover:bg-muted/40'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="text-center">
            <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-muted-foreground">회원 정보를 불러오는 중입니다.</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-muted-foreground">조건에 맞는 회원이 없습니다.</p>
          {statusFilter !== 'all' ? (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="mt-4 text-sm font-medium text-primary hover:text-[var(--primary-hover)]"
            >
              전체 회원 보기
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-border bg-[var(--surface-subtle)]">
                <tr>
                  {['사번', '이름', '이메일', '상태', '권한', '관리'].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4 font-mono text-sm">{user.employeeNo}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[user.status]}`}>
                        {STATUS_LABELS[user.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
                          >
                            {role === 'admin' ? '관리자' : '임직원'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.status === 'inactive' ? (
                          <button
                            type="button"
                            onClick={() => {
                              void handleUpdateStatus(user.id, 'active');
                            }}
                            disabled={updatingUserId === user.id}
                            className="inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-3 py-1.5 text-xs font-semibold text-success transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <UserCheck className="size-3.5" />
                            승인
                          </button>
                        ) : null}

                        {user.status !== 'leave' ? (
                          <button
                            type="button"
                            onClick={() => {
                              void handleUpdateStatus(user.id, 'leave');
                            }}
                            disabled={updatingUserId === user.id}
                            className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <UserX className="size-3.5" />
                            이용 중지
                          </button>
                        ) : null}

                        {user.status === 'leave' ? (
                          <button
                            type="button"
                            onClick={() => {
                              void handleUpdateStatus(user.id, 'active');
                            }}
                            disabled={updatingUserId === user.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCheck className="size-3.5" />
                            재승인
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showGrantModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-card)] bg-card p-6">
            <h2>포인트 일괄 지급</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              승인 완료된 임직원 전체에게 300,000P를 일괄 지급합니다.
            </p>

            <div className="mt-5 space-y-3">
              {[
                { label: '지급 대상', value: '승인 완료 임직원 전체' },
                { label: '지급 포인트', value: '300,000P' },
                { label: '만료일', value: '2026-12-31' },
                { label: '지급 사유', value: '2026 연간 복지 포인트 지급' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-1 rounded-[var(--radius)] bg-background px-4 py-3 text-sm text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowGrantModal(false)}
                className="rounded-[var(--radius)] border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/20"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleBulkGrant();
                }}
                className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-[var(--primary-hover)]"
              >
                지급 실행
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
