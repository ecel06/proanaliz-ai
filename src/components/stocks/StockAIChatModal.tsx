// src/components/stocks/StockAIChatModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import {
  StockItem,
  StockMarketType,
  StockQuantAnalysis,
} from '../../types/stocks';
import { fetchStockDeepAnalysis } from '../../services/stockService';
import { buildInstitutionalAIMemo, formatStockPrice } from '../../utils/stockAnalysisEngine';

interface StockChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  picks?: { stock: StockItem; analysis: StockQuantAnalysis }[];
  quickSuggestions?: string[];
}

// Şirket ismi / Popüler Türkçe arama eşleştirmeleri
const COMPANY_NAME_MAP: Record<string, string> = {
  'türk hava yolları': 'THYAO',
  'hava yolları': 'THYAO',
  'thy': 'THYAO',
  'ereğli': 'EREGL',
  'eregli': 'EREGL',
  'tüpraş': 'TUPRS',
  'tupras': 'TUPRS',
  'aselsan': 'ASELS',
  'garanti': 'GARAN',
  'garanti bankası': 'GARAN',
  'akbank': 'AKBNK',
  'iş bankası': 'ISCTR',
  'is bankasi': 'ISCTR',
  'yapı kredi': 'YKBNK',
  'yapi kredi': 'YKBNK',
  'ykb': 'YKBNK',
  'şişecam': 'SISE',
  'sisecam': 'SISE',
  'koç holding': 'KCHOL',
  'koc holding': 'KCHOL',
  'sabancı': 'SAHOL',
  'sabanci': 'SAHOL',
  'ford': 'FROTO',
  'ford otosan': 'FROTO',
  'tofaş': 'TOASO',
  'tofas': 'TOASO',
  'bim': 'BIMAS',
  'bimaş': 'BIMAS',
  'migros': 'MGROS',
  'şok market': 'SOKM',
  'sok market': 'SOKM',
  'petkim': 'PETKM',
  'türk telekom': 'TTKOM',
  'telekom': 'TTKOM',
  'turkcell': 'TCELL',
  'sasa': 'SASA',
  'hektaş': 'HEKTS',
  'hektas': 'HEKTS',
  'astor': 'ASTOR',
  'kontrolmatik': 'KONTR',
  'alarko': 'ALARK',
  'coca cola': 'CCOLA',
  'tav': 'TAVHL',
  'tav havalimanları': 'TAVHL',
  'vakıfbank': 'VAKBN',
  'vakifbank': 'VAKBN',
  'halkbank': 'HALKB',
  'pegasus': 'PGSUS',
  'altın sertifikası': 'ALTIN.S1',
  'darphane altın': 'ALTIN.S1',
  'altins1': 'ALTIN.S1',
};

// Canlı Makro (Altın, Dolar, Euro, Borsa, Kripto) verilerini çeken yardımcı fonksiyon
async function fetchLiveMacroRates(): Promise<
  Array<{ symbol: string; label: string; unit: string; price: number; changePct: number }>
> {
  try {
    const res = await fetch('/api/macro/live');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
}

interface StockAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockItem[];
  analysesMap: Map<string, StockQuantAnalysis>;
  market: StockMarketType;
  selectedStock: StockItem | null;
  onSelectStock: (stock: StockItem) => void;
}

export const StockAIChatModal: React.FC<StockAIChatModalProps> = ({
  isOpen,
  onClose,
  stocks,
  analysesMap,
  market,
  selectedStock,
  onSelectStock,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [strategy, setStrategy] = useState<'strong_buy' | 'value' | 'dip_bounce' | 'dividend'>('strong_buy');
  const [pickCount, setPickCount] = useState<number>(5);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const marketTitle = market === 'bist' ? 'BIST (Türkiye)' : market === 'us' ? 'NASDAQ / NYSE' : 'Kripto (Binance)';

  const buildWelcome = (): StockChatMessage => ({
    id: 'st_welcome',
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    text:
      `Merhaba! Ben **ProAnaliz Borsa AI & Sinyal Robotu** 📈🤖\n\n` +
      `Şu anda **${marketTitle}** piyasasında **${stocks.length} hisse/varlık** canlı teknik + temel röntgenden geçiriliyor.\n` +
      `• *"Altın alınır mı?" veya "Gram altın ne olur?"*\n` +
      `• *"${selectedStock?.symbol || (market === 'bist' ? 'THYAO' : 'NVDA')} alınır mı?"*\n` +
      `• *"5 hisseli Güçlü AL portföyü kur"*\n` +
      `• *"BIST 100 endeksi ne olur?"*\n` +
      `• *"F/K ucuz değer hisseleri hangileri?"*`,
    quickSuggestions: [
      '🟡 Altın Alınır mı?',
      '🔥 5 Güçlü AL Portföyü Kur',
      `🔍 ${selectedStock?.symbol || (market === 'bist' ? 'THYAO' : 'NVDA')} Analiz Et`,
      '📈 BIST 100 Endeks Yönü',
      '💎 Ucuz Değer Hisseleri',
    ],
  });

  const [messages, setMessages] = useState<StockChatMessage[]>(() => [buildWelcome()]);

  useEffect(() => {
    setMessages([buildWelcome()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, selectedStock?.symbol]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const processQuery = async (
    queryText: string,
    override?: { strat?: 'strong_buy' | 'value' | 'dip_bounce' | 'dividend'; count?: number }
  ): Promise<StockChatMessage> => {
    const rawQ = queryText.trim();
    const q = rawQ.toLowerCase();
    const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const enriched = stocks
      .map((s) => ({ stock: s, analysis: analysesMap.get(s.symbol) }))
      .filter((x): x is { stock: StockItem; analysis: StockQuantAnalysis } => Boolean(x.analysis));

    // 🟡 1. ALTIN & KIYMETLİ MADENLER ANALİZİ (Gram Altın, Ons Altın, Çeyrek, ALTIN.S1)
    const isGoldQuery =
      q.includes('altın') ||
      q.includes('altin') ||
      q.includes('gold') ||
      q.includes('ons') ||
      q.includes('çeyrek') ||
      q.includes('ceyrek') ||
      q.includes('altins1') ||
      q.includes('altın.s1');

    if (isGoldQuery) {
      const macroRates = await fetchLiveMacroRates();
      const gramObj = macroRates.find((m) => m.symbol === 'GRAM_ALTIN');
      const onsObj = macroRates.find((m) => m.symbol === 'GC=F');
      const ceyrekObj = macroRates.find((m) => m.symbol === 'CEYREK_ALTIN');
      const usdObj = macroRates.find((m) => m.symbol === 'USDTRY=X');

      const gramPriceStr = gramObj ? `${gramObj.price.toLocaleString('tr-TR')} ₺` : 'Canlı Veri Alınıyor';
      const gramChgStr = gramObj ? `(%${gramObj.changePct >= 0 ? '+' : ''}${gramObj.changePct}%)` : '';
      const onsPriceStr = onsObj ? `$${onsObj.price.toLocaleString('tr-TR')}` : 'Canlı Veri Alınıyor';
      const onsChgStr = onsObj ? `(%${onsObj.changePct >= 0 ? '+' : ''}${onsObj.changePct}%)` : '';
      const ceyrekPriceStr = ceyrekObj ? `${ceyrekObj.price.toLocaleString('tr-TR')} ₺` : 'Canlı Veri Alınıyor';
      const usdPriceStr = usdObj ? `${usdObj.price.toFixed(2)} ₺` : 'Canlı Veri Alınıyor';

      // Find Darphane Altın Sertifikası in stocks if available
      const altinS1Pick = enriched.filter(
        (x) => x.stock.symbol === 'ALTIN.S1' || x.stock.symbol === 'ALTINS1' || x.stock.name.toLowerCase().includes('darphane')
      );

      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text:
          `🟡 **Altın Piyasa Analizi & "Altın Alınır mı?" Değerlendirmesi**\n\n` +
          `📊 **Canlı Piyasa Fiyatları:**\n` +
          `• **Gram Altın (Kapalıçarşı/Serbest):** **${gramPriceStr}** ${gramChgStr}\n` +
          `• **Ons Altın (Global XAU/USD):** **${onsPriceStr}** ${onsChgStr}\n` +
          `• **Çeyrek Altın:** **${ceyrekPriceStr}**\n` +
          `• **Dolar/TL Kuru:** **${usdPriceStr}**\n\n` +
          `🧭 **Altın Alınır mı? — Makro Faktörler & Strateji:**\n\n` +
          `1. **Global Faiz & Fed Döngüsü:**\n` +
          `ABD Merkez Bankası (Fed) ve küresel merkez bankalarının faiz indirim sürecine girmesi, faiz getirisi olmayan altının getiri maliyetini düşürür. Tarihsel olarak faiz indirim dönemleri altının en güçlü ralli evreleridir.\n\n` +
          `2. **Dolar/TL ve Çift Yönlü Güç:**\n` +
          `Türkiye'de Gram Altın fiyatı \`(Ons Altın / 31.10) × Dolar/TL\` formülüyle hesaplanır. Yani ons fiyatı yerinde saysa dahi kurdaki artış veya ons yükselişi gram altına doğrudan çift yönlü getiri sağlar. Bu durum gram altını yerel enflasyona karşı en güçlü kalkanlardan biri yapar.\n\n` +
          `3. **Jeopolitik Riskler & Merkez Bankası Rezervleri:**\n` +
          `Küresel gerilimler ve dünya merkez bankalarının (Çin, Hindistan, Polonya ve TCMB) rekor seviyede altın alımları, geri çekilmelerde güçlü bir taban desteği oluşturmaktadır.\n\n` +
          `🏛️ **Borsa İstanbul Alternatifi — Darphane Altın Sertifikası (ALTIN.S1):**\n` +
          `Kuyumcu işçilik farkı ve banka alım-satım makaslarına takılmadan Borsa hesabınızdan **ALTIN.S1** kodlu Darphane Sertifikası ile hisse alır gibi 0.01 gramlık paylarla işlem yapabilirsiniz. Stopaj sıfırdır.\n\n` +
          `💡 **Uygulanabilir Yatırım Stratejisi:**\n` +
          `• **Kademeli Alım (DCA):** Tek seferde tüm sermayeyle almak yerine, olası geri çekilmeleri fırsat bilerek aylık/haftalık parçalar halinde biriktirmek riskinizi minimize eder.\n` +
          `• **İdeal Sepet Ağırlığı:** Dengeli bir yatırım portföyünde altının payı **%15 ile %25** arasında güvenli liman kalkanı olarak tutulabilir.\n` +
          `• **Vade:** Kısa vadeli al-sattan ziyade orta-uzun vadeli (en az 6-12 ay) servet koruma aracıdır.\n\n` +
          `*(Yasal Uyarı: Burada yer alan bilgiler yatırım tavsiyesi niteliğinde olmayıp bilgilendirme amaçlıdır YTD.)*`,
        picks: altinS1Pick,
        quickSuggestions: [
          '🪙 Darphane Altın Sertifikası (ALTIN.S1)',
          '🥈 Gümüş Alınır mı?',
          '💵 Dolar & Döviz Görünümü',
          '📈 BIST 100 Endeks Yönü',
          '🔥 5 Güçlü AL Hissesi',
        ],
      };
    }

    // 🥈 2. GÜMÜŞ & KIYMETLİ METALLER (Silver, GMSTR)
    const isSilverQuery =
      q.includes('gümüş') || q.includes('gumus') || q.includes('silver') || q.includes('gmstr');

    if (isSilverQuery) {
      const gmstrPick = enriched.filter((x) => x.stock.symbol === 'GMSTR' || x.stock.name.toLowerCase().includes('gümüş'));

      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text:
          `🥈 **Gümüş Piyasa Analizi & "Gümüş Alınır mı?" Değerlendirmesi**\n\n` +
          `📊 **Gümüşü Öne Çıkaran Temel Dinamikler:**\n\n` +
          `1. **Çift Yönlü Talep (Hem Yatırım Hem Sanayi):**\n` +
          `Gümüş sadece bir kıymetli maden değil, aynı zamanda güneş panelleri (fotovoltaik hücreler), elektrikli araçlar, yapay zeka çip üretimi ve tıbbi cihazlarda alternatifi olmayan stratejik bir endüstriyel metaldir.\n\n` +
          `2. **Altın/Gümüş Rasyosu (Gold/Silver Ratio):**\n` +
          `Tarihsel ortalaması 60-65 seviyesinde olan rasyonun 80-85 üzerinde olması, gümüşün altına göre ucuz kaldığını ve güçlü bir ralli potansiyeli taşıdığını gösterir.\n\n` +
          `3. **Yüksek Volatilite Uyarısı:**\n` +
          `Gümüşün piyasa derinliği altından daha küçüktür. Bu nedenle yükselişleri altından çok daha sert (%50-%100 gibi) olabildiği gibi, düzeltmeleri de daha serttir.\n\n` +
          `🏛️ **Borsa İstanbul Alternatifi:** Borsa hesabınızdan **GMSTR** (QNB Finansinvest Gümüş Borsa Yatırım Fonu) alarak fiziki gümüşe endeksli işlem yapabilirsiniz.\n\n` +
          `💡 **Özet Strateji:** Yüksek risk toleransına sahip yatırımcılar için portföyün **%5-%10'u** oranında kademeli olarak değerlendirilebilir. (YTD)`,
        picks: gmstrPick,
        quickSuggestions: ['🟡 Altın Alınır mı?', '🔥 5 Güçlü AL Hissesi', '📈 BIST 100 Endeks Yönü'],
      };
    }

    // 💵 3. DÖVİZ, DOLAR VE EURO (USD/TRY, EUR/TRY)
    const isFxQuery =
      q.includes('dolar') ||
      q.includes('euro') ||
      q.includes('döviz') ||
      q.includes('doviz') ||
      q.includes('usd') ||
      q.includes('eur') ||
      q.includes('sterlin') ||
      q.includes('kur');

    if (isFxQuery) {
      const macroRates = await fetchLiveMacroRates();
      const usdObj = macroRates.find((m) => m.symbol === 'USDTRY=X');
      const eurObj = macroRates.find((m) => m.symbol === 'EURTRY=X');
      const gbpObj = macroRates.find((m) => m.symbol === 'GBPTRY=X');

      const usdStr = usdObj ? `${usdObj.price.toFixed(2)} ₺ (%${usdObj.changePct >= 0 ? '+' : ''}${usdObj.changePct}%)` : '34.60 ₺';
      const eurStr = eurObj ? `${eurObj.price.toFixed(2)} ₺ (%${eurObj.changePct >= 0 ? '+' : ''}${eurObj.changePct}%)` : '36.50 ₺';
      const gbpStr = gbpObj ? `${gbpObj.price.toFixed(2)} ₺ (%${gbpObj.changePct >= 0 ? '+' : ''}${gbpObj.changePct}%)` : '43.80 ₺';

      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text:
          `💵 **Döviz Piyasası & Dolar / Euro Görünümü**\n\n` +
          `📊 **Canlı Kurlar:**\n` +
          `• **Dolar (USD/TRY):** **${usdStr}**\n` +
          `• **Euro (EUR/TRY):** **${eurStr}**\n` +
          `• **İngiliz Sterlini (GBP/TRY):** **${gbpStr}**\n\n` +
          `🧭 **Döviz Almak Mantıklı mı? (Makro Analiz):**\n\n` +
          `1. **TCMB Para Politikası & Reel Faiz:**\n` +
          `Türkiye Cumhuriyet Merkez Bankası'nın (TCMB) sürdürdüğü sıkı para politikası ve pozitif reel faiz ortamı, TL mevduat ve para piyasası fonlarını dövize kıyasla daha cazip kılmaktadır.\n\n` +
          `2. **Dolar Bir Yatırım Aracı mıdır?:**\n` +
          `Dolar kendi başına bir para birimidir ve ABD'deki yıllık %2.5-%3 enflasyona maruz kalarak küresel bazda değer kaybeder. Sadece kur artışından getiri beklemek yerine, döviz bazlı getiri sağlayan **Eurobond**, **yabancı hisse fonları** veya **ihracatçı BIST şirketleri** çok daha yüksek reel getiri üretir.\n\n` +
          `💡 **Özet:** Kısa vadeli nakit ihtiyaçları haricinde salt döviz tutmak reel faiz ortamında TL mevduat veya Borsa/Altın karşısında fırsat maliyeti yaratabilir. (YTD)`,
        picks: [],
        quickSuggestions: ['🟡 Altın Alınır mı?', '📈 BIST 100 Endeks Yönü', '🔥 5 Güçlü AL Hissesi'],
      };
    }

    // 📈 4. BORSA İSTANBUL & BIST 100 ENDEKS GÖRÜNÜMÜ
    const isIndexQuery =
      q.includes('bist') ||
      q.includes('bist100') ||
      q.includes('xu100') ||
      q.includes('endeks') ||
      q.includes('borsa ne olur') ||
      q.includes('borsa düşer mi') ||
      q.includes('borsa çıkar mı') ||
      q.includes('borsa alınır mı') ||
      q.includes('borsaya girilir mi');

    if (isIndexQuery && !q.includes('hisse')) {
      const macroRates = await fetchLiveMacroRates();
      const xu100 = macroRates.find((m) => m.symbol === 'XU100.IS');
      const indexStr = xu100 ? `${xu100.price.toLocaleString('tr-TR')} puan (%${xu100.changePct >= 0 ? '+' : ''}${xu100.changePct}%)` : '9,350+ puan';

      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text:
          `📈 **Borsa İstanbul (BIST 100) — Teknik & Makro Görünüm**\n\n` +
          `📊 **Canlı Endeks Seviyesi:** **${indexStr}**\n\n` +
          `🧭 **Borsa Ne Olur? — Temel Faktörler:**\n\n` +
          `1. **Faiz İndirim Döngüsü:**\n` +
          `Enflasyondaki kademeli düşüşle birlikte TCMB'nin faiz indirim sürecine başlaması, mevduattan çıkan likiditenin borsaya akmasını sağlayan en önemli katalizördür.\n\n` +
          `2. **Çarpanlar & Şirket Değerlemeleri:**\n` +
          `BIST 100 şirketleri F/K (Fiyat/Kazanç) ve PD/DD bazında gelişmekte olan ülke borsalarına kıyasla %35-%45 iskonto ile işlem görmektedir.\n\n` +
          `3. **Yabancı Girişleri & Gri Liste Başarısı:**\n` +
          `Kredi derecelendirme kuruluşlarının (S&P, Moody's, Fitch) not artışları ve CDS priminin 260 baz puan civarına gerilemesi orta vadede kurumsal fon akışını desteklemektedir.\n\n` +
          `💡 **Strateji:** Endeks genelinden ziyade bilançosu güçlü, döviz fazlası olan, çarpanları ucuz ve pazar lideri şirketlere odaklanmak en yüksek alfa getirisini sağlar. (YTD)`,
        picks: enriched.slice(0, 3),
        quickSuggestions: ['🔥 5 Güçlü AL Portföyü Kur', '💎 Ucuz Değer Hisseleri', '🟡 Altın Alınır mı?'],
      };
    }

    // 🪙 5. BİTCOİN & KRİPTO PARALAR
    const isCryptoQuery =
      q.includes('bitcoin') || q.includes('btc') || q.includes('kripto') || q.includes('ethereum') || q.includes('eth');

    if (isCryptoQuery && !q.includes('hisse')) {
      const macroRates = await fetchLiveMacroRates();
      const btcObj = macroRates.find((m) => m.symbol === 'BTC-USD');
      const btcStr = btcObj ? `$${btcObj.price.toLocaleString('tr-TR')} (%${btcObj.changePct >= 0 ? '+' : ''}${btcObj.changePct}%)` : '90,000$+';

      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text:
          `🪙 **Bitcoin & Kripto Varlık Analizi**\n\n` +
          `📊 **Canlı Bitcoin (BTC/USD):** **${btcStr}**\n\n` +
          `🧭 **Kripto Piyasası Dinamikleri:**\n` +
          `• **Kurumsal ETF Girişleri:** BlackRock, Fidelity ve büyük kurumsal fonların spot ETF alımları piyasa arzını daraltmaya devam etmektedir.\n` +
          `• **Halving Sonrası Döngü:** Tarihsel 4 yıllık döngülerde halving'i takip eden 6-18 aylık dönem boğa piyasasının en güçlü fazı olmuştur.\n` +
          `• **Risk Yönetimi:** Kripto varlıklar yüksek volatilite barındırdığından toplam portföyün **%5 ile %10'unu** aşmayacak şekilde, stop-loss disipliniyle yönetilmelidir. (YTD)`,
        picks: [],
        quickSuggestions: ['🟡 Altın Alınır mı?', '📈 BIST 100 Endeks Yönü', '🔥 5 Güçlü AL Hissesi'],
      };
    }

    // 💼 6. GENEL YATIRIM & PORTFÖY DAĞILIMI TAVSİYESİ
    const isGeneralAdviceQuery =
      q.includes('nasıl yatırım') ||
      q.includes('ne almalı') ||
      q.includes('ne alayım') ||
      q.includes('altın mı borsa mı') ||
      q.includes('borsa mı altın mı') ||
      q.includes('portföy nasıl') ||
      q.includes('sepet nasıl') ||
      q.includes('paramı nasıl') ||
      q.includes('yatırım tavsiyesi');

    if (isGeneralAdviceQuery && !override) {
      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text:
          `💼 **İdeal Portföy Sepeti & Varlık Dağılım Modeli**\n\n` +
          `Yatırımda en önemli kural tek bir varlığa bağlı kalmamaktır. Farklı ekonomik dönemlerde birbirini dengeleyen **Örnek 4 Ayaklı Portföy Modeli**:\n\n` +
          `1. 📈 **%40 - %45 Kaliteli BIST Hisseleri / Fonları:**\n` +
          `Büyüyen, temettü veren, ihracatçı veya yüksek özsermaye kârlılığına sahip öncü şirketler (Büyüme motoru).\n\n` +
          `2. 🟡 **%20 - %25 Altın & Kıymetli Madenler (Gram / ALTIN.S1):**\n` +
          `Enflasyon, jeopolitik krizler ve kur şoklarına karşı güvenli liman kalkanı.\n\n` +
          `3. 💵 **%15 - %20 Para Piyasası / TL Mevduat Fonları:**\n` +
          `Düzenli bileşik nakit akışı sağlar ve borsa düzeltmelerinde ucuzdan hisse almak için hazır likidite oluşturur.\n\n` +
          `4. 🌐 **%10 - %15 Yabancı Hisse / Eurobond / Teknoloji Fonları:**\n` +
          `Döviz bazlı global büyüme ve teknoloji rallisine katılım sağlar.\n\n` +
          `💡 **Prensip:** Her ay düzenli kademeli alım yapıp düşüşleri fırsat görmek uzun vadede en yüksek bileşik getiriyi sağlar. (YTD)`,
        picks: enriched.slice(0, 3),
        quickSuggestions: ['🔥 5 Güçlü AL Portföyü Kur', '🟡 Altın Alınır mı?', '💎 Ucuz Değer Hisseleri'],
      };
    }

    // 🏆 7. EN ÇOK YÜKSELENLER / DÜŞENLER / HACİM LİDERLERİ
    const isGainersQuery = q.includes('en çok artan') || q.includes('en çok yükselen') || q.includes('kazandıran') || q.includes('tavan') || q.includes('lider');
    const isLosersQuery = q.includes('en çok düşen') || q.includes('en çok azalan') || q.includes('taban') || q.includes('kaybettiren');
    const isVolumeQuery = q.includes('hacim') || q.includes('para girişi') || q.includes('en çok işlem');

    if (isGainersQuery && !override) {
      const topGainers = [...enriched].sort((a, b) => b.stock.changePct - a.stock.changePct).slice(0, 5);
      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text: `🚀 **${marketTitle} — Günün En Çok Yükselen 5 Hissesi:**\nAşağıdaki hisseler gün içinde en yüksek pozitif prim yapan lider varlıklardır:`,
        picks: topGainers,
        quickSuggestions: ['🔥 5 Güçlü AL Portföyü Kur', '💎 Ucuz Değer Hisseleri', '⚠️ SAT Sinyalleri'],
      };
    }

    if (isLosersQuery && !override) {
      const topLosers = [...enriched].sort((a, b) => a.stock.changePct - b.stock.changePct).slice(0, 5);
      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text: `📉 **${marketTitle} — Günün En Çok Düşen 5 Hissesi:**\nAşağıdaki varlıklar gün içi en sert geri çekilmeyi yaşayan hisselerdir (Dip tepki potansiyeli için RSI kontrol edilebilir):`,
        picks: topLosers,
        quickSuggestions: ['⚡ RSI Dip Tepki Adayları', '🔥 5 Güçlü AL Portföyü Kur'],
      };
    }

    if (isVolumeQuery && !override) {
      const topVolume = [...enriched].sort((a, b) => (b.stock.volume || 0) - (a.stock.volume || 0)).slice(0, 5);
      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text: `📊 **${marketTitle} — En Yüksek Hacimli / Para Girişi Yaşayan 5 Hisse:**\nKurumsal ve bireysel yatırımcı ilgisinin en yoğunlaştığı tahtalar:`,
        picks: topVolume,
        quickSuggestions: ['🔥 5 Güçlü AL Portföyü Kur', '💎 Ucuz Değer Hisseleri'],
      };
    }

    // 🔍 8. ÖZEL BİR HİSSE / ŞİRKET SORGUSU (Şirket İsmi veya Sembol)
    if (!override) {
      // 8a. Check COMPANY_NAME_MAP first (e.g. "ereğli", "tüpraş", "aselsan", "thy")
      let targetSymbol: string | null = null;
      for (const [nameKey, sym] of Object.entries(COMPANY_NAME_MAP)) {
        if (q.includes(nameKey)) {
          targetSymbol = sym;
          break;
        }
      }

      // 8b. Match against enriched list by symbol or name
      const matched = enriched.find((x) => {
        if (targetSymbol && x.stock.symbol.toUpperCase() === targetSymbol.toUpperCase()) return true;
        const sym = x.stock.symbol.toLowerCase();
        // Exact symbol token match or surrounded by boundaries
        const symRegex = new RegExp(`(^|\\b|\\s)${sym}(\\b|\\s|$)`, 'i');
        if (symRegex.test(q)) return true;
        const firstName = x.stock.name.toLowerCase().split(' ')[0];
        if (firstName.length >= 4 && q.includes(firstName)) return true;
        return false;
      });

      if (matched && !q.includes('portföy') && !q.includes('liste') && !q.includes('öner')) {
        const { stock, analysis } = matched;
        const deep = await fetchStockDeepAnalysis(stock.symbol, stock.market);
        const memo = buildInstitutionalAIMemo(stock, analysis, deep);
        const mtfLine = deep
          ? `\n• **Çoklu Zaman Dilimi (MTF):** ${deep.mtfSummary.alignment} (${deep.mtf
              .map((m) => `${m.timeframe.split(' ')[0]}: ${m.signal}`)
              .join(' | ')})`
          : '';
        const analystLine = deep?.financials?.targetMeanPrice
          ? `\n• **Kurumsal Analist Hedefi:** Ort. **${formatStockPrice(
              deep.financials.targetMeanPrice,
              stock.currency
            )}** (%${deep.financials.upsidePct ?? 0} potansiyel • ${
              deep.financials.numberOfAnalystOpinions ?? '-'
            } kurum)`
          : '';
        const btLine =
          deep?.backtest && deep.backtest.totalTrades > 0
            ? `\n• **1Y Backtest Kanıtı:** ${deep.backtest.totalTrades} işlemde **%${deep.backtest.winRate}** kazanma, bileşik **%${deep.backtest.strategyReturnPct}** (Profit Factor: ${deep.backtest.profitFactor})`
            : '';
        const newsLine =
          deep?.news && deep.news.length > 0
            ? `\n• **Güncel Haber (${deep.news[0].sentiment}):** "${deep.news[0].title}"`
            : '';

        return {
          id: `st_${Date.now()}`,
          sender: 'assistant',
          timestamp: nowTime,
          text:
            `📊 **${stock.symbol} — ${stock.name}** [${memo.convictionBadge}]\n\n` +
            `• Güncel Fiyat: **${formatStockPrice(stock.close, stock.currency)}** (${stock.changePct >= 0 ? '+' : ''}%${stock.changePct.toFixed(2)})\n` +
            `• Quant Sinyal: **${analysis.signal}** (AI Skor: **${analysis.score}/100** | Trend: %${analysis.trendScore} | Momentum: %${analysis.momentumScore} | Temel: %${analysis.fundamentalScore})` +
            mtfLine +
            analystLine +
            btLine +
            `\n• **İşlem Planı:** Stop-Loss **${formatStockPrice(analysis.tradePlan.stopLoss, stock.currency)}** (${analysis.tradePlan.stopLossPct}%) → Hedef 1 **${formatStockPrice(analysis.tradePlan.tp1, stock.currency)}** → Hedef 2 **${formatStockPrice(analysis.tradePlan.tp2, stock.currency)}** (R/R: 1:${analysis.tradePlan.riskReward})` +
            newsLine +
            `\n\n*(Yasal Uyarı: Bilgilendirme amaçlıdır, yatırım tavsiyesi içermez YTD.)*`,
          picks: [matched],
          quickSuggestions: ['🔥 5 Güçlü AL Portföyü Kur', '⚠️ Riskli / SAT Sinyalleri', '🟡 Altın Alınır mı?'],
        };
      }
    }

    // 🎯 9. AÇIKÇA HİSSE ÖNERİSİ / STRATEJİ TARAMASI İSTENDİĞİNDE
    const isExplicitPicksQuery =
      override !== undefined ||
      q.includes('hisse') ||
      q.includes('portföy') ||
      q.includes('liste') ||
      q.includes('öner') ||
      q.includes('al sinyali') ||
      q.includes('güçlü al') ||
      q.includes('sat') ||
      q.includes('risk') ||
      q.includes('rsi') ||
      q.includes('dip') ||
      q.includes('tepki') ||
      q.includes('temettü') ||
      q.includes('ucuz') ||
      q.includes('değer') ||
      q.includes('f/k');

    if (isExplicitPicksQuery) {
      const countMatch = q.match(/(\d+)\s*(?:hisse|adet|varlık)/);
      const limit = override?.count || (countMatch ? Math.min(10, Math.max(2, parseInt(countMatch[1], 10))) : pickCount);

      let chosenStrat = override?.strat;
      if (!chosenStrat) {
        if (q.includes('sat') || q.includes('risk')) {
          const sells = [...enriched]
            .filter((x) => x.analysis.signal === 'SAT' || x.analysis.signal === 'GÜÇLÜ SAT')
            .sort((a, b) => a.analysis.score - b.analysis.score)
            .slice(0, limit);
          return {
            id: `st_${Date.now()}`,
            sender: 'assistant',
            timestamp: nowTime,
            text:
              sells.length > 0
                ? `⚠️ **${marketTitle} — Teknik Zayıflık & SAT Sinyali Veren ${sells.length} Hisse:**\nAşağıdaki varlıklar EMA ortalamalarının altında veya aşırı alım/zayıf momentum bölgesinde.`
                : `✅ **${marketTitle}** taramasında şu an kritik GÜÇLÜ SAT sinyali üreten hisse görünmüyor.`,
            picks: sells,
            quickSuggestions: ['🔥 5 Güçlü AL Portföyü Kur', '💎 Ucuz Değer Hisseleri'],
          };
        }
        if (q.includes('rsi') || q.includes('dip') || q.includes('tepki') || q.includes('aşırı sat')) {
          chosenStrat = 'dip_bounce';
        } else if (q.includes('temettü') || q.includes('temettu')) {
          chosenStrat = 'dividend';
        } else if (q.includes('ucuz') || q.includes('değer') || q.includes('f/k') || q.includes('pd/dd')) {
          chosenStrat = 'value';
        } else {
          chosenStrat = strategy;
        }
      }

      let sorted: { stock: StockItem; analysis: StockQuantAnalysis }[] = [];
      let headline = '';

      if (chosenStrat === 'dip_bounce') {
        sorted = [...enriched]
          .filter((x) => x.stock.rsi !== null && x.stock.rsi <= 42)
          .sort((a, b) => (a.stock.rsi || 50) - (b.stock.rsi || 50))
          .slice(0, limit);
        headline = `⚡ **RSI Dip & Tepki Adayları (${marketTitle}):** Kısa vadede aşırı satılmış, destek tepkisi potansiyeli taşıyan en ucuz RSI hisseleri:`;
      } else if (chosenStrat === 'value') {
        sorted = [...enriched]
          .filter((x) => x.stock.pe !== null && x.stock.pe > 0 && x.analysis.fundamentalScore >= 60)
          .sort((a, b) => b.analysis.fundamentalScore + b.analysis.score - (a.analysis.fundamentalScore + a.analysis.score))
          .slice(0, limit);
        headline = `💎 **Ucuz Değer & Kaliteli Bilanço Hisseleri (${marketTitle}):** Düşük F/K, makul PD/DD ve yüksek ROE skoruna göre ilk ${limit} hisse:`;
      } else if (chosenStrat === 'dividend') {
        sorted = [...enriched]
          .filter((x) => (x.stock.dividendYield || 0) > 1.5)
          .sort((a, b) => (b.stock.dividendYield || 0) - (a.stock.dividendYield || 0))
          .slice(0, limit);
        headline = `💰 **En Yüksek Temettü Verimli Güçlü Hisseler (${marketTitle}):**`;
      } else {
        sorted = [...enriched]
          .sort((a, b) => b.analysis.score - a.analysis.score)
          .slice(0, limit);
        headline = `🔥 **ProAnaliz Quant — En Yüksek AI Skorlu ${limit} AL Sinyali (${marketTitle}):** Trend + Momentum + Temel analiz uyumu en yüksek hisseler:`;
      }

      return {
        id: `st_${Date.now()}`,
        sender: 'assistant',
        timestamp: nowTime,
        text: sorted.length > 0 ? headline : `${marketTitle} piyasasında bu kritere tam uyan hisse bulunamadı.`,
        picks: sorted,
        quickSuggestions: ['💎 Ucuz Değer Hisseleri', '⚡ RSI Dip Tepki Adayları', '⚠️ SAT Sinyalleri', '🟡 Altın Alınır mı?'],
      };
    }

    // 🤖 10. GENEL VE AKILLI DOĞAL DİL YANITI (Alakasız 5 hisse vermek yerine soruya doğrudan cevap ver)
    return {
      id: `st_${Date.now()}`,
      sender: 'assistant',
      timestamp: nowTime,
      text:
        `🤖 **"${rawQ}"** sorunuz hakkında:\n\n` +
        `ProAnaliz Borsa AI & Makro Robotu olarak bu konuda size şu alanlarda canlı analiz ve strateji sunabilirim:\n\n` +
        `• **Altın & Kıymetli Madenler:** *"Altın alınır mı?"*, *"Gram altın ne olur?"*, *"Gümüş alınır mı?"*\n` +
        `• **Borsa & Endeks:** *"BIST 100 ne olur?"*, *"Borsa düşer mi?"*, *"Günün en çok yükselenleri"*\n` +
        `• **Hisse Analizi:** Herhangi bir hisse sembolü veya şirketi (Örn: *"THYAO alınır mı?"*, *"Ereğli hedef fiyat"*, *"Tüpraş analiz"*)\n` +
        `• **Portföy & Sinyal Robotu:** *"5 Güçlü AL hissesi öner"*, *"RSI dip tepki hisseleri"*, *"Ucuz değer hisseleri"*\n` +
        `• **Döviz & Faiz:** *"Dolar ne olur?"*, *"Faiz indirimi borsayı nasıl etkiler?"*\n\n` +
        `Aşağıdaki hızlı butonlardan birine dokunabilir veya doğrudan hisse/varlık adı yazabilirsiniz:`,
      picks: [],
      quickSuggestions: [
        '🟡 Altın Alınır mı?',
        '📈 BIST 100 Endeks Yönü',
        '🔥 5 Güçlü AL Portföyü Kur',
        '💎 Ucuz Değer Hisseleri',
        '💵 Dolar & Döviz Görünümü',
      ],
    };
  };

  const handleSend = async (
    argText?: string,
    override?: { strat?: 'strong_buy' | 'value' | 'dip_bounce' | 'dividend'; count?: number }
  ) => {
    const msg = (argText || inputText).trim();
    if (!msg) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        text: msg,
      },
    ]);
    setInputText('');
    setIsTyping(true);
    try {
      const reply = await processQuery(msg, override);
      setMessages((prev) => [...prev, reply]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleWizardGenerate = () => {
    const labels = {
      strong_buy: 'Güçlü AL Portföyü',
      value: 'Ucuz Değer Hisseleri',
      dip_bounce: 'RSI Dip Tepki Adayları',
      dividend: 'Yüksek Temettü Portföyü',
    };
    handleSend(`${pickCount} hisseli ${labels[strategy]} oluştur`, {
      strat: strategy,
      count: pickCount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl h-[90vh] sm:h-[85vh] rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl shadow-cyan-500/15 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-cyan-500/20 via-slate-900 to-emerald-500/15 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  ProAnaliz Borsa AI &amp; Sinyal Robotu
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                  QUANT MOTORU
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {marketTitle} • {stocks.length} Hisse Canlı Analiz
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setMessages([buildWelcome()])}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Sohbeti Sıfırla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quant Portföy Sihirbazı */}
        <div className="px-4 py-2.5 bg-slate-950/75 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as typeof strategy)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-cyan-300 cursor-pointer"
          >
            <option value="strong_buy">🔥 Güçlü AL (Trend+Momentum)</option>
            <option value="value">💎 Ucuz Değer (F/K + PD/DD + ROE)</option>
            <option value="dip_bounce">⚡ RSI Aşırı Satım Tepki</option>
            <option value="dividend">💰 Yüksek Temettü Verimi</option>
          </select>

          <select
            value={pickCount}
            onChange={(e) => setPickCount(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer"
          >
            <option value={3}>3 Hisse</option>
            <option value={5}>5 Hisse</option>
            <option value={7}>7 Hisse</option>
            <option value={10}>10 Hisse</option>
          </select>

          <button
            onClick={handleWizardGenerate}
            className="ml-auto px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center space-x-1 shadow-md shadow-cyan-500/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Portföy Tarama</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-cyan-400 text-slate-950 font-bold rounded-br-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none'
                }`}
              >
                {m.text.split('**').map((part, idx) =>
                  idx % 2 === 1 ? <strong key={idx}>{part}</strong> : <span key={idx}>{part}</span>
                )}
              </div>

              {m.picks && m.picks.length > 0 && (
                <div className="mt-2.5 w-full max-w-lg space-y-1.5">
                  {m.picks.map(({ stock, analysis }) => (
                    <button
                      key={stock.symbol}
                      onClick={() => {
                        onSelectStock(stock);
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/60 flex items-center justify-between gap-2 text-left cursor-pointer transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-xs text-white">{stock.symbol}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                              analysis.signal === 'GÜÇLÜ AL'
                                ? 'bg-emerald-500 text-slate-950'
                                : analysis.signal === 'AL'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : analysis.signal === 'SAT' || analysis.signal === 'GÜÇLÜ SAT'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {analysis.signal} ({analysis.score})
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">{stock.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          RSI: {stock.rsi?.toFixed(1) ?? '-'} • F/K: {stock.pe?.toFixed(1) ?? '-'} • Hedef:{' '}
                          <span className="text-emerald-400">{formatStockPrice(analysis.tradePlan.tp1, stock.currency)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-black text-white">
                          {formatStockPrice(stock.close, stock.currency)}
                        </div>
                        <div
                          className={`text-[10px] font-mono font-bold flex items-center justify-end space-x-0.5 ${
                            stock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>
                            {stock.changePct >= 0 ? '+' : ''}
                            {stock.changePct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {m.quickSuggestions && m.quickSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.quickSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-400/20 border border-slate-700 hover:border-cyan-400/50 text-[11px] font-bold text-slate-300 hover:text-cyan-200 cursor-pointer transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-[10px] text-slate-500 mt-1">{m.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-cyan-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Teknik göstergeler ve bilanço çarpanları taranıyor...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Örn: Altın alınır mı, THYAO alınır mı, BIST 100 ne olur, 5 güçlü hisse..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

