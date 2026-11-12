// src/components/AdminModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Crown, 
  Gift, 
  Activity, 
  Search, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Server,
  Phone,
  MessageCircle,
  Download,
  Lock,
  Unlock,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  User, 
  fetchAdminStatsApi, 
  fetchAdminUsersApi, 
  updateUserVipApi, 
  updateUserRoleApi, 
  updateUserDetailsApi,
  deleteUserApi, 
  fetchAdminPromosApi, 
  createPromoCodeApi, 
  deletePromoCodeApi 
} from '../utils/authHelper';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onRefreshBulletin?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshBulletin,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'promos' | 'tiers' | 'stats'>('users');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // New promo state
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDays, setNewPromoDays] = useState(7);
  const [newPromoLabel, setNewPromoLabel] = useState('Yönetici Kampanyası');

  useEffect(() => {
    if (isOpen && currentUser?.role === 'admin') {
      loadData();
    }
  }, [isOpen, currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, promosRes] = await Promise.all([
        fetchAdminStatsApi(),
        fetchAdminUsersApi(),
        fetchAdminPromosApi(),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success && usersRes.users) setUsers(usersRes.users);
      if (promosRes.success && promosRes.promos) setPromos(promosRes.promos);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || currentUser?.role !== 'admin') return null;

  const showFeedback = (text: string, isError: boolean = false) => {
    setActionMessage({ text, isError });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleGiveVip = async (userId: string, days: number, planName: string) => {
    const res = await updateUserVipApi(userId, days, planName);
    if (res.success && res.user) {
      setUsers(prev => prev.map(u => u.id === userId ? res.user! : u));
      showFeedback(`VIP Başarıyla Güncellendi (+${days} Gün)`);
      loadData();
    } else {
      showFeedback(res.error || 'VIP verilemedi', true);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (userId === currentUser.id) {
      if (!confirm('Kendi yöneticilik yetkinizi kaldırmak istediğinize emin misiniz?')) return;
    }
    const res = await updateUserRoleApi(userId, nextRole);
    if (res.success && res.user) {
      setUsers(prev => prev.map(u => u.id === userId ? res.user! : u));
      showFeedback(`Kullanıcı rolü "${nextRole.toUpperCase()}" olarak değiştirildi.`);
      loadData();
    } else {
      showFeedback(res.error || 'Rol değiştirilemedi', true);
    }
  };

  const handleEditPhone = async (userId: string, currentPhone?: string | null) => {
    const newPhone = prompt('Kullanıcı Telefon Numarasını Güncelle:', currentPhone || '');
    if (newPhone === null) return;
    const res = await updateUserDetailsApi(userId, { phone: newPhone });
    if (res.success && res.user) {
      setUsers(prev => prev.map(u => u.id === userId ? res.user! : u));
      showFeedback('Telefon numarası güncellendi.');
    } else {
      showFeedback(res.error || 'Güncellenemedi', true);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (userId === currentUser.id) {
      alert('Kendi hesabınızı silemezsiniz!');
      return;
    }
    if (!confirm(`"${name}" adlı kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    const res = await deleteUserApi(userId);
    if (res.success) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      showFeedback('Kullanıcı başarıyla silindi.');
      loadData();
    } else {
      showFeedback(res.error || 'Kullanıcı silinemedi', true);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;

    const res = await createPromoCodeApi(newPromoCode, newPromoDays, newPromoLabel);
    if (res.success && res.promo) {
      setPromos(prev => [res.promo, ...prev]);
      setNewPromoCode('');
      showFeedback(`"${res.promo.code}" hediye kodu oluşturuldu!`);
    } else {
      showFeedback(res.error || 'Promosyon kodu oluşturulamadı', true);
    }
  };

  const handleDeletePromo = async (code: string) => {
    if (!confirm(`"${code}" kodunu silmek istediğinize emin misiniz?`)) return;
    const res = await deletePromoCodeApi(code);
    if (res.success) {
      setPromos(prev => prev.filter(p => p.code !== code));
      showFeedback(`"${code}" kodu silindi.`);
    } else {
      showFeedback(res.error || 'Kod silinemedi', true);
    }
  };

  const handleExportCsv = () => {
    if (users.length === 0) return;
    const headers = ['ID', 'Ad Soyad', 'E-Posta', 'Telefon', 'Giriş Yöntemi', 'Rol', 'VIP Durumu', 'VIP Bitiş Tarihi'];
    const rows = users.map(u => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.phone || '',
      u.authProvider || 'local',
      u.role,
      u.isVip ? 'VIP' : 'Free',
      u.vipExpiresAt ? new Date(u.vipExpiresAt).toLocaleDateString('tr-TR') : ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `proanaliz_kullanicilar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('Kullanıcı & Telefon listesi CSV olarak indirildi.');
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Glow ambient */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/40 text-amber-400">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Yönetici (Admin) Paneli</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-black border border-rose-500/30">
                  KURUCU &amp; ADMİN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kullanıcı telefonları, VIP süreleri, Google kayıtları ve sistem kontrolü.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionMessage && (
          <div className={`mt-2.5 p-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 ${
            actionMessage.isError ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {actionMessage.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Quick KPI Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 shrink-0">
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Toplam Kayıtlı</span>
            </div>
            <div className="text-xl font-black text-white mt-0.5">
              {stats?.totalUsers || users.length || 0}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Aktif VIP Üye</span>
            </div>
            <div className="text-xl font-black text-amber-400 mt-0.5">
              {stats?.vipUsers || users.filter(u => u.isVip).length || 0}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Telefonlu Üyeler</span>
            </div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {users.filter(u => u.phone).length}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>Sunucu Durumu</span>
            </div>
            <div className="text-xs font-mono font-bold text-purple-300 mt-1">
              v2026.11.12.17 • Çevrimiçi
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 mb-3 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kullanıcılar ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tiers' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Free vs. VIP Kuralları</span>
          </button>

          <button
            onClick={() => setActiveTab('promos')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'promos' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Promosyon Kodları ({promos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stats' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sistem &amp; Bülten</span>
          </button>
        </div>

        {/* TAB 1: USERS LIST */}
        {activeTab === 'users' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Search Input & CSV Export Button */}
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="İsim, e-posta veya telefon ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Tüm kullanıcı ve telefon listesini CSV formatında indir"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">CSV İndir</span>
              </button>
            </div>

            {/* Users Table / Scrollable Container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Eşleşen kullanıcı bulunamadı.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const daysLeft = u.vipExpiresAt ? Math.max(0, Math.ceil((u.vipExpiresAt - Date.now()) / (24 * 60 * 60 * 1000))) : 0;
                  const isCurrent = u.id === currentUser.id;
                  const cleanPhoneNum = u.phone ? u.phone.replace(/\D/g, '') : null;

                  return (
                    <div
                      key={u.id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* User Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white truncate text-sm">{u.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                              (Siz)
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            u.authProvider === 'google' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {u.authProvider === 'google' ? 'Google' : 'E-Posta'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                            u.role === 'admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {u.role === 'admin' ? '🛡️ Admin' : '👤 Free Üye'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                          <span>{u.email}</span>
                          {u.phone ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                              <Phone className="w-3 h-3" />
                              {u.phone}
                              {cleanPhoneNum && (
                                <a
                                  href={`https://wa.me/${cleanPhoneNum.startsWith('90') ? cleanPhoneNum : '90' + cleanPhoneNum}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold inline-flex items-center gap-0.5"
                                  title="WhatsApp ile İletişime Geç"
                                >
                                  <MessageCircle className="w-2.5 h-2.5" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleEditPhone(u.id, u.phone)}
                              className="text-[10px] text-slate-500 hover:text-amber-300 underline cursor-pointer"
                            >
                              + Telefon Ekle
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Üyelik:</span>
                          {u.isVip ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-400" />
                              {u.vipPlan || 'VIP'} ({daysLeft} Gün Kaldı)
                            </span>
                          ) : (
                            <span className="text-slate-500">Standart Ücretsiz (Free) Plan</span>
                          )}
                        </div>
                      </div>

                      {/* User Actions */}
                      <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                        {/* Quick Add VIP Buttons */}
                        <button
                          onClick={() => handleGiveVip(u.id, 30, '1 Aylık VIP')}
                          className="px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-[11px] transition-colors cursor-pointer"
                          title="Kullanıcıya 30 Gün VIP Ver"
                        >
                          +30 Gün
                        </button>
                        <button
                          onClick={() => handleGiveVip(u.id, 365, 'Yıllık Kral VIP')}
                          className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] transition-colors cursor-pointer"
                          title="Kullanıcıya 1 Yıl VIP Ver"
                        >
                          +1 Yıl
                        </button>

                        {/* Toggle Admin Role */}
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                          title="Rolünü Değiştir"
                        >
                          {u.role === 'admin' ? 'Yetki Düşür' : 'Admin Yap'}
                        </button>

                        {/* Delete User */}
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FREE vs VIP MATRIX */}
        {activeTab === 'tiers' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="font-black text-amber-300 text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Free (Standart) vs. VIP Üyelik Kullanım Kuralları</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                VIP süresi dolan kullanıcıların hesabı silinmez; otomatik olarak Free (Ücretsiz) plana düşürülür. Kilitli alanlar tekrar `🔒 VIP` haline gelir.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* FREE TIER */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-xs uppercase tracking-wider">🆓 Free (Ücretsiz) Plan</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">Herkes Açık</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-400">
                    <li className="flex items-center gap-1.5">✓ Tüm liglerin canlı maç bülteni &amp; skorları</li>
                    <li className="flex items-center gap-1.5">✓ Temel oranlar, form durumları &amp; puan tablosu</li>
                    <li className="flex items-center gap-1.5">✓ <strong>1 Adet Kupon:</strong> Günün İdeal Kuponu açık</li>
                    <li className="flex items-center gap-1.5">✓ TJK yarış bülteni ve at listeleri</li>
                    <li className="flex items-center gap-1.5">✓ Canlı Döviz, Altın &amp; Borsa genel görünümü</li>
                    <li className="flex items-center gap-1.5 text-rose-400/80">✗ Banko (%85+) &amp; Sürpriz Kuponlar Kilitli</li>
                    <li className="flex items-center gap-1.5 text-rose-400/80">✗ TJK Altılı Robotu Hazır Kuponu Kilitli</li>
                    <li className="flex items-center gap-1.5 text-rose-400/80">✗ Borsa Quant "GÜÇLÜ AL" Sinyalleri Kilitli</li>
                  </ul>
                </div>

                {/* VIP TIER */}
                <div className="p-3.5 rounded-xl bg-gradient-to-b from-amber-500/10 to-slate-900 border border-amber-400/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-300 text-xs uppercase tracking-wider">👑 VIP Kulübü Üyesi</span>
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black">Full Erişim</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-amber-100">
                    <li className="flex items-center gap-1.5">★ <strong>Günün Banko Kuponu (%85+ Güvenilirlik)</strong></li>
                    <li className="flex items-center gap-1.5">★ <strong>Yüksek Oranlı Sürpriz Kupon</strong></li>
                    <li className="flex items-center gap-1.5">★ <strong>TJK Altılı Robotu:</strong> Günün Cazip Banko Tekleri</li>
                    <li className="flex items-center gap-1.5">★ <strong>Borsa &amp; Kripto:</strong> Quant "GÜÇLÜ AL" Sinyalleri</li>
                    <li className="flex items-center gap-1.5">★ <strong>Sınırsız AI Kupon &amp; Sohbet Robotu</strong></li>
                    <li className="flex items-center gap-1.5">★ <strong>Anlık VIP Push Bildirimleri (Sıfır Gecikme)</strong></li>
                    <li className="flex items-center gap-1.5 text-emerald-400 font-bold">★ Reklamsız, öncelikli VIP terminal desteği</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROMO CODES */}
        {activeTab === 'promos' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Add Promo Code Form */}
            <form onSubmit={handleCreatePromo} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-3 shrink-0 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Kod Adı (Örn: KRAL2026)"
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                className="w-full sm:w-1/3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono uppercase focus:outline-hidden focus:border-amber-400"
              />
              <div className="flex items-center gap-1.5 w-full sm:w-1/4">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={newPromoDays}
                  onChange={(e) => setNewPromoDays(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-400 shrink-0">Gün VIP</span>
              </div>
              <input
                type="text"
                placeholder="Açıklama (Örn: Tanıtım Hediyesi)"
                value={newPromoLabel}
                onChange={(e) => setNewPromoLabel(e.target.value)}
                className="w-full sm:flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!newPromoCode.trim()}
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                + Kod Ekle
              </button>
            </form>

            {/* Promo Codes List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {promos.map((p) => (
                <div
                  key={p.code}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono font-black text-xs">
                      {p.code}
                    </span>
                    <div>
                      <div className="font-bold text-white">{p.label}</div>
                      <div className="text-[10px] text-slate-400">Verilen Süre: {p.days} Gün Full VIP</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePromo(p.code)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Kodu Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM & STATS */}
        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="font-black text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Canlı Sistem Durumu &amp; Kontroller</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Sunucu Dağıtımı (Render):</div>
                  <div className="font-mono text-emerald-400 font-bold">https://proanaliz-ai.onrender.com</div>
                </div>

                <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Yönetici Hesabınız:</div>
                  <div className="font-bold text-white">{currentUser.name} ({currentUser.email})</div>
                </div>
              </div>

              {onRefreshBulletin && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onRefreshBulletin();
                      showFeedback('Canlı bülten verileri güncelleniyor...');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Canlı İddaa Bültenini Yenile</span>
                  </button>
                </div>
              )}
            </div>

            {/* Monetization / PayTR notes */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h3 className="font-black text-amber-300 text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Ödeme &amp; Abonelik Durumu</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Şu anda VIP üyelikler promosyon kodları ve yönetici paneli üzerinden anında tanımlanabilir haldedir.
                Gerçek kredi kartı ile otomatik ödeme almak için <strong>PayTR</strong> veya <strong>Shopier</strong> mağazanızı bağlayabilirsiniz.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
