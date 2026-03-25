import { useEffect, useState } from 'react';
import { Search, Coins, UserRoundPlus } from 'lucide-react';
import type { User } from '../../types';
import { adminApi } from '../../api';
import { toast } from 'sonner';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGrantModal, setShowGrantModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        query: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setUsers(res.data.items);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleBulkGrant = async () => {
    try {
      await adminApi.grantPoints({
        batchKey: '2026-annual-grant',
        amount: 300000,
        targetStatus: 'active',
        expiresAt: '2026-12-31T14:59:59Z',
        description: '2026 연간 복지 포인트 지급',
      });
      toast.success('포인트 일괄 지급이 완료되었습니다.');
      setShowGrantModal(false);
    } catch (error) {
      toast.error('포인트 지급에 실패했습니다.');
    }
  };

  const statusLabels: Record<User['status'], string> = {
    active: '재직',
    inactive: '휴직',
    leave: '퇴사',
  };

  const statusColors: Record<User['status'], string> = {
    active: 'bg-success-soft text-success',
    inactive: 'bg-warning-soft text-warning',
    leave: 'bg-muted/30 text-foreground/70',
  };

  const filterButtons = [
    { value: 'all', label: '전체' },
    { value: 'active', label: '재직' },
    { value: 'inactive', label: '휴직' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1>임직원 관리</h1>
          <p className="mt-1 text-muted-foreground">임직원 정보와 포인트를 관리하세요.</p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90"
        >
          <Coins className="size-5" strokeWidth={1.5} />
          <span>포인트 일괄 지급</span>
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-card rounded-[var(--radius-card)] p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 사번, 이메일로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-[var(--radius)] bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90"
          >
            검색
          </button>
        </form>

        <div className="flex gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              className={`px-4 py-1.5 rounded-[var(--radius-button)] transition-colors ${
                statusFilter === btn.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/20 text-foreground/70 hover:bg-muted/40'
              }`}
              style={{ fontSize: 'var(--text-sm)' }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 사용자 목록 */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-[var(--radius-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--neutral-100)' }} className="border-b border-border">
                <tr>
                  {['사번', '이름', '이메일', '상태', '역할'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-muted-foreground uppercase tracking-wider" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4">
                      <p className="font-mono" style={{ fontSize: 'var(--text-sm)' }}>{user.employeeNo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="text-foreground">{user.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-[var(--radius-sm)] ${statusColors[user.status]}`} style={{ fontSize: 'var(--text-xs)' }}>
                        {statusLabels[user.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {user.roles.map((role) => (
                          <span key={role} className="px-2 py-1 bg-primary/10 text-primary rounded-[var(--radius-sm)]" style={{ fontSize: 'var(--text-xs)' }}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 포인트 일괄 지급 모달 */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-[var(--radius-card)] max-w-md w-full p-6 space-y-4">
            <h2>포인트 일괄 지급</h2>
            
            <div className="space-y-3">
              {[
                { label: '지급 회차', value: '2026-annual-grant' },
                { label: '지급 포인트', value: '300000', type: 'number' },
                { label: '대상', value: '재직 중인 전체 임직원' },
                { label: '유효기간', value: '2026-12-31' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-foreground/70 mb-1">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={field.value}
                    disabled
                    className="w-full px-4 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowGrantModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-[var(--radius)] hover:bg-muted/20"
              >
                취소
              </button>
              <button
                onClick={handleBulkGrant}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90"
              >
                지급하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}