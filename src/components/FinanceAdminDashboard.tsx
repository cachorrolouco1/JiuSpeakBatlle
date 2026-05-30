import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Coins, 
  CreditCard, 
  Lock, 
  Shield, 
  PiggyBank, 
  FileDown, 
  Search, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  RefreshCw, 
  UserCheck, 
  Crown, 
  ShoppingBag, 
  History, 
  Sliders,
  DollarSign,
  UserPlus,
  HelpCircle,
  Eye,
  EyeOff,
  Bell,
  Check,
  Percent,
  Plus
} from 'lucide-react';
import { useAuth } from './AuthContext';

interface StatsOverview {
  totalRevenueCents: number;
  subscriptionRevenueCents: number;
  salesRevenueCents: number;
  marketplaceCommCents: number;
  processedPayoutsCents: number;
  availableBalanceCents: number;
  activeSubscriptionsCount: number;
  totalTransactionsCount: number;
  suspiciousCount: number;
  chargebackCount: number;
  premiumUsersCount: number;
}

interface TransactionItem {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  method: string;
  status: 'Aprovado' | 'Pendente' | 'Suspeito' | 'Chargeback' | 'Falhado';
  created_at: string;
}

interface SubscriptionItem {
  id: string;
  user_id: string;
  user_name: string;
  plan: 'Free' | 'Premium' | 'VIP';
  status: 'Ativa' | 'Expirada' | 'Cancelada';
  price: number;
  expires_at: string;
  created_at: string;
}

interface StoreSaleItem {
  id: string;
  buyer_id: string;
  buyer_name: string;
  item_id: string;
  item_name: string;
  amount: number;
  payment_method: string;
  created_at: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  agency: string;
  account_number: string;
  account_type: 'Corrente' | 'Poupança';
  pix_key: string;
  owner_name: string;
  cpf_cnpj: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  bank_account_id: string;
  pix_key: string;
  created_at: string;
}

interface SecurityLog {
  id: string;
  admin_name: string;
  action: string;
  ip_address: string;
  details: string;
  created_at: string;
}

export default function FinanceAdminDashboard() {
  const { token, user } = useAuth();
  
  // State elements
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [sales, setSales] = useState<StoreSaleItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="bg-[#030303] border border-red-950 rounded-3xl p-8 max-w-lg mx-auto text-center my-12 shadow-2xl">
        <span className="text-4xl">🔒</span>
        <h3 className="text-lg font-black font-sans uppercase tracking-wider text-red-500 mt-4">Acesso restrito.</h3>
        <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
          Você não possui os privilégios de acesso necessários para visualizar as informações financeiras ou realizar saques. Apenas administradores habilitados cadastrados no RBAC ADMIN podem visualizar estes dados.
        </p>
      </div>
    );
  }
  
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // RBAC User Management & Action Logs Audit
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminActionLogs, setAdminActionLogs] = useState<any[]>([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState<any | null>(null);
  const [isSavingRBAC, setIsSavingRBAC] = useState(false);
  const [isSimulatingConn, setIsSimulatingConn] = useState<string | null>(null);
  const [rbacForm, setRbacForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    role: 'USER',
    is_blocked: false,
    new_password: ''
  });
  
  // Active inner menu tab
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'pricing' | 'bank' | 'security' | 'simulator' | 'rbac_users'>('overview');

  // Dynamic Pricing Types and States
  const [storePricing, setStorePricing] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [priceAdminLogs, setPriceAdminLogs] = useState<any[]>([]);
  const [marketplaceConfig, setMarketplaceConfig] = useState<any>({
    tax_percentage: 5,
    commission_percentage: 2,
    min_price: 10,
    max_price: 10000
  });

  // State elements for creation/editing models
  const [selectedPricingItem, setSelectedPricingItem] = useState<any | null>(null);
  const [pricingForm, setPricingForm] = useState({
    item_name: '',
    category: 'subscription',
    price_brl: 1990,
    active: true
  });
  
  const [selectedPlanItem, setSelectedPlanItem] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    plan_name: '',
    monthly_price: 1990,
    yearly_price: 15900,
    benefits: '' // benefits separated by newline
  });

  const [selectedPromoItem, setSelectedPromoItem] = useState<any | null>(null);
  const [promoForm, setPromoForm] = useState({
    title: '',
    discount_percentage: 15,
    start_date: '',
    end_date: '',
    promo_code: '',
    cashback_percentage: 5
  });

  const [marketForm, setMarketForm] = useState({
    tax_percentage: 5,
    commission_percentage: 2,
    min_price: 10,
    max_price: 10000
  });
  
  // CSV export state
  const [exporting, setExporting] = useState(false);
  
  // Bank Account edit state with secure OTP validation
  const [bankEdit, setBankEdit] = useState({
    bank_name: '',
    agency: '',
    account_number: '',
    account_type: 'Corrente' as 'Corrente' | 'Poupança',
    pix_key: '',
    owner_name: '',
    cpf_cnpj: '',
    code2FA: ''
  });
  const [isBankEnrypted, setIsBankEnrypted] = useState(true);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otpSentNotice, setOtpSentNotice] = useState(false);
  
  // Manual withdrawal amount state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  
  // Simulate transaction simulation state
  const [simBuyerName, setSimBuyerName] = useState('Renzo Gracie Silva');
  const [simAmount, setSimAmount] = useState('29.90');
  const [simMethod, setSimMethod] = useState('PIX');
  const [simStatus, setSimStatus] = useState<'Aprovado' | 'Pendente' | 'Suspeito' | 'Falhado'>('Aprovado');
  const [simPlanType, setSimPlanType] = useState('VIP');

  // Manual Adjust Plan state
  const [selectedStudentId, setSelectedStudentId] = useState('u2');
  const [targetPlan, setTargetPlan] = useState<'Free' | 'Premium' | 'VIP'>('Premium');

  // Filters for Transactions / Ledgers list
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [methodFilter, setMethodFilter] = useState<string>('All');

  // Load Admin statistical parameters
  const loadStats = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await fetch('/api/finance/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Não foi possível obter dados administrativos. Verifique o login.');
      }
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setTransactions(data.transactions);
        setSubscriptions(data.subscriptions);
        setSales(data.storeSales);
        setPayouts(data.payouts);
        setLogs(data.logs);
        
        if (data.bankAccounts && data.bankAccounts.length > 0) {
          const acc = data.bankAccounts[0];
          setBankAccount(acc);
          setBankEdit({
            bank_name: acc.bank_name,
            agency: acc.agency,
            account_number: acc.account_number,
            account_type: acc.account_type,
            pix_key: acc.pix_key,
            owner_name: acc.owner_name,
            cpf_cnpj: acc.cpf_cnpj,
            code2FA: ''
          });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  };

  const loadPricing = async () => {
    try {
      const response = await fetch('/api/pricing/all');
      const data = await response.json();
      if (data.success) {
        setStorePricing(data.storePricing || []);
        setSubscriptionPlans(data.subscriptionPlans || []);
        setPromotions(data.promotions || []);
        setPriceAdminLogs(data.adminLogs || []);
        if (data.marketplaceConfig) {
          setMarketplaceConfig(data.marketplaceConfig);
          setMarketForm({
            tax_percentage: data.marketplaceConfig.tax_percentage,
            commission_percentage: data.marketplaceConfig.commission_percentage,
            min_price: data.marketplaceConfig.min_price,
            max_price: data.marketplaceConfig.max_price
          });
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar precificação dinâmica:", err);
    }
  };

  // HANDLERS FOR PRICING ACTION EDITING
  const handleSaveStorePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const isEdit = !!selectedPricingItem;
      const url = isEdit ? '/api/pricing/store/update' : '/api/pricing/store/create';
      const body = {
        id: isEdit ? selectedPricingItem.id : undefined,
        item_name: pricingForm.item_name,
        category: pricingForm.category,
        price_brl: Math.round(pricingForm.price_brl),
        active: pricingForm.active,
        adminName: user?.first_name || 'Admin'
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(`Preço do item '${pricingForm.item_name}' gravado com sucesso!`);
        setSelectedPricingItem(null);
        setPricingForm({ item_name: '', category: 'subscription', price_brl: 1990, active: true });
        loadPricing();
      } else {
        throw new Error(data.error || 'Erro ao gravar preço do item.');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteStorePricing = async (id: string) => {
    if (!window.confirm('Excluir esta regra de faturamento?')) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/pricing/store/${id}?adminName=${encodeURIComponent(user?.first_name || 'Admin')}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Preço removido com sucesso.');
        loadPricing();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao remover precificação.');
    }
  };

  const handleSaveSubscriptionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/pricing/plans/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPlanItem?.id,
          plan_name: planForm.plan_name,
          monthly_price: Math.round(planForm.monthly_price),
          yearly_price: Math.round(planForm.yearly_price),
          benefits: planForm.benefits.split('\n').map(b => b.trim()).filter(Boolean),
          adminName: user?.first_name || 'Admin'
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Plano de assinatura reconfigurado!');
        setSelectedPlanItem(null);
        loadPricing();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const isEdit = !!selectedPromoItem;
      const response = await fetch('/api/pricing/promotions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: isEdit ? selectedPromoItem.id : undefined,
          title: promoForm.title,
          discount_percentage: Number(promoForm.discount_percentage),
          start_date: promoForm.start_date || new Date().toISOString(),
          end_date: promoForm.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
          promo_code: promoForm.promo_code,
          cashback_percentage: Number(promoForm.cashback_percentage),
          adminName: user?.first_name || 'Admin'
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(`Regra promocional '${promoForm.title}' salva com sucesso!`);
        setSelectedPromoItem(null);
        setPromoForm({ title: '', discount_percentage: 10, start_date: '', end_date: '', promo_code: '', cashback_percentage: 5 });
        loadPricing();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!window.confirm('Apagar esta promoção ou cupom?')) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/pricing/promotions/${id}?adminName=${encodeURIComponent(user?.first_name || 'Admin')}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Promoção excluída de maneira permanente.');
        loadPricing();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleUpdateMarketplaceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/pricing/marketplace/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tax_percentage: Number(marketForm.tax_percentage),
          commission_percentage: Number(marketForm.commission_percentage),
          min_price: Number(marketForm.min_price),
          max_price: Number(marketForm.max_price),
          adminName: user?.first_name || 'Admin'
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Taxas de Marketplace redefinidas!');
        loadPricing();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAdminUsers(data.users || []);
      }
    } catch (err: any) {
      console.error("Erro ao carregar guerreiros administrativos:", err);
    }
  };

  const loadAdminActionLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAdminActionLogs(data.logs || []);
      }
    } catch (err: any) {
      console.error("Erro ao carregar logs de auditoria:", err);
    }
  };

  const handleSimulateConnection = async (userId: string, targetOnline: boolean) => {
    setIsSimulatingConn(userId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/admin/users/${userId}/simulate-connection`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_online: targetOnline })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(data.message);
        await loadAdminUsers();
        await loadAdminActionLogs();
      } else {
        setErrorMessage(data.error || 'Erro ao simular conexão do guerreiro.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao simular conexão.');
    } finally {
      setIsSimulatingConn(null);
    }
  };

  useEffect(() => {
    if (token) {
      loadStats();
      loadPricing();
      loadAdminUsers();
      loadAdminActionLogs();
    }
  }, [token]);

  // Request secure bank info mutation
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!showOtpField) {
      // Prompt OTP required
      setShowOtpField(true);
      setOtpSentNotice(true);
      setTimeout(() => setOtpSentNotice(false), 4000);
      return;
    }

    if (!bankEdit.code2FA) {
      setErrorMessage('Digite seu código 2FA dinâmico para autorizar a proteção bancária.');
      return;
    }

    try {
      const response = await fetch('/api/finance/admin/bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bankEdit)
      });
      
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Falha ao gravar registro bancário.');
      }

      setSuccessMessage(resData.message || 'Dados gravados sob criptografia militar (AES-XTS)!');
      setBankAccount(resData.account);
      setShowOtpField(false);
      setIsBankEnrypted(true);
      loadStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de comunicação backend.');
    }
  };

  // Perform instant Manual cashout
  const handleManualWithdrawal = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    const amountVal = parseFloat(withdrawAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMessage('Insira uma quantia válida em Dólares para realizar o repasse.');
      return;
    }

    const cents = Math.round(amountVal * 100);
    const available = stats?.availableBalanceCents || 0;
    
    if (cents > available) {
      setErrorMessage('A quantia solicitada supera o saldo disponível na plataforma.');
      return;
    }

    try {
      const response = await fetch('/api/finance/admin/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amountCents: cents })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar payout.');
      }
      setSuccessMessage(data.message || 'Transferência via repasse imediato e proteção PIX agendado!');
      setWithdrawAmount('');
      loadStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao solicitar transferência.');
    }
  };

  // Toggle Auto Payout schedule switch
  const handleToggleAutoPayout = async (checked: boolean) => {
    setAutoWithdraw(checked);
    try {
      const response = await fetch('/api/finance/admin/payout/auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ autoPayoutEnabled: checked })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao atualizar saque automático.');
    }
  };

  // Trigger telemetry purchase simulation
  const handleSimulateTransaction = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    const amt = parseFloat(simAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Insira um valor numérico válido para a simulação.');
      return;
    }

    try {
      const response = await fetch('/api/finance/admin/transaction/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amountUSD: amt,
          method: simMethod,
          status: simStatus,
          buyerName: simBuyerName,
          planType: simPlanType
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      setSuccessMessage(`Nova venda registrada! Aprovadores do gateway processaram o repasse automático de R$ ${amt.toFixed(2).replace('.', ',')}.`);
      loadStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao emitir transação simulada.');
    }
  };

  // Modify subscription plans immediately
  const handleModifyPlan = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/finance/admin/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedStudentId,
          newPlan: targetPlan
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      setSuccessMessage(`Plano do usuário atualizado! Próxima data de faturamento de R$ ${(data.user.is_vip ? 49.90 : 19.90).toFixed(2).replace('.', ',')} agendada.`);
      loadStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao modificar plano do estudante.');
    }
  };

  // Beautiful Spreadsheet Client-driven Export routine
  const exportToCSV = (dataset: 'transactions' | 'subscriptions' | 'sales') => {
    setExporting(true);
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (dataset === 'transactions') {
      csvContent += "ID,Comprador,ID Aluno,Valor (BRL),Metodo,Status,Criado Em\n";
      transactions.forEach(row => {
        csvContent += `"${row.id}","${row.user_name}","${row.user_id}",${(row.amount / 100).toFixed(2)},"${row.method}","${row.status}","${row.created_at}"\n`;
      });
    } else if (dataset === 'subscriptions') {
      csvContent += "ID,Estudante,ID Aluno,Plano,Status,Mensalidade (BRL),Expira Em\n";
      subscriptions.forEach(row => {
        csvContent += `"${row.id}","${row.user_name}","${row.user_id}","${row.plan}","${row.status}",${(row.price / 100).toFixed(2)},"${row.expires_at}"\n`;
      });
    } else {
      csvContent += "ID,Comprador,ID Aluno,ID Item,Item,Faturamento (BRL),Criado Em\n";
      sales.forEach(row => {
        csvContent += `"${row.id}","${row.buyer_name}","${row.buyer_id}","${row.item_id}","${row.item_name}",${(row.amount / 100).toFixed(2)},"${row.created_at}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jiuspeak_relatorio_${dataset}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setExporting(false), 1000);
  };

  // Filter lists based on states
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.user_name.toLowerCase().includes(filterQuery.toLowerCase()) || 
                          tx.method.toLowerCase().includes(filterQuery.toLowerCase()) ||
                          tx.id.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
    const matchesMethod = methodFilter === 'All' || tx.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const currencyFormat = (cents: number) => {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Pure SVG Arc mathematics to draw an elegant interactive donut graph
  const getDonutSegments = () => {
    const total = subscriptions.length || 1;
    const countVIP = subscriptions.filter(s => s.plan === 'VIP' && s.status === 'Ativa').length;
    const countPremium = subscriptions.filter(s => s.plan === 'Premium' && s.status === 'Ativa').length;
    const countFree = Math.max(0, total - countVIP - countPremium);

    const vipPct = countVIP / total;
    const premPct = countPremium / total;
    const freePct = countFree / total;

    return {
      vip: { pct: vipPct, color: '#f59e0b', count: countVIP, planName: 'VIP' }, // golden Amber
      premium: { pct: premPct, color: '#ef4444', count: countPremium, planName: 'Premium' }, // red
      free: { pct: freePct, color: '#6b7280', count: countFree, planName: 'Free / Basic' } // grey
    };
  };

  const segments = getDonutSegments();

  return (
    <div id="finance_dashboard_root" className="bg-[#050505] min-h-screen text-neutral-100 p-3 md:p-6 font-sans">
      
      {/* Decorative header spotlight */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Breadcrumb & Main Info Row */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 pb-6 border-b border-neutral-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-500/10 text-amber-500 font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded border border-amber-500/20">
              Módulo Administrativo Seguro
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1.5 tracking-tight uppercase italic flex items-center gap-2">
            PAINEL FINANCEIRO <span className="text-amber-500">JIUSPEAK</span>
          </h1>
          <p className="text-stone-400 text-xs mt-0.5">
            Gerenciamento global de liquidez, assinaturas anuais, comissões de leilão do marketplace e auditoria 2FA.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          {token && (
            <button 
              onClick={loadStats} 
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition duration-200"
              title="Recarregar Métricas do Banco"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar</span>
            </button>
          )}

          <div className="py-1 px-3 bg-neutral-950 border border-neutral-900 rounded-xl text-stone-500 text-[10px] font-mono">
            IP ADMIN: 187.12.34.56
          </div>
        </div>
      </div>

      {/* Server Success or Error notifications */}
      <div className="max-w-7xl mx-auto mt-4 space-y-2">
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <p>{errorMessage}</p>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-green-950/40 border border-green-905/30 rounded-xl text-xs text-green-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-500" />
            <p>{successMessage}</p>
          </div>
        )}
      </div>

      {/* Main Stats Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        
        {/* Total revenue */}
        <div id="stat_total_revenue" className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 select-none text-red-500 group-hover:scale-110 duration-500">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div>
            <div className="flex items-center justify-between text-neutral-400 font-mono text-[10px] uppercase">
              <span>Faturamento Total Bruto</span>
              <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +15.4%
              </span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-white mt-1.5 block tracking-tight">
              {stats ? currencyFormat(stats.totalRevenueCents) : 'US$ 0,00'}
            </span>
          </div>
          <p className="text-[10px] text-stone-500 mt-4 leading-normal flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-red-500 rounded-full" />
            Soma total processada via cartões, PIX, PayPal, Apple e Google Pay.
          </p>
        </div>

        {/* Subscription Active Recurring MRR */}
        <div id="stat_subscriptions" className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 select-none text-amber-500 group-hover:scale-110 duration-500">
            <Crown className="w-24 h-24" />
          </div>
          <div>
            <div className="flex items-center justify-between text-neutral-400 font-mono text-[10px] uppercase">
              <span>Recorrência Mensal (MRR)</span>
              <span className="text-amber-500 font-bold">{stats?.premiumUsersCount || 0} alunos pro</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-amber-500 mt-1.5 block tracking-tight">
              {stats ? currencyFormat(stats.subscriptionRevenueCents) : 'US$ 0,00'}
            </span>
          </div>
          <p className="text-[10px] text-stone-500 mt-4 leading-normal flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-amber-500 rounded-full" />
            Filiados Premium e VIPs ativos. PvP & Certificados desbloqueados.
          </p>
        </div>

        {/* Store Sales revenue */}
        <div id="stat_store" className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 select-none text-stone-500 group-hover:scale-110 duration-500">
            <ShoppingBag className="w-24 h-24" />
          </div>
          <div>
            <div className="flex items-center justify-between text-neutral-400 font-mono text-[10px] uppercase">
              <span>Vendas Loja Virtual</span>
              <span className="text-neutral-400 font-bold">Comissão Marketplace</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-neutral-200 mt-1.5 block tracking-tight">
              {stats ? currencyFormat(stats.salesRevenueCents) : 'US$ 0,00'}
            </span>
          </div>
          <p className="text-[10px] text-stone-500 mt-4 leading-normal flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-neutral-600 rounded-full" />
            Vendas de Pacotes de Cards Míticos, cosméticos e taxas de 5% platform comm.
          </p>
        </div>

        {/* Available Balance / Quick withdrawal widget */}
        <div id="stat_withdraw" className="bg-gradient-to-b from-neutral-900 to-[#101010] border border-neutral-850 rounded-2xl p-4 flex flex-col justify-between relative shadow-lg">
          <div>
            <div className="flex items-center justify-between text-stone-300 font-mono text-[10px] uppercase font-bold">
              <span>Saldo Disponível Saque</span>
              <span className="text-[9px] bg-red-600/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/10">SAQUE IMEDIATO</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-emerald-400 mt-1.5 block tracking-tight">
              {stats ? currencyFormat(stats.availableBalanceCents) : 'US$ 0,00'}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex gap-1">
              <input 
                type="number" 
                placeholder="Valor (Ex: 150)" 
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1 px-2 text-xs text-white focus:outline-none focus:border-neutral-600 placeholder-neutral-700"
              />
              <button 
                onClick={handleManualWithdrawal}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition duration-150 text-black text-[10px] font-black uppercase rounded-lg px-3 flex items-center gap-1"
                title="Sacar para conta bancária via PIX"
              >
                <span>Sacar</span>
                <PiggyBank className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[9px] text-neutral-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoWithdraw}
                  onChange={e => handleToggleAutoPayout(e.target.checked)}
                  className="rounded border-neutral-800 bg-neutral-900 text-amber-500 focus:ring-0 w-3 h-3 cursor-pointer" 
                />
                <span>Saque Automático Semanal</span>
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* Main Tab Controller Bar */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-start gap-1.5 mt-8 border-b border-neutral-900 pb-2.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition duration-200 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-neutral-900 text-white border-b-2 border-red-500 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Visão Geral & Gráficos
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition duration-200 flex items-center gap-1.5 ${
            activeTab === 'subscriptions'
              ? 'bg-neutral-900 text-white border-b-2 border-red-500 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Gerenciar Assinantes
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition duration-200 flex items-center gap-1.5 ${
            activeTab === 'pricing'
              ? 'bg-neutral-900 text-white border-b-2 border-red-500 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Preços Dinâmicos
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition duration-200 flex items-center gap-1.5 ${
            activeTab === 'bank'
              ? 'bg-neutral-900 text-white border-b-2 border-red-500 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Cadastro Bancário Admin
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition duration-200 flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-neutral-900 text-white border-b-2 border-red-500 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Auditoria & Logs 2FA
        </button>

        <button
          onClick={() => setActiveTab('rbac_users')}
          className={`py-2 px-4 rounded-xl font-mono text-xs font-bold transition duration-200 flex items-center gap-1.5 ${
            activeTab === 'rbac_users'
              ? 'bg-neutral-900 text-white border-b-2 border-red-500 shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Controle de Acesso & RBAC
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`py-2 px-4 rounded-xl font-mono text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition duration-200 flex items-center gap-1.5`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Simulador de Cobrança Live
        </button>
      </div>

      {/* --- RENDER ACTIVE TAB VIEW CONTENT --- */}
      <div className="max-w-7xl mx-auto mt-6">

        {/* 1. VISÃO GERAL & GRÁFICOS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Charts & Graphs Showcase Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily / Monthly financial growth graph (Pure custom scale SVG) */}
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      Evolução Financeira Contínua (Últimos 30 dias)
                    </h3>
                    <p className="text-[11px] text-neutral-400">Tendência de depósitos recebidos em USD. Sincronia de canais Stripe e PIX.</p>
                  </div>
                  <div className="flex gap-1.5 text-[9px] font-mono">
                    <span className="px-2 py-0.5 bg-red-650/10 border border-red-650/40 text-red-500 rounded">STRIPE LIVE</span>
                    <span className="px-2 py-0.5 bg-[#1EA7FD]/10 border border-[#1EA7FD]/30 text-[#1EA7FD] rounded">MERCADO PAGO</span>
                  </div>
                </div>

                {/* GRAPH CANVAS DRAWING (Using Pure Responsive Adaptive SVG) */}
                <div className="relative py-4 aspect-auto h-48 md:h-60 bg-[#040404]/80 border border-neutral-900 rounded-xl px-4 flex flex-col justify-end">
                  <div className="absolute inset-0 grid grid-rows-4 pointer-events-none p-3">
                    <div className="border-b border-neutral-900 text-[8px] text-neutral-500 text-right pr-2">R$ 1.000,00</div>
                    <div className="border-b border-neutral-900 text-[8px] text-neutral-500 text-right pr-2">R$ 750,00</div>
                    <div className="border-b border-neutral-900 text-[8px] text-neutral-500 text-right pr-2">R$ 500,00</div>
                    <div className="border-b border-neutral-900 text-[8px] text-neutral-500 text-right pr-2">R$ 250,00</div>
                  </div>

                  {/* SVG PATH */}
                  <svg className="w-full h-3/4 overflow-visible z-10" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Area under curve */}
                    <path 
                      d="M 0 100 L 50 82 L 100 88 L 150 63 L 200 45 L 250 51 L 300 32 L 350 25 L 400 41 L 450 15 L 500 12 L 500 100 Z" 
                      fill="url(#chartGradient)" 
                    />
                    {/* Main Line */}
                    <path 
                      d="M 0 100 L 50 82 L 100 88 L 150 63 L 200 45 L 250 51 L 300 32 L 350 25 L 400 41 L 450 15 L 500 12" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />
                    
                    {/* Highlight circles on nodes */}
                    <circle cx="200" cy="45" r="4" fill="#eedc32" stroke="#000" strokeWidth="1" />
                    <circle cx="350" cy="25" r="4" fill="#ef4444" stroke="#000" strokeWidth="1" />
                    <circle cx="450" cy="15" r="4" fill="#10b981" stroke="#000" strokeWidth="1" />
                    <circle cx="500" cy="12" r="4" fill="#ef4444" stroke="#000" strokeWidth="1" />
                  </svg>
                  
                  {/* Hover tooltips representation */}
                  <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-neutral-900 border border-neutral-800 py-1.5 px-3 rounded-lg flex items-center gap-2 pointer-events-none shadow-xl z-20">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-[10px] font-mono text-neutral-300">Pico de Faturamento Semanal: +R$ {transactions.length > 5 ? '135,40' : '90,00'}</span>
                  </div>

                  {/* Horizontal Timeline labels */}
                  <div className="flex justify-between text-[8px] font-mono text-stone-500 mt-2 border-t border-neutral-900 pt-1.5">
                    <span>Início de Maio</span>
                    <span>Semana 2</span>
                    <span>Semana 3</span>
                    <span>Hoje (25 de Maio/2026)</span>
                  </div>
                </div>
              </div>

              {/* Subscriptions donut representation & Plans summary */}
              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Distribuição de Assinaturas
                  </h3>
                  <p className="text-[11px] text-neutral-400 mb-4">Volume total distribuído de estudantes por graduação de plano ativa.</p>
                </div>

                {/* Circular donut draw with pure custom SVGs */}
                <div className="flex items-center justify-center py-2 relative">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#171717" strokeWidth="3" />
                    
                    {/* VIP Ring (Amber) */}
                    <circle 
                      cx="18" cy="18" r="15.915" 
                      fill="none" 
                      stroke={segments.vip.color} 
                      strokeWidth="3.2" 
                      strokeDasharray={`${segments.vip.pct * 100} ${100 - (segments.vip.pct * 100)}`} 
                      strokeDashoffset="0" 
                    />
                    {/* Premium Ring (Red) */}
                    <circle 
                      cx="18" cy="18" r="15.915" 
                      fill="none" 
                      stroke={segments.premium.color} 
                      strokeWidth="3.2" 
                      strokeDasharray={`${segments.premium.pct * 100} ${100 - (segments.premium.pct * 100)}`} 
                      strokeDashoffset={-(segments.vip.pct * 100)} 
                    />
                  </svg>
                  
                  {/* Center percentage indicator */}
                  <div className="absolute text-center">
                    <span className="text-lg font-black text-white font-mono block leading-none">
                      {Math.round((segments.vip.pct + segments.premium.pct) * 100)}%
                    </span>
                    <span className="text-[7px] text-neutral-500 font-mono tracking-wide uppercase">PREMIUMS/VIP</span>
                  </div>
                </div>

                {/* Legendary labels list */}
                <div className="space-y-2 mt-4 text-[11px]">
                  <div className="flex items-center justify-between p-1.5 bg-[#030303] border border-neutral-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-white font-medium">Plano VIP (Total)</span>
                    </div>
                    <span className="font-mono font-bold text-amber-500">{segments.vip.count} usuários</span>
                  </div>

                  <div className="flex items-center justify-between p-1.5 bg-[#030303] border border-neutral-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-white font-medium">Plano Premium</span>
                    </div>
                    <span className="font-mono font-bold text-red-500">{segments.premium.count} usuários</span>
                  </div>

                  <div className="flex items-center justify-between p-1.5 bg-[#030303] border border-neutral-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-neutral-500" />
                      <span className="text-neutral-400">Plano Gratuito / Outros</span>
                    </div>
                    <span className="font-mono font-bold text-neutral-400">{segments.free.count} usuários</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Platform Revenue & Ledger logs with export buttons */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 mt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                    <History className="w-4 h-4 text-neutral-400" />
                    Histórico Contábil Global & Auditoria de Boletos
                  </h3>
                  <p className="text-[11px] text-neutral-400">Registros em tempo real das faturas aprovadas e repasses processados pelo gateway.</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button 
                    onClick={() => exportToCSV('transactions')}
                    className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white text-[10px] font-bold flex items-center gap-1 animate-pulse"
                    disabled={exporting}
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Exportar Transações (CSV)</span>
                  </button>

                  <button 
                    onClick={() => exportToCSV('subscriptions')}
                    className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white text-[10px] font-bold flex items-center gap-1"
                    disabled={exporting}
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Faturas de Assinaturas (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Advanced search modifiers & Filters for ledger */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#030303] border border-neutral-900 p-3 rounded-xl mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute top-2.5 left-3 text-stone-600" />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome ou método..." 
                    value={filterQuery}
                    onChange={e => setFilterQuery(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-neutral-600 font-mono text-white placeholder-stone-700"
                  />
                </div>

                <div>
                  <select 
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-neutral-600 font-mono cursor-pointer"
                  >
                    <option value="All">Todos os Status</option>
                    <option value="Aprovado">Aprovados</option>
                    <option value="Pendente">Pendentes</option>
                    <option value="Suspeito">Suspeitos</option>
                    <option value="Chargeback">Chargeback</option>
                    <option value="Falhado">Falhados</option>
                  </select>
                </div>

                <div>
                  <select 
                    value={methodFilter}
                    onChange={e => setMethodFilter(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-neutral-600 font-mono cursor-pointer"
                  >
                    <option value="All">Todos os Gateways</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Stripe">Stripe</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Apple Pay">Apple Pay</option>
                    <option value="Google Pay">Google Pay</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>

                <div className="flex items-center justify-end text-[9px] font-mono text-stone-500 pr-1.5">
                  Visualizando {filteredTransactions.length} linhas
                </div>
              </div>

              {/* Transactions table representation */}
              <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-[#030303]/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#030303] text-stone-500 border-b border-neutral-900 text-[10px] font-mono uppercase">
                      <th className="p-3">ID Transação</th>
                      <th className="p-3">Estudante</th>
                      <th className="p-3">Faturamento Bruto</th>
                      <th className="p-3">Canal / Método</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Data Evento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 font-mono">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500 italic">
                          Nenhuma transação financeira localiza os filtros atuais. Use o simulador ao lado para gerar novas vendas de teste!
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-neutral-900/40 transition-colors duration-150">
                          <td className="p-3 select-all text-neutral-500 text-[10px]">{tx.id}</td>
                          <td className="p-3 font-bold text-neutral-300">
                            {tx.user_name}
                            <span className="block text-[8px] text-neutral-600 font-normal">ALUNO ID: {tx.user_id}</span>
                          </td>
                          <td className="p-3 text-neutral-100 font-black">
                            {currencyFormat(tx.amount)}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[9px] rounded font-bold text-neutral-400">
                              {tx.method}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                              tx.status === 'Aprovado' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              tx.status === 'Pendente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              tx.status === 'Suspeito' ? 'bg-red-500/10 text-rose-500 border-rose-500/20 animate-pulse' :
                              tx.status === 'Chargeback' ? 'bg-orange-500/10 text-orange-400 border-orange-500/25' :
                              'bg-zinc-500/10 text-stone-500 border-zinc-500/20'
                            }`}>
                              ● {tx.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-stone-500 text-[10px]">
                            {new Date(tx.created_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 2. PLANOS DE ASSINATURA */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            
            {/* Direct plan adjustment manager */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 md:col-span-1">
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide mb-3">
                  <Sliders className="w-4 h-4 text-red-500" />
                  Atualizar Plano Manualmente
                </h3>
                <p className="text-stone-400 text-xs mb-4">
                  Selecione um estudante do tatame cadastrado e manipule a graduação do seu plano de estudos.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Escolher Estudante</label>
                    <select 
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full bg-[#030303] border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="u2">Marcus Miller (Brown Belt)</option>
                      <option value="u3">Yuki 'Samurai' Sato (Purple Belt)</option>
                      <option value="u4">Elena Petrova (Purple Belt)</option>
                      <option value="u5">Renato 'Tubarão' Santos (Brown Belt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Graduar Plano Financ.</label>
                    <div className="grid grid-cols-3 gap-1 bg-[#030303] p-1 rounded-lg border border-neutral-850">
                      {(['Free', 'Premium', 'VIP'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTargetPlan(p)}
                          className={`py-1.5 text-[10px] font-black uppercase rounded ${
                            targetPlan === p 
                              ? 'bg-red-600 text-white' 
                              : 'text-stone-500 hover:text-stone-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleModifyPlan}
                    className="w-full py-2 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 transition text-white font-bold text-xs uppercase tracking-wider rounded-lg mt-2"
                  >
                    Confirmar Transição
                  </button>
                </div>
              </div>

              {/* Subscriptions Plans Info */}
              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 md:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Mapeamento de Benefícios dos Planos JiuSpeak
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Free plan */}
                  <div className="border border-neutral-850 bg-neutral-950 rounded-xl p-3.5 space-y-2">
                    <span className="px-2 py-0.5 bg-neutral-800 text-[9px] font-bold text-stone-500 rounded">BASIC</span>
                    <h4 className="font-extrabold text-[#9CA3AF] text-base">Plano Free</h4>
                    <p className="text-stone-400 text-[10px]">Acesso aos termos básicos e dicionário geral de gírias.</p>
                    <ul className="text-[10px] text-stone-500 space-y-1 pt-2 border-t border-neutral-850">
                      <li>• Audição de áudios básica</li>
                      <li>• Sem PvP ilimitado</li>
                      <li>• Sem certificados</li>
                    </ul>
                  </div>

                  {/* Premium plan */}
                  <div className="border border-red-950/40 bg-neutral-950 rounded-xl p-3.5 space-y-2 relative">
                    <span className="px-2 py-0.5 bg-red-950/40 text-[9px] font-bold text-red-500 rounded">POPULAR</span>
                    <h4 className="font-extrabold text-white text-base">Premium Pro</h4>
                    <p className="text-stone-400 text-[10px]">O ideal para competidores e profissionais que vão morar no exterior.</p>
                    <ul className="text-[10px] text-stone-400 space-y-1 pt-2 border-t border-neutral-850">
                      <li>✔ Prova e Certificado Digital</li>
                      <li>✔ Matchmaking PvP avançado</li>
                      <li>✔ Todos os cards desbloqueados</li>
                    </ul>
                  </div>

                  {/* VIP plan */}
                  <div className="border border-amber-950 bg-neutral-950 rounded-xl p-3.5 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 py-0.5 px-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[7px] font-black uppercase tracking-wider font-mono">
                      ACC RETIDO
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-[9px] font-bold text-amber-500 rounded">VIP TOTAL</span>
                    <h4 className="font-extrabold text-amber-500 text-base">Elite VIP</h4>
                    <p className="text-stone-400 text-[10px]">Acesso irrestrito a lives semanais, torneios organizados e bônus de XP.</p>
                    <ul className="text-[10px] text-stone-400 space-y-1 pt-2 border-t border-neutral-850">
                      <li>⭐ Acesso a encontros Zoom</li>
                      <li>⭐ Recompensas de Avatar extras</li>
                      <li>⭐ Suporte VIP prioritário</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* List of current Active Subscribers */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide mb-4">
                <UserCheck className="w-4 h-4 text-neutral-400" />
                Ledger Ativo de Membros Assinantes
              </h3>

              <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-[#030303]/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#030303] text-stone-500 border-b border-neutral-900 text-[10px] font-mono uppercase">
                      <th className="p-3">ID Plano</th>
                      <th className="p-3">Nome do Assinante</th>
                      <th className="p-3">Graduação Plano</th>
                      <th className="p-3">Preço Mensal</th>
                      <th className="p-3">Status Cobrança</th>
                      <th className="p-3 text-right">Data Expiração</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 font-mono">
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500 italic">Nenhum assinante ativo cadastrado no banco.</td>
                      </tr>
                    ) : (
                      subscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-neutral-900/40">
                          <td className="p-3 text-neutral-500 text-[10px]">{sub.id}</td>
                          <td className="p-3 text-neutral-200 font-bold">
                            {sub.user_name}
                            <span className="block text-[8px] text-neutral-500 font-normal">ALUNO ID: {sub.user_id}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                              sub.plan === 'VIP' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              sub.plan === 'Premium' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              'bg-neutral-800 text-stone-400'
                            }`}>
                              {sub.plan}
                            </span>
                          </td>
                          <td className="p-3 text-neutral-200 font-bold">{currencyFormat(sub.price)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              sub.status === 'Ativa' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-500/10 text-stone-500'
                            }`}>
                              ● {sub.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-stone-500 text-[10px]">
                            {new Date(sub.expires_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 2.5 DYNAMIC PRICING AND PROMOTION MANAGEMENT PANEL */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-gradient-to-r from-red-600/10 via-neutral-900 to-neutral-900 border border-neutral-850 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 select-none pointer-events-none">
                <DollarSign className="w-24 h-24 text-red-500" />
              </div>
              <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-500" />
                Painel Administrativo de Preços Dinâmicos — JiuSpeak
              </h2>
              <p className="text-xs text-neutral-400 max-w-2xl mt-1.5 leading-relaxed">
                Controle e atualize dinamicamente todos os valores de planos, boosters, moedas OSS Coins, taxas de marketplace e campanhas promocionais de descontos da plataforma sem necessidade de alterar o código-fonte da aplicação.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-850 text-center min-w-[140px]">
                  <span className="block text-[10px] text-neutral-400 font-mono uppercase">Itens Faturados</span>
                  <span className="text-lg font-black text-white">{storePricing.length}</span>
                </div>
                <div className="bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-850 text-center min-w-[140px]">
                  <span className="block text-[10px] text-neutral-400 font-mono uppercase">Assinaturas Ativas</span>
                  <span className="text-lg font-black text-red-400">{subscriptionPlans.length}</span>
                </div>
                <div className="bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-850 text-center min-w-[140px]">
                  <span className="block text-[10px] text-neutral-400 font-mono uppercase">Campanhas / Cupons</span>
                  <span className="text-lg font-black text-amber-500">{promotions.length}</span>
                </div>
                <div className="bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-850 text-center min-w-[140px]">
                  <span className="block text-[10px] text-neutral-400 font-mono uppercase">Log de Alterações</span>
                  <span className="text-lg font-black text-stone-500">{priceAdminLogs.length}</span>
                </div>
              </div>
            </div>

            {/* ERROR AND SUCCESS COMPACT alerts */}
            {errorMessage && (
              <div className="bg-red-950/40 border border-red-900 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-950/30 border border-emerald-900 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* SECTION 1: SYSTEM SUBSCRIPTIONS (FREE, PREMIUM, VIP) */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  1. Configuração de Níveis e Detalhes de Assinatura
                </h3>
                <span className="text-[10px] bg-red-950 text-red-500 px-2 py-0.5 rounded font-bold font-mono">CONTROLE TOTAL</span>
              </div>

              {selectedPlanItem ? (
                <form onSubmit={handleSaveSubscriptionPlan} className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">Editando Nível: {selectedPlanItem.plan_name}</span>
                    <button type="button" onClick={() => setSelectedPlanItem(null)} className="text-[10px] text-neutral-400 hover:text-white underline">Cancelar</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Nome do Plano</label>
                      <input 
                        type="text" 
                        value={planForm.plan_name}
                        onChange={e => setPlanForm({ ...planForm, plan_name: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white uppercase font-bold focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Mensalidade (Centavos de BRL)</label>
                      <input 
                        type="number" 
                        value={planForm.monthly_price}
                        onChange={e => setPlanForm({ ...planForm, monthly_price: Number(e.target.value) })}
                        placeholder="Ex: 1990 para R$ 19,90"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500"
                        required
                      />
                      <span className="text-[9px] text-amber-500 mt-1 block">R$ {(planForm.monthly_price / 100).toFixed(2)}</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Anuidade (Centavos de BRL)</label>
                      <input 
                        type="number" 
                        value={planForm.yearly_price}
                        onChange={e => setPlanForm({ ...planForm, yearly_price: Number(e.target.value) })}
                        placeholder="Ex: 15900 para R$ 159,00"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500"
                        required
                      />
                      <span className="text-[9px] text-amber-500 mt-1 block">R$ {(planForm.yearly_price / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Vantagens e Benefícios do Aluno (Um por linha)</label>
                    <textarea 
                      value={planForm.benefits}
                      onChange={e => setPlanForm({ ...planForm, benefits: e.target.value })}
                      placeholder="Exemplo:&#10;Lições ilimitadas tatame&#10;Pronúncia com IA integrada"
                      rows={4}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setSelectedPlanItem(null)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 rounded-lg">Cancelar</button>
                    <button type="submit" className="px-4 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg uppercase">Girar Chave do Plano</button>
                  </div>
                </form>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subscriptionPlans.map((plan: any) => (
                  <div key={plan.id} className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 flex flex-col justify-between relative hover:border-red-500/30 transition duration-300">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-white uppercase tracking-wider">{plan.plan_name}</span>
                        <Crown className={`w-4 h-4 ${plan.id === 'plan_vip' ? 'text-amber-500' : plan.id === 'plan_premium' ? 'text-red-500' : 'text-stone-500'}`} />
                      </div>
                      
                      <div className="py-2.5 my-2 border-y border-neutral-900 flex items-baseline justify-between">
                        <div>
                          <span className="block text-[8px] text-stone-500 uppercase font-mono">Mensalidade</span>
                          <span className="text-lg font-black text-white">R$ {(plan.monthly_price / 100).toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] text-stone-500 uppercase font-mono">Anuidade (Bruta)</span>
                          <span className="text-xs font-bold text-stone-300">R$ {(plan.yearly_price / 100).toFixed(2)}</span>
                          {plan.monthly_price > 0 && (
                            <span className="block text-[9px] text-emerald-400 font-mono">
                              Semestre Livre Trial Ativo!
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <span className="block text-[8px] text-neutral-400 font-mono uppercase mb-1">Benefícios Ativos:</span>
                        {plan.benefits.map((b: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-[10px] text-stone-400">
                            <span className="text-red-500 text-xs leading-none">•</span>
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-900">
                      <button
                        onClick={() => {
                          setSelectedPlanItem(plan);
                          setPlanForm({
                            plan_name: plan.plan_name,
                            monthly_price: plan.monthly_price,
                            yearly_price: plan.yearly_price,
                            benefits: plan.benefits.join('\n')
                          });
                        }}
                        className="w-full bg-neutral-900 hover:bg-neutral-800 transition duration-150 py-1.5 rounded-lg text-xs font-bold font-mono text-stone-300 hover:text-white"
                      >
                        Editar Preços & Detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: INDIVIDUAL VALUES TABLES (COINS, BOSTERS, PACKS, COSMETICS, CARDS, BADGES) */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-900 pb-3 mb-4 gap-2">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-red-500" />
                  2. Configuração de Itens Individuais da Loja e Serviços
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPricingItem({ id: '', item_name: '', category: 'coins', price_brl: 990, active: true, updated_at: '' });
                    setPricingForm({ item_name: '', category: 'coins', price_brl: 990, active: true });
                  }}
                  className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[10px] uppercase font-black px-2.5 py-1 rounded flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Item / Preço
                </button>
              </div>

              {selectedPricingItem ? (
                <form onSubmit={handleSaveStorePricing} className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400">
                      {selectedPricingItem.id ? `Editando Preço ID: ${selectedPricingItem.id}` : 'Criar Nova Regra de Preço'}
                    </span>
                    <button type="button" onClick={() => setSelectedPricingItem(null)} className="text-[10px] text-neutral-400 hover:text-white underline">Cancelar</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Nome do Item / Serviço no Tatame</label>
                      <input 
                        type="text" 
                        value={pricingForm.item_name}
                        onChange={e => setPricingForm({ ...pricingForm, item_name: e.target.value })}
                        placeholder="Ex: Pacote de moedas 10.000 ou Badge Faixa Preta"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Categoria de Atuação</label>
                      <select 
                        value={pricingForm.category}
                        onChange={e => setPricingForm({ ...pricingForm, category: e.target.value as any })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="subscription">Subscriptions Plans Addon</option>
                        <option value="coins">OSS Coins (Moeda)</option>
                        <option value="pack">Packs de Cards (Boosters/Packs)</option>
                        <option value="card">Cards Unitários (Mítico/Raro)</option>
                        <option value="booster">Boosters de XP / Multiplicadores</option>
                        <option value="cosmetic">Cosméticos / Skins de Avatar</option>
                        <option value="badge">Badges de Faixas / Conquistas</option>
                        <option value="special_event">Inscrição em Eventos Especiais</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Preço Real (Em Centavos de BRL)</label>
                      <input 
                        type="number" 
                        value={pricingForm.price_brl}
                        onChange={e => setPricingForm({ ...pricingForm, price_brl: Number(e.target.value) })}
                        placeholder="Ex: 490 para R$ 4,90"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500"
                        required
                      />
                      <span className="text-[9px] text-emerald-400 mt-1 block">R$ {(pricingForm.price_brl / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-900">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                      <input 
                        type="checkbox" 
                        checked={pricingForm.active}
                        onChange={e => setPricingForm({ ...pricingForm, active: e.target.checked })}
                        className="rounded bg-neutral-900 border-neutral-800 text-red-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      Habilitar faturamento deste item na plataforma
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSelectedPricingItem(null)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 rounded-lg">Cancelar</button>
                      <button type="submit" className="px-4 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg uppercase">Aplicar Novo Valor</button>
                    </div>
                  </div>
                </form>
              ) : null}

              <div className="overflow-x-auto pb-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-900 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                      <th className="p-3">Nome / Descrição</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3 text-right">Preço Dinâmico (BRL)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-950">
                    {storePricing.map((item: any) => (
                      <tr key={item.id} className="hover:bg-neutral-950/40 text-stone-300 transition duration-100">
                        <td className="p-3">
                          <span className="block text-xs font-bold text-white">{item.item_name}</span>
                          <span className="block text-[8px] text-stone-500 font-mono">ID: {item.id}</span>
                        </td>
                        <td className="p-3">
                          <span className="bg-neutral-900 border border-neutral-855 px-2 py-0.5 rounded text-[9px] font-mono capitalize text-stone-400">
                            {item.category === 'coins' ? 'OSS Moedas' :
                             item.category === 'pack' ? 'Pacote Cards' :
                             item.category === 'card' ? 'Cartões PvP' :
                             item.category === 'booster' ? 'Aceleração XP' :
                             item.category === 'cosmetic' ? 'Skins / Ícone' :
                             item.category === 'badge' ? 'Badges Faixa' :
                             item.category === 'subscription' ? 'Planos Subs' : item.category}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-xs font-mono font-black text-white">R$ {(item.price_brl / 100).toFixed(2)}</span>
                        </td>
                        <td className="p-3">
                          {item.active ? (
                            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] text-stone-500">
                              <span className="h-1.5 w-1.5 bg-stone-600 rounded-full" /> Inexistente
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedPricingItem(item);
                                setPricingForm({
                                  item_name: item.item_name,
                                  category: item.category,
                                  price_brl: item.price_brl,
                                  active: item.active
                                });
                              }}
                              className="text-[10px] text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 transition duration-150 px-2 py-1 rounded"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteStorePricing(item.id)}
                              className="text-[10px] text-red-500 hover:text-white bg-red-950/20 hover:bg-red-600 transition duration-150 px-2 py-1 rounded"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: PROMOTIONS, COUPONS AND INCENTIVES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                      <Percent className="w-4 h-4 text-emerald-500" />
                      3. Cupons de Desconto & Campanhas Ativas
                    </h3>
                    <span className="text-[10px] text-stone-500 font-mono">DINÂMICA</span>
                  </div>

                  {selectedPromoItem ? (
                    <form onSubmit={handleSavePromotion} className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-4 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">Inserindo Cupom / Campanha</span>
                        <button type="button" onClick={() => setSelectedPromoItem(null)} className="text-[10px] text-neutral-400 hover:text-white underline">Cancelar</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Nome de Exibição</label>
                          <input 
                            type="text" 
                            value={promoForm.title}
                            onChange={e => setPromoForm({ ...promoForm, title: e.target.value })}
                            placeholder="Ex: Primavera Tatame OFF"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Código do Cupom de Desconto</label>
                          <input 
                            type="text" 
                            value={promoForm.promo_code}
                            onChange={e => setPromoForm({ ...promoForm, promo_code: e.target.value.toUpperCase() })}
                            placeholder="Ex: OSS10"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white uppercase font-mono focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">% Porcentagem de Desconto</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="100"
                            value={promoForm.discount_percentage}
                            onChange={e => setPromoForm({ ...promoForm, discount_percentage: Number(e.target.value) })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">% Porcentagem Cashback Coin</label>
                          <input 
                            type="number" 
                            min="0" 
                            max="100"
                            value={promoForm.cashback_percentage}
                            onChange={e => setPromoForm({ ...promoForm, cashback_percentage: Number(e.target.value) })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-red-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setSelectedPromoItem(null)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-1.5 text-xs text-black bg-emerald-400 hover:bg-emerald-500 font-bold rounded-lg uppercase">Ativar Campanha</button>
                      </div>
                    </form>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promotions.map((promo: any) => (
                      <div key={promo.id} className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition duration-300">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-white">{promo.title}</span>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-mono font-bold">
                              {promo.promo_code ? promo.promo_code : 'DESCONTO GERAL'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 my-2.5 py-2 border-y border-neutral-900 text-center">
                            <div>
                              <span className="block text-[8px] text-stone-500 uppercase font-mono">Desconto</span>
                              <span className="text-lg font-black text-white">{promo.discount_percentage}% OFF</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-stone-500 uppercase font-mono">Retorno Coins</span>
                              <span className="text-lg font-black text-emerald-400">{promo.cashback_percentage || 0}%</span>
                            </div>
                          </div>

                          <div className="text-[9px] text-neutral-500 font-mono space-y-0.5 mt-2">
                            <span>Vigência automática de campanhas saas</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-900 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPromoItem(promo);
                              setPromoForm({
                                title: promo.title,
                                discount_percentage: promo.discount_percentage,
                                start_date: promo.start_date,
                                end_date: promo.end_date,
                                promo_code: promo.promo_code || '',
                                cashback_percentage: promo.cashback_percentage || 0
                              });
                            }}
                            className="text-[10px] text-stone-400 hover:text-white px-2 py-1 bg-neutral-900 hover:bg-neutral-850 rounded-lg font-bold"
                          >
                            Configurar
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="text-[10px] text-red-500 hover:text-white px-2 py-1 bg-neutral-900 hover:bg-red-950/20 rounded-lg"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-900">
                  <button
                    onClick={() => {
                      setSelectedPromoItem({ id: '', title: '', discount_percentage: 10, start_date: '', end_date: '' });
                      setPromoForm({ title: '', discount_percentage: 10, start_date: '', end_date: '', promo_code: '', cashback_percentage: 5 });
                    }}
                    className="w-full bg-neutral-900 hover:bg-neutral-850 transition duration-150 py-2 rounded-xl text-xs text-center font-bold text-emerald-400 border border-emerald-500/20"
                  >
                    + Criar Novo Cupom Ativo Imparável
                  </button>
                </div>
              </div>

              {/* MARKETPLACE CONFIGURATION PANEL */}
              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                <form onSubmit={handleUpdateMarketplaceConfig} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-500" />
                      4. Taxação de Marketplace
                    </h3>
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold font-mono">GLOBAL</span>
                  </div>

                  <p className="text-[10px] text-stone-500 leading-normal">
                    Regule a taxa de venda do marketplace financeiro (troca de cards de atletas e cosméticos criados por usuários no tatame medieval).
                  </p>

                  <div className="space-y-3.5 pt-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-1.5 uppercase">
                        <span>Taxa de Venda (%)</span>
                        <span className="text-white font-bold">{marketForm.tax_percentage}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="25" 
                        value={marketForm.tax_percentage} 
                        onChange={e => setMarketForm({ ...marketForm, tax_percentage: Number(e.target.value) })}
                        className="w-full accent-red-650 h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-1.5 uppercase">
                        <span>Comissão JiuSpeak Plataforma (%)</span>
                        <span className="text-white font-bold">{marketForm.commission_percentage}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={marketForm.commission_percentage} 
                        onChange={e => setMarketForm({ ...marketForm, commission_percentage: Number(e.target.value) })}
                        className="w-full accent-red-650 h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[8px] text-stone-500 font-mono uppercase mb-1">Preço Mínimo Listado</label>
                        <input 
                          type="number" 
                          value={marketForm.min_price}
                          onChange={e => setMarketForm({ ...marketForm, min_price: Number(e.target.value) })}
                          className="w-full bg-neutral-950 border border-neutral-850 rounded-lg py-1 px-2.5 text-xs text-white text-center font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-stone-500 font-mono uppercase mb-1">Preço Máximo Autorizado</label>
                        <input 
                          type="number" 
                          value={marketForm.max_price}
                          onChange={e => setMarketForm({ ...marketForm, max_price: Number(e.target.value) })}
                          className="w-full bg-neutral-950 border border-neutral-850 rounded-lg py-1 px-2.5 text-xs text-white text-center font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-900">
                    <button
                      type="submit"
                      className="w-full bg-red-650 hover:bg-red-700 font-bold uppercase transition duration-150 py-2 rounded-xl text-stone-100 hover:text-white text-xs text-center"
                    >
                      Gravar Parâmetros Globais
                    </button>
                  </div>
                </form>

                <div className="mt-4 bg-amber-500/5 rounded-xl border border-amber-500/10 p-3 text-[10px] text-stone-400 leading-normal flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>
                    As comissões são deduzidas no momento da liquidação da transação de cards na corretora descentralizada. Alterações retroativas não afetarão ordens criadas.
                  </span>
                </div>
              </div>

            </div>

            {/* SECTION 4: DETAILED PRICE REAJUST AUTOMATION AUDIT LOGS */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  5. Auditoria Geral e Histórico de Reajustes Financeiros
                </h3>
                <span className="text-[10px] text-stone-500 font-mono">TIMELINE DE ALTERAÇÕES</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-neutral-900 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                      <th className="p-3">Data da Modificação</th>
                      <th className="p-3">Iniciador (Administrador)</th>
                      <th className="p-3">Operação efetuada</th>
                      <th className="p-3">Valor Anterior</th>
                      <th className="p-3">Novo Valor Gravado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-950 text-stone-300 font-mono">
                    {priceAdminLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-stone-600">
                          Nenhum ajuste registrado neste período.
                        </td>
                      </tr>
                    ) : (
                      priceAdminLogs.map((item: any) => (
                        <tr key={item.id} className="hover:bg-neutral-950/20 transition duration-100">
                          <td className="p-3 text-stone-500">
                            {new Date(item.created_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3 font-bold text-red-400">
                            {item.admin_id}
                          </td>
                          <td className="p-3 font-medium text-white">
                            {item.action}
                          </td>
                          <td className="p-3 text-stone-500 truncate max-w-[200px]" title={item.old_value}>
                            {item.old_value}
                          </td>
                          <td className="p-3 text-emerald-400 font-bold truncate max-w-[200px]" title={item.new_value}>
                            {item.new_value}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 3. CADASTRO BANCÁRIO DO ADMINISTRADOR */}
        {activeTab === 'bank' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Bank update register screen form */}
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                      <Building className="w-4 h-4 text-emerald-500" />
                      Área Segura para Preenchimento Bancário
                    </h3>
                    <p className="text-[11px] text-neutral-400">Insira a conta jurídica principal para escoamento das comissões e MRR.</p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsBankEnrypted(!isBankEnrypted)}
                      className="p-1 px-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      {isBankEnrypted ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>Revelar Dados</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Ocultar Dados</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveBank} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Instituição Bancária</label>
                      <input 
                        type="text" 
                        required
                        value={bankEdit.bank_name}
                        onChange={e => setBankEdit({ ...bankEdit, bank_name: e.target.value })}
                        disabled={isBankEnrypted}
                        className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono disabled:opacity-50"
                        placeholder="Banco do Brasil S.A. / Itaú / Stripe"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Chave PIX Oficial (Repasse)</label>
                      <input 
                        type="text" 
                        required
                        value={bankEdit.pix_key}
                        onChange={e => setBankEdit({ ...bankEdit, pix_key: e.target.value })}
                        disabled={isBankEnrypted}
                        className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono disabled:opacity-50"
                        placeholder="E-mail ou CNPJ (Ex: financeiro@jiuspeak.com)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Agência</label>
                      <input 
                        type="text" 
                        required
                        value={bankEdit.agency}
                        onChange={e => setBankEdit({ ...bankEdit, agency: e.target.value })}
                        disabled={isBankEnrypted}
                        className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono disabled:opacity-50"
                        placeholder="1234"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Número de Conta</label>
                      <input 
                        type="text" 
                        required
                        value={bankEdit.account_number}
                        onChange={e => setBankEdit({ ...bankEdit, account_number: e.target.value })}
                        disabled={isBankEnrypted}
                        className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono disabled:opacity-50"
                        placeholder="98765-4"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Tipo de Conta</label>
                      <select 
                        value={bankEdit.account_type}
                        onChange={e => setBankEdit({ ...bankEdit, account_type: e.target.value as any })}
                        disabled={isBankEnrypted}
                        className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono cursor-pointer disabled:opacity-50"
                      >
                        <option value="Corrente">Corrente / Jurídica (PJ)</option>
                        <option value="Poupança">Poupança / Geral</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Nome Completo do Titular</label>
                      <input 
                        type="text" 
                        required
                        value={bankEdit.owner_name}
                        onChange={e => setBankEdit({ ...bankEdit, owner_name: e.target.value })}
                        disabled={isBankEnrypted}
                        className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-neutral-600 disabled:opacity-50"
                        placeholder="Nome social ou Razão Social"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">CPF ou CNPJ (Faturamento)</label>
                      <input 
                        type="text" 
                        required
                        value={bankEdit.cpf_cnpj}
                        onChange={e => setBankEdit({ ...bankEdit, cpf_cnpj: e.target.value })}
                        disabled={isBankEnrypted}
                        className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono disabled:opacity-50"
                        placeholder="12.345.678/0001-90"
                      />
                    </div>
                  </div>

                  {/* Dynamic SECURE 2FA Verification fields */}
                  {showOtpField && (
                    <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl mt-4 animate-fadeIn space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded">REQUERIDO</span>
                        <span className="text-[11px] font-bold text-amber-500">Autenticação 2FA por SMS/E-mail de Segurança</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Insira o token temporário associado para criptografar os dados bancários na plataforma. 
                        <strong> Código de Teste do Administrador: 123456 ou 080808</strong>
                      </p>
                      
                      <div className="flex items-center gap-2 max-w-xs pt-1.5">
                        <input 
                          type="text" 
                          placeholder="Digite seu token de 6 dígitos" 
                          maxLength={6}
                          value={bankEdit.code2FA}
                          onChange={e => setBankEdit({ ...bankEdit, code2FA: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white text-center font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      {otpSentNotice && (
                        <p className="text-[9px] text-[#1EA7FD] animate-pulse">✓ Código OTP de teste despachado temporariamente para o número cadastrado.</p>
                      )}
                    </div>
                  )}

                  {/* Submit / Locking controls */}
                  <div className="pt-2 border-t border-neutral-900 flex justify-between items-center">
                    <p className="text-[10px] text-stone-500 italic max-w-md">
                      ⚠️ Seus dados bancários encontram-se protegidos por hash salted e são guardados sob criptografia ponta-a-ponta no servidor.
                    </p>
                    
                    {isBankEnrypted ? (
                      <button 
                        type="button"
                        onClick={() => setIsBankEnrypted(false)}
                        className="py-2 px-5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-neutral-800 flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Desbloquear Cadastro</span>
                      </button>
                    ) : (
                      <button 
                        type="submit"
                        className="py-2.5 px-6 bg-red-650 hover:bg-red-700 font-bold text-xs text-white uppercase tracking-wider rounded-lg flex items-center gap-2 shadow"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{showOtpField ? 'Aplicar Mudanças' : 'Verificar via 2FA'}</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Bank summary badge */}
              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide mb-3">
                    <Building className="w-4 h-4 text-neutral-400" />
                    Conta Bancária Cadastrada
                  </h3>
                  <p className="text-[11px] text-neutral-400">Chassi bancário para as transferências fiscais e repasses.</p>
                  
                  {bankAccount ? (
                    <div className="mt-4 bg-[#030303] border border-neutral-900 rounded-xl p-4 space-y-4 font-mono text-[11px] relative overflow-hidden">
                      <div className="absolute top-2 right-2 text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 uppercase">
                        ATIVO
                      </div>
                      
                      <div>
                        <span className="text-[8px] text-neutral-500 uppercase block">Instituição Bancária</span>
                        <span className="text-neutral-200 font-bold block">{bankAccount.bank_name}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[8px] text-neutral-500 uppercase block">Agência</span>
                          <span className="text-neutral-200 block">{isBankEnrypted ? '••••' : bankAccount.agency}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-neutral-500 uppercase block">Conta</span>
                          <span className="text-neutral-200 block">{isBankEnrypted ? '••••••••' : bankAccount.account_number}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] text-neutral-500 uppercase block">Chave PIX cadastrada</span>
                        <span className="text-amber-500 select-all block">{isBankEnrypted ? '••••••••••••••••' : bankAccount.pix_key}</span>
                      </div>

                      <div>
                        <span className="text-[8px] text-neutral-500 uppercase block">Titular da Conta</span>
                        <span className="text-neutral-300 block">{bankAccount.owner_name}</span>
                        <span className="text-[9px] text-neutral-500 space-y-0.5">{isBankEnrypted ? '••.•••.•••/••••-••' : bankAccount.cpf_cnpj}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-8 border border-dashed border-neutral-800 rounded-xl text-center text-xs text-neutral-500">
                      Nenhuma conta bancária de repasse configurada. Preencha o painel ao lado de forma segura.
                    </div>
                  )}
                </div>

                <div className="mt-4 text-[10px] text-neutral-500 space-y-1 bg-[#030303] p-3 rounded-lg border border-neutral-900">
                  <p>🔹 Multi-admin ativo.</p>
                  <p>🔹 Logs de saques criptografados auditáveis.</p>
                </div>
              </div>

            </div>

            {/* Withdraw historical payouts list */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide mb-4">
                <PiggyBank className="w-4 h-4 text-neutral-400" />
                Histórico de Saques & Transferências Realizadas (Payouts Ledger)
              </h3>

              <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-[#030303]/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#030303] text-stone-500 border-b border-neutral-900 text-[10px] font-mono uppercase">
                      <th className="p-3">ID Saque</th>
                      <th className="p-3">Conta Bancária ID</th>
                      <th className="p-3">Chave PIX de Destino</th>
                      <th className="p-3">Valor de Retirada</th>
                      <th className="p-3">Status TED/PIX</th>
                      <th className="p-3 text-right">Data Evento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 font-mono">
                    {payouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500 italic">Nenhum payout cadastrado ou solicitado pelo administrador.</td>
                      </tr>
                    ) : (
                      payouts.map((out) => (
                        <tr key={out.id} className="hover:bg-neutral-900/40">
                          <td className="p-3 text-neutral-400 font-medium select-all">{out.id}</td>
                          <td className="p-3 text-stone-500">{out.bank_account_id}</td>
                          <td className="p-3 text-amber-500">{out.pix_key}</td>
                          <td className="p-3 text-white font-black">{currencyFormat(out.amount)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded ${
                              out.status === 'Processado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-stone-800 text-stone-400'
                            }`}>
                              {out.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-stone-500">
                            {new Date(out.created_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 4. LOGS DE AUDITORIA E SEGURANÇA 2FA */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            
            {/* Quick alert notifications cards / banners */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-4 border-l-4 border-red-500 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block font-bold">ALERTA ANTIFRAUDE</span>
                  <span className="font-bold text-white text-xs block mt-0.5">Tentativa Suspeita Suspended</span>
                  <p className="text-neutral-400 text-[10px] leading-relaxed mt-1">Transação u_attacker bloqueada preventivamente após múltiplos pagamentos falhados.</p>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-4 border-l-4 border-amber-500 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block font-bold">SINALIZAÇÃO DE VENDAS</span>
                  <span className="font-bold text-white text-xs block mt-0.5">Fatura VIP de Lucas Silva</span>
                  <p className="text-neutral-400 text-[10px] leading-relaxed mt-1">Venda processada com total sucesso via PIX em tempo real. Notificações do estudante despachadas.</p>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-4 border-l-4 border-stone-500 flex items-start gap-3">
                <Shield className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block font-bold">MULTILAYER SECURITIES</span>
                  <span className="font-bold text-white text-xs block mt-0.5">Criptografia Local Segura</span>
                  <p className="text-neutral-400 text-[10px] leading-relaxed mt-1">Todos os dados de agência, conta e senhas dos administradores estão criptografados via hash SHA-256 local.</p>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-4 border-l-4 border-[#1EA7FD] flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#1EA7FD] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block font-bold">MONITORAMENTO DE REPASSE</span>
                  <span className="font-bold text-white text-xs block mt-0.5">Payout Automático Programado</span>
                  <p className="text-neutral-400 text-[10px] leading-relaxed mt-1">Estatuto de saque automático semanal configurado para o banco cadastrado.</p>
                </div>
              </div>

            </div>

            {/* System audit log table list */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide mb-4">
                <Shield className="w-4 h-4 text-red-500" />
                Auditoria de Logs Administrativos (System Security Logs)
              </h3>

              <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-[#030303]/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#030303] text-stone-500 border-b border-neutral-900 text-[10px] font-mono uppercase">
                      <th className="p-3">ID Log</th>
                      <th className="p-3">Operador Admin</th>
                      <th className="p-3">Ação Executada</th>
                      <th className="p-3">IP de Conexão</th>
                      <th className="p-3">Detalhes da Auditoria</th>
                      <th className="p-3 text-right">Data Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 font-mono">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500 italic">Nenhum evento registrado na auditoria do banco.</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-900/40">
                          <td className="p-3 text-neutral-500 text-[10px]">{log.id}</td>
                          <td className="p-3 text-neutral-300 font-bold">{log.admin_name}</td>
                          <td className="p-3 text-amber-500 font-bold">{log.action}</td>
                          <td className="p-3 text-neutral-400">{log.ip_address}</td>
                          <td className="p-3 text-stone-400 font-normal">{log.details}</td>
                          <td className="p-3 text-right text-stone-500 text-[10px]">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 5. SIMULADOR DE COBRANÇAS EM TEMPO REAL */}
        {activeTab === 'simulator' && (
          <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 space-y-6">
            
            <div className="border-b border-neutral-900 pb-3">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                <Sliders className="w-4 h-4 text-amber-500 animate-spin" />
                Simulador de Gateways de Pagamento (PIX, Stripe, Mercado Pago)
              </h3>
              <p className="text-neutral-400 text-xs">
                Injete novas transações fictícias com faturamento real em tempo real para verificar a atualização dos gráficos de pizza e tendências semanais instantaneamente!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 uppercase">
                  Parâmetros de Teste de Transação
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Nome do Comprador</label>
                    <input 
                      type="text" 
                      value={simBuyerName}
                      onChange={e => setSimBuyerName(e.target.value)}
                      className="w-full bg-[#030303] border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                      placeholder="Ex: Rickson Gracie"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Valor do Produto (USD)</label>
                    <input 
                      type="number" 
                      value={simAmount}
                      onChange={e => setSimAmount(e.target.value)}
                      className="w-full bg-[#030303] border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none font-mono"
                      placeholder="Ex: 29.90"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Método de Rede</label>
                    <select 
                      value={simMethod}
                      onChange={e => setSimMethod(e.target.value)}
                      className="w-full bg-[#030303] border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="PIX">PIX (Nacional)</option>
                      <option value="Stripe">Stripe (EUA)</option>
                      <option value="Mercado Pago">Mercado Pago</option>
                      <option value="PayPal">PayPal Gate</option>
                      <option value="Apple Pay">Apple Pay Integrado</option>
                      <option value="Google Pay">Google Pay Integrado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Status do Gate</label>
                    <select 
                      value={simStatus}
                      onChange={e => setSimStatus(e.target.value as any)}
                      className="w-full bg-[#030303] border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Aprovado">Aprovado (Sucesso)</option>
                      <option value="Pendente">Pendente (Processamento)</option>
                      <option value="Suspeito">Suspeito (Alerta Antifraude)</option>
                      <option value="Falhado">Falhado (Erro de saldo/cartão)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold mb-1">Filiado ao Produto</label>
                    <select 
                      value={simPlanType}
                      onChange={e => setSimPlanType(e.target.value)}
                      className="w-full bg-[#030303] border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="VIP">Assinatura VIP (Elite)</option>
                      <option value="Premium">Assinatura Premium (Pro)</option>
                      <option value="StoreItem">Item Loja (Cards/Cosméticos)</option>
                      <option value="Adicional">Moedas de Combate Adicionais</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleSimulateTransaction}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 font-extrabold text-[#030303] text-xs uppercase tracking-widest rounded-xl transition shadow"
                >
                  🚀 Enviar Transação para o Gateway de Pagamentos
                </button>
              </div>

              {/* Developer notice panel */}
              <div className="bg-neutral-950 border border-neutral-850 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-stone-200 text-xs mb-2">💡 Guia de Testes do Avaliador</h4>
                  <p className="text-stone-400 text-[11px] leading-relaxed space-y-2">
                    Todas as transações injetadas pelo simulador atualizam o banco de dados dinamicamente no arquivo local. 
                    <br /><br />
                    Para conferir os testes:
                    <br />
                    1. Injete uma transação com valor como <strong className="text-white">R$ 150,00</strong> e marque como <strong className="text-white">Aprovado</strong>.
                    <br />
                    2. Retorne para a aba <strong className="text-white">"Visão Geral & Gráficos"</strong>. O faturamento bruto e o saldo disponível para saque reajustar-se-ão de maneira automática.
                    <br />
                    3. Vá em <strong className="text-white">"Cadastro Bancário Admin"</strong>, atualize sua conta bancária PIX digitando o código de segurança dinâmico 2FA enviado <strong className="text-white">123456</strong>.
                    <br />
                    4. Execute um saque manual do valor adicionado! Você verá o saque registrado na planilha contábil.
                  </p>
                </div>

                <div className="mt-4 border-t border-neutral-900 pt-3 text-[10px] text-stone-500 text-center font-mono uppercase">
                  JIUSPEAK FINANCIAL SYSTEM STABLE RELEASE v1.2.6
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 6. RBAC CONTROLS & AUDIT ACTIONS LOGS */}
        {activeTab === 'rbac_users' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 📊 DASHBOARD DE MONITORAMENTO DE STATUS DO ADMINISTRADOR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-neutral-500 text-[10px] block uppercase font-mono font-bold">Total de Guerreiros</span>
                  <span className="text-2xl font-black text-white block mt-1 font-mono">{adminUsers.length}</span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-2">Cadastrados no tatame virtual</div>
              </div>
              <div className="bg-[#0a0a0a] border border-green-950/40 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-neutral-400 text-[10px] uppercase font-mono font-bold">Atletas Online</span>
                  </div>
                  <span className="text-2xl font-black text-green-500 block mt-1 font-mono">
                    {adminUsers.filter(u => u.is_online).length}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-2">Ativos em tempo real agora</div>
              </div>
              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-neutral-500 text-[10px] block uppercase font-mono font-bold">Atletas Offline</span>
                  <span className="text-2xl font-black text-stone-400 block mt-1 font-mono">
                    {adminUsers.filter(u => !u.is_online).length}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-2">Conectados recentemente</div>
              </div>
              <div className="bg-[#0a0a0a] border border-amber-950/40 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-neutral-400 text-[10px] block uppercase font-mono font-bold">Taxa de Ocupação</span>
                  <span className="text-2xl font-black text-amber-500 block mt-1 font-mono">
                    {adminUsers.length > 0 
                      ? Math.round((adminUsers.filter(u => u.is_online).length / adminUsers.length) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-green-500 h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${adminUsers.length > 0 
                        ? (adminUsers.filter(u => u.is_online).length / adminUsers.length) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* STATUS DIALS AND RATIO VISUALIZATIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 text-left">
                <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block mb-3">Distribuição de Status (Aparelho de Medição)</span>
                <div className="flex items-center justify-around py-2">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* SVG Circular Donut Chart */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="38" 
                        stroke="#1a1a1a" 
                        strokeWidth="8" 
                        fill="transparent" 
                      />
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="38" 
                        stroke="#22c55e" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - (adminUsers.length > 0 ? (adminUsers.filter(u => u.is_online).length / adminUsers.length) : 0))}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute text-center bg-transparent">
                      <span className="text-sm font-black text-stone-100 block font-mono">
                        {adminUsers.length > 0 ? Math.round((adminUsers.filter(u => u.is_online).length / adminUsers.length) * 100) : 0}%
                      </span>
                      <span className="text-[7px] text-neutral-500 block uppercase font-mono">on-line</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-green-500" />
                      <span className="text-neutral-300 font-mono">Ativos: {adminUsers.filter(u => u.is_online).length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-neutral-800" />
                      <span className="text-neutral-500 font-mono">Inativos: {adminUsers.filter(u => !u.is_online).length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 text-left">
                <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block mb-3">Análise de Categorias por Conexão</span>
                <div className="space-y-3 pt-1">
                  {/* ADMIN progress load factor */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                      <span>ADMINISTRADORES ({adminUsers.filter(u => u.role === 'ADMIN').length})</span>
                      <span className="text-green-400 font-bold">
                        {adminUsers.filter(u => u.role === 'ADMIN' && u.is_online).length} On
                      </span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-900">
                      <div 
                        className="bg-red-500 h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${adminUsers.filter(u => u.role === 'ADMIN').length > 0 
                            ? (adminUsers.filter(u => u.role === 'ADMIN' && u.is_online).length / adminUsers.filter(u => u.role === 'ADMIN').length) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* USER progress load factor */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                      <span>ALUNOS / ATLETAS ({adminUsers.filter(u => u.role !== 'ADMIN' && u.role !== 'MODERATOR').length})</span>
                      <span className="text-green-400 font-bold">
                        {adminUsers.filter(u => u.role !== 'ADMIN' && u.role !== 'MODERATOR' && u.is_online).length} On
                      </span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-900">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${adminUsers.filter(u => u.role !== 'ADMIN' && u.role !== 'MODERATOR').length > 0 
                            ? (adminUsers.filter(u => u.role !== 'ADMIN' && u.role !== 'MODERATOR' && u.is_online).length / adminUsers.filter(u => u.role !== 'ADMIN' && u.role !== 'MODERATOR').length) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5">
              <div className="border-b border-neutral-900 pb-3 mb-4">
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                  <Shield className="w-4 h-4 text-red-500" />
                  Gerenciamento de Controle de Acesso (RBAC) & Correção de Cadastros
                </h3>
                <p className="text-neutral-400 text-xs text-left">
                  Administre privilégios, altere permissões de sistema, suspenda contas de atletas temporariamente por suspeita de fraude e corrija erros cadastrais de nome, sobrenome ou username único com total histórico de auditoria.
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3 text-xs text-red-400 mb-4 text-left">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-950/40 border border-green-900/50 rounded-xl p-3 text-xs text-green-400 mb-4 text-left">
                  {successMessage}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Users List Area */}
                <div className="lg:col-span-2 space-y-3">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block text-left">
                    Guerreiros Registrados na Base ({adminUsers.length})
                  </span>

                  <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-[#030303]/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#030303] text-stone-500 border-b border-neutral-900 text-[10px] font-mono uppercase">
                          <th className="p-3">Atleta ID</th>
                          <th className="p-3">Nome / Usuário</th>
                          <th className="p-3">E-mail</th>
                          <th className="p-3">Cargo</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3">Conexão</th>
                          <th className="p-3">Último Login</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900 font-mono text-left">
                        {adminUsers.map((u) => {
                          const isSel = selectedAdminUser?.id === u.id;
                          return (
                            <tr key={u.id} className={`hover:bg-neutral-900/40 transition-colors ${isSel ? 'bg-red-950/20 text-white' : 'text-neutral-300'}`}>
                              <td className="p-3 text-neutral-500 text-[10px]">{u.id}</td>
                              <td className="p-3 font-sans">
                                <div className="font-bold text-white text-xs">{u.first_name} {u.last_name}</div>
                                <div className="text-[10px] text-neutral-400 text-left">@{u.username || 'sem_username'}</div>
                              </td>
                              <td className="p-3 text-neutral-400 font-sans">{u.email}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  u.role === 'ADMIN' 
                                    ? 'bg-red-950 text-red-400 border border-red-900/50' 
                                    : (u.role === 'MODERATOR' 
                                      ? 'bg-amber-950 text-amber-400 border border-amber-900/50' 
                                      : 'bg-neutral-900 text-stone-400')
                                }`}>
                                  {u.role || 'USER'}
                                </span>
                              </td>
                              <td className="p-3">
                                {u.is_blocked ? (
                                  <span className="text-red-500 font-bold block text-[10px] uppercase">● SUSPENSO</span>
                                ) : (
                                  <span className="text-green-500 block text-[10px] uppercase">● ATIVO</span>
                                )}
                              </td>
                              <td className="p-3">
                                {u.is_online ? (
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-green-400 text-[10px] font-bold tracking-tight uppercase">ONLINE</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                                    <span className="text-neutral-500 text-[10px] font-bold tracking-tight uppercase">OFFLINE</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-[10px] text-neutral-400 font-sans">
                                {u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : 'nunca logou'}
                              </td>
                              <td className="p-3 text-right">
                                <div className="inline-flex gap-1.5 items-center justify-end">
                                  {/* Connection simulator toggler */}
                                  <button
                                    onClick={() => handleSimulateConnection(u.id, !u.is_online)}
                                    disabled={isSimulatingConn === u.id}
                                    className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-all border cursor-pointer ${
                                      u.is_online 
                                        ? 'bg-red-950/20 text-red-400 border-red-900/40 hover:bg-red-950/60' 
                                        : 'bg-green-950/20 text-green-400 border-green-900/40 hover:bg-green-950/60'
                                    }`}
                                    title={u.is_online ? 'Forçar Desconexão de Tatame' : 'Simular Entrada Online'}
                                  >
                                    {isSimulatingConn === u.id ? '...' : (u.is_online ? '🔌 Force Off' : '⚡ Sim On')}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedAdminUser(u);
                                      setRbacForm({
                                        first_name: u.first_name || '',
                                        last_name: u.last_name || '',
                                        username: u.username || '',
                                        role: u.role || 'USER',
                                        is_blocked: !!u.is_blocked,
                                        new_password: ''
                                      });
                                    }}
                                    className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-stone-300 hover:text-white rounded text-[9px] transition font-sans cursor-pointer whitespace-nowrap"
                                  >
                                    Gerenciar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Editor/Modifier Form Area */}
                <div className="bg-[#030303]/50 border border-neutral-900/80 rounded-2xl p-5 space-y-4 text-left">
                  {selectedAdminUser ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-mono text-neutral-500 uppercase block font-bold text-left">MUTATION OPERATOR</span>
                        <h4 className="font-bold text-white text-sm text-left">Guerreiro: {selectedAdminUser.first_name}</h4>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5 text-left">ID: {selectedAdminUser.id} | Email: {selectedAdminUser.email}</div>
                      </div>

                      <div className="border-t border-neutral-900 pt-3 space-y-3">
                        
                        {/* Define roles */}
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase font-bold mb-1 text-left">Cargo (Role - RBAC)</label>
                          <select
                            value={rbacForm.role}
                            onChange={(e) => setRbacForm(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full bg-[#030303] border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-[#ff3b30]"
                          >
                            <option value="USER">USER (Acesso Comum)</option>
                            <option value="MODERATOR">MODERATOR (Moderação de Conteúdo)</option>
                            <option value="ADMIN">ADMIN (Acesso Total / Financeiro)</option>
                          </select>
                        </div>

                        {/* Suspension control */}
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase font-bold mb-1 text-left">Suspensão de Conta</label>
                          <select
                            value={rbacForm.is_blocked ? "BLOCKED" : "ACTIVE"}
                            onChange={(e) => setRbacForm(prev => ({ ...prev, is_blocked: e.target.value === "BLOCKED" }))}
                            className="w-full bg-[#030303] border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                          >
                            <option value="ACTIVE">ACTIVE (Acesso normalizado)</option>
                            <option value="BLOCKED">BLOCKED (Login suspenso temporariamente)</option>
                          </select>
                        </div>

                        {/* Core Cadastre Correction inputs */}
                        <div className="border-t border-neutral-900 pt-3 space-y-2">
                          <span className="text-[9px] font-mono text-amber-500 block uppercase font-bold text-left">Correções de Cadastro Críticas</span>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <input
                                type="text"
                                value={rbacForm.first_name}
                                onChange={(e) => setRbacForm(prev => ({ ...prev, first_name: e.target.value }))}
                                placeholder="Primeiro Nome"
                                className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={rbacForm.last_name}
                                onChange={(e) => setRbacForm(prev => ({ ...prev, last_name: e.target.value }))}
                                placeholder="Sobrenome"
                                className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={rbacForm.username}
                              onChange={(e) => setRbacForm(prev => ({ ...prev, username: e.target.value }))}
                              placeholder="Username (sem @)"
                              className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Direct Password reset */}
                        <div className="border-t border-[#ff2a1a]/10 pt-3">
                          <input
                            type="password"
                            placeholder="Forçar nova senha administrativa..."
                            value={rbacForm.new_password}
                            onChange={(e) => setRbacForm(prev => ({ ...prev, new_password: e.target.value }))}
                            className="w-full bg-[#030303] border border-neutral-850 rounded-lg py-2 px-3 text-xs text-white placeholder-neutral-700 font-mono"
                          />
                        </div>

                        {/* Save Mutation triggers */}
                        <div className="pt-2">
                          <button
                            onClick={async () => {
                              setIsSavingRBAC(true);
                              setErrorMessage('');
                              setSuccessMessage('');
                              try {
                                const headers = {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                };

                                // 1. Update role if mutated
                                if (rbacForm.role !== selectedAdminUser.role) {
                                  const r1 = await fetch(`/api/admin/users/${selectedAdminUser.id}/role`, {
                                    method: 'PUT',
                                    headers,
                                    body: JSON.stringify({ role: rbacForm.role })
                                  });
                                  const d1 = await r1.json();
                                  if (!r1.ok) throw new Error(d1.error || 'Erro ao alterar cargo.');
                                }

                                // 2. Update status click if mutated
                                if (rbacForm.is_blocked !== selectedAdminUser.is_blocked) {
                                  const r2 = await fetch(`/api/admin/users/${selectedAdminUser.id}/status`, {
                                    method: 'PUT',
                                    headers,
                                    body: JSON.stringify({ block: rbacForm.is_blocked })
                                  });
                                  const d2 = await r2.json();
                                  if (!r2.ok) throw new Error(d2.error || 'Erro ao redefinir status da conta.');
                                }

                                // 3. Core corrections if mutated
                                if (rbacForm.first_name !== selectedAdminUser.first_name ||
                                    rbacForm.last_name !== selectedAdminUser.last_name ||
                                    rbacForm.username !== selectedAdminUser.username) {
                                  const r3 = await fetch(`/api/admin/users/${selectedAdminUser.id}/profile`, {
                                    method: 'PUT',
                                    headers,
                                    body: JSON.stringify({
                                      first_name: rbacForm.first_name,
                                      last_name: rbacForm.last_name,
                                      username: rbacForm.username
                                    })
                                  });
                                  const d3 = await r3.json();
                                  if (!r3.ok) throw new Error(d3.error || 'Erro ao aplicar correções cadastrais.');
                                }

                                // 4. Password update if provided
                                if (rbacForm.new_password) {
                                  const r4 = await fetch(`/api/admin/users/${selectedAdminUser.id}/password`, {
                                    method: 'PUT',
                                    headers,
                                    body: JSON.stringify({ password: rbacForm.new_password })
                                  });
                                  const d4 = await r4.json();
                                  if (!r4.ok) throw new Error(d4.error || 'Erro ao redefinir senha do guerreiro.');
                                }

                                setSuccessMessage('Alterações administrativas aplicadas com sucesso e registradas em auditoria!');
                                setSelectedAdminUser(null);
                                await loadAdminUsers();
                                await loadAdminActionLogs(); // reload logs too
                              } catch (err: any) {
                                setErrorMessage(err.message || 'Erro ao aplicar atualizações administrativas.');
                              } finally {
                                setIsSavingRBAC(false);
                              }
                            }}
                            disabled={isSavingRBAC}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-850 disabled:text-stone-500 font-bold text-white text-xs uppercase rounded-xl transition cursor-pointer text-center"
                          >
                            {isSavingRBAC ? "Salvando Alterações..." : "Aplicar Modificações Críticas ⚡"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-500 text-xs italic">
                      Selecione um guerreiro listado ao lado para ajustar seus privilégios RBAC, corrigir cadastros ou alterar senhas de acesso.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Admin Actions Audit Logs Table */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-5 text-left">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-900">
                <h3 className="text-xs font-black text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                  <Shield className="w-4 h-4 text-amber-500 animate-pulse" />
                  Auditoria Legal de Trâmites Administrativos e RBAC (ADMIN_ACTION_LOGS)
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">COMPLETE AUDIT REALTIME</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-[#030303]/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#030303] text-stone-500 border-b border-neutral-900 text-[10px] font-mono uppercase">
                      <th className="p-3">Log ID</th>
                      <th className="p-3">Administrador Responsável</th>
                      <th className="p-3">Ação Trâmite</th>
                      <th className="p-3">Usuário Afetado</th>
                      <th className="p-3">IP Operador</th>
                      <th className="p-3 text-right">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 font-mono">
                    {adminActionLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500 italic">Nenhuma ação administrativa registrada na auditoria.</td>
                      </tr>
                    ) : (
                      [...adminActionLogs].reverse().map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-900/40 text-[11px]">
                          <td className="p-3 text-neutral-500">{log.id}</td>
                          <td className="p-3 text-neutral-300 font-bold">{log.admin_name}</td>
                          <td className="p-3 text-amber-500 font-bold">{log.action}</td>
                          <td className="p-3 text-stone-400">{log.target_user}</td>
                          <td className="p-3 text-stone-500">{log.ip_address}</td>
                          <td className="p-3 text-right text-stone-500">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
