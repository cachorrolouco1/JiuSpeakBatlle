import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Coins, 
  Sparkles, 
  User, 
  Award, 
  Activity, 
  Zap, 
  Flame, 
  Shield, 
  Clock, 
  ChevronRight, 
  HelpCircle, 
  Search, 
  SlidersHorizontal,
  Plus, 
  Trophy, 
  Grid, 
  ArrowRightLeft, 
  History, 
  Check, 
  AlertCircle, 
  X,
  RefreshCw,
  Gift
} from 'lucide-react';
import { useAuth } from './AuthContext';

// Standard Interfaces for Shop state
interface StoreItem {
  id: string;
  name: string;
  type: 'card' | 'pack' | 'cosmetic' | 'booster' | 'vip' | 'battlepass';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  price: number;
  is_premium: boolean;
  image: string;
  description: string;
  details?: any;
}

interface UserInventory {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  acquired_at: string;
}

interface CardCollection {
  id: string;
  user_id: string;
  card_id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  level: number;
  xp: number;
  translation_en: string;
  translation_pt: string;
  image: string;
  acquired_at: string;
}

interface MarketplaceListing {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_belt: string;
  seller_image: string;
  card_id: string;
  item_name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  price: number;
  is_sold: boolean;
  buyer_id?: string;
  buyer_name?: string;
  created_at: string;
}

interface PurchaseHistory {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  amount: number;
  currency: 'OSS' | 'USD';
  payment_method: string;
  created_at: string;
}

export default function VirtualStore() {
  const { user: currentUser, token, refreshUser } = useAuth();

  // Selected tab
  const [activeShopTab, setActiveShopTab] = useState<'all' | 'cards' | 'packs' | 'cosmetics' | 'boosters' | 'market' | 'ledger'>('all');

  // Loading and error indicators
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // States fetched from authentic Express endpoints
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [inventory, setInventory] = useState<UserInventory[]>([]);
  const [cards, setCards] = useState<CardCollection[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);

  // Simulation states & details
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<StoreItem | null>(null);
  const [simulatedCardToSell, setSimulatedCardToSell] = useState<CardCollection | null>(null);
  const [sellPriceInput, setSellPriceInput] = useState('');
  const [simulatedCardDetails, setSimulatedCardDetails] = useState<CardCollection | null>(null);

  // Premium checkout simulation
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'Coins' | 'Stripe' | 'PIX' | 'GooglePay' | 'ApplePay' | 'PlayBilling' | 'AppStore'>('Coins');
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  
  // Custom Live PIX state trackers
  const [currentPixData, setCurrentPixData] = useState<{
    qr_code: string;
    copia_cola: string;
    expires_at: string;
    payment_id: string;
  } | null>(null);
  const [pixConfirming, setPixConfirming] = useState(false);
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [cashbackReceivedCoins, setCashbackReceivedCoins] = useState<number | null>(null);

  // Gacha opening simulation state
  const [openedPackCards, setOpenedPackCards] = useState<any[]>([]);
  const [showPackOpeningArena, setShowPackOpeningArena] = useState(false);
  const [currentOpeningPackName, setCurrentOpeningPackName] = useState('');
  const [revealedIdx, setRevealedIdx] = useState(0);

  // Load everything
  const loadData = async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const headersOptions = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      // 1. Vitrine
      const resItems = await fetch('/api/store/items', { headers: headersOptions });
      const dataItems = await resItems.json();
      if (dataItems.items) setStoreItems(dataItems.items);

      if (token) {
        // 2. Inventário
        const resInv = await fetch('/api/store/inventory', { headers: headersOptions });
        const dataInv = await resInv.json();
        if (dataInv.inventory) setInventory(dataInv.inventory);

        // 3. Deck de cartas
        const resCards = await fetch('/api/store/cards', { headers: headersOptions });
        const dataCards = await resCards.json();
        if (dataCards.cards) setCards(dataCards.cards);

        //  purchase ledger
        const resLedg = await fetch('/api/store/purchases', { headers: headersOptions });
        const dataLedg = await resLedg.json();
        if (dataLedg.purchases) setPurchases(dataLedg.purchases);
      }

      // 5. Mercado de técnicas
      const resMarket = await fetch('/api/store/marketplace', { headers: headersOptions });
      const dataMarket = await resMarket.json();
      if (dataMarket.listings) setListings(dataMarket.listings);

    } catch (err: any) {
      setErrorText('Falha de rede ao conectar com o servidor da JiuSpeak Arena.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle Free Chest Claim
  const handleClaimFreeChest = async () => {
    if (!token) return;
    setLoading(true);
    setErrorText(null);
    setSuccessText(null);
    try {
      const res = await fetch('/api/store/daily-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessText(data.message);
        refreshUser();
        loadData();
      } else {
        setErrorText(data.error || 'Erro ao resgatar recompensa.');
      }
    } catch (err: any) {
      setErrorText('Erro ao enviar requisição para o dojo.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Purchase order
  const handleInitiatePurchase = (item: StoreItem) => {
    setSelectedItemForPurchase(item);
    // Reset any old PIX state trackers
    setCurrentPixData(null);
    setPixConfirming(false);
    setPixConfirmed(false);
    setCopiedKey(false);
    setCashbackReceivedCoins(null);
    setErrorText(null);
    setSuccessText(null);

    if (item.is_premium) {
      setCheckoutPaymentMethod('PIX'); // Default to PIX for sleek Brazilian gateway display!
    } else {
      setCheckoutPaymentMethod('Coins');
    }
  };

  // Process purchase checkout
  const handleConfirmPurchase = async () => {
    if (!token || !selectedItemForPurchase) return;
    setCheckoutProcessing(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const res = await fetch('/api/store/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: selectedItemForPurchase.id,
          paymentMethod: checkoutPaymentMethod
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.purchase && data.purchase.is_pix) {
          setCurrentPixData({
            qr_code: data.purchase.qr_code,
            copia_cola: data.purchase.copia_cola,
            expires_at: data.purchase.expires_at,
            payment_id: data.purchase.payment_id
          });
          setPixConfirmed(false);
          setSuccessText(data.message);
        } else {
          setSuccessText(data.message);
          setSelectedItemForPurchase(null);
          refreshUser();
          loadData();
        }
      } else {
        setErrorText(data.error || 'A transação falhou.');
      }
    } catch (err: any) {
      setErrorText('Ocorreu um erro no pipeline de pagamento.');
    } finally {
      setCheckoutProcessing(false);
    }
  };

  // Trigger simulated PIX instant webhook callback release
  const handleTriggerPixConfirmation = async () => {
    if (!token || !currentPixData) return;
    setPixConfirming(true);
    setSuccessText(null);
    setErrorText(null);

    try {
      const res = await fetch('/api/payments/pix/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentId: currentPixData.payment_id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPixConfirmed(true);
        setSuccessText(data.message);
        if (data.cashbackCoins) {
          setCashbackReceivedCoins(data.cashbackCoins);
        }
        refreshUser();
        loadData();
      } else {
        setErrorText(data.error || 'Erro ao simular webhook de liberação PIX.');
      }
    } catch (err: any) {
      setErrorText('Falha ao comunicar confirmação com o servidor do dojo.');
    } finally {
      setPixConfirming(false);
    }
  };

  // Open card packs from inventory (Gacha animated stage)
  const handleOpenPack = async (packItemId: string, packName: string) => {
    if (!token) return;
    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const res = await fetch('/api/store/pack/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packItemId })
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentOpeningPackName(packName);
        setOpenedPackCards(data.cards);
        setRevealedIdx(0);
        setShowPackOpeningArena(true);
        refreshUser();
        loadData();
      } else {
        setErrorText(data.error || 'Não foi possível desempacotar este item.');
      }
    } catch (err) {
      setErrorText('Falha no motor de abertura gacha.');
    } finally {
      setLoading(false);
    }
  };

  // Upgrade Card
  const handleUpgradeCard = async (userCardId: string) => {
    if (!token) return;
    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const res = await fetch('/api/store/card/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userCardId })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessText(data.message);
        setSimulatedCardDetails(null); // close dialog
        refreshUser();
        loadData();
      } else {
        setErrorText(data.error || 'Falha ao processar upgrade.');
      }
    } catch (err) {
      setErrorText('Erro ao enviar ordens de subida de nível.');
    } finally {
      setLoading(false);
    }
  };

  // Peer to peer marketplace auction listing
  const handleSellCard = async () => {
    if (!token || !simulatedCardToSell || !sellPriceInput) return;
    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const res = await fetch('/api/store/marketplace/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userCardId: simulatedCardToSell.id,
          price: Number(sellPriceInput)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessText(data.message);
        setSimulatedCardToSell(null);
        setSellPriceInput('');
        loadData();
      } else {
        setErrorText(data.error || 'Erro ao publicar seu anúncio.');
      }
    } catch (err) {
      setErrorText('Pipeline de leilão rejeitado pelo servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Peer to peer Buy listed card
  const handleBuyMarketCard = async (listingId: string) => {
    if (!token) return;
    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const res = await fetch('/api/store/marketplace/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ listingId })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessText(data.message);
        refreshUser();
        loadData();
      } else {
        setErrorText(data.error || 'Compra de anúncio indisponível.');
      }
    } catch (err) {
      setErrorText('Pipeline do leilão quebrou ao processar compra.');
    } finally {
      setLoading(false);
    }
  };

  // Peer to peer Cancel listing
  const handleCancelMarketCard = async (listingId: string) => {
    if (!token) return;
    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const res = await fetch('/api/store/marketplace/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ listingId })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessText(data.message);
        loadData();
      } else {
        setErrorText(data.error || 'Erro ao cancelar o anúncio.');
      }
    } catch (err) {
      setErrorText('Erro ao enviar cancelamento ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Helper colors mapping for rarities matching Clash Royale / Fortnite aesthetic
  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case 'Mythic':
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-300 font-extrabold shadow-yellow-500/20';
      case 'Legendary':
        return 'bg-gradient-to-r from-red-600 to-orange-500 text-white border-red-400 font-black shadow-red-600/20';
      case 'Epic':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 font-bold shadow-purple-500/10';
      case 'Rare':
        return 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 font-bold shadow-blue-500/10';
      default:
        return 'bg-[#1e293b] text-neutral-300 border-neutral-700 shadow-sm';
    }
  };

  const getRarityCardBorderStyle = (rarity: string) => {
    switch (rarity) {
      case 'Mythic':
        return 'border-amber-500/80 shadow-lg shadow-amber-500/15 ring-2 ring-yellow-400/30';
      case 'Legendary':
        return 'border-red-600/80 shadow-lg shadow-red-600/15 ring-1 ring-orange-500/20';
      case 'Epic':
        return 'border-purple-600/80 shadow-md shadow-purple-600/10';
      case 'Rare':
        return 'border-blue-600/80 shadow-sm shadow-blue-600/10';
      default:
        return 'border-neutral-800 hover:border-neutral-700';
    }
  };

  const getCardBgStyle = (rarity: string) => {
    switch (rarity) {
      case 'Mythic':
        return 'bg-gradient-to-b from-[#1c1917] via-[#0c0a09] to-[#1c1917]';
      case 'Legendary':
        return 'bg-gradient-to-b from-[#1a1415] via-[#0a0607] to-[#1a1415]';
      case 'Epic':
        return 'bg-gradient-to-b from-[#13111c] via-[#07050d] to-[#13111c]';
      case 'Rare':
        return 'bg-gradient-to-b from-[#0e1624] via-[#050811] to-[#0e1624]';
      default:
        return 'bg-gradient-to-b from-[#121212] to-[#0a0a0a]';
    }
  };

  return (
    <div className="text-white min-h-screen font-sans">
      
      {/* 🪙 CORE ECONOMIC MARQUEE STATUS BANNER */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800/80 rounded-2xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 bg-amber-500/10 w-24 h-24 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 bg-red-600/5 w-36 h-36 rounded-full blur-3xl" />

        <div className="flex items-center gap-4 relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-black text-2xl shadow-xl shadow-amber-500/20 animate-pulse">
            🪙
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold block">
              Dojo JiuSpeak Economy
            </span>
            <h2 className="text-xl font-black font-sans uppercase tracking-tight flex items-center gap-2">
              OSS Coins Virtual Store
            </h2>
            <p className="text-xs text-neutral-400">
              Negocie técnicas, compre customizações premium para a Arena e aperfeiçoe sua coleção!
            </p>
          </div>
        </div>

        {/* Dynamic balances indicators */}
        <div className="flex items-center gap-4 flex-wrap justify-center relative">
          {/* OSS Balance Pill */}
          <div className="bg-neutral-950 border border-amber-500/30 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-inner">
            <Coins className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <span className="text-[8px] font-mono uppercase text-neutral-500 block">Sua Carteira</span>
              <span className="text-lg font-black font-mono text-amber-400">
                {(currentUser?.coins !== undefined ? currentUser.coins : 2500).toLocaleString()}
              </span>
              <span className="text-[8px] font-sans font-bold text-amber-500 ml-1">OSS</span>
            </div>
          </div>

          {/* VIP Pass Status Badge */}
          <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all ${
            currentUser?.is_vip 
              ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/30 shadow-md'
              : 'bg-neutral-950 border-neutral-800'
          }`}>
            <Award className={`w-5 h-5 ${currentUser?.is_vip ? 'text-amber-400 animate-bounce' : 'text-neutral-500'}`} />
            <div>
              <span className="text-[8px] font-mono uppercase text-neutral-500 block">Assinatura VIP</span>
              <span className={`text-[11px] font-black uppercase block ${currentUser?.is_vip ? 'text-amber-400' : 'text-neutral-400'}`}>
                {currentUser?.is_vip ? 'CONCEDIDO (Gladiador)' : 'Nenhum Ativo'}
              </span>
              <span className="text-[8px] text-neutral-500 font-sans block">Passe: S{currentUser?.battle_pass_tier || 1} Tier 1</span>
            </div>
          </div>

          {/* Daily chest rewards claims button with dynamic action */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClaimFreeChest}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-4 py-3 rounded-xl font-bold text-xs uppercase shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center gap-2"
          >
            <Gift className="w-4 h-4 text-black animate-bounce" />
            <span>Baú Grátis 📦</span>
          </motion.button>
        </div>
      </div>

      {/* 📢 TRANSATIONAL NOTIFIER SLIDER */}
      <AnimatePresence>
        {successText && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neutral-950 border-l-4 border-emerald-500 text-neutral-200 p-4 rounded-xl flex items-center gap-3 relative overflow-hidden mb-6"
          >
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-black block">Operação com sucesso</span>
              <p className="text-xs text-neutral-300 font-medium">{successText}</p>
            </div>
            <button onClick={() => setSuccessText(null)} className="text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {errorText && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neutral-950 border-l-4 border-red-500 text-neutral-200 p-4 rounded-xl flex items-center gap-3 relative overflow-hidden mb-6"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-red-400 font-black block">Transação cancelada</span>
              <p className="text-xs text-neutral-300 font-medium">{errorText}</p>
            </div>
            <button onClick={() => setErrorText(null)} className="text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 STORE TABS NAVIGATOR (Clash Royale Style Categories Selector) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8 border-b border-neutral-900">
        <button
          onClick={() => setActiveShopTab('all')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-full text-xs font-mono uppercase tracking-wider transition-all border whitespace-nowrap ${
            activeShopTab === 'all'
              ? 'bg-white text-black border-white font-bold'
              : 'bg-[#0f0f0f] text-neutral-400 border-neutral-900 hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Ver Vitrine</span>
        </button>

        <button
          onClick={() => setActiveShopTab('cards')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-full text-xs font-mono uppercase tracking-wider transition-all border whitespace-nowrap ${
            activeShopTab === 'cards'
              ? 'bg-purple-600 text-white border-purple-500 font-bold'
              : 'bg-[#0f0f0f] text-neutral-400 border-neutral-900 hover:text-white'
          }`}
        >
          <span>🃏 Cards de Técnicas</span>
        </button>

        <button
          onClick={() => setActiveShopTab('packs')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-full text-xs font-mono uppercase tracking-wider transition-all border whitespace-nowrap ${
            activeShopTab === 'packs'
              ? 'bg-rose-600 text-white border-rose-500 font-bold'
              : 'bg-[#0f0f0f] text-neutral-400 border-neutral-900 hover:text-white'
          }`}
        >
          <span>📦 Pacotes Gacha</span>
        </button>

        <button
          onClick={() => setActiveShopTab('cosmetics')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-full text-xs font-mono uppercase tracking-wider transition-all border whitespace-nowrap ${
            activeShopTab === 'cosmetics'
              ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
              : 'bg-[#0f0f0f] text-neutral-400 border-neutral-900 hover:text-white'
          }`}
        >
          <span>👺 Cosméticos & Emojis</span>
        </button>

        <button
          onClick={() => setActiveShopTab('boosters')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-full text-xs font-mono uppercase tracking-wider transition-all border whitespace-nowrap ${
            activeShopTab === 'boosters'
              ? 'bg-amber-600 text-white border-amber-500 font-bold'
              : 'bg-[#0f0f0f] text-neutral-400 border-neutral-900 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Boosters</span>
        </button>

        <button
          onClick={() => setActiveShopTab('market')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-full text-xs font-mono uppercase tracking-wider transition-all border whitespace-nowrap ${
            activeShopTab === 'market'
              ? 'bg-amber-500 text-black border-amber-400 font-black'
              : 'bg-[#0f0f0f] text-neutral-400 border-neutral-900 hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Marketplace (Leilão)</span>
        </button>

        <button
          onClick={() => setActiveShopTab('ledger')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-full text-xs font-mono uppercase tracking-wider transition-all border whitespace-nowrap ${
            activeShopTab === 'ledger'
              ? 'bg-neutral-800 text-white border-neutral-700 font-bold'
              : 'bg-[#0f0f0f] text-neutral-400 border-neutral-900 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Minhas Compras ({purchases.length})</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      )}

      {/* 🌟 1. MY CARD COLLECTION DECK (Clash Royale Style Card Upgrades) */}
      {activeShopTab === 'cards' && (
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-6">
            <h3 className="text-lg font-black uppercase tracking-tight text-purple-400 mb-1 flex items-center gap-2">
              <span>🃏 Meu Deck de Técnicas Esportivas</span>
              <span className="text-xs font-black font-sans px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full lowercase text-neutral-400">
                {cards.length} cartas em posse
              </span>
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              Acumule duplicadas nas lições ou abra card packs gacha da loja. Quando possuir XP suficiente, faça upgrades com OSS Coins para expandir o nível de suas finalizações e ganhar prestígio no dojo!
            </p>

            {cards.length === 0 ? (
              <div className="text-center py-12 bg-neutral-950 border border-neutral-900 rounded-3xl">
                <p className="text-neutral-500 text-xs">Você ainda não possui nenhum card de BJJ na sua coleção.</p>
                <button 
                  onClick={() => setActiveShopTab('packs')}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xs font-bold uppercase"
                >
                  Adquirir Pacotes de Cards
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {cards.map((c) => {
                  let reqXp = c.level === 1 ? 10 : c.level === 2 ? 20 : c.level === 3 ? 40 : 80;
                  let upgradeCost = c.level === 1 ? 100 : c.level === 2 ? 250 : c.level === 3 ? 600 : 1200;
                  let hasXpToUpgrade = c.xp >= reqXp;

                  return (
                    <motion.div
                      key={c.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      onClick={() => setSimulatedCardDetails(c)}
                      className={`cursor-pointer rounded-2xl border p-4 flex flex-col items-center text-center relative overflow-hidden h-[260px] select-none transition-all ${getRarityCardBorderStyle(c.rarity)} ${getCardBgStyle(c.rarity)}`}
                    >
                      {/* Rarity Label Floating */}
                      <span className={`absolute top-2 left-2 text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border leading-none ${getRarityBadgeStyle(c.rarity)}`}>
                        {c.rarity}
                      </span>

                      {/* Card illustration */}
                      <div className="text-5xl my-6 animate-pulse select-none">{c.image}</div>

                      {/* Level Tag */}
                      <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full mb-2">
                        Lvl {c.level || 1}
                      </span>

                      {/* Title */}
                      <h4 className="text-xs font-black tracking-tight line-clamp-1 text-white uppercase text-center mb-1">
                        {c.name}
                      </h4>

                      {/* Duplicates indicator progress bar */}
                      <div className="mt-auto w-full space-y-1">
                        <div className="flex items-center justify-between text-[8px] font-mono font-bold text-neutral-400">
                          <span>CARTAS</span>
                          <span className={hasXpToUpgrade ? 'text-green-400 font-extrabold' : ''}>
                            {c.xp}/{reqXp}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800 p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${hasXpToUpgrade ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-purple-500'}`}
                            style={{ width: `${Math.min(100, (c.xp / reqXp) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick notice of upgradeable state */}
                      {hasXpToUpgrade && (
                        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🛍️ 2. STORE VITRINES DISPLAY: CARD ROTATIONS AND CONSUMABLES */}
      {(activeShopTab === 'all' || activeShopTab === 'packs' || activeShopTab === 'cosmetics' || activeShopTab === 'boosters') && (
        <div className="space-y-12">
          
          {/* PACOTES DE CARTAS CATEGORY */}
          {(activeShopTab === 'all' || activeShopTab === 'packs') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tight text-rose-500 flex items-center gap-2">
                  <span>📦 Gacha Packs (Adquira Novas Técnicas)</span>
                  <span className="text-[9px] font-mono tracking-widest bg-rose-500/10 text-rose-500 border border-rose-900/40 px-3 py-1 rounded">
                    Sorteio Aleatório
                  </span>
                </h3>
              </div>

              {/* Inventory pack stocks claim segment if owned */}
              {token && inventory.filter(inv => inv.item_id.startsWith('p_')).length > 0 && (
                <div className="bg-gradient-to-r from-rose-950/20 via-neutral-950 to-neutral-950 border border-rose-900/30 p-4 rounded-xl mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <h4 className="text-xs font-bold text-rose-400 uppercase">Seus Pacotes em Estoque</h4>
                      <p className="text-[10px] text-neutral-400">Você possui pacotes comprados que estão prontos para desempacotar!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {inventory.filter(inv => inv.item_id.startsWith('p_')).map(packInv => {
                      const st = storeItems.find(s => s.id === packInv.item_id);
                      if (!st) return null;
                      return (
                        <button
                          key={packInv.id}
                          onClick={() => handleOpenPack(st.id, st.name)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase rounded-lg shadow flex items-center gap-2"
                        >
                          <span>Abrir {st.name} ({packInv.quantity} em estoque)</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {storeItems.filter(item => item.type === 'pack').map(item => (
                  <div
                    key={item.id}
                    className="bg-[#0b0b0d] border border-neutral-900 rounded-2xl p-5 flex flex-col hover:border-neutral-800 transition-all text-center relative overflow-hidden"
                  >
                    <div className="text-6xl my-4 text-center select-none animate-bounce" style={{ animationDuration: '4s' }}>{item.image}</div>
                    <span className={`self-center text-[8px] tracking-widest uppercase font-extrabold border px-2.0 py-0.5 rounded-full mb-2 ${getRarityBadgeStyle(item.rarity)}`}>
                      {item.rarity} Pack
                    </span>
                    <h4 className="text-xs font-black uppercase text-white mb-2">{item.name}</h4>
                    <p className="text-[10px] text-neutral-400 mb-6 min-h-[30px]">{item.description}</p>
                    
                    <button
                      onClick={() => handleInitiatePurchase(item)}
                      className="mt-auto w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-amber-400 font-black font-mono text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <span>{item.price.toLocaleString()} OSS</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DYNAMIC CARD STORE RECREATION */}
          {activeShopTab === 'all' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-tight text-purple-400 flex items-center gap-2">
                <span>🥋 Rotação do Dojo (Comprar Individualmente)</span>
                <span className="text-[9px] font-mono tracking-widest bg-purple-500/10 text-purple-500 border border-purple-900/40 px-3 py-1 rounded">
                  Renova Diariamente
                </span>
              </h3>
              <p className="text-xs text-neutral-400 -mt-2">Cartas de finalização selecionadas que você pode comprar diretamente sem depender da sorte de gachas.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {storeItems.filter(item => item.type === 'card').slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    className={`bg-neutral-950 border rounded-2xl p-5 flex flex-col justify-between text-center relative overflow-hidden transition-all ${getRarityCardBorderStyle(item.rarity)}`}
                  >
                    <div className="text-5xl my-4 select-none">{item.image}</div>
                    <span className={`self-center text-[8px] tracking-widest uppercase font-bold border px-2 py-0.5 rounded-md mb-2 ${getRarityBadgeStyle(item.rarity)}`}>
                      {item.rarity}
                    </span>
                    <h4 className="text-xs font-black text-white uppercase mb-1">{item.name}</h4>
                    <p className="text-[10px] text-neutral-400 mb-4 line-clamp-2 min-h-[30px]">{item.description}</p>
                    
                    <button
                      onClick={() => handleInitiatePurchase(item)}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 rounded-xl font-mono font-black text-amber-400 text-xs border border-neutral-800 uppercase flex items-center justify-center gap-2"
                    >
                      <span>{item.price.toLocaleString()} OSS</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE COSMETICS CATEGORY */}
          {(activeShopTab === 'all' || activeShopTab === 'cosmetics') && (
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-tight text-cyan-400 flex items-center gap-2">
                <span>👺 Itens de Perfil, Molduras Animadas & Skins</span>
                <span className="text-[9px] font-mono tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-900/40 px-3 py-1 rounded">
                  Cosméticos Exclusivos
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {storeItems.filter(item => item.type === 'cosmetic').map(item => {
                  const alreadyUnlocked = currentUser?.unlocked_cosmetics?.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-[#090b0c] border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-800 transition-all text-center relative overflow-hidden"
                    >
                      <div className="text-5xl my-5 select-none">{item.image}</div>
                      <span className={`self-center text-[7px] tracking-widest uppercase border px-2.5 py-0.5 rounded-full mb-2 ${getRarityBadgeStyle(item.rarity)}`}>
                        {item.rarity} • {item.details?.category || 'cosmético'}
                      </span>
                      <h4 className="text-xs font-black uppercase text-white mb-1">{item.name}</h4>
                      <p className="text-[10px] text-neutral-400 mb-6 line-clamp-2 min-h-[30px]">{item.description}</p>
                      
                      {alreadyUnlocked ? (
                        <div className="w-full bg-cyan-950/20 border border-cyan-800/30 text-cyan-400 py-2.5 rounded-xl font-mono text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Já Adquirido</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInitiatePurchase(item)}
                          className="w-full py-2.5 bg-[#07090a] hover:bg-[#12181a] border border-neutral-800 text-amber-400 font-mono font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2"
                        >
                          <span>{item.price.toLocaleString()} OSS</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DYNAMIC BOOSTERS CATEGORY */}
          {(activeShopTab === 'all' || activeShopTab === 'boosters') && (
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-tight text-amber-600 flex items-center gap-2">
                <span>⚡ Boosters de Rendimento em Luta & Streak</span>
                <span className="text-[9px] font-mono tracking-widest bg-amber-600/10 text-amber-500 border border-amber-900/40 px-3 py-1 rounded">
                  Vantagens Temporárias
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {storeItems.filter(item => item.type === 'booster').map(item => (
                  <div
                    key={item.id}
                    className="bg-[#0d0d0c] border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-800 transition-all text-center relative overflow-hidden"
                  >
                    <div className="text-5xl my-4 text-center select-none">{item.image}</div>
                    <span className="self-center bg-amber-900/10 text-amber-500 border border-amber-900/30 text-[8px] tracking-widest uppercase font-extrabold px-3 py-0.5 rounded-full mb-2">
                      BOOSTER
                    </span>
                    <h4 className="text-xs font-black uppercase text-white mb-1">{item.name}</h4>
                    <p className="text-[10px] text-neutral-400 mb-6">{item.description}</p>
                    
                    <button
                      onClick={() => handleInitiatePurchase(item)}
                      className="w-full py-2.5 bg-neutral-950 border border-neutral-800 text-amber-400 font-mono font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2"
                    >
                      <span>{item.price.toLocaleString()} OSS</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREMIUM PRODUCTS PASSE & GLADIADOR VIP */}
          {activeShopTab === 'all' && (
            <div className="space-y-8">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-[#0d0f11] via-[#101316] to-[#0d0f11] border border-neutral-850 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 bg-amber-500/5 w-64 h-64 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest uppercase font-black bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-full">
                      💎 JiuSpeak Premium Combat Store (R$ / BRL)
                    </span>
                    <h3 className="text-xl font-black text-white uppercase mt-4 mb-2">Clube de Vantagens & Moedas OSS</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
                      Acelere seus estudos de inglês com multiplicadores de XP e certificados ilimitados. Compre moedas virtuais em Real Brasileiro (R$) para abrir pacotes de cartas e colecionar golpes do Jiu-Jítsu!
                    </p>
                  </div>
                  <div className="bg-[#18181b]/50 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3 self-stretch md:self-auto justify-center">
                    <span className="text-2xl">⚡</span>
                    <div className="text-left">
                      <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono leading-none">Benefício Extra</div>
                      <div className="text-xs font-black text-amber-500 mt-1">Cashback Ativo de 5% em PIX!</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plans Section */}
              <div>
                <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>1. Planos de Assinatura JiuSpeak</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Free Plan Static Card */}
                  <div className="bg-neutral-950/40 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-800 transition-all">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-2xl">🥋</span>
                        <span className="text-[8px] bg-neutral-800 text-neutral-400 uppercase font-mono px-2 py-0.5 rounded leading-none font-bold">Gratuito</span>
                      </div>
                      <h4 className="text-xs font-black uppercase text-white mt-3 leading-none">Plano Faixa Branca (Free)</h4>
                      <p className="text-[10px] text-neutral-400 leading-relaxed mt-2.5">
                        Acesso básico às ofensivas diárias, vocabulário essencial de tatame e duelos básicos de PvP.
                      </p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-neutral-900 flex items-center justify-between">
                      <span className="text-xs font-black text-white">R$ 0,00</span>
                      <span className="text-[9px] text-green-500 uppercase font-mono font-bold">Ativo por Padrão</span>
                    </div>
                  </div>

                  {storeItems.filter(item => item.type && (item.type.includes('sub') || item.type === 'vip' || item.type === 'battlepass')).map(item => {
                    const isVip = item.id.includes('vip') || item.id === 'vip_membership';
                    const isActive = isVip 
                      ? currentUser?.is_vip 
                      : (currentUser?.is_vip === false && currentUser?.battle_pass_tier && currentUser.battle_pass_tier > 0); // simulated active state

                    return (
                      <div
                        key={item.id}
                        className={`bg-neutral-950/60 border rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative ${
                          isVip ? 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.02)]' : 'border-neutral-900'
                        }`}
                      >
                        {isVip && (
                          <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[7px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full shadow">
                            Mais Popular
                          </div>
                        )}
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-2xl">{item.image}</span>
                            <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border leading-none font-bold ${getRarityBadgeStyle(item.rarity)}`}>
                              {item.rarity}
                            </span>
                          </div>
                          <h4 className="text-xs font-black uppercase text-white mt-3 leading-none">{item.name}</h4>
                          <p className="text-[10px] text-neutral-400 leading-normal mt-2.5 min-h-[40px]">{item.description}</p>
                        </div>

                        <div className="mt-5">
                          {isActive ? (
                            <div className="w-full bg-green-500/10 border border-green-500/30 text-green-500 text-center py-2 rounded-lg text-[10px] font-sans font-black uppercase flex items-center justify-center gap-1.5 shadow">
                              <Check className="w-3.5 h-3.5" />
                              <span>Plano Ativo</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleInitiatePurchase(item)}
                              className={`w-full py-2 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                                isVip 
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow' 
                                  : 'bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white'
                              }`}
                            >
                              <span>Assinar • R$ {(item.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coin Packs Sections */}
              <div>
                <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider mb-4 flex items-center gap-2">
                  <Coins className="w-4.5 h-4.5 text-yellow-500" />
                  <span>2. Pacotes de Moedas OSS Coins (BRL)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {storeItems.filter(item => item.type === 'coin_pack').map(item => {
                    const isLegacyBest = item.id === 'pack_coins_10000';
                    return (
                      <div
                        key={item.id}
                        className={`bg-[#0c0c0e] border rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.01] transition-all ${
                          isLegacyBest ? 'border-yellow-500/20 bg-gradient-to-b from-[#111108] to-[#0b0b0d]' : 'border-neutral-900 bg-neutral-950/60'
                        }`}
                      >
                        <div className="relative">
                          <div className="flex justify-between items-center">
                            <span className="text-3xl filter drop-shadow">{item.image}</span>
                            <span className="text-[7px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/25 text-yellow-500">
                              +BÔNUS
                            </span>
                          </div>
                          <h4 className="text-xs font-black uppercase text-white mt-4 leading-none">{item.name}</h4>
                          <p className="text-[10px] text-neutral-400 leading-normal mt-2 min-h-[30px]">{item.description}</p>
                        </div>

                        <div className="mt-5">
                          <button
                            onClick={() => handleInitiatePurchase(item)}
                            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 hover:border-neutral-700 transition-all"
                          >
                            <span>Comprar • R$ {(item.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🏪 3. PEER-TO-PEER TATAME MARKETPLACE (Auction list / trades) */}
      {activeShopTab === 'market' && (
        <div className="space-y-6">
          <div className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-neutral-900 pb-5 mb-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-amber-500 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>Mercado de Técnicas do Tatame</span>
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                  Espaço descentralizado do JiuSpeak para lutadores anunciarem cards de finalização repetidos de suas coleções em troca de OSS Coins!
                </p>
              </div>

              {/* Sell trigger button directly */}
              <button
                onClick={() => {
                  if (cards.length > 0) setSimulatedCardToSell(cards[0]);
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold px-4  py-2.5 rounded-xl uppercase text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>Anunciar Card Próprio</span>
              </button>
            </div>

            {/* Simulated Active Listings List (P2P real backend queries!) */}
            <div>
              <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider mb-4">Cards em Leilão ({listings.filter(l => !l.is_sold).length})</h4>
              
              {listings.filter(l => !l.is_sold).length === 0 ? (
                <div className="text-center py-12 bg-neutral-950 border border-neutral-900 rounded-3xl">
                  <p className="text-neutral-500 text-xs">Sem ofertas ou leilões ativos no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.filter(l => !l.is_sold).map((list) => {
                    const isMyOwnAd = list.seller_id === currentUser?.id;
                    return (
                      <div
                        key={list.id}
                        className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 flex flex-col justify-between"
                      >
                        {/* Seller header profile card */}
                        <div className="flex items-center gap-3 border-b border-neutral-900 pb-3 mb-3">
                          <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-[10px] text-white overflow-hidden uppercase border border-neutral-700">
                            {list.seller_image ? (
                              <img src={list.seller_image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : list.seller_name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-white block truncate max-w-[150px]">{list.seller_name}</span>
                            <span className="text-[8px] font-mono tracking-wider font-extrabold uppercase text-amber-500 block">
                              Faixa {list.seller_belt || 'Branca'}
                            </span>
                          </div>
                        </div>

                        {/* Card metadata body */}
                        <div className="flex items-center gap-4 py-3 bg-[#0a0a0a] border border-neutral-900 px-3 rounded-lg mb-4">
                          <span className="text-4xl select-none">
                            {list.rarity === 'Legendary' ? '👑' : list.rarity === 'Epic' ? '🦁' : list.rarity === 'Rare' ? '🔺' : '🦾'}
                          </span>
                          <div>
                            <span className={`text-[8px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded leading-none ${getRarityBadgeStyle(list.rarity)}`}>
                              {list.rarity}
                            </span>
                            <h5 className="text-xs font-black text-white uppercase mt-1.5 line-clamp-1">{list.item_name}</h5>
                          </div>
                        </div>

                        {/* Price tag */}
                        <div className="flex items-center justify-between mt-auto">
                          <div>
                            <span className="text-[8px] font-mono uppercase text-neutral-500 block">Preço</span>
                            <span className="text-sm font-black font-mono text-amber-400">{list.price.toLocaleString()} OSS</span>
                          </div>

                          {isMyOwnAd ? (
                            <button
                              onClick={() => handleCancelMarketCard(list.id)}
                              className="px-3.5 py-1.5 bg-red-950/20 border border-red-900/40 text-red-500 font-extrabold text-[10px] uppercase rounded-lg hover:bg-neutral-900 hover:text-white"
                            >
                              Cancelar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBuyMarketCard(list.id)}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase rounded-lg shadow"
                            >
                              Comprar Card
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📜 4. TRANSACTION PURCHASES LEDGER EXTRATO */}
      {activeShopTab === 'ledger' && (
        <div className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-6">
          <h3 className="text-lg font-black uppercase tracking-tight text-neutral-300 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-neutral-400" />
            <span>Extrato Dinâmico de Transações</span>
          </h3>

          {purchases.length === 0 ? (
            <div className="text-center py-12 bg-neutral-950 border border-neutral-900 rounded-2xl">
              <p className="text-neutral-500 text-xs">Nenhuma compra listada nos registros deste guerreiro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 uppercase tracking-widest text-[9px] font-mono font-black">
                    <th className="py-3 px-4">DATA</th>
                    <th className="py-3 px-4">ITEM ADQUIRIDO</th>
                    <th className="py-3 px-4">MÉTODO</th>
                    <th className="py-3 px-4">VALOR</th>
                    <th className="py-3 px-4 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {purchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-neutral-950/45 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[10px] text-neutral-500">
                        {new Date(pur.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-white uppercase">{pur.item_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-neutral-900 border border-neutral-800 text-neutral-400 text-[9px] font-mono px-2 py-0.5 rounded">
                          {pur.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {pur.currency === 'OSS' ? `${pur.amount.toLocaleString()} OSS` : `US$ ${(pur.amount / 100).toFixed(2)}`}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-green-400 font-extrabold text-[10px] uppercase">CONCLUÍDO</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* ==============================================
          👹 MODAL DIALOG: CARD DETAIL DETAILS & UPGRADES
          ============================================== */}
      <AnimatePresence>
        {simulatedCardDetails && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0b0d] border border-neutral-800 rounded-3xl max-w-md w-full p-6 relative overflow-hidden"
            >
              {/* Abs decoration backdrop glow */}
              <div className="absolute top-0 left-0 p-32 bg-purple-600/10 rounded-full blur-3xl -ml-24 -mt-24" />

              <button 
                onClick={() => setSimulatedCardDetails(null)} 
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center relative">
                <span className={`text-[9px] uppercase tracking-widest font-black border px-3 py-1 rounded mb-4 inline-block ${getRarityBadgeStyle(simulatedCardDetails.rarity)}`}>
                  {simulatedCardDetails.rarity} Technique Card
                </span>

                <div className="text-7xl my-6 select-none animate-pulse">{simulatedCardDetails.image}</div>
                
                <h3 className="text-lg font-black text-white uppercase mb-2 tracking-tight">
                  {simulatedCardDetails.name}
                </h3>

                {/* Card translations display block */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-left my-5 space-y-3">
                  <div>
                    <span className="text-[8px] font-mono uppercase text-neutral-500 block">JiuSpeak English Rule</span>
                    <p className="text-xs text-amber-400 font-extrabold font-mono italic">
                      "{simulatedCardDetails.translation_en || 'Learn the leverage point to apply submission'}"
                    </p>
                  </div>
                  <div className="border-t border-neutral-900 pt-2">
                    <span className="text-[8px] font-mono uppercase text-neutral-500 block">Tradução Técnica</span>
                    <p className="text-xs text-neutral-300 font-medium">
                      "{simulatedCardDetails.translation_pt || 'Conecte os pontos e conquiste a vitória'}"
                    </p>
                  </div>
                </div>

                {/* Upgrades panel info */}
                {(() => {
                  const currentLvl = simulatedCardDetails.level || 1;
                  let reqXp = currentLvl === 1 ? 10 : currentLvl === 2 ? 20 : currentLvl === 3 ? 45 : 80;
                  let upgradeCost = currentLvl === 1 ? 100 : currentLvl === 2 ? 250 : currentLvl === 3 ? 600 : 1200;
                  let hasXpToUpgrade = simulatedCardDetails.xp >= reqXp;

                  return (
                    <div className="space-y-4 pt-1 border-t border-neutral-900">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500">Nível Atual:</span>
                        <span className="font-bold text-white uppercase font-mono tracking-wider">Level {currentLvl}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500">Progresso de Cartas:</span>
                        <span className={`font-mono font-bold ${hasXpToUpgrade ? 'text-green-400' : 'text-neutral-300'}`}>
                          {simulatedCardDetails.xp}/{reqXp}
                        </span>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full bg-neutral-950 h-3 border border-neutral-900 p-0.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${hasXpToUpgrade ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-purple-600'}`}
                          style={{ width: `${Math.min(100, (simulatedCardDetails.xp / reqXp) * 100)}%` }}
                        />
                      </div>

                      {/* Bottom action controls */}
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => {
                            setSimulatedCardToSell(simulatedCardDetails);
                            setSimulatedCardDetails(null);
                          }}
                          className="flex-1 py-3 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-extrabold text-xs uppercase rounded-xl"
                        >
                          Vender no Mercado
                        </button>

                        <button
                          disabled={!hasXpToUpgrade}
                          onClick={() => handleUpgradeCard(simulatedCardDetails.id)}
                          className={`flex-1 py-3 font-mono font-black text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 shadow ${
                            hasXpToUpgrade 
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:scale-105 transition-transform'
                              : 'bg-neutral-950 border border-neutral-900 text-neutral-600 cursor-not-allowed'
                          }`}
                        >
                          <span>Evoluir Lvl {currentLvl + 1}</span>
                          {hasXpToUpgrade && <span className="text-[10px] font-bold">({upgradeCost} OSS)</span>}
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==============================================
          🎨 MODAL DIALOG: CARD SELLING INPUT POPUP
          ============================================== */}
      <AnimatePresence>
        {simulatedCardToSell && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0b0d] border border-neutral-800 rounded-3xl max-w-sm w-full p-6 relative"
            >
              <button 
                onClick={() => setSimulatedCardToSell(null)} 
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <span className="text-amber-500 text-2xl">⚡</span>
                <h3 className="text-md font-black uppercase tracking-tight text-white mt-2 mb-1">
                  Anunciar Finalização no Leilão
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                  Defina o preço de venda para listarmos seu card '{simulatedCardToSell.name}' no Tatame de Negociações JiuSpeak.
                </p>

                <div className="bg-[#0a0a0c] border border-neutral-900 rounded-2xl p-4 flex gap-3 items-center text-left mb-6">
                  <span className="text-4xl">{simulatedCardToSell.image}</span>
                  <div>
                    <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 bg-neutral-905 border border-neutral-800 font-black rounded text-neutral-400">
                      Raridade: {simulatedCardToSell.rarity}
                    </span>
                    <h4 className="text-xs font-black uppercase text-white mt-1">{simulatedCardToSell.name}</h4>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-left">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold block mb-1.5">Preço pretendido (OSS Coins)</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Ex: 500"
                        value={sellPriceInput}
                        onChange={(e) => setSellPriceInput(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono font-black text-amber-400 focus:outline-none focus:border-amber-500/80"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-amber-500 font-black">OSS</span>
                    </div>
                  </div>

                  <button
                    disabled={!sellPriceInput || Number(sellPriceInput) <= 0}
                    onClick={handleSellCard}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow shadow-amber-500/10 disabled:bg-neutral-900 disabled:text-neutral-500 disabled:shadow-none transition-all"
                  >
                    Publicar Anúncio de Venda
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==============================================
          📦 CHECKOUT DIALOG: PAYMENT INTEGRATIONS (PIX / STRIPE COINS SIMULATION)
          ============================================== */}
      <AnimatePresence>
        {selectedItemForPurchase && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-45 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0b0d] border border-neutral-800 rounded-3xl max-w-md w-full p-6 relative"
            >
              <button 
                onClick={() => setSelectedItemForPurchase(null)} 
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase font-black text-amber-500">Checkout Finalização</span>
                <h3 className="text-lg font-black text-white uppercase mt-1 mb-6">Confirmação de Aquisição</h3>

                {/* Main Product Box Display */}
                <div className="bg-[#0a0a0c] border border-neutral-900 rounded-2xl p-4 flex gap-4 items-center text-left mb-6">
                  <span className="text-5xl select-none animate-pulse">{selectedItemForPurchase.image}</span>
                  <div>
                    <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border leading-none font-bold ${getRarityBadgeStyle(selectedItemForPurchase.rarity)}`}>
                      {selectedItemForPurchase.rarity} • {selectedItemForPurchase.type}
                    </span>
                    <h4 className="text-sm font-black uppercase text-white mt-2 leading-none">{selectedItemForPurchase.name}</h4>
                    <p className="text-[10px] text-neutral-400 leading-normal mt-1.5">{selectedItemForPurchase.description}</p>
                  </div>
                </div>

                {/* Payment Selection Forms & Interactive PIX Screen */}
                <div className="space-y-4">
                  {currentPixData ? (
                    pixConfirmed ? (
                      /* Approved Animation and Cashback Splash */
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6 space-y-4"
                      >
                        <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/10 mb-2">
                          <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <h4 className="text-base font-black text-white uppercase tracking-tight">Pagamento Aprovado!</h4>
                        <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                          Sua compensação bancária em BRL (PIX) foi processada com sucesso através de nossos webhooks e o produto foi liberado na sua conta!
                        </p>
                        
                        {cashbackReceivedCoins && (
                          <div className="bg-yellow-500/10 border border-yellow-500/25 p-3 rounded-xl max-w-xs mx-auto flex items-center justify-center gap-2">
                            <span className="text-lg">🪙</span>
                            <div className="text-left font-sans">
                              <span className="text-[9px] uppercase tracking-widest text-yellow-500 font-mono block leading-none">Cashback Recebido</span>
                              <span className="text-xs font-black text-white mt-1">+{cashbackReceivedCoins} OSS Coins Creditadas</span>
                            </div>
                          </div>
                        )}

                        <div className="pt-4">
                          <button
                            onClick={() => {
                              setSelectedItemForPurchase(null);
                              setCurrentPixData(null);
                            }}
                            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow"
                          >
                            Ir para o Tatame
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* Active QR Code Payment Station */
                      <div className="space-y-4">
                        <div className="text-center space-y-1 mb-2">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-500 uppercase font-mono tracking-wider animate-pulse">
                            <span className="w-2 h-2 bg-amber-500 rounded-full" />
                            <span>Aguardando Pagamento PIX...</span>
                          </div>
                          <p className="text-[10px] text-neutral-500">Escaneie o QR Code abaixo com o aplicativo do seu banco.</p>
                        </div>

                        {/* Real-rendered QR Code */}
                        <div className="bg-white p-3 rounded-2xl max-w-[160px] mx-auto shadow-md shadow-black/80">
                          <img 
                            src={currentPixData.qr_code} 
                            alt="PIX QR Code" 
                            className="w-full h-auto"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* PIX Copia Cola Copy Field */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 block">PIX Copia e Cola (Chave)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={currentPixData.copia_cola}
                              className="flex-1 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-[10px] font-mono text-neutral-400 select-all block truncate"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(currentPixData.copia_cola);
                                setCopiedKey(true);
                                setTimeout(() => setCopiedKey(false), 2000);
                              }}
                              className={`px-3 py-2 text-xs font-black uppercase rounded-lg transition-colors ${
                                copiedKey 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-neutral-850 hover:bg-neutral-800 text-white'
                              }`}
                            >
                              {copiedKey ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                        </div>

                        {/* Expire indicator and Simulating Button */}
                        <div className="bg-neutral-950/80 border border-neutral-900 p-3.5 rounded-xl text-center space-y-2">
                          <div className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                            Expira em 09:58 • Valor: <span className="text-white font-black">R$ {(selectedItemForPurchase.price / 100).toFixed(2).replace('.', ',')}</span>
                          </div>
                          
                          <button
                            disabled={pixConfirming}
                            onClick={handleTriggerPixConfirmation}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow"
                          >
                            {pixConfirming ? (
                              <>
                                <RefreshCw className="w-4 h-4 text-black animate-spin" />
                                <span>Simulando Webhook...</span>
                              </>
                            ) : (
                              <span>Simular Confirmação PIX (Webhook)</span>
                            )}
                          </button>
                          <p className="text-[8px] text-neutral-600 italic">Simula o recebimento do webhook de aprovação instantânea pelo Banco de Origem.</p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedItemForPurchase(null);
                            setCurrentPixData(null);
                          }}
                          className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 text-neutral-500 hover:text-white uppercase font-bold text-[10px] rounded-lg mt-2 font-mono transition-colors"
                        >
                          Cancelar & Fechar
                        </button>
                      </div>
                    )
                  ) : (
                    /* Checkout Select Gateway Page */
                    <>
                      {selectedItemForPurchase.is_premium ? (
                        <div>
                          <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 block mb-2">Selecione o Método Bancário</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Stripe', 'PIX', 'GooglePay', 'ApplePay', 'PlayBilling', 'AppStore'].map((method) => {
                              const titleMap: Record<string, string> = {
                                'Stripe': 'Cartão Stripe',
                                'PIX': 'Instantâneo PIX',
                                'GooglePay': 'Google Pay',
                                'ApplePay': 'Apple Pay',
                                'PlayBilling': 'Mercado Pago',
                                'AppStore': 'App Store Pay'
                              };
                              return (
                                <button
                                  key={method}
                                  onClick={() => setCheckoutPaymentMethod(method as any)}
                                  className={`py-2.5 px-3 rounded-lg border text-left text-xs uppercase font-bold transition-all ${
                                    checkoutPaymentMethod === method 
                                      ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-extrabold shadow-sm'
                                      : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:bg-neutral-900'
                                  }`}
                                >
                                  <span className="block truncate">{titleMap[method] || method}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-neutral-400">Total a Pagar via Moedas App:</span>
                          <span className="text-sm font-mono font-black text-yellow-500">
                            {selectedItemForPurchase.price.toLocaleString()} OSS Coins
                          </span>
                        </div>
                      )}

                      {/* Operational Action */}
                      <div className="pt-4 flex gap-3">
                        <button
                          onClick={() => setSelectedItemForPurchase(null)}
                          className="flex-1 py-3 bg-neutral-950 border border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-white uppercase font-bold text-xs rounded-xl"
                        >
                          Cancelar
                        </button>

                        <button
                          disabled={checkoutProcessing}
                          onClick={handleConfirmPurchase}
                          className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black uppercase font-black tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 shadow"
                        >
                          {checkoutProcessing ? (
                            <>
                              <RefreshCw className="w-4 h-4 text-black animate-spin" />
                              <span>Processando...</span>
                            </>
                          ) : (
                            <span>Simular Checkout</span>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==============================================
          🌌 FULLSCREEN ARENA MODAL: GACHA REVEAL STAGE
          ============================================== */}
      <AnimatePresence>
        {showPackOpeningArena && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-6 overflow-hidden select-none">
            
            {/* Ambient dynamic cosmic light effect */}
            <div className="absolute inset-0 bg-radial-gradient from-purple-950/20 via-black to-black opacity-90" />
            
            {/* Background floating particle assets */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-600/5 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl animate-pulse" />

            {/* Stage header info */}
            <div className="relative text-center pt-8">
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-500 font-extrabold animate-pulse block">
                Jiuspeak Card Pack Opening
              </span>
              <h2 className="text-2xl font-black uppercase text-white tracking-wider mt-1">
                {currentOpeningPackName}
              </h2>
              <span className="text-[9px] font-sans text-neutral-400 uppercase tracking-widest block mt-1.5">
                Carta {revealedIdx + 1} de {openedPackCards.length} extraídas
              </span>
            </div>

            {/* MAIN STAGE: REVEAL ACTIVE CARD */}
            <div className="relative flex-1 flex flex-col items-center justify-center py-6">
              {openedPackCards.length > 0 && (
                <div className="relative w-80 h-[440px]">
                  
                  {/* Card revealed container */}
                  {openedPackCards.map((pCard, index) => {
                    if (index !== revealedIdx) return null;
                    return (
                      <motion.div
                        key={pCard.id || index}
                        initial={{ rotateY: 180, scale: 0.8, opacity: 0 }}
                        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`absolute inset-0 rounded-3xl border-2 p-6 flex flex-col items-center justify-between text-center ${getRarityCardBorderStyle(pCard.rarity)} ${getCardBgStyle(pCard.rarity)}`}
                        style={{ transformStyle: 'preserve-3d font-sans' }}
                      >
                        {/* Shimmer overlay dynamic texture for Legendaries and Mythics */}
                        {(pCard.rarity === 'Legendary' || pCard.rarity === 'Mythic') && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full animate-shimmer pointer-events-none" />
                        )}

                        {/* Top layout decoration */}
                        <div className="w-full flex justify-between items-center">
                          <span className={`text-[9px] uppercase font-mono px-2.5 py-0.5 tracking-wider border rounded-md leading-none ${getRarityBadgeStyle(pCard.rarity)}`}>
                            {pCard.rarity}
                          </span>
                          <span className="text-[9px] font-mono tracking-wider font-extrabold text-neutral-400">
                            Lvl 1 + 10 XP
                          </span>
                        </div>

                        {/* Centered Dynamic Emoji Representation */}
                        <div className="text-8xl select-none my-6 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] animate-bounce" style={{ animationDuration: '3s' }}>
                          {pCard.image || '🎴'}
                        </div>

                        {/* Middle textual structure */}
                        <div className="space-y-1">
                          <h3 className="text-md font-black uppercase tracking-tight text-white">{pCard.name}</h3>
                          <span className="text-[8px] font-mono tracking-widest text-neutral-400 uppercase font-black block">Coleção de Técnicas</span>
                        </div>

                        {/* Card rules translations boxes */}
                        <div className="w-full bg-neutral-950/80 border border-neutral-900 rounded-xl p-3 text-left space-y-1.5 shadow">
                          <p className="text-[10px] text-amber-400 italic font-mono font-extrabold text-center max-w-full">
                            "{pCard.translation_en || 'Learn commands & position definitions in English to lock submissions'}"
                          </p>
                          <p className="text-[9px] text-neutral-400 text-center border-t border-neutral-900 pt-1.5 max-w-full">
                            "{pCard.translation_pt || 'Aprenda comandos de finalização em Inglês'}"
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action buttons stage base footer */}
            <div className="relative text-center pb-8 flex flex-col items-center gap-4">
              
              {revealedIdx < openedPackCards.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRevealedIdx(prev => prev + 1)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-purple-950/50 flex items-center gap-2"
                >
                  <span>Revelar Próxima Carta</span>
                  <ChevronRight className="w-4 h-4 text-white" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowPackOpeningArena(false);
                    setOpenedPackCards([]);
                    setActiveShopTab('cards'); // go review their collectible deck!
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <span>Concluir e Ir para Meu Deck 🥋</span>
                </motion.button>
              )}

              <p className="text-[9px] text-neutral-500 uppercase tracking-widest">
                Os cards adquiridos foram creditados diretamente na sua coleção de técnicas JiuSpeak.
              </p>
            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
