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
  Sparkles,
  TrendingUp,
  DollarSign,
  Radio,
  Plus,
  Clock,
  Send,
  Cpu,
  Flame,
  Check,
  Megaphone,
  History,
  Save,
  Globe,
  LifeBuoy
} from 'lucide-react';
import { 
  User, 
  EditorCoupon,
  EditorMatch,
  SiteAnnouncement,
  SupportTicket,
  fetchAdminStatsApi, 
  fetchAdminUsersApi, 
  updateUserVipApi, 
  updateUserRoleApi, 
  updateUserDetailsApi,
  deleteUserApi, 
  fetchAdminPromosApi, 
  createPromoCodeApi, 
  deletePromoCodeApi,
  fetchEditorCouponsApi,
  saveEditorCouponApi,
  deleteEditorCouponApi,
  fetchServicesHealthApi,
  fetchAnnouncementApi,
  saveAnnouncementApi,
  adminResetUserPasswordApi,
  updateOwnProfileApi,
  fetchAdminSupportTicketsApi,
  updateAdminSupportTicketApi
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
  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'finance' | 'editor_coupons' | 'announcement' | 'logs' | 'system' | 'promos' | 'tiers'>('users');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [editorCoupons, setEditorCoupons] = useState<EditorCoupon[]>([]);
  const [servicesHealth, setServicesHealth] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  // Announcement CMS state
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementVariant, setAnnouncementVariant] = useState<'gold' | 'emerald' | 'rose' | 'blue'>('gold');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // New promo state
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDays, setNewPromoDays] = useState(7);
  const [newPromoLabel, setNewPromoLabel] = useState('Yönetici Kampanyası');

  // New Editor Coupon Form State
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [couponTitle, setCouponTitle] = useState('👑 YÖNETİCİ ŞEREF KUPONU');
  const [couponSubtitle, setCouponSubtitle] = useState('Yönetici Masası Özel Tercihleri & AI Analizi');
  const [couponCategory, setCouponCategory] = useState<'football' | 'horses' | 'stocks'>('football');
  const [couponConfidence, setCouponConfidence] = useState(92);
  const [couponIsVipOnly, setCouponIsVipOnly] = useState(true);
  const [couponMatches, setCouponMatches] = useState<Array<{
    homeTeam: string;
    awayTeam: string;
    league: string;
    matchTime: string;
    matchDate: string;
    prediction: string;
    odds: number;
    confidence: number;
    reason: string;
  }>>([
    {
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      league: 'İspanya La Liga',
      matchTime: '21:00',
      matchDate: 'Bugün',
      prediction: '2.5 ÜST & KG VAR',
      odds: 1.72,
      confidence: 93,
      reason: 'El Clasico xG analizi en az 3 golü işaret ediyor.'
    },
    {
      homeTeam: 'Liverpool',
      awayTeam: 'Man City',
      league: 'İngiltere Premier Lig',
      matchTime: '19:30',
      matchDate: 'Bugün',
      prediction: 'MS 1X',
      odds: 1.48,
      confidence: 89,
      reason: 'Anfield saha avantajı ve Liverpool pres gücü.'
    }
  ]);

  useEffect(() => {
    if (isOpen && currentUser?.role === 'admin') {
      loadData();
    }
  }, [isOpen, currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, promosRes, couponsRes, healthRes, annRes, ticketsRes] = await Promise.all([
        fetchAdminStatsApi(),
        fetchAdminUsersApi(),
        fetchAdminPromosApi(),
        fetchEditorCouponsApi(),
        fetchServicesHealthApi(),
        fetchAnnouncementApi(),
        fetchAdminSupportTicketsApi()
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success && usersRes.users) setUsers(usersRes.users);
      if (promosRes.success && promosRes.promos) setPromos(promosRes.promos);
      if (couponsRes.success && couponsRes.coupons) setEditorCoupons(couponsRes.coupons);
      if (healthRes.success && healthRes.health) setServicesHealth(healthRes.health);
      if (ticketsRes?.success && Array.isArray(ticketsRes.tickets)) setTickets(ticketsRes.tickets);
      if (annRes?.success && annRes.announcement) {
        setAnnouncementText(annRes.announcement.text || '');
        setAnnouncementEnabled(!!annRes.announcement.enabled);
        setAnnouncementVariant(annRes.announcement.variant || 'gold');
        setAnnouncementLink(annRes.announcement.link || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string, reply?: string) => {
    setUpdatingTicketId(ticketId);
    try {
      const res = await updateAdminSupportTicketApi(ticketId, { status, adminReply: reply });
      if (res.success && res.ticket) {
        setTickets(prev => prev.map(t => t.id === ticketId ? res.ticket! : t));
        showFeedback(`Destek talebi güncellendi (${status})`);
      } else {
        showFeedback(res.error || 'Talep güncellenemedi', true);
      }
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    try {
      const res = await saveAnnouncementApi({
        enabled: announcementEnabled,
        text: announcementText,
        variant: announcementVariant,
        link: announcementLink
      });
      if (res.success) {
        showFeedback('📢 Site duyurusu başarıyla kaydedildi ve yayına alındı!');
        loadData();
      } else {
        showFeedback(res.error || 'Duyuru kaydedilemedi', true);
      }
    } finally {
      setSavingAnnouncement(false);
    }
  };

  if (!isOpen || currentUser?.role !== 'admin') return null;

  const showFeedback = (text: string, isError: boolean = false) => {
    setActionMessage({ text, isError });
    setTimeout(() => setActionMessage(null), 3500);
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

  const handleResetUserPassword = async (userId: string, name: string) => {
    const newPass = prompt(`"${name}" kullanıcısı için yeni bir şifre belirleyin (En az 6 karakter):`, '123456');
    if (!newPass) return;
    if (newPass.trim().length < 6) {
      alert('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    const res = await adminResetUserPasswordApi(userId, newPass.trim());
    if (res.success) {
      showFeedback(`🔑 "${name}" kullanıcısının şifresi "${newPass.trim()}" olarak güncellendi!`);
      loadData();
    } else {
      showFeedback(res.error || 'Şifre güncellenemedi', true);
    }
  };

  const handleChangeOwnAdminPassword = async () => {
    const currentPass = prompt('Mevcut Yönetici Şifrenizi Girin:');
    if (!currentPass) return;
    const newPass = prompt('Yeni Yönetici Şifrenizi Girin (En az 6 karakter):');
    if (!newPass || newPass.trim().length < 6) {
      alert('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }
    const res = await updateOwnProfileApi({
      currentPassword: currentPass.trim(),
      newPassword: newPass.trim()
    });
    if (res.success) {
      showFeedback('👑 Yönetici şifreniz başarıyla güncellendi!');
    } else {
      showFeedback(res.error || 'Yönetici şifresi güncellenemedi.', true);
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
    const headers = ['ID', 'Ad Soyad', 'E-Posta', 'Telefon', 'İlgi Alanı', 'Giriş Yöntemi', 'Rol', 'VIP Durumu', 'VIP Bitiş Tarihi'];
    const rows = users.map(u => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.phone || '',
      u.preferredInterest || 'Genel',
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

  // Editor Coupon Management Handlers
  const handleAddMatchRow = () => {
    setCouponMatches(prev => [
      ...prev,
      {
        homeTeam: '',
        awayTeam: '',
        league: 'Süper Lig',
        matchTime: '20:00',
        matchDate: 'Bugün',
        prediction: 'MS 1',
        odds: 1.65,
        confidence: 88,
        reason: ''
      }
    ]);
  };

  const handleRemoveMatchRow = (index: number) => {
    if (couponMatches.length <= 1) {
      alert('Kuponda en az 1 maç bulunmalıdır.');
      return;
    }
    setCouponMatches(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEditorCoupon = async () => {
    if (!couponTitle.trim()) {
      alert('Lütfen kupon başlığı girin.');
      return;
    }
    const invalid = couponMatches.some(m => !m.homeTeam.trim() || !m.awayTeam.trim() || !m.prediction.trim());
    if (invalid) {
      alert('Lütfen maçlardaki ev sahibi, deplasman ve tahmin alanlarını doldurunuz.');
      return;
    }

    const res = await saveEditorCouponApi({
      title: couponTitle,
      subtitle: couponSubtitle,
      category: couponCategory,
      confidence: couponConfidence,
      isVipOnly: couponIsVipOnly,
      matches: couponMatches.map((m, i) => ({
        id: `m_ed_${Date.now()}_${i}`,
        ...m
      }))
    });

    if (res.success && res.coupon) {
      setEditorCoupons(prev => [res.coupon!, ...prev.filter(c => c.id !== res.coupon!.id)]);
      setIsAddingCoupon(false);
      showFeedback('👑 Yönetici kuponu başarıyla yayına alındı!');
    } else {
      showFeedback(res.error || 'Kupon kaydedilemedi', true);
    }
  };

  const handleDeleteEditorCoupon = async (id: string) => {
    if (!confirm('Bu yönetici kuponunu yayından kaldırmak istediğinize emin misiniz?')) return;
    const res = await deleteEditorCouponApi(id);
    if (res.success) {
      setEditorCoupons(prev => prev.filter(c => c.id !== id));
      showFeedback('Kupon yayından kaldırıldı.');
    } else {
      showFeedback(res.error || 'Kupon silinemedi', true);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
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
                <h2 className="text-lg sm:text-xl font-black text-white">Yönetici (Admin) Kokpiti</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-black border border-rose-500/30">
                  KURUCU &amp; ADMİN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Finans &amp; Gelir, Yönetici Kuponları, Canlı Bot Sağlığı ve Üye CRM Yönetimi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleChangeOwnAdminPassword}
              className="px-2.5 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Kendi Yönetici Şifrenizi Değiştirin"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Şifremi Değiştir</span>
            </button>
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
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tahmini Aylık MRR</span>
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              ₺{(stats?.estimatedMrr || 0).toLocaleString('tr-TR')}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>Sistem Sağlığı</span>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>%100 Çevrimiçi</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div 
          className="flex flex-wrap items-center gap-1 sm:gap-1.5 border-b border-slate-800 pb-2.5 mb-3 shrink-0"
        >
          <button
            onClick={() => setActiveTab('users')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kullanıcılar ({users.length})</span>
          </button>

          {(() => {
            const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
            return (
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'tickets' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Destek ({tickets.length})</span>
                {openCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                    {openCount} Yeni
                  </span>
                )}
              </button>
            );
          })()}

          <button
            onClick={() => setActiveTab('finance')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'finance' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Finans &amp; Gelir</span>
            {stats?.expiringSoonCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                {stats.expiringSoonCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('editor_coupons')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'editor_coupons' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Kuponlar ({editorCoupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcement')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'announcement' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Duyuru CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'logs' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Aktivite ({stats?.activityLogs?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'system' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Bot &amp; Veri</span>
          </button>

          <button
            onClick={() => setActiveTab('promos')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'promos' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Promosyonlar ({promos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tiers' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Free vs. VIP</span>
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
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <button
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-700"
                title="Tüm kullanıcıları telefonlarıyla CSV (Excel) olarak indir"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">CSV İndir</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Kullanıcı bulunamadı.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const cleanPhoneForWa = u.phone ? u.phone.replace(/[^\d]/g, '') : null;
                  const waNumber = cleanPhoneForWa?.startsWith('0') ? '90' + cleanPhoneForWa.slice(1) : (cleanPhoneForWa || '');

                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-amber-500/10 border-amber-400/40' 
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: User details */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                          u.isVip ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs truncate">{u.name}</span>
                            {u.role === 'admin' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                ADMİN
                              </span>
                            )}
                            {u.authProvider === 'google' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Google
                              </span>
                            )}
                            {u.authProvider === 'whatsapp_otp' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                WhatsApp OTP
                              </span>
                            )}
                            {u.isVip ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                👑 VIP ({u.vipPlan || 'Aktif'})
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
                                Free
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {u.email}
                          </div>

                          {/* Phone number and direct WhatsApp link */}
                          <div className="flex items-center gap-2 mt-1 text-[11px]">
                            {u.phone ? (
                              <>
                                <span className="font-mono text-emerald-400 font-bold">{u.phone}</span>
                                <a
                                  href={`https://wa.me/${waNumber}?text=Merhaba%20${encodeURIComponent(u.name)}%2C%20ProAnaliz%20AI%20destek%20ekibinden%20yaz%C4%B1yorum.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold border border-emerald-500/30 transition-colors"
                                  title="WhatsApp ile Sohbet Başlat"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-400" />
                                  <span>WhatsApp</span>
                                </a>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEditPhone(u.id, u.phone)}
                                className="text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                              >
                                + Telefon Ekle
                              </button>
                            )}

                            {u.vipExpiresAt && (
                              <span className="text-[10px] text-slate-500">
                                • VIP Bitiş: {new Date(u.vipExpiresAt).toLocaleDateString('tr-TR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                        {/* VIP Duration Quick Actions */}
                        <button
                          onClick={() => handleGiveVip(u.id, 7, '7 Gün Hediye VIP')}
                          className="px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/20 text-[10px] font-bold transition-colors cursor-pointer"
                          title="7 Gün VIP Tanımla"
                        >
                          +7G VIP
                        </button>
                        <button
                          onClick={() => handleGiveVip(u.id, 30, 'Aylık VIP')}
                          className="px-2 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[10px] font-black transition-colors cursor-pointer"
                          title="30 Gün VIP Tanımla"
                        >
                          +30G VIP
                        </button>

                        {/* Reset / Change User Password */}
                        <button
                          onClick={() => handleResetUserPassword(u.id, u.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] transition-colors cursor-pointer border border-slate-700 hover:border-amber-400/50"
                          title={`"${u.name}" adlı kullanıcının şifresini değiştir / sıfırla`}
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Toggle Admin */}
                        {!isCurrent && (
                          <button
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors cursor-pointer"
                            title={u.role === 'admin' ? 'Yetkiyi Düşür' : 'Admin Yap'}
                          >
                            <ShieldCheck className={`w-3.5 h-3.5 ${u.role === 'admin' ? 'text-rose-400' : 'text-slate-400'}`} />
                          </button>
                        )}

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

        {/* TAB 2: SUPPORT TICKETS (DESTEK TALEPLERİ) */}
        {activeTab === 'tickets' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 mb-3 shrink-0">
              <button
                onClick={() => setTicketFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  ticketFilter === 'all' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Tümü ({tickets.length})
              </button>
              <button
                onClick={() => setTicketFilter('open')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  ticketFilter === 'open' ? 'bg-rose-500 text-white font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Açık ({tickets.filter(t => t.status === 'open').length})
              </button>
              <button
                onClick={() => setTicketFilter('in_progress')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  ticketFilter === 'in_progress' ? 'bg-sky-500 text-white font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                İnceleniyor ({tickets.filter(t => t.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setTicketFilter('resolved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  ticketFilter === 'resolved' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Çözüldü ({tickets.filter(t => t.status === 'resolved').length})
              </button>
            </div>

            {/* Tickets list */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs">
              {(() => {
                const filteredTickets = tickets.filter(t => ticketFilter === 'all' || t.status === ticketFilter);
                if (filteredTickets.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 rounded-2xl bg-slate-950/60 border border-slate-800">
                      Bu filtreye uygun destek talebi bulunamadı.
                    </div>
                  );
                }
                return filteredTickets.map((t) => {
                  const replyText = replyTextMap[t.id] ?? (t.adminReply || '');
                  return (
                    <div key={t.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500">#{t.id}</span>
                          <span className="font-black text-white text-sm">{t.subject}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300 uppercase">
                            {t.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={t.status}
                            disabled={updatingTicketId === t.id}
                            onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value, replyText)}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer"
                          >
                            <option value="open">Açık (Yeni)</option>
                            <option value="in_progress">İnceleniyor</option>
                            <option value="resolved">Çözüldü</option>
                            <option value="closed">Kapatıldı</option>
                          </select>
                        </div>
                      </div>

                      {/* User Info & Message */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Gönderen:</span>
                          <span className="font-bold text-slate-200">{t.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">E-Posta:</span>
                          <a href={`mailto:${t.email}`} className="text-amber-400 hover:underline">{t.email}</a>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Telefon / WhatsApp:</span>
                          {t.phone ? (
                            <a
                              href={`https://wa.me/${t.phone.replace(/[^\d]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>{t.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-600">Belirtilmedi</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs leading-relaxed">
                        {t.message}
                      </div>

                      {/* Admin Reply & Action */}
                      <div className="pt-2 space-y-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            <span>Yönetici Cevabı</span>
                          </span>
                          {t.repliedAt && (
                            <span className="text-slate-500 text-[10px]">
                              Son cevap: {new Date(t.repliedAt).toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Kullanıcıya iletilecek yönetici yanıtı..."
                            value={replyText}
                            onChange={(e) => setReplyTextMap(prev => ({ ...prev, [t.id]: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-400"
                          />
                          <button
                            type="button"
                            disabled={updatingTicketId === t.id || !replyText.trim()}
                            onClick={() => handleUpdateTicketStatus(t.id, t.status === 'open' ? 'in_progress' : t.status, replyText)}
                            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            {updatingTicketId === t.id ? 'Kaydediliyor...' : 'Cevabı Kaydet'}
                          </button>
                          {t.status !== 'resolved' && (
                            <button
                              type="button"
                              disabled={updatingTicketId === t.id}
                              onClick={() => handleUpdateTicketStatus(t.id, 'resolved', replyText)}
                              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Çözüldü Olarak İşaretle</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* TAB 3: FINANCE & REVENUE COCKPIT */}
        {activeTab === 'finance' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 text-xs text-slate-300">
            {/* Top Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-slate-950 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Aylık Tahmini MRR</span>
                <div className="text-2xl font-black text-white font-mono">₺{(stats?.estimatedMrr || 0).toLocaleString('tr-TR')}</div>
                <div className="text-[10px] text-slate-400">Aktif {stats?.vipUsers || 0} VIP aboneden üretilen düzenli ciro</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-slate-950 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Tahmini Toplam Hacim</span>
                <div className="text-2xl font-black text-amber-300 font-mono">₺{(stats?.totalRevenue || 0).toLocaleString('tr-TR')}</div>
                <div className="text-[10px] text-slate-400">Kullanıcı başına LTV tahmini ile kümülatif hacim</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/15 to-slate-950 border border-blue-500/30 space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">VIP Dönüşüm Oranı</span>
                <div className="text-2xl font-black text-blue-300 font-mono">
                  %{stats?.totalUsers ? Math.round(((stats?.vipUsers || 0) / stats.totalUsers) * 100) : 0}
                </div>
                <div className="text-[10px] text-slate-400">Toplam {stats?.totalUsers || 0} kayıtlı kullanıcı içindeki payı</div>
              </div>
            </div>

            {/* Retention & Expiring Soon List */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs sm:text-sm">🚨 3 Gün İçinde Süresi Bitecek VIP Üyeler (Kritik Hatırlatma)</h3>
                    <p className="text-[10px] text-slate-400">Aboneliği bitmek üzere olan üyelere tek tıkla indirimli WhatsApp teklifi gönderin.</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                  {stats?.expiringSoonCount || 0} Üye
                </span>
              </div>

              {stats?.expiringSoonUsers && stats.expiringSoonUsers.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {stats.expiringSoonUsers.map((u: any) => {
                    const cleanPhone = u.phone ? u.phone.replace(/[^\d]/g, '') : null;
                    const waNumber = cleanPhone?.startsWith('0') ? '90' + cleanPhone.slice(1) : (cleanPhone || '');
                    const daysLeft = Math.max(1, Math.ceil((u.vipExpiresAt - Date.now()) / (24 * 3600 * 1000)));

                    return (
                      <div key={u.id} className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-white text-xs">{u.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {u.phone || u.email} • <span className="text-rose-400 font-bold">{daysLeft} gün kaldı</span>
                          </div>
                        </div>

                        {u.phone ? (
                          <a
                            href={`https://wa.me/${waNumber}?text=Merhaba%20${encodeURIComponent(u.name)}%2C%20ProAnaliz%20AI%20VIP%20%C3%BCyeli%C4%9Finiz%20${daysLeft}%20g%C3%BCn%20i%C3%A7inde%20sona%20eriyor.%20Bug%C3%BCne%20%C3%B6zel%20%2530%20yenileme%20f\u0131rsat\u0131n\u0131%20ka%C3%A7\u0131rmay\u0131n!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center gap-1 transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp Teklifi</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Telefon yok</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/40 text-center text-slate-500 text-xs">
                  Şu an süresi bitmek üzere olan acil kullanıcı bulunmuyor. Tüm VIP süreleri güvende!
                </div>
              )}
            </div>

            {/* Plan Pricing Matrix */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h3 className="font-black text-amber-300 text-xs uppercase tracking-wider">Aktif VIP Fiyatlandırma Politikası</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Haftalık VIP:</div>
                  <div className="font-black text-white text-sm">350 ₺ / Hafta</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Aylık VIP (Popüler):</div>
                  <div className="font-black text-amber-400 text-sm">990 ₺ / Ay</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Sezonluk / Yıllık VIP:</div>
                  <div className="font-black text-emerald-400 text-sm">4.900 ₺ / Sezon</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EDITOR CURATED COUPONS (CMS) */}
        {activeTab === 'editor_coupons' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs text-slate-300">
            {/* Top Action: Add New Editor Coupon Button */}
            <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <div>
                <h3 className="font-black text-white text-xs sm:text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Yönetici &amp; Editör Özel Kuponları</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Buradan oluşturacağınız kuponlar ana sayfadaki Kuponlar bölümünün en başında altın rozetle sergilenir.
                </p>
              </div>

              <button
                onClick={() => setIsAddingCoupon(!isAddingCoupon)}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingCoupon ? 'İptal' : 'Yeni Kupon Ekle'}</span>
              </button>
            </div>

            {/* Coupon Creation Form */}
            {isAddingCoupon && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-slate-950 border border-amber-400/40 space-y-3">
                <div className="font-black text-amber-300 text-sm">👑 Yeni Yönetici Kuponu Oluştur</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Kupon Başlığı</label>
                    <input
                      type="text"
                      value={couponTitle}
                      onChange={(e) => setCouponTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Alt Açıklama</label>
                    <input
                      type="text"
                      value={couponSubtitle}
                      onChange={(e) => setCouponSubtitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Güven Skoru (%)</label>
                    <input
                      type="number"
                      min="50"
                      max="99"
                      value={couponConfidence}
                      onChange={(e) => setCouponConfidence(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Kategori</label>
                    <select
                      value={couponCategory}
                      onChange={(e: any) => setCouponCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="football">Futbol (İddaa)</option>
                      <option value="horses">At Yarışı (TJK)</option>
                      <option value="stocks">Borsa &amp; Kripto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Erişim Tipi</label>
                    <select
                      value={couponIsVipOnly ? 'vip' : 'free'}
                      onChange={(e) => setCouponIsVipOnly(e.target.value === 'vip')}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="vip">👑 VIP Özel (Free Kilitli)</option>
                      <option value="free">🆓 Herkese Açık (Ücretsiz)</option>
                    </select>
                  </div>
                </div>

                {/* Match Rows */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Kupon Maçları ({couponMatches.length})</span>
                    <button
                      type="button"
                      onClick={handleAddMatchRow}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      + Maç Ekle
                    </button>
                  </div>

                  {couponMatches.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <input
                          type="text"
                          placeholder="Ev Sahibi (Örn: Real Madrid)"
                          value={m.homeTeam}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCouponMatches(prev => prev.map((item, i) => i === idx ? { ...item, homeTeam: val } : item));
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-400"
                        />
                        <input
                          type="text"
                          placeholder="Deplasman (Örn: Barcelona)"
                          value={m.awayTeam}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCouponMatches(prev => prev.map((item, i) => i === idx ? { ...item, awayTeam: val } : item));
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-400"
                        />
                        <input
                          type="text"
                          placeholder="Tahmin (Örn: 2.5 ÜST)"
                          value={m.prediction}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCouponMatches(prev => prev.map((item, i) => i === idx ? { ...item, prediction: val } : item));
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-400"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.05"
                            placeholder="Oran"
                            value={m.odds}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCouponMatches(prev => prev.map((item, i) => i === idx ? { ...item, odds: val } : item));
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMatchRow(idx)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Maçı Çıkar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCoupon(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditorCoupon}
                    className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    👑 Kuponu Yayına Al
                  </button>
                </div>
              </div>
            )}

            {/* List of Published Editor Coupons */}
            <div className="space-y-3">
              {editorCoupons.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Henüz yayında bir yönetici kuponu bulunmuyor.
                </div>
              ) : (
                editorCoupons.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">{c.title}</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                            {c.isVipOnly ? 'VIP ÖZEL' : 'HERKESE AÇIK'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{c.subtitle}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Toplam Oran</div>
                          <div className="text-sm font-black text-amber-400 font-mono">{c.totalOdds}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteEditorCoupon(c.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer"
                          title="Yayından Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      {c.matches.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800/50 last:border-0">
                          <span className="text-white font-medium">{m.homeTeam} - {m.awayTeam}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-300 font-mono">{m.prediction}</span>
                            <span className="font-mono text-emerald-400">{m.odds}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BOT & DATA SERVICES HEALTH */}
        {activeTab === 'system' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs sm:text-sm">Canlı Botlar &amp; Veri Akışı Durumu</h3>
                    <p className="text-[10px] text-slate-400">Tüm dış veri kaynakları ve yapay zeka hesaplama motorları anlık izleniyor.</p>
                  </div>
                </div>

                {onRefreshBulletin && (
                  <button
                    onClick={() => {
                      onRefreshBulletin();
                      showFeedback('Bülten ve maç formları zorla yenileniyor...');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Zorla Senkronize Et</span>
                  </button>
                )}
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {servicesHealth?.services?.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-black text-white text-xs">{s.name}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black">
                        {s.latencyMs} ms
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Sağlık Skoru: <strong className="text-emerald-400">%{s.healthScore}</strong></span>
                      <span>Son Senk: {Math.round((Date.now() - s.lastSync) / 1000)} sn önce</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Server Specifications */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h3 className="font-black text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>Bulut Sunucu Metrikleri (Render Production)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Uptime (Çalışma Süresi):</div>
                  <div className="font-bold text-white font-mono">{Math.floor(servicesHealth?.server?.uptimeSeconds / 60 || 1)} Dakika</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Bellek (RAM) Tüketimi:</div>
                  <div className="font-bold text-emerald-400 font-mono">{servicesHealth?.server?.memoryMb || 85} MB</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Node Çalışma Ortamı:</div>
                  <div className="font-bold text-blue-300 font-mono">{servicesHealth?.server?.nodeVersion || 'v20.x'} (Linux)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROMO CODES */}
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
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
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

        {/* TAB 6: FREE VS VIP TIERS */}
        {activeTab === 'tiers' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="font-black text-white text-sm flex items-center gap-2">
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

        {/* TAB 7: SITE ANNOUNCEMENT CMS */}
        {activeTab === 'announcement' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs sm:text-sm">Site Genel Duyurusu &amp; Kayan Yazı CMS</h3>
                    <p className="text-[10px] text-slate-400">
                      Tüm ziyaretçilerin ve üyelerin en üst bantta göreceği anlık bildirimi buradan yönetin.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                  <input
                    type="checkbox"
                    checked={announcementEnabled}
                    onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 cursor-pointer"
                  />
                  <span className={`text-xs font-black ${announcementEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {announcementEnabled ? '🟢 CANLI YAYINDA' : '⚪ PASİF'}
                  </span>
                </label>
              </div>

              {/* Theme color variant selection */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1.5">Duyuru Tema Rengi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setAnnouncementVariant('gold')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      announcementVariant === 'gold' 
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 ring-1 ring-amber-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>👑 Altın VIP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementVariant('emerald')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      announcementVariant === 'emerald' 
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🟢 Kazanç Yeşil</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementVariant('rose')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      announcementVariant === 'rose' 
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 ring-1 ring-rose-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🚨 Önemli / Kırmızı</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementVariant('blue')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      announcementVariant === 'blue' 
                        ? 'bg-blue-500/20 border-blue-400 text-blue-300 ring-1 ring-blue-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>ℹ️ Bilgi Mavi</span>
                  </button>
                </div>
              </div>

              {/* Text input */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Duyuru Metni</label>
                <textarea
                  rows={2}
                  placeholder="Örn: 🔥 Günün Banko Kuponu & TJK Cazip Tekleri Eklendi! VIP üyelerimize bol kazançlar dileriz."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              {/* Optional Link */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Tıklanabilir Yönlendirme Linki (Opsiyonel)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Örn: https://t.me/proanaliz veya kupon detay linki"
                    value={announcementLink}
                    onChange={(e) => setAnnouncementLink(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Canlı Önizleme:</span>
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 shadow-lg ${
                  announcementVariant === 'gold' ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 border-amber-400/40 text-amber-200' :
                  announcementVariant === 'emerald' ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-emerald-400/40 text-emerald-200' :
                  announcementVariant === 'rose' ? 'bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-rose-500/20 border-rose-400/40 text-rose-200' :
                  'bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 border-blue-400/40 text-blue-200'
                }`}>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-white/20 text-white shrink-0">
                      DUYURU
                    </span>
                    <span className="truncate">{announcementText || 'Duyuru metni buraya gelecek...'}</span>
                  </div>
                  {announcementLink && (
                    <span className="text-[10px] underline font-black shrink-0">İncele →</span>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAnnouncement}
                  disabled={savingAnnouncement}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${savingAnnouncement ? 'animate-spin' : ''}`} />
                  <span>{savingAnnouncement ? 'Kaydediliyor...' : '💾 Duyuruyu Kaydet & Canlıya Al'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs sm:text-sm">Canlı Aktivite Günlüğü &amp; Denetim İzi</h3>
                    <p className="text-[10px] text-slate-400">
                      Kayıt olan üyeler, VIP tanımlamaları, kupon paylaşımları ve güvenlik olayları kronolojik listelenir.
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadData}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Güncelle</span>
                </button>
              </div>

              {/* Logs List */}
              <div className="space-y-2 pt-1">
                {stats?.activityLogs && stats.activityLogs.length > 0 ? (
                  stats.activityLogs.map((log: any) => {
                    const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                    const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleDateString('tr-TR') : '';

                    let badgeColor = 'bg-slate-800 text-slate-300';
                    if (log.type === 'REGISTER') badgeColor = 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
                    else if (log.type === 'VIP_GRANT') badgeColor = 'bg-amber-400/20 text-amber-300 border border-amber-400/30';
                    else if (log.type === 'COUPON_CREATED') badgeColor = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
                    else if (log.type === 'ANNOUNCEMENT_UPDATE') badgeColor = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                    else if (log.type === 'USER_DELETE') badgeColor = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';

                    return (
                      <div key={log.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${badgeColor}`}>
                              {log.type}
                            </span>
                            <span className="font-bold text-white text-xs">{log.message}</span>
                          </div>
                          {log.meta && Object.keys(log.meta).length > 0 && (
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {JSON.stringify(log.meta)}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0 text-[10px] text-slate-500 font-mono">
                          <div>{timeStr}</div>
                          <div>{dateStr}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Henüz kayıtlı bir denetim aktivitesi bulunmuyor.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};