import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ChevronRight,
  CircleHelp,
  LogOut,
  MapPin,
  Megaphone,
  ReceiptText,
  Shield,
  ShoppingBag,
  Smartphone,
  UserCircle2,
  WalletCards,
} from 'lucide-react';
import { pointApi, shippingAddressApi } from '../api';
import { useAuth } from '../auth/AuthProvider';
import type { PointBalance, ShippingAddress } from '../types';

const TEXT = {
  title: '\uB9C8\uC774',
  availablePoint: '\uC0AC\uC6A9 \uAC00\uB2A5 \uD3EC\uC778\uD2B8',
  expiringPoint: '\uB9CC\uB8CC \uC608\uC815 \uD3EC\uC778\uD2B8',
  account: '\uACC4\uC815',
  address: '\uC8FC\uC18C',
  service: '\uC11C\uBE44\uC2A4',
  policy: '\uC815\uCC45',
  edit: '\uD3B8\uC9D1',
  idLabel: '\uC544\uC774\uB514',
  nameLabel: '\uC0AC\uC6A9\uC790 \uC774\uB984',
  phoneLabel: '\uD734\uB300\uD3F0\uBC88\uD638',
  noAddress: '\uB4F1\uB85D\uB41C \uBC30\uC1A1\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  help: '\uB3C4\uC6C0\uB9D0 \u0026 \uC9C0\uC6D0',
  notice: '\uACF5\uC9C0\uC0AC\uD56D',
  terms: '\uBCF5\uC9C0\uBAB0 \uC774\uC6A9\uC57D\uAD00',
  privacy: '\uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC \uBC29\uCE68',
  signOut: '\uB85C\uADF8\uC544\uC6C3',
  signOutHint: '\uC77C\uC2DC\uC801 \uB85C\uADF8\uC544\uC6C3',
  removeAccount: '\uACC4\uC815 \uC0AD\uC81C',
  orderShipping: '\uC8FC\uBB38\u00B7\uBC30\uC1A1',
  pointHistory: '\uD3EC\uC778\uD2B8',
  accountInfo: '\uACC4\uC815 \uC815\uBCF4',
  addressManage: '\uBC30\uC1A1\uC9C0 \uAD00\uB9AC',
} as const;

const QUICK_LINKS = [
  { to: '/orders', label: TEXT.orderShipping, icon: ShoppingBag },
  { to: '/points', label: TEXT.pointHistory, icon: WalletCards },
  { to: '/me#account', label: TEXT.accountInfo, icon: UserCircle2 },
  { to: '/me#address', label: TEXT.addressManage, icon: MapPin },
];

const SERVICE_LINKS = [
  { label: TEXT.help, icon: CircleHelp },
  { label: TEXT.notice, icon: Megaphone },
];

const POLICY_LINKS = [
  { label: TEXT.terms, icon: ReceiptText },
  { label: TEXT.privacy, icon: Shield },
];

export function MyPage() {
  const { user, signOut } = useAuth();
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [balanceRes, addressRes] = await Promise.all([
          pointApi.getBalance(),
          shippingAddressApi.getList(),
        ]);

        setBalance(balanceRes.data);
        setAddresses(addressRes.data);
      } catch (error) {
        console.error('Failed to load my page data:', error);
      }
    };

    void loadData();
  }, []);

  const primaryAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? addresses[0] ?? null,
    [addresses],
  );

  return (
    <div className="mx-auto max-w-[560px] space-y-6 pb-6">
      <div className="pt-1 text-center">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#232c51]">{TEXT.title}</h1>
      </div>

      <section className="grid gap-3">
        <div className="flex items-center justify-between rounded-[18px] bg-[#dff3d8] px-5 py-5">
          <div>
            <p className="text-[14px] font-semibold text-[#3b5742]">{TEXT.availablePoint}</p>
          </div>
          <div className="flex items-center gap-2 text-[#23354d]">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#4fc34e] text-white">
              <WalletCards className="size-4" strokeWidth={2} />
            </div>
            <span className="text-[18px] font-extrabold">{balance?.availablePoint.toLocaleString() ?? '0'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[18px] bg-[#fff2bf] px-5 py-5">
          <div>
            <p className="text-[14px] font-semibold text-[#5b4f2d]">{TEXT.expiringPoint}</p>
          </div>
          <div className="flex items-center gap-2 text-[#23354d]">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#ffc400] text-white">
              <WalletCards className="size-4" strokeWidth={2} />
            </div>
            <span className="text-[18px] font-extrabold">{balance?.expiringPoint.toLocaleString() ?? '0'}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-3">
        {QUICK_LINKS.map((item) => (
          <Link key={item.label} to={item.to} className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-[72px] items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(35,44,81,0.06)]">
              <item.icon className="size-7 text-[#ff5b7f]" strokeWidth={1.7} />
            </div>
            <span className="break-keep text-[13px] font-medium leading-4 text-[#232c51]">{item.label}</span>
          </Link>
        ))}
      </section>

      <section id="account" className="space-y-4">
        <h2 className="text-[18px] font-extrabold text-[#232c51]">{TEXT.account}</h2>
        <div className="rounded-[18px] border border-[#d7dce8] bg-white p-5 shadow-[0_8px_18px_rgba(35,44,81,0.04)]">
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex size-9 items-center justify-center rounded-full border border-[#ff6f89] text-[#ff5b7f]">
                <ReceiptText className="size-4" strokeWidth={1.8} />
              </div>
              <div>
                <p className="break-all text-[20px] font-bold leading-7 text-[#111827]">{user?.email ?? '-'}</p>
                <p className="mt-1 text-[14px] text-[#8a93a7]">{TEXT.idLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-9 items-center justify-center rounded-full border border-[#ff6f89] text-[#ff5b7f]">
                <UserCircle2 className="size-4" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[24px] font-bold leading-none text-[#111827]">{user?.name ?? '-'}</p>
                <p className="mt-1 text-[14px] text-[#8a93a7]">{TEXT.nameLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-9 items-center justify-center rounded-full border border-[#ff6f89] text-[#ff5b7f]">
                <Smartphone className="size-4" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[24px] font-bold leading-none text-[#111827]">{primaryAddress?.phone ?? '-'}</p>
                <p className="mt-1 text-[14px] text-[#8a93a7]">{TEXT.phoneLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="address" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold text-[#232c51]">{TEXT.address}</h2>
          <button type="button" className="rounded-[10px] border border-[#ff6f89] px-4 py-2 text-[14px] font-semibold text-[#ff5b7f]">
            {TEXT.edit}
          </button>
        </div>

        <div className="rounded-[18px] border border-[#d7dce8] bg-white p-5 shadow-[0_8px_18px_rgba(35,44,81,0.04)]">
          {primaryAddress ? (
            <div className="flex items-start gap-4">
              <div className="mt-1 flex size-9 items-center justify-center rounded-full border border-[#ff6f89] text-[#ff5b7f]">
                <MapPin className="size-4" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[20px] font-bold leading-none text-[#111827]">{primaryAddress.recipientName}</p>
                <p className="mt-2 break-keep text-[15px] leading-6 text-[#4b5563]">
                  ({primaryAddress.zipCode}) {primaryAddress.address1} {primaryAddress.address2}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[15px] text-[#8a93a7]">{TEXT.noAddress}</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[18px] font-extrabold text-[#232c51]">{TEXT.service}</h2>
        {SERVICE_LINKS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex w-full items-center justify-between rounded-[18px] border border-[#d7dce8] bg-white px-5 py-5 text-left shadow-[0_8px_18px_rgba(35,44,81,0.04)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-9 items-center justify-center rounded-full border border-[#ff6f89] text-[#ff5b7f]">
                <item.icon className="size-4" strokeWidth={1.8} />
              </div>
              <span className="text-[18px] font-semibold text-[#111827]">{item.label}</span>
            </div>
            <ChevronRight className="size-5 text-[#6b7280]" strokeWidth={1.8} />
          </button>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-[18px] font-extrabold text-[#232c51]">{TEXT.policy}</h2>
        <div className="space-y-3 rounded-[18px] border border-[#d7dce8] bg-white p-3 shadow-[0_8px_18px_rgba(35,44,81,0.04)]">
          {POLICY_LINKS.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center justify-between rounded-[14px] px-2 py-3 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-9 items-center justify-center rounded-full border border-[#ff6f89] text-[#ff5b7f]">
                  <item.icon className="size-4" strokeWidth={1.8} />
                </div>
                <span className="text-[18px] font-semibold text-[#111827]">{item.label}</span>
              </div>
              <ChevronRight className="size-5 text-[#6b7280]" strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center justify-between rounded-[18px] border border-[#d7dce8] bg-white px-5 py-5 text-left shadow-[0_8px_18px_rgba(35,44,81,0.04)]"
      >
        <div className="flex items-center gap-4">
          <div className="flex size-9 items-center justify-center rounded-full border border-[#ff6f89] text-[#ff5b7f]">
            <LogOut className="size-4" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[18px] font-semibold text-[#111827]">{TEXT.signOut}</p>
            <p className="text-[14px] text-[#8a93a7]">{TEXT.signOutHint}</p>
          </div>
        </div>
        <ChevronRight className="size-5 text-[#6b7280]" strokeWidth={1.8} />
      </button>

      <div className="pb-4 pt-2 text-center text-[14px] font-medium text-[#d1d5db]">{TEXT.removeAccount}</div>
    </div>
  );
}
