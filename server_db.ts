import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  password_hash: string;
  profile_image: string; // Base64 or standard URL
  belt_rank: 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black';
  xp: number;
  streak: number;
  coins?: number; // OSS Coins
  is_vip?: boolean; // VIP Membership Status
  battle_pass_tier?: number; // 1 to 20
  battle_pass_xp?: number;
  unlocked_cosmetics?: string[]; // array of item_ids
  active_frame?: string; // profile frame cosmetic item_id
  active_avatar_skin?: string; // cosmetic item_id
  active_belt_skin?: string; // cosmetic item_id
  active_title?: string;
  is_online: boolean;
  email_verified: boolean;
  verification_token?: string;
  reset_token?: string;
  reset_token_expiry?: string;
  role?: 'ADMIN' | 'MODERATOR' | 'USER';
  permissions?: string[];
  last_login?: string;
  is_admin?: boolean;
  username?: string;
  username_locked?: boolean;
  is_verified?: boolean;
  last_profile_update?: string;
  biography?: string;
  social_instagram?: string;
  social_twitter?: string;
  language?: string;
  theme_visual?: string;
  privacy_profile?: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

export interface MatchRow {
  id: string;
  player_one: string; // user id
  player_two: string; // user id or bot id
  player_one_name: string;
  player_two_name: string;
  player_one_belt: string;
  player_two_belt: string;
  player_one_image: string;
  player_two_image: string;
  winner: string; // 'player_one' | 'player_two' | 'draw'
  xp_gained: number; // For the human or average
  created_at: string;
}

export interface PVPRankingRow {
  user_id: string;
  elo: number;
  wins: number;
  losses: number;
  streak: number;
}

export interface SocialPostComment {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: string;
}

export interface SocialPostRow {
  id: string;
  user_id: string;
  type: string;
  image_url: string;
  content: string;
  likes: string[]; // list of user_idx who liked
  comments: SocialPostComment[];
  created_at: string;
}

export interface UserAchievementRow {
  id: string;
  user_id: string;
  badge: string;
  unlocked_at: string;
}

export interface FollowerRow {
  follower_id: string;
  following_id: string;
}

export interface StoreItemRow {
  id: string;
  name: string;
  type: 'card' | 'pack' | 'cosmetic' | 'booster' | 'vip' | 'battlepass' | 'premium_sub' | 'premium_sub_annual' | 'vip_sub' | 'vip_sub_annual' | 'coin_pack';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  price: number; // in OSS Coins or cents (USD) if premium
  is_premium: boolean; // if true, uses real-money payments simulated via Stripe/PIX
  image: string; // emoji or design icon
  description: string;
  details?: {
    trad_en?: string;
    trad_pt?: string;
    level?: number;
    category?: 'avatar' | 'frame' | 'beltskin' | 'title' | 'emoji' | 'arena' | 'banner';
    booster_type?: 'xp' | 'coin' | 'streak';
    duration_hours?: number;
  };
}

export interface UserInventoryRow {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  acquired_at: string;
}

export interface CardCollectionRow {
  id: string;
  user_id: string;
  card_id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  level: number;
  xp: number; // For leveling-up mechanics!
  translation_en: string;
  translation_pt: string;
  image: string;
  acquired_at: string;
}

export interface PurchaseRow {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  amount: number; // Price paid
  currency: 'OSS' | 'USD' | 'BRL'; // Currency denomination
  payment_method: 'Coins' | 'Stripe' | 'PIX' | 'GooglePay' | 'ApplePay' | 'PlayBilling' | 'AppStore';
  created_at: string;
}

export interface MarketplaceListingRow {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_belt: string;
  seller_image: string;
  card_id?: string;
  item_id?: string;
  card_name?: string;
  item_name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  price: number; // listed price in OSS Coins
  is_sold: boolean;
  buyer_id?: string;
  buyer_name?: string;
  created_at: string;
}

export interface AdminBankAccount {
  id: string;
  bank_name: string;
  agency: string;
  account_number: string;
  account_type: 'Corrente' | 'Poupança';
  pix_key: string;
  owner_name: string;
  cpf_cnpj: string;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  user_name: string;
  amount: number; // in cents of USD
  method: 'PIX' | 'Cartão de Crédito' | 'Google Pay' | 'Apple Pay' | 'PayPal' | 'Stripe' | 'Mercado Pago';
  status: 'Aprovado' | 'Pendente' | 'Suspeito' | 'Chargeback' | 'Falhado';
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  user_name: string;
  plan: 'Free' | 'Premium' | 'VIP';
  status: 'Ativa' | 'Expirada' | 'Cancelada';
  price: number; // in cents of BRL
  expires_at: string;
  created_at: string;
  renewal_date?: string; // Standard renewal date for direct compliance
}

export interface PaymentRow {
  id: string;
  user_id: string;
  amount: number; // in Real (cents, e.g. R$ 9,90 = 990)
  currency: 'BRL';
  method: 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Boleto' | 'Google Pay' | 'Apple Pay' | 'Mercado Pago' | 'Stripe';
  status: 'Aprovado' | 'Pendente' | 'Recusado' | 'Suspeito' | 'Chargeback' | 'Falhado';
  transaction_id: string;
  item_id?: string; // Optional reference to purchased item
  created_at: string;
}

export interface PIXPaymentRow {
  id: string;
  payment_id: string;
  qr_code: string;
  copia_cola: string;
  expires_at: string;
}

export interface OSSCoinPurchaseRow {
  id: string;
  user_id: string;
  package: string; // "500 OSS Coins" | "1000 OSS Coins" | "5000 OSS Coins" | "10000 OSS Coins"
  amount_paid: number; // e.g. 990, 1990, 4990, 9900 in Real cents
  coins_received: number;
  created_at: string;
}

export interface StoreSaleRow {
  id: string;
  buyer_id: string;
  buyer_name: string;
  item_id: string;
  item_name: string;
  amount: number; // in cents of USD
  payment_method: string;
  created_at: string;
}

export interface AdminSecurityLog {
  id: string;
  admin_name: string;
  action: string;
  ip_address: string;
  details: string;
  created_at: string;
}

export interface AdminActionLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_user: string; // e.g. email or name or ID of the user affected
  ip_address: string;
  created_at: string;
}

export interface AdminPayoutRequest {
  id: string;
  amount: number; // in cents of USD
  status: 'Pendente' | 'Processado' | 'Falhado';
  bank_account_id: string;
  pix_key: string;
  created_at: string;
}

// DYNAMIC PRICING AND PROMOTIONS MODELS
export interface StorePricingRow {
  id: string;
  item_name: string;
  category: 'subscription' | 'coins' | 'pack' | 'card' | 'booster' | 'cosmetic' | 'badge' | 'marketplace' | 'special_event';
  price_brl: number; // in BRL cents (e.g. 1990 = R$ 19,90)
  active: boolean;
  updated_at: string;
}

export interface SubscriptionPlanRow {
  id: string;
  plan_name: string;
  monthly_price: number; // in cents R$
  yearly_price: number; // in cents R$
  benefits: string[];
}

export interface PromotionRow {
  id: string;
  title: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  promo_code?: string; // dynamic coupon
  cashback_percentage?: number; // active dynamic cashback
}

export interface PriceAdminLog {
  id: string;
  admin_id: string;
  action: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export interface MarketplaceConfigRow {
  tax_percentage: number; // e.g. 5 for 5% tax
  commission_percentage: number; // e.g. 2 for 2% commission
  min_price: number; // minimum OSS Coins seller pricing
  max_price: number; // maximum OSS Coins seller pricing
}

const DB_FILE = path.join(process.cwd(), 'database.json');
const MATCHES_FILE = path.join(process.cwd(), 'matches.json');
const PVP_RANKINGS_FILE = path.join(process.cwd(), 'pvp_rankings.json');
const SOCIAL_POSTS_FILE = path.join(process.cwd(), 'social_posts.json');
const ACHIEVEMENTS_FILE = path.join(process.cwd(), 'user_achievements.json');
const FOLLOWERS_FILE = path.join(process.cwd(), 'followers.json');

const STORE_ITEMS_FILE = path.join(process.cwd(), 'store_items.json');
const USER_INVENTORY_FILE = path.join(process.cwd(), 'user_inventory.json');
const CARD_COLLECTION_FILE = path.join(process.cwd(), 'card_collection.json');
const PURCHASES_FILE = path.join(process.cwd(), 'purchases.json');
const MARKETPLACE_FILE = path.join(process.cwd(), 'marketplace.json');

const ADMIN_BANK_ACCOUNTS_FILE = path.join(process.cwd(), 'admin_bank_accounts.json');
const TRANSACTIONS_FILE = path.join(process.cwd(), 'transactions.json');
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'subscriptions.json');
const STORE_SALES_FILE = path.join(process.cwd(), 'store_sales.json');
const ADMIN_SECURITY_LOGS_FILE = path.join(process.cwd(), 'admin_security_logs.json');
const ADMIN_ACTION_LOGS_FILE = path.join(process.cwd(), 'admin_action_logs.json');
const ADMIN_PAYOUTS_FILE = path.join(process.cwd(), 'admin_payouts.json');
const PAYMENTS_FILE = path.join(process.cwd(), 'payments.json');
const PIX_PAYMENTS_FILE = path.join(process.cwd(), 'pix_payments.json');
const OSS_COIN_PURCHASES_FILE = path.join(process.cwd(), 'oss_coin_purchases.json');

const STORE_PRICING_FILE = path.join(process.cwd(), 'store_pricing.json');
const SUBSCRIPTION_PLANS_FILE = path.join(process.cwd(), 'subscription_plans.json');
const PROMOTIONS_FILE = path.join(process.cwd(), 'promotions.json');
const PRICE_ADMIN_LOGS_FILE = path.join(process.cwd(), 'price_admin_logs.json');
const MARKETPLACE_CONFIG_FILE = path.join(process.cwd(), 'marketplace_config.json');

// Initialize with database representation populated by default users
const DEFAULTS: UserRow[] = [
  {
    id: 'u2',
    first_name: "Marcus",
    last_name: "Miller",
    email: "marcus.miller@jiuspeak.com",
    phone: "+1 (305) 555-0199",
    address: "Miami Beach, Florida, USA",
    password_hash: "hashed",
    profile_image: "🇺🇸",
    belt_rank: "Brown",
    xp: 10890,
    streak: 8,
    coins: 2400,
    is_vip: false,
    is_online: false,
    email_verified: true,
    role: "MODERATOR",
    is_admin: false,
    permissions: ["moderate"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'u3',
    first_name: "Yuki",
    last_name: "'Samurai' Sato",
    email: "yuki.sato@jiuspeak.com",
    phone: "+81 (3) 5555-0123",
    address: "Shibuya, Tokyo, Japan",
    password_hash: "hashed",
    profile_image: "🇯🇵",
    belt_rank: "Purple",
    xp: 9540,
    streak: 12,
    coins: 1800,
    is_vip: false,
    is_online: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'u4',
    first_name: "Elena",
    last_name: "Petrova",
    email: "elena.petrova@jiuspeak.com",
    phone: "+7 (495) 555-4321",
    address: "Arbat District, Moscow, Russia",
    password_hash: "hashed",
    profile_image: "🇷🇺",
    belt_rank: "Purple",
    xp: 8710,
    streak: 21,
    coins: 2100,
    is_vip: false,
    is_online: false,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'u5',
    first_name: "Gabriel",
    last_name: "'Leão' Souza",
    email: "gabriel.leao@jiuspeak.com",
    phone: "+55 (21) 98888-8888",
    address: "Copacabana, Rio de Janeiro, RJ",
    password_hash: "hashed",
    profile_image: "🇧🇷",
    belt_rank: "Blue",
    xp: 7920,
    streak: 6,
    coins: 1500,
    is_vip: false,
    is_online: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'u7',
    first_name: "Hans",
    last_name: "Müller",
    email: "hans.mueller@jiuspeak.com",
    phone: "+49 (89) 5555-5678",
    address: "Munich, Bavaria, Germany",
    password_hash: "hashed",
    profile_image: "🇩🇪",
    belt_rank: "Blue",
    xp: 3220,
    streak: 4,
    coins: 1000,
    is_vip: false,
    is_online: false,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'u8',
    first_name: "Emily",
    last_name: "Watson",
    email: "emily.watson@jiuspeak.com",
    phone: "+61 (2) 5555-8765",
    address: "Manly, Sydney, New South Wales, Australia",
    password_hash: "hashed",
    profile_image: "🇦🇺",
    belt_rank: "White",
    xp: 2980,
    streak: 2,
    coins: 850,
    is_vip: false,
    is_online: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

class DatabaseManager {
  private users: UserRow[] = [];
  private matches: MatchRow[] = [];
  private pvpRankings: PVPRankingRow[] = [];
  private socialPosts: SocialPostRow[] = [];
  private userAchievements: UserAchievementRow[] = [];
  private followers: FollowerRow[] = [];
  
  // Store Collections
  private storeItems: StoreItemRow[] = [];
  private userInventory: UserInventoryRow[] = [];
  private cardCollection: CardCollectionRow[] = [];
  private purchases: PurchaseRow[] = [];
  private marketplace: MarketplaceListingRow[] = [];

  // Financial Admin Collections
  private adminBankAccounts: AdminBankAccount[] = [];
  private transactions: TransactionRow[] = [];
  private subscriptions: SubscriptionRow[] = [];
  private storeSales: StoreSaleRow[] = [];
  private adminSecurityLogs: AdminSecurityLog[] = [];
  private adminActionLogs: AdminActionLog[] = [];
  private adminPayouts: AdminPayoutRequest[] = [];
  
  // Real BRL Payment Table Collections
  private payments: PaymentRow[] = [];
  private pixPayments: PIXPaymentRow[] = [];
  private ossCoinPurchases: OSSCoinPurchaseRow[] = [];

  // Dynamic Multi-Tier Pricing Collections
  private storePricingTable: StorePricingRow[] = [];
  private subscriptionPlansTable: SubscriptionPlanRow[] = [];
  private promotionsTable: PromotionRow[] = [];
  private priceAdminLogsTable: PriceAdminLog[] = [];
  private marketplaceConfigTable: MarketplaceConfigRow = {
    tax_percentage: 5,
    commission_percentage: 2,
    min_price: 10,
    max_price: 10000
  };

  private prisma: PrismaClient | null = null;
  public isPrismaActive = false;

  private async initPrisma() {
    if (process.env.DATABASE_URL) {
      try {
        this.prisma = new PrismaClient({
          datasources: {
            db: {
              url: process.env.DATABASE_URL
            }
          }
        });
        // Fast test query to verify PostgreSQL database connection
        await this.prisma.$queryRaw`SELECT 1`;
        this.isPrismaActive = true;
        console.log("[JiuSpeak Database] ⚡ Conectado ao PostgreSQL com sucesso via Prisma ORM! 🥋");
        
        // Sync JSON users into PostgreSQL on first boot so no user registers/progress is lost!
        await this.syncJsonToPrisma();
      } catch (err: any) {
        console.error(`[JiuSpeak Database] Falha ao conectar ao PostgreSQL: ${err.message}. caindo de volta para JSON local. 🔒`);
        this.isPrismaActive = false;
      }
    } else {
      console.log("[JiuSpeak Database] DATABASE_URL não declarada. Usando persistência por arquivo 'database.json'.");
    }
  }

  private async syncJsonToPrisma() {
    if (!this.prisma || !this.isPrismaActive) return;
    try {
      console.log("[JiuSpeak Database] Sincronizando usuários locais com o servidor PostgreSQL...");
      for (const u of this.users) {
        const exist = await this.prisma.user.findUnique({
          where: { email: u.email }
        });
        if (!exist) {
          await this.prisma.user.create({
            data: {
              id: u.id,
              first_name: u.first_name,
              last_name: u.last_name || "",
              email: u.email,
              phone: u.phone || "",
              address: u.address || "",
              password_hash: u.password_hash,
              role: u.role || 'USER',
              created_at: new Date(u.created_at)
            }
          });
          console.log(`[JiuSpeak Sync] Usuário cadastrado sincronizado com sucesso: ${u.email}`);
        }
      }
      console.log("[JiuSpeak Database] Sincronização concluída com sucesso!");
    } catch (err: any) {
      console.error("[JiuSpeak Database] Erro crítico ao sincronizar banco de dados JSON para PostgreSQL:", err.message);
    }
  }

  constructor() {
    this.load();
    this.initPrisma().catch(err => {
      console.error("[JiuSpeak Database] Error initializing prisma asynchronously:", err);
    });
  }

  private load() {
    try {
      let updated = false;
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        this.users = JSON.parse(data);
        
        this.users = this.users.map(u => {
          let hasChange = false;
          let role = u.role;
          let is_admin = u.is_admin;
          let permissions = u.permissions;
          let username = u.username;
          let username_locked = u.username_locked;
          let is_verified = u.is_verified;
          
          if (u.email === 'maxtechptbr@gmail.com' || u.email === 'maxtechptbr9@gmail.com' || u.email === 'maxtechbtbr@gmail.com') {
            if (role !== 'ADMIN' || !is_admin) {
              role = 'ADMIN';
              is_admin = true;
              permissions = ['all'];
              hasChange = true;
            }
          } else if (u.email === 'marcus.miller@jiuspeak.com' || u.id === 'u2') {
            if (role !== 'MODERATOR') {
              role = 'MODERATOR';
              is_admin = false;
              permissions = ['moderate'];
              hasChange = true;
            }
          } else {
            if (!role) {
              role = 'USER';
              is_admin = false;
              permissions = ['user'];
              hasChange = true;
            }
          }

          if (!username) {
            const cleanParts = (u.first_name + (u.last_name ? '.' + u.last_name : ''))
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // remove diacritics
              .replace(/[^a-z0-9.]/g, '')
              .replace(/\.+/g, '.');
            let tempUsername = cleanParts || u.email.split('@')[0];
            
            // Check uniqueness in the already populated parts
            let suffix = 1;
            let checkName = tempUsername;
            while (this.users.some(item => item.id !== u.id && item.username === checkName)) {
              checkName = tempUsername + suffix;
              suffix++;
            }
            username = checkName;
            hasChange = true;
          }

          if (username_locked === undefined) {
            username_locked = true;
            hasChange = true;
          }

          if (is_verified === undefined) {
            is_verified = u.email_verified || false;
            hasChange = true;
          }
          
          if (hasChange) {
            updated = true;
            return { 
              ...u, 
              role, 
              is_admin, 
              permissions, 
              username, 
              username_locked, 
              is_verified 
            };
          }
          return u;
        });
      } else {
        this.users = [...DEFAULTS];
        updated = true;
      }

      // Ensure administrative users always exist and are correctly configured
      const targetAdminEmails = ['maxtechbtbr@gmail.com', 'maxtechptbr@gmail.com', 'maxtechptbr9@gmail.com'];
      for (const email of targetAdminEmails) {
        const index = this.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (index === -1) {
          this.users.push({
            id: 'usr_admin_' + email.split('@')[0],
            first_name: "Admin",
            last_name: "Guerreiro",
            email: email,
            phone: "(11) 99999-9999",
            address: "São Paulo, SP",
            password_hash: bcrypt.hashSync("98922678aA", 10),
            profile_image: "🥋",
            belt_rank: "Black",
            xp: 15000,
            streak: 30,
            coins: 5000,
            is_vip: true,
            is_online: false,
            email_verified: true,
            role: "ADMIN",
            is_admin: true,
            permissions: ["all"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          updated = true;
        } else {
          const exists = this.users[index];
          let needsUpdate = false;
          if (exists.role !== 'ADMIN' || !exists.is_admin) {
            exists.role = 'ADMIN';
            exists.is_admin = true;
            exists.permissions = ['all'];
            needsUpdate = true;
          }
          try {
            const isPasswordCorrectObj = bcrypt.compareSync("98922678aA", exists.password_hash);
            if (!isPasswordCorrectObj) {
              exists.password_hash = bcrypt.hashSync("98922678aA", 10);
              needsUpdate = true;
            }
          } catch (passErr) {
            exists.password_hash = bcrypt.hashSync("98922678aA", 10);
            needsUpdate = true;
          }
          if (needsUpdate) {
            updated = true;
          }
        }
      }

      if (updated) {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load users database, resetting to defaults", e);
      this.users = [...DEFAULTS];
    }

    try {
      if (fs.existsSync(MATCHES_FILE)) {
        this.matches = JSON.parse(fs.readFileSync(MATCHES_FILE, 'utf8'));
      } else {
        this.matches = [];
        this.saveMatches();
      }
    } catch (e) {
      this.matches = [];
    }

    try {
      if (fs.existsSync(PVP_RANKINGS_FILE)) {
        this.pvpRankings = JSON.parse(fs.readFileSync(PVP_RANKINGS_FILE, 'utf8'));
      } else {
        this.pvpRankings = [];
        this.savePvpRankings();
      }
    } catch (e) {
      this.pvpRankings = [];
    }

    try {
      if (fs.existsSync(SOCIAL_POSTS_FILE)) {
        this.socialPosts = JSON.parse(fs.readFileSync(SOCIAL_POSTS_FILE, 'utf8'));
      } else {
        this.socialPosts = [
          {
            id: 'post_1',
            user_id: 'u1',
            type: 'belt',
            image_url: '🥋',
            content: '🥋 Acabei de subir para Black Belt no JiuSpeak! A estrada foi longa mas a dedicação superou os desafios técnicos. OSS!',
            likes: ['u2', 'u3'],
            comments: [
              { id: 'c1', user_id: 'u2', name: 'Marcus Miller', content: 'Parabéns mestre Lucas! Rola impecável e inglês afiado.', created_at: new Date().toISOString() }
            ],
            created_at: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: 'post_2',
            user_id: 'u5',
            type: 'streak',
            image_url: '🔥',
            content: '🔥 30 dias consecutivos (streak) treinando inglês aplicado ao Jiu-Jítsu sem dar mole! Não há evolução sem constância.',
            likes: ['u1', 'u7'],
            comments: [],
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ];
        this.saveSocialPosts();
      }
    } catch (e) {
      this.socialPosts = [];
    }

    try {
      if (fs.existsSync(ACHIEVEMENTS_FILE)) {
        this.userAchievements = JSON.parse(fs.readFileSync(ACHIEVEMENTS_FILE, 'utf8'));
      } else {
        this.userAchievements = [
          { id: 'ach_1', user_id: 'u1', badge: 'White Belt English', unlocked_at: new Date().toISOString() },
          { id: 'ach_2', user_id: 'u1', badge: 'Submission Expert', unlocked_at: new Date().toISOString() },
          { id: 'ach_3', user_id: 'u2', badge: 'Tatame Translator', unlocked_at: new Date().toISOString() }
        ];
        this.saveUserAchievements();
      }
    } catch (e) {
      this.userAchievements = [];
    }

    try {
      if (fs.existsSync(FOLLOWERS_FILE)) {
        this.followers = JSON.parse(fs.readFileSync(FOLLOWERS_FILE, 'utf8'));
      } else {
        this.followers = [
          { follower_id: 'u2', following_id: 'u1' },
          { follower_id: 'u3', following_id: 'u1' },
          { follower_id: 'u5', following_id: 'u1' }
        ];
        this.saveFollowers();
      }
    } catch (e) {
      this.followers = [];
    }

    // Load store databases
    try {
      if (fs.existsSync(STORE_ITEMS_FILE)) {
        this.storeItems = JSON.parse(fs.readFileSync(STORE_ITEMS_FILE, 'utf8'));
      } else {
        this.seedStoreItems();
      }
    } catch (e) {
      this.storeItems = [];
    }

    try {
      if (fs.existsSync(USER_INVENTORY_FILE)) {
        this.userInventory = JSON.parse(fs.readFileSync(USER_INVENTORY_FILE, 'utf8'));
      } else {
        this.userInventory = [
          { id: 'inv_1', user_id: 'u1', item_id: 'cos_avatar_samurai', quantity: 1, acquired_at: new Date().toISOString() },
          { id: 'inv_2', user_id: 'u1', item_id: 'bst_xp', quantity: 2, acquired_at: new Date().toISOString() }
        ];
        this.saveUserInventory();
      }
    } catch (e) {
      this.userInventory = [];
    }

    try {
      if (fs.existsSync(CARD_COLLECTION_FILE)) {
        this.cardCollection = JSON.parse(fs.readFileSync(CARD_COLLECTION_FILE, 'utf8'));
      } else {
        // Clear/initial seed of custom cards for black belt Lucas
        this.cardCollection = [
          {
            id: 'cc_1',
            user_id: 'u1',
            card_id: 'c_armbar',
            name: 'Armbar Guard (Chave de Braço)',
            rarity: 'Common',
            level: 3,
            xp: 15,
            translation_en: 'Extend their arm to force the tap',
            translation_pt: 'Estenda o braço dele para forçar a batida',
            image: '🦾',
            acquired_at: new Date().toISOString()
          },
          {
            id: 'cc_2',
            user_id: 'u1',
            card_id: 'c_triangle',
            name: 'Triangle Choke (Triângulo)',
            rarity: 'Rare',
            level: 2,
            xp: 5,
            translation_en: 'Lock your knees to apply asphyxiating pressure',
            translation_pt: 'Tranque os joelhos para aplicar pressão asfixiante',
            image: '🔺',
            acquired_at: new Date().toISOString()
          },
          {
            id: 'cc_3',
            user_id: 'u1',
            card_id: 'c_helio',
            name: 'Sabedoria de Hélio Gracie',
            rarity: 'Mythic',
            level: 1,
            xp: 0,
            translation_en: 'Always assume your opponent is bigger and stronger',
            translation_pt: 'Sempre assuma que seu oponente é maior e mais forte',
            image: '👴',
            acquired_at: new Date().toISOString()
          }
        ];
        this.saveCardCollection();
      }
    } catch (e) {
      this.cardCollection = [];
    }

    try {
      if (fs.existsSync(PURCHASES_FILE)) {
        this.purchases = JSON.parse(fs.readFileSync(PURCHASES_FILE, 'utf8'));
      } else {
        this.purchases = [
          {
            id: 'pur_1',
            user_id: 'u1',
            item_id: 'cos_avatar_samurai',
            item_name: 'Avatar Máscara Samurai',
            amount: 500,
            currency: 'OSS',
            payment_method: 'Coins',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ];
        this.savePurchases();
      }
    } catch (e) {
      this.purchases = [];
    }

    try {
      if (fs.existsSync(MARKETPLACE_FILE)) {
        this.marketplace = JSON.parse(fs.readFileSync(MARKETPLACE_FILE, 'utf8'));
      } else {
        this.marketplace = [
          {
            id: 'list_1',
            seller_id: 'u2',
            seller_name: 'Marcus Miller',
            seller_belt: 'Brown',
            seller_image: '🇺🇸',
            card_id: 'c_flying_armbar',
            item_name: 'Flying Armbar (Chave Voadora)',
            rarity: 'Legendary',
            price: 1100,
            is_sold: false,
            created_at: new Date(Date.now() - 360000 * 2).toISOString()
          },
          {
            id: 'list_2',
            seller_id: 'u3',
            seller_name: "Yuki 'Samurai' Sato",
            seller_belt: 'Purple',
            seller_image: '🇯🇵',
            card_id: 'c_rear_naked',
            item_name: 'Rear Naked Choke (Mata-Leão)',
            rarity: 'Epic',
            price: 550,
            is_sold: false,
            created_at: new Date(Date.now() - 360000 * 10).toISOString()
          }
        ];
        this.saveMarketplace();
      }
    } catch (e) {
      this.marketplace = [];
    }

    // Load financial admin databases
    try {
      if (fs.existsSync(ADMIN_BANK_ACCOUNTS_FILE)) {
        this.adminBankAccounts = JSON.parse(fs.readFileSync(ADMIN_BANK_ACCOUNTS_FILE, 'utf8'));
      } else {
        this.adminBankAccounts = [
          {
            id: 'bank_sample',
            bank_name: 'Banco do Brasil S.A.',
            agency: '4122',
            account_number: '98765-4',
            account_type: 'Corrente',
            pix_key: 'financeiro@jiuspeak.com',
            owner_name: 'JiuSpeak Ensino de Idiomas LTDA',
            cpf_cnpj: '12.345.678/0001-90',
            created_at: new Date(Date.now() - 360000 * 240).toISOString()
          }
        ];
        this.saveAdminBankAccounts();
      }
    } catch (e) {
      this.adminBankAccounts = [];
    }

    try {
      if (fs.existsSync(TRANSACTIONS_FILE)) {
        this.transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE, 'utf8'));
      } else {
        const baseTime = Date.now();
        this.transactions = [
          {
            id: 'tx_1',
            user_id: 'u2',
            user_name: 'Marcus Miller',
            amount: 1500, // $15.00
            method: 'Cartão de Crédito',
            status: 'Aprovado',
            created_at: new Date(baseTime - 3600000 * 24 * 14).toISOString()
          },
          {
            id: 'tx_2',
            user_id: 'u1',
            user_name: 'Lucas Silva',
            amount: 2990, // $29.90
            method: 'PIX',
            status: 'Aprovado',
            created_at: new Date(baseTime - 3600000 * 24 * 10).toISOString()
          },
          {
            id: 'tx_3',
            user_id: 'u3',
            user_name: "Yuki 'Samurai' Sato",
            amount: 500, // $5.00
            method: 'PayPal',
            status: 'Aprovado',
            created_at: new Date(baseTime - 3600000 * 24 * 8).toISOString()
          },
          {
            id: 'tx_4',
            user_id: 'u4',
            user_name: 'Elena Petrova',
            amount: 2990, // $29.90
            method: 'Stripe',
            status: 'Chargeback',
            created_at: new Date(baseTime - 3600000 * 24 * 6).toISOString()
          },
          {
            id: 'tx_5',
            user_id: 'u5',
            user_name: 'Emily Watson',
            amount: 1500, // $15.00
            method: 'Apple Pay',
            status: 'Aprovado',
            created_at: new Date(baseTime - 3600000 * 24 * 3).toISOString()
          },
          {
            id: 'tx_6',
            user_id: 'u6',
            user_name: 'Unknown Attacker',
            amount: 5000, // $50.00
            method: 'Mercado Pago',
            status: 'Suspeito',
            created_at: new Date(baseTime - 3600000 * 12).toISOString()
          },
          {
            id: 'tx_7',
            user_id: 'u1',
            user_name: 'Lucas Silva',
            amount: 990, // $9.90
            method: 'Mercado Pago',
            status: 'Pendente',
            created_at: new Date(baseTime - 3600000 * 2).toISOString()
          },
          {
            id: 'tx_8',
            user_id: 'u2',
            user_name: 'Marcus Miller',
            amount: 1500, // $15.00
            method: 'Stripe',
            status: 'Falhado',
            created_at: new Date(baseTime - 3600000 * 24 * 1).toISOString()
          }
        ];
        this.saveTransactions();
      }
    } catch (e) {
      this.transactions = [];
    }

    try {
      if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
        this.subscriptions = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8'));
      } else {
        const baseTime = Date.now();
        this.subscriptions = [
          {
            id: 'sub_1',
            user_id: 'u1',
            user_name: 'Lucas Silva',
            plan: 'VIP',
            status: 'Ativa',
            price: 2990, // $29.90
            expires_at: new Date(baseTime + 3600000 * 24 * 25).toISOString(),
            created_at: new Date(baseTime - 3600000 * 24 * 5).toISOString()
          },
          {
            id: 'sub_2',
            user_id: 'u2',
            user_name: 'Marcus Miller',
            plan: 'Premium',
            status: 'Ativa',
            price: 1500, // $15.00
            expires_at: new Date(baseTime + 3600000 * 24 * 12).toISOString(),
            created_at: new Date(baseTime - 3600000 * 24 * 18).toISOString()
          },
          {
            id: 'sub_3',
            user_id: 'u4',
            user_name: 'Elena Petrova',
            plan: 'Premium',
            status: 'Cancelada',
            price: 1500,
            expires_at: new Date(baseTime - 3600000 * 24 * 2).toISOString(),
            created_at: new Date(baseTime - 3600000 * 24 * 32).toISOString()
          }
        ];
        this.saveSubscriptions();
      }
    } catch (e) {
      this.subscriptions = [];
    }

    try {
      if (fs.existsSync(STORE_SALES_FILE)) {
        this.storeSales = JSON.parse(fs.readFileSync(STORE_SALES_FILE, 'utf8'));
      } else {
        const baseTime = Date.now();
        this.storeSales = [
          {
            id: 'sale_1',
            buyer_id: 'u1',
            buyer_name: 'Lucas Silva',
            item_id: 'p_mythic',
            item_name: 'Pacote Mítico Supremo',
            amount: 2490, // $24.90
            payment_method: 'Stripe',
            created_at: new Date(baseTime - 3600000 * 24 * 4).toISOString()
          },
          {
            id: 'sale_2',
            buyer_id: 'u2',
            buyer_name: 'Marcus Miller',
            item_id: 'p_epic',
            item_name: 'Pacote Épico Tatame',
            amount: 1250, // $12.50
            payment_method: 'PIX',
            created_at: new Date(baseTime - 3600000 * 24 * 10).toISOString()
          }
        ];
        this.saveStoreSales();
      }
    } catch (e) {
      this.storeSales = [];
    }

    try {
      if (fs.existsSync(ADMIN_SECURITY_LOGS_FILE)) {
        this.adminSecurityLogs = JSON.parse(fs.readFileSync(ADMIN_SECURITY_LOGS_FILE, 'utf8'));
      } else {
        const baseTime = Date.now();
        this.adminSecurityLogs = [
          {
            id: 'log_1',
            admin_name: 'Lucas Silva',
            action: 'Autenticação de Acesso Admin',
            ip_address: '187.12.34.56',
            details: 'Login de administrador aprovado via autenticação 2FA',
            created_at: new Date(baseTime - 3600000 * 3).toISOString()
          },
          {
            id: 'log_2',
            admin_name: 'Lucas Silva',
            action: 'Atualização de Conta Bancária',
            ip_address: '187.12.34.56',
            details: 'Dados da conta do Banco do Brasil atualizados com criptografia',
            created_at: new Date(baseTime - 3600000 * 24).toISOString()
          },
          {
            id: 'log_3',
            admin_name: 'Lucas Silva',
            action: 'Saque Solicitado',
            ip_address: '187.12.34.56',
            details: 'Solicitação de saque manual de US$ 125.00 para conta PIX enviada',
            created_at: new Date(baseTime - 3600000 * 24 * 5).toISOString()
          }
        ];
        this.saveAdminSecurityLogs();
      }
    } catch (e) {
      this.adminSecurityLogs = [];
    }

    try {
      if (fs.existsSync(ADMIN_ACTION_LOGS_FILE)) {
        this.adminActionLogs = JSON.parse(fs.readFileSync(ADMIN_ACTION_LOGS_FILE, 'utf8'));
      } else {
        const baseTime = Date.now();
        this.adminActionLogs = [
          {
            id: 'actlog_1',
            admin_id: 'u1',
            admin_name: 'Lucas Silva',
            action: 'Promover para Moderador',
            target_user: 'marcus.miller@jiuspeak.com',
            ip_address: '187.12.34.56',
            created_at: new Date(baseTime - 3600000 * 24 * 2).toISOString()
          }
        ];
        this.saveAdminActionLogs();
      }
    } catch (e) {
      this.adminActionLogs = [];
    }

    try {
      if (fs.existsSync(ADMIN_PAYOUTS_FILE)) {
        this.adminPayouts = JSON.parse(fs.readFileSync(ADMIN_PAYOUTS_FILE, 'utf8'));
      } else {
        const baseTime = Date.now();
        this.adminPayouts = [
          {
            id: 'payout_1',
            amount: 45000, // $450.00
            status: 'Processado',
            bank_account_id: 'bank_sample',
            pix_key: 'financeiro@jiuspeak.com',
            created_at: new Date(baseTime - 3600000 * 24 * 10).toISOString()
          },
          {
            id: 'payout_2',
            amount: 12500, // $125.00
            status: 'Processado',
            bank_account_id: 'bank_sample',
            pix_key: 'financeiro@jiuspeak.com',
            created_at: new Date(baseTime - 3600000 * 24 * 5).toISOString()
          }
        ];
        this.saveAdminPayouts();
      }
    } catch (e) {
      this.adminPayouts = [];
    }

    // Dynamic schema validation & currency initialization for existing databases!
    this.users = this.users.map(u => ({
      ...u,
      coins: u.coins !== undefined ? u.coins : 2500,
      is_vip: u.is_vip !== undefined ? u.is_vip : false,
      battle_pass_tier: u.battle_pass_tier !== undefined ? u.battle_pass_tier : 1,
      battle_pass_xp: u.battle_pass_xp !== undefined ? u.battle_pass_xp : 0,
      unlocked_cosmetics: u.unlocked_cosmetics !== undefined ? u.unlocked_cosmetics : [],
      active_frame: u.active_frame || '',
      active_avatar_skin: u.active_avatar_skin || '',
      active_belt_skin: u.active_belt_skin || '',
      active_title: u.active_title || '',
    }));
    this.save();

    // Load real-world BRL payments
    try {
      if (fs.existsSync(PAYMENTS_FILE)) {
        this.payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8'));
      } else {
        this.payments = [];
        this.savePayments();
      }
    } catch (e) {
      this.payments = [];
    }

    try {
      if (fs.existsSync(PIX_PAYMENTS_FILE)) {
        this.pixPayments = JSON.parse(fs.readFileSync(PIX_PAYMENTS_FILE, 'utf8'));
      } else {
        this.pixPayments = [];
        this.savePixPayments();
      }
    } catch (e) {
      this.pixPayments = [];
    }

    try {
      if (fs.existsSync(OSS_COIN_PURCHASES_FILE)) {
        this.ossCoinPurchases = JSON.parse(fs.readFileSync(OSS_COIN_PURCHASES_FILE, 'utf8'));
      } else {
        this.ossCoinPurchases = [];
        this.saveOssCoinPurchases();
      }
    } catch (e) {
      this.ossCoinPurchases = [];
    }

    // Dynamic pricing tables loads
    try {
      if (fs.existsSync(STORE_PRICING_FILE)) {
        this.storePricingTable = JSON.parse(fs.readFileSync(STORE_PRICING_FILE, 'utf8'));
      } else {
        // Build initial STORE_PRICING seeding
        this.storePricingTable = [
          { id: 'bp_premium_monthly', item_name: 'Mensalidade JiuSpeak Premium', category: 'subscription', price_brl: 1990, active: true, updated_at: new Date().toISOString() },
          { id: 'bp_premium_yearly', item_name: 'Anuidade JiuSpeak Premium', category: 'subscription', price_brl: 15900, active: true, updated_at: new Date().toISOString() },
          { id: 'bp_vip_monthly', item_name: 'Mensalidade Elite VIP', category: 'subscription', price_brl: 4990, active: true, updated_at: new Date().toISOString() },
          { id: 'bp_vip_yearly', item_name: 'Anuidade Elite VIP', category: 'subscription', price_brl: 39900, active: true, updated_at: new Date().toISOString() },
          { id: 'coin_pack_500', item_name: '500 OSS Coins Pacote', category: 'coins', price_brl: 490, active: true, updated_at: new Date().toISOString() },
          { id: 'coin_pack_1000', item_name: '1000 OSS Coins Pacote', category: 'coins', price_brl: 990, active: true, updated_at: new Date().toISOString() },
          { id: 'coin_pack_5000', item_name: '5000 OSS Coins Pacote', category: 'coins', price_brl: 3990, active: true, updated_at: new Date().toISOString() },
          { id: 'p_gold', item_name: 'Gold Card Pack (Vias de Ouro)', category: 'pack', price_brl: 1490, active: true, updated_at: new Date().toISOString() },
          { id: 'cos_avatar_samurai', item_name: 'Skin Samurai Guard (Cosmético)', category: 'cosmetic', price_brl: 1990, active: true, updated_at: new Date().toISOString() },
          { id: 'bst_xp', item_name: 'Booster XP 150% (3 horas)', category: 'booster', price_brl: 790, active: true, updated_at: new Date().toISOString() }
        ];
        this.saveStorePricing();
      }
    } catch (e) {
      this.storePricingTable = [];
    }

    try {
      if (fs.existsSync(SUBSCRIPTION_PLANS_FILE)) {
        this.subscriptionPlansTable = JSON.parse(fs.readFileSync(SUBSCRIPTION_PLANS_FILE, 'utf8'));
      } else {
        this.subscriptionPlansTable = [
          {
            id: 'plan_free',
            plan_name: 'Plano Faixa Branca (Free)',
            monthly_price: 0,
            yearly_price: 0,
            benefits: ["Acesso a 5 cards do deck", "Duelos de arena casuais", "Vocabulário de tatame básico", "Limite de XP diário standard"]
          },
          {
            id: 'plan_premium',
            plan_name: 'Plano JiuSpeak Premium',
            monthly_price: 1990,
            yearly_price: 15900,
            benefits: ["Acesso ilimitado a vocabulários", "Reconhecimento de pronúncia por IA", "Emissão de certificados digitais de fluência", "Acesso livre a desafios de áudio"]
          },
          {
            id: 'plan_vip',
            plan_name: 'Plano Gladiador Elite VIP',
            monthly_price: 4990,
            yearly_price: 39900,
            benefits: ["Ganho de XP Triplicado (300%) no placar", "Bônus de 500 OSS Coins mensais", "Mentoria de termos de arbitragem internacional", "Marcador dourado no perfil público"]
          }
        ];
        this.saveSubscriptionPlans();
      }
    } catch (e) {
      this.subscriptionPlansTable = [];
    }

    try {
      if (fs.existsSync(PROMOTIONS_FILE)) {
        this.promotionsTable = JSON.parse(fs.readFileSync(PROMOTIONS_FILE, 'utf8'));
      } else {
        this.promotionsTable = [
          {
            id: 'promo_blackfriday',
            title: 'Black Friday Combat',
            discount_percentage: 30,
            start_date: '2026-11-20T00:00:00Z',
            end_date: '2026-11-30T23:59:59Z',
            promo_code: 'BFCOMBAT30',
            cashback_percentage: 5
          },
          {
            id: 'promo_copa',
            title: 'Desconto de Temporada Mundial',
            discount_percentage: 15,
            start_date: '2026-05-01T00:00:00Z',
            end_date: '2026-06-30T23:59:59Z',
            promo_code: 'OSS15',
            cashback_percentage: 10
          }
        ];
        this.savePromotions();
      }
    } catch (e) {
      this.promotionsTable = [];
    }

    try {
      if (fs.existsSync(PRICE_ADMIN_LOGS_FILE)) {
        this.priceAdminLogsTable = JSON.parse(fs.readFileSync(PRICE_ADMIN_LOGS_FILE, 'utf8'));
      } else {
        this.priceAdminLogsTable = [
          {
            id: 'pl_1',
            admin_id: 'u1',
            action: 'Criação de Preço de Assinatura',
            old_value: 'Nenhum',
            new_value: 'Mensalidade Premium: R$ 19,90',
            created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
          },
          {
            id: 'pl_2',
            admin_id: 'u1',
            action: 'Ativação de Promoção Black Friday',
            old_value: 'Inativo',
            new_value: 'BFCOMBAT30 (30% OFF + 5% Cashback)',
            created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
          }
        ];
        this.savePriceAdminLogs();
      }
    } catch (e) {
      this.priceAdminLogsTable = [];
    }

    try {
      if (fs.existsSync(MARKETPLACE_CONFIG_FILE)) {
        this.marketplaceConfigTable = JSON.parse(fs.readFileSync(MARKETPLACE_CONFIG_FILE, 'utf8'));
      } else {
        this.marketplaceConfigTable = {
          tax_percentage: 5,
          commission_percentage: 2,
          min_price: 10,
          max_price: 10000
        };
        this.saveMarketplaceConfig();
      }
    } catch (e) {
      this.marketplaceConfigTable = {
        tax_percentage: 5,
        commission_percentage: 2,
        min_price: 10,
        max_price: 10000
      };
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.users, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write to users database file", e);
    }
  }

  public saveMatches() {
    try {
      fs.writeFileSync(MATCHES_FILE, JSON.stringify(this.matches, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write to matches database file", e);
    }
  }

  public savePvpRankings() {
    try {
      fs.writeFileSync(PVP_RANKINGS_FILE, JSON.stringify(this.pvpRankings, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write to pvp rankings database file", e);
    }
  }

  public saveSocialPosts() {
    try {
      fs.writeFileSync(SOCIAL_POSTS_FILE, JSON.stringify(this.socialPosts, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write to social posts file", e);
    }
  }

  public saveStoreItems() {
    try {
      fs.writeFileSync(STORE_ITEMS_FILE, JSON.stringify(this.storeItems, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write store items file", e);
    }
  }

  public saveUserInventory() {
    try {
      fs.writeFileSync(USER_INVENTORY_FILE, JSON.stringify(this.userInventory, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write user inventory file", e);
    }
  }

  public saveCardCollection() {
    try {
      fs.writeFileSync(CARD_COLLECTION_FILE, JSON.stringify(this.cardCollection, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write card collection file", e);
    }
  }

  public savePurchases() {
    try {
      fs.writeFileSync(PURCHASES_FILE, JSON.stringify(this.purchases, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write purchases file", e);
    }
  }

  public saveMarketplace() {
    try {
      fs.writeFileSync(MARKETPLACE_FILE, JSON.stringify(this.marketplace, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write marketplace file", e);
    }
  }

  public saveUserAchievements() {
    try {
      fs.writeFileSync(ACHIEVEMENTS_FILE, JSON.stringify(this.userAchievements, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write to user achievements file", e);
    }
  }

  public saveFollowers() {
    try {
      fs.writeFileSync(FOLLOWERS_FILE, JSON.stringify(this.followers, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write to followers file", e);
    }
  }

  public getMatches(): MatchRow[] {
    return this.matches;
  }

  public addMatch(match: Omit<MatchRow, 'id' | 'created_at'>): MatchRow {
    const newMatch: MatchRow = {
      ...match,
      id: 'mat_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.matches.push(newMatch);
    this.saveMatches();
    return newMatch;
  }

  public getPvpRankings(): PVPRankingRow[] {
    return this.pvpRankings;
  }

  public getRankingByUserId(userId: string): PVPRankingRow {
    let r = this.pvpRankings.find(x => x.user_id === userId);
    if (!r) {
      r = {
        user_id: userId,
        elo: 1000,
        wins: 0,
        losses: 0,
        streak: 0
      };
      this.pvpRankings.push(r);
      this.savePvpRankings();
    }
    return r;
  }

  public updatePvpRanking(userId: string, eloDiff: number, isWin: boolean): PVPRankingRow {
    const r = this.getRankingByUserId(userId);
    r.elo = Math.max(100, r.elo + eloDiff);
    if (isWin) {
      r.wins += 1;
      r.streak += 1;
    } else {
      r.losses += 1;
      r.streak = 0;
    }
    this.savePvpRankings();
    return r;
  }

  public getUsers(): UserRow[] {
    return this.users;
  }

  public getUserByEmail(email: string): UserRow | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): UserRow | undefined {
    return this.users.find(u => u.id === id);
  }

  public getUserByUsername(username: string): UserRow | undefined {
    return this.users.find(u => u.username?.toLowerCase() === username.toLowerCase());
  }

  public getUserByVerificationToken(token: string): UserRow | undefined {
    return this.users.find(u => u.verification_token === token);
  }

  public getUserByResetToken(token: string): UserRow | undefined {
    return this.users.find(u => u.reset_token === token);
  }

  public createUser(userData: Omit<UserRow, 'id' | 'created_at' | 'updated_at' | 'xp' | 'streak' | 'belt_rank' | 'is_online' | 'email_verified'>): UserRow {
    const rawName = (userData.first_name + (userData.last_name ? '.' + userData.last_name : ''))
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .replace(/[^a-z0-9.]/g, '')
      .replace(/\.+/g, '.');
    let baseUsername = rawName || userData.email.split('@')[0];
    let tempUsername = baseUsername;
    let suffix = 1;
    while (this.users.some(u => u.username === tempUsername)) {
      tempUsername = baseUsername + suffix;
      suffix++;
    }

    const newUser: UserRow = {
      ...userData,
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      username: tempUsername,
      username_locked: true,
      is_verified: false,
      belt_rank: 'White',
      xp: 0,
      streak: 1,
      is_online: true,
      email_verified: false, // starts unverified but with dynamic verification capabilities!
      role: 'USER',
      is_admin: false,
      permissions: ['user'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.users.push(newUser);
    this.save();

    // Persist to PostgreSQL if Prisma connection is active
    if (this.isPrismaActive && this.prisma) {
      this.prisma.user.create({
        data: {
          id: newUser.id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          phone: newUser.phone,
          address: newUser.address,
          password_hash: newUser.password_hash,
          role: newUser.role || 'USER',
          created_at: new Date(newUser.created_at)
        }
      }).then(() => {
        console.log(`[Prisma Database] Sucesso ao persistir novo atleta no PostgreSQL: ${newUser.email}`);
      }).catch(err => {
        console.error(`[Prisma Database Error] Falha ao persistir usuário ${newUser.email} no PostgreSQL:`, err);
      });
    }

    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserRow>): UserRow | null {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    this.users[idx] = {
      ...this.users[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.save();

    // Update in PostgreSQL if Prisma connection is active
    if (this.isPrismaActive && this.prisma) {
      const updateData: any = {};
      if (updates.first_name !== undefined) updateData.first_name = updates.first_name;
      if (updates.last_name !== undefined) updateData.last_name = updates.last_name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.password_hash !== undefined) updateData.password_hash = updates.password_hash;
      if (updates.role !== undefined) updateData.role = updates.role;

      if (Object.keys(updateData).length > 0) {
        this.prisma.user.update({
          where: { id },
          data: updateData
        }).then(() => {
          console.log(`[Prisma Database] Sucesso ao atualizar atleta no PostgreSQL: ${id}`);
        }).catch(err => {
          console.error(`[Prisma Database Error] Falha ao atualizar usuário ${id} no PostgreSQL:`, err);
        });
      }
    }

    return this.users[idx];
  }

  public deleteUser(id: string): boolean {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.users.splice(idx, 1);
    this.save();

    // Delete from PostgreSQL if Prisma connection is active
    if (this.isPrismaActive && this.prisma) {
      this.prisma.user.delete({
        where: { id }
      }).then(() => {
        console.log(`[Prisma Database] Sucesso ao deletar atleta do PostgreSQL: ${id}`);
      }).catch(err => {
        console.error(`[Prisma Database Error] Falha ao excluir usuário ${id} no PostgreSQL:`, err);
      });
    }

    return true;
  }

  // --- SOCIAL INTEGRATION & SHARING CORE DATABASE HANDLERS ---
  
  public getEnrichedSocialPosts() {
    return this.socialPosts.map(post => {
      const u = this.getUserById(post.user_id);
      return {
        ...post,
        user_name: u ? `${u.first_name} ${u.last_name}` : 'Unknown Fighter',
        user_image: u ? u.profile_image : '🥋',
        user_belt: u ? u.belt_rank : 'White'
      };
    }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addSocialPost(userId: string, type: string, imageUrl: string, content: string): SocialPostRow {
    const newPost: SocialPostRow = {
      id: 'post_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      type,
      image_url: imageUrl,
      content,
      likes: [],
      comments: [],
      created_at: new Date().toISOString()
    };
    this.socialPosts.push(newPost);
    this.saveSocialPosts();
    return newPost;
  }

  public toggleLikeSocialPost(postId: string, userId: string): { liked: boolean; count: number } {
    const post = this.socialPosts.find(p => p.id === postId);
    if (!post) return { liked: false, count: 0 };
    
    if (!post.likes) post.likes = [];
    const idx = post.likes.indexOf(userId);
    let liked = false;
    
    if (idx === -1) {
      post.likes.push(userId);
      liked = true;
    } else {
      post.likes.splice(idx, 1);
      liked = false;
    }
    
    this.saveSocialPosts();
    return { liked, count: post.likes.length };
  }

  public addCommentSocialPost(postId: string, userId: string, name: string, content: string): SocialPostComment | null {
    const post = this.socialPosts.find(p => p.id === postId);
    if (!post) return null;

    const newComment: SocialPostComment = {
      id: 'com_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      name,
      content,
      created_at: new Date().toISOString()
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    this.saveSocialPosts();
    return newComment;
  }

  public getUserAchievements(userId: string): UserAchievementRow[] {
    return this.userAchievements.filter(a => a.user_id === userId);
  }

  public unlockAchievement(userId: string, badge: string): UserAchievementRow | null {
    // Check if duplicate
    const exists = this.userAchievements.find(a => a.user_id === userId && a.badge.toLowerCase() === badge.toLowerCase());
    if (exists) return exists;

    const newAch: UserAchievementRow = {
      id: 'ach_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      badge,
      unlocked_at: new Date().toISOString()
    };
    this.userAchievements.push(newAch);
    this.saveUserAchievements();
    return newAch;
  }

  public getFollowers(userId: string): FollowerRow[] {
    return this.followers.filter(f => f.following_id === userId);
  }

  public getFollowing(userId: string): FollowerRow[] {
    return this.followers.filter(f => f.follower_id === userId);
  }

  public toggleFollowUser(followerId: string, followingId: string): { followed: boolean } {
    const idx = this.followers.findIndex(f => f.follower_id === followerId && f.following_id === followingId);
    let followed = false;
    if (idx === -1) {
      this.followers.push({ follower_id: followerId, following_id: followingId });
      followed = true;
    } else {
      this.followers.splice(idx, 1);
      followed = false;
    }
    this.saveFollowers();
    return { followed };
  }

  // ==========================================
  // JIUSPEAK VIRTUAL STORE & ECONOMY METHODS
  // ==========================================

  public getStoreItems(): StoreItemRow[] {
    return this.storeItems;
  }

  public getStoreItemById(id: string): StoreItemRow | undefined {
    return this.storeItems.find(item => item.id === id);
  }

  public seedStoreItems() {
    this.seedStoreItemsInternal();
  }

  private seedStoreItemsInternal() {
    this.storeItems = [
      // CARDS
      {
        id: 'c_armbar',
        name: 'Armbar Guard (Chave de Braço)',
        type: 'card',
        rarity: 'Common',
        price: 150,
        is_premium: false,
        image: '🦾',
        description: 'Submissão de hiperextensão clássica partindo da guarda fechada.',
        details: { trad_en: 'Extend their arm to force the tap', trad_pt: 'Estenda o braço dele para forçar a batida', level: 1 }
      },
      {
        id: 'c_triangle',
        name: 'Triangle Choke (Triângulo)',
        type: 'card',
        rarity: 'Rare',
        price: 350,
        is_premium: false,
        image: '🔺',
        description: 'Estrangulamento de constrição usando suas pernas e guarda.',
        details: { trad_en: 'Lock your knees to apply asphyxiating pressure', trad_pt: 'Tranque os joelhos para aplicar pressão asfixiante', level: 1 }
      },
      {
        id: 'c_kimura',
        name: 'Kimura Shoulder Key',
        type: 'card',
        rarity: 'Rare',
        price: 300,
        is_premium: false,
        image: '🔄',
        description: 'Chave rotacional de ombro tradicional no Jiu-Jítsu.',
        details: { trad_en: 'Apply dual-handed rotational shoulder torque', trad_pt: 'Aplique torque rotacional de ombro com as duas mãos', level: 1 }
      },
      {
        id: 'c_rear_naked',
        name: 'Rear Naked Choke (Mata-Leão)',
        type: 'card',
        rarity: 'Epic',
        price: 600,
        is_premium: false,
        image: '🦁',
        description: 'O rei das finalizações pelas costas sem pano.',
        details: { trad_en: 'Slip your forearm under their neck and squeeze', trad_pt: 'Deslize o antebraço sob o pescoço e aperte', level: 1 }
      },
      {
        id: 'c_heel_hook',
        name: 'Inverted Heel Hook (Chave de Calcanhar)',
        type: 'card',
        rarity: 'Legendary',
        price: 1200,
        is_premium: false,
        image: '🦵',
        description: 'Uma das finalizações mais devastadoras do Grappling moderno.',
        details: { trad_en: 'Trap the leg and twist the heel inwards', trad_pt: 'Prenda a perna e gire o calcanhar para dentro', level: 1 }
      },
      {
        id: 'c_helio',
        name: 'Sabedoria de Hélio Gracie',
        type: 'card',
        rarity: 'Mythic',
        price: 2500,
        is_premium: false,
        image: '👴',
        description: 'Frases motivacionais e lições do grande mestre criador.',
        details: { trad_en: 'Always assume your opponent is bigger and stronger', trad_pt: 'Sempre assuma que seu oponente é maior e mais forte', level: 1 }
      },
      {
        id: 'c_flying_armbar',
        name: 'Flying Armbar (Chave Voadora)',
        type: 'card',
        rarity: 'Legendary',
        price: 1500,
        is_premium: false,
        image: '🦅',
        description: 'Chave de braço aérea saltando diretamente na guarda.',
        details: { trad_en: 'Jump, pull guard and catch the arm in mid-air', trad_pt: 'Salte, puxe para a guarda e pegue o braço no ar', level: 1 }
      },

      // PACKS
      {
        id: 'p_bronze',
        name: 'Bronze Card Pack',
        type: 'pack',
        rarity: 'Common',
        price: 400,
        is_premium: false,
        image: '📦',
        description: 'Contém 3 cards aleatórios (maior chance de Common e Rare).'
      },
      {
        id: 'p_silver',
        name: 'Silver Card Pack',
        type: 'pack',
        rarity: 'Rare',
        price: 800,
        is_premium: false,
        image: '🥈',
        description: 'Contém 3 cards com 1 garantido Rare ou superior.'
      },
      {
        id: 'p_gold',
        name: 'Gold Card Pack (Shiny)',
        type: 'pack',
        rarity: 'Epic',
        price: 1500,
        is_premium: false,
        image: '🥇',
        description: 'Contém 5 cards com 1 garantido Epic ou superior, animação reluzente!'
      },
      {
        id: 'p_legendary',
        name: 'Legendary Card Pack',
        type: 'pack',
        rarity: 'Legendary',
        price: 3000,
        is_premium: false,
        image: '👑',
        description: 'Pacote premium absoluto com 5 cards, sendo 1 garantido Legendary ou Mythic!'
      },

      // COSMETICS
      {
        id: 'cos_avatar_samurai',
        name: 'Avatar Máscara Samurai',
        type: 'cosmetic',
        rarity: 'Rare',
        price: 500,
        is_premium: false,
        image: '👺',
        description: 'Visual tradicional japonês para exibir em seu avatar público.',
        details: { category: 'avatar' }
      },
      {
        id: 'cos_avatar_gracie',
        name: 'Avatar OSS Grandmaster',
        type: 'cosmetic',
        rarity: 'Epic',
        price: 1000,
        is_premium: false,
        image: '🧙‍♂️',
        description: 'O mestre ancião com linhas de costura dourada.',
        details: { category: 'avatar' }
      },
      {
        id: 'cos_frame_gold',
        name: 'Moldura Campeão de Ouro',
        type: 'cosmetic',
        rarity: 'Rare',
        price: 600,
        is_premium: false,
        image: '❇️',
        description: 'Uma moldura reluzente dourada com partículas animadas.',
        details: { category: 'frame' }
      },
      {
        id: 'cos_frame_fire',
        name: 'Moldura Fogo do Dojo',
        type: 'cosmetic',
        rarity: 'Legendary',
        price: 1200,
        is_premium: false,
        image: '🔥',
        description: 'Borda animada com chamas escaldantes para assustar rivais em PvP.',
        details: { category: 'frame' }
      },
      {
        id: 'cos_belt_gold',
        name: 'Skin Faixa Linha de Ouro',
        type: 'cosmetic',
        rarity: 'Legendary',
        price: 2000,
        is_premium: false,
        image: '✨',
        description: 'Exibe sua faixa de treino com fios de costura de ouro puro.',
        details: { category: 'beltskin' }
      },
      {
        id: 'cos_emoji_oss',
        name: 'Emoji OSS Punch Golden',
        type: 'cosmetic',
        rarity: 'Common',
        price: 200,
        is_premium: false,
        image: '👊',
        description: 'Emoji exclusivo para usar nos comentários do feed e arena PvP.',
        details: { category: 'emoji' }
      },
      {
        id: 'cos_arena_cyber',
        name: 'Arena de Luta Cyber Tokyo',
        type: 'cosmetic',
        rarity: 'Legendary',
        price: 2500,
        is_premium: false,
        image: '🌆',
        description: 'Plano de fundo tecnológico com holofotes neon para as suas lutas PvP.',
        details: { category: 'arena' }
      },

      // BOOSTERS
      {
        id: 'bst_xp',
        name: 'Booster 2x XP (24h)',
        type: 'booster',
        rarity: 'Rare',
        price: 300,
        is_premium: false,
        image: '⚡',
        description: 'Dobra todo XP recebido nas lições de inglês e duelos PvP do dojo.',
        details: { booster_type: 'xp', duration_hours: 24 }
      },
      {
        id: 'bst_coin',
        name: 'Booster 2x Coins (24h)',
        type: 'booster',
        rarity: 'Rare',
        price: 300,
        is_premium: false,
        image: '🪙',
        description: 'Dobra todos os ganhos de OSS Coins de vitórias PvP e desafios.',
        details: { booster_type: 'coin', duration_hours: 24 }
      },
      {
        id: 'bst_streak',
        name: 'Protetor de Streak Diário',
        type: 'booster',
        rarity: 'Common',
        price: 200,
        is_premium: false,
        image: '🛡️',
        description: 'Impede a perda do seu streak de ofensiva caso você esqueça de treinar em um dia.',
        details: { booster_type: 'streak', duration_hours: 24 }
      },

      // VIP MEMBERSHIP & BATTLE PASS (PREMIUM BRL - Real currency payments)
      {
        id: 'vip_membership',
        name: 'VIP Gladiador Club (Mensal)',
        type: 'vip',
        rarity: 'Legendary',
        price: 4990, // R$ 49,90
        is_premium: true,
        image: '💎',
        description: '+100% XP extra em todas atividades, 1000 Coins diárias gratuitas, moldura de coroa e certificados premium ilimitados.'
      },
      {
        id: 'battlepass_s1',
        name: 'Passe de Batalha: Noite de Combate',
        type: 'battlepass',
        rarity: 'Epic',
        price: 9990, // R$ 99,90
        is_premium: true,
        image: '🎟️',
        description: 'Acesso progressivo a 20 tiers de prêmios contendo cards míticos, títulos lendários e moedas.'
      },
      {
        id: 'plan_premium_monthly',
        name: 'Acesso Premium Mensal',
        type: 'premium_sub',
        rarity: 'Epic',
        price: 1990, // R$ 19,90
        is_premium: true,
        image: '⭐️',
        description: 'Certificados premium ilimitados, lições de inglês avançadas e multiplicador de 1.5x XP.'
      },
      {
        id: 'plan_premium_annual',
        name: 'Acesso Premium Anual (Save 20%)',
        type: 'premium_sub_annual',
        rarity: 'Epic',
        price: 15900, // R$ 159,00
        is_premium: true,
        image: '⭐',
        description: 'Plano anual: Certificados premium ilimitados, lições de inglês avançadas, multiplicador de XP e moldura estelar.'
      },
      {
        id: 'plan_vip_monthly',
        name: 'VIP Gladiador Club (Mensal)',
        type: 'vip_sub',
        rarity: 'Legendary',
        price: 4990, // R$ 49,90
        is_premium: true,
        image: '👑',
        description: 'Vantagens VIPs em dobro, 1000 Moedas Diárias automáticas e Moldura Dourada da Coroa no Dojo.'
      },
      {
        id: 'plan_vip_annual',
        name: 'VIP Gladiador Club Anual (Save 20%)',
        type: 'vip_sub_annual',
        rarity: 'Legendary',
        price: 39900, // R$ 399,00
        is_premium: true,
        image: '🏆',
        description: 'Plano anual definitivo: Economize 20%, receba vantagens VIP, moedas diárias e distintivo de Fundador no Perfil.'
      },
      {
        id: 'pack_coins_500',
        name: 'Pacote de 500 OSS Coins',
        type: 'coin_pack',
        rarity: 'Common',
        price: 990, // R$ 9,90
        is_premium: true,
        image: '🪙',
        description: 'Adiciona 500 moedas ao seu saldo para comprar cards, pacotes de gacha ou boosters de treino.'
      },
      {
        id: 'pack_coins_1000',
        name: 'Pacote de 1000 OSS Coins (+Bonus)',
        type: 'coin_pack',
        rarity: 'Rare',
        price: 1990, // R$ 19,90
        is_premium: true,
        image: '💰',
        description: 'Adiciona 1000 moedas com bônus de 100 OSS Coins especiais de treino extra.'
      },
      {
        id: 'pack_coins_5000',
        name: 'Pacote de 5000 OSS Coins (+Extra)',
        type: 'coin_pack',
        rarity: 'Epic',
        price: 4990, // R$ 49,90
        is_premium: true,
        image: '💎',
        description: 'Melhor custo-benefício: Adiciona 5000 moedas com bônus de 1000 OSS Coins especiais de treino.'
      },
      {
        id: 'pack_coins_10000',
        name: 'Super Pacote de 10000 OSS Coins',
        type: 'coin_pack',
        rarity: 'Legendary',
        price: 9900, // R$ 99,00
        is_premium: true,
        image: '🏆',
        description: 'Pacote definitivo: Adiciona 10000 moedas com bônus máximo de 2500 OSS Coins extras grátis.'
      }
    ];
    this.saveStoreItems();
  }

  public getUserInventory(userId: string): UserInventoryRow[] {
    return this.userInventory.filter(inv => inv.user_id === userId);
  }

  public getUserCardCollection(userId: string): CardCollectionRow[] {
    return this.cardCollection.filter(cc => cc.user_id === userId);
  }

  public getUserPurchases(userId: string): PurchaseRow[] {
    return this.purchases.filter(p => p.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getMarketplaceListings(): MarketplaceListingRow[] {
    return this.marketplace;
  }

  // Claim surprise daily reward chest!
  public claimDailyBonusChest(userId: string): { success: boolean, message: string, coinsEarned: number, user: UserRow } {
    const user = this.getUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const earnings = Math.floor(Math.random() * 300) + 150; // 150 to 450 OSS Coins
    if (user.coins === undefined) user.coins = 0;
    user.coins += earnings;
    user.updated_at = new Date().toISOString();
    this.save();

    // Trigger purchase logging to keep track
    const newPurchase: PurchaseRow = {
      id: 'pur_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      item_id: 'daily_chest',
      item_name: 'Chest Diário Grátis',
      amount: earnings,
      currency: 'OSS',
      payment_method: 'Coins', // received
      created_at: new Date().toISOString()
    };
    this.purchases.push(newPurchase);
    this.savePurchases();

    return {
      success: true,
      message: `Boa, guerreiro! Você abriu a Caixinha Diária e faturou ${earnings} OSS Coins de recompensa!`,
      coinsEarned: earnings,
      user
    };
  }

  // Triggered when winning a PvP match, streak, etc. to grant OSS Coins!
  public grantUserCoins(userId: string, amount: number, reason: string): UserRow | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    if (user.coins === undefined) user.coins = 0;
    user.coins += amount;
    user.updated_at = new Date().toISOString();
    this.save();

    // Log the transaction
    const newPur: PurchaseRow = {
      id: 'pur_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      item_id: 'coin_grant',
      item_name: `Ganhos: ${reason}`,
      amount: amount,
      currency: 'OSS',
      payment_method: 'Coins',
      created_at: new Date().toISOString()
    };
    this.purchases.push(newPur);
    this.savePurchases();

    return user;
  }

  // Purchase an item from the virtual store
  public buyStoreItem(
    userId: string,
    itemId: string,
    paymentMethod: 'Coins' | 'Stripe' | 'PIX' | 'GooglePay' | 'ApplePay' | 'PlayBilling' | 'AppStore'
  ): { success: boolean, message: string, user?: UserRow, purchase?: PurchaseRow } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'Fighter/user not logged in.' };

    const item = this.getStoreItemById(itemId);
    if (!item) return { success: false, message: 'Item no longer found in store database.' };

    const isCoinPayment = paymentMethod === 'Coins';
    const nowStr = new Date().toISOString();
    
    if (isCoinPayment) {
      if (item.is_premium) {
        return { success: false, message: 'Este item premium só pode ser adquirido com pagamentos reais.' };
      }
      if (user.coins === undefined) user.coins = 0;
      if (user.coins < item.price) {
        return { success: false, message: `OSS Coins insuficientes! Você tem ${user.coins} mas o item custa ${item.price} moedas.` };
      }
      // Deduct
      user.coins -= item.price;
    } else {
      // Process Real BRL gateway payments
      const gatewayMap: Record<string, PaymentRow['method']> = {
        'Stripe': 'Stripe',
        'PIX': 'PIX',
        'GooglePay': 'Google Pay',
        'ApplePay': 'Apple Pay',
        'PlayBilling': 'Mercado Pago',
        'AppStore': 'Stripe'
      };
      const methodToUse = gatewayMap[paymentMethod] || 'Stripe';

      const newPayment = this.addPayment({
        user_id: userId,
        amount: item.price,
        currency: 'BRL',
        method: methodToUse,
        status: methodToUse === 'PIX' ? 'Pendente' : 'Aprovado',
        transaction_id: 'tx_brl_' + Math.random().toString(36).substr(2, 9),
        item_id: itemId
      });

      if (methodToUse === 'PIX') {
        const qrContent = `00020101021226830014br.gov.bcb.pix2561pix-qr.jiuspeak.com/pay/${newPayment.id}5204000053039865405${(item.price/100).toFixed(2)}5802BR5915JiuSpeak Platform6009SAO PAULO62070503***6304`;
        const resPix = this.addPixPayment(newPayment.id, `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`, qrContent, 10);
        
        return {
          success: true,
          message: `Código PIX gerado com sucesso! Realize o pagamento para confirmar instantaneamente.`,
          user,
          purchase: {
            id: newPayment.id,
            user_id: userId,
            item_id: itemId,
            item_name: item.name,
            amount: item.price,
            currency: 'BRL',
            payment_method: 'PIX',
            created_at: nowStr,
            qr_code: resPix.qr_code,
            copia_cola: resPix.copia_cola,
            expires_at: resPix.expires_at,
            payment_id: newPayment.id,
            is_pix: true
          } as any
        };
      }

      // If approved credit cards, ApplePay, Stripe, GooglePay etc. immediately fulfill delivery:
      if ((item.type as string) === 'premium_sub' || (item.type as string) === 'premium_sub_annual' || (item.type as string) === 'vip_sub' || (item.type as string) === 'vip_sub_annual' || (item.type as string) === 'vip') {
        const isAnnual = (item.type as string).includes('annual');
        const isVip = (item.type as string).includes('vip') || item.id === 'vip_membership';
        const planName: 'Free' | 'Premium' | 'VIP' = isVip ? 'VIP' : 'Premium';

        this.subscriptions.forEach(sub => {
          if (sub.user_id === userId && sub.status === 'Ativa') {
            sub.status = 'Expirada';
          }
        });

        const durationDays = isAnnual ? 365 : 30;
        const expDate = new Date(Date.now() + durationDays * 86400000);

        const newSub: SubscriptionRow = {
          id: 'sub_' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          user_name: user.first_name + ' ' + user.last_name,
          plan: planName,
          status: 'Ativa',
          price: item.price,
          created_at: nowStr,
          expires_at: expDate.toISOString(),
          renewal_date: expDate.toISOString()
        };
        this.subscriptions.push(newSub);
        this.saveSubscriptions();

        if (isVip) {
          user.is_vip = true;
        }
      } else if ((item.type as string) === 'coin_pack') {
        let coinsGiven = 0;
        if (item.id === 'pack_coins_500') coinsGiven = 500 + 50;
        if (item.id === 'pack_coins_1000') coinsGiven = 1000 + 100;
        if (item.id === 'pack_coins_5000') coinsGiven = 5000 + 1000;
        if (item.id === 'pack_coins_10000') coinsGiven = 10000 + 2500;

        if (user.coins === undefined) user.coins = 0;
        user.coins += coinsGiven;
        this.addOssCoinPurchase(userId, item.id, item.price, coinsGiven);
      }
    }

    // Process delivery package
    const nowStr2 = new Date().toISOString();
    
    // Create inventory record or deliver immediately depending on the type
    if (item.type === 'vip') {
      user.is_vip = true;
    } else if (item.type === 'battlepass') {
      user.battle_pass_tier = 1;
      user.battle_pass_xp = 0;
    } else if (item.type === 'cosmetic') {
      if (!user.unlocked_cosmetics) user.unlocked_cosmetics = [];
      if (!user.unlocked_cosmetics.includes(item.id)) {
        user.unlocked_cosmetics.push(item.id);
      }
      // Apply cosmetic automatically based on category
      if (item.details?.category === 'avatar') user.active_avatar_skin = item.id;
      if (item.details?.category === 'frame') user.active_frame = item.id;
      if (item.details?.category === 'beltskin') user.active_belt_skin = item.id;
      if (item.details?.category === 'title') user.active_title = item.name;

      // Also deliver to the inventory row
      const existingInv = this.userInventory.find(inv => inv.user_id === userId && inv.item_id === itemId);
      if (existingInv) {
        existingInv.quantity += 1;
      } else {
        this.userInventory.push({
          id: 'inv_' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          item_id: itemId,
          quantity: 1,
          acquired_at: nowStr
        });
      }
    } else if (item.type === 'booster' || item.type === 'pack') {
      const existingInv = this.userInventory.find(inv => inv.user_id === userId && inv.item_id === itemId);
      if (existingInv) {
        existingInv.quantity += 1;
      } else {
        this.userInventory.push({
          id: 'inv_' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          item_id: itemId,
          quantity: 1,
          acquired_at: nowStr
        });
      }
    } else if (item.type === 'card') {
      // Buying a dynamic card from store rotation directly
      const existingCard = this.cardCollection.find(cc => cc.user_id === userId && cc.card_id === item.id);
      if (existingCard) {
        existingCard.xp += 10; // gain level progression
      } else {
        this.cardCollection.push({
          id: 'cc_' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          card_id: item.id,
          name: item.name,
          rarity: item.rarity,
          level: 1,
          xp: 0,
          translation_en: item.details?.trad_en || '',
          translation_pt: item.details?.trad_pt || '',
          image: item.image,
          acquired_at: nowStr
        });
      }
    }

    // Record purchase transaction log
    const newPurchase: PurchaseRow = {
      id: 'pur_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      item_id: itemId,
      item_name: item.name,
      amount: item.price,
      currency: isCoinPayment ? 'OSS' : 'BRL',
      payment_method: paymentMethod,
      created_at: nowStr
    };

    user.updated_at = nowStr;
    this.purchases.push(newPurchase);
    
    this.save();
    this.saveUserInventory();
    this.saveCardCollection();
    this.savePurchases();

    return {
      success: true,
      message: `Sucesso! Você comprou '${item.name}' com sucesso através de ${paymentMethod}.`,
      user,
      purchase: newPurchase
    };
  }

  // Open card pack (Gacha dynamic logic with Clash Royale aesthetics)
  public openCardPack(userId: string, packItemId: string): { success: boolean, message: string, cards: CardCollectionRow[], user?: UserRow } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'Fighter not logged in.', cards: [] };

    // Check inventory
    const invIdx = this.userInventory.findIndex(inv => inv.user_id === userId && inv.item_id === packItemId);
    if (invIdx === -1 || this.userInventory[invIdx].quantity < 1) {
      return { success: false, message: 'Você não possui pacotes deste tipo no inventário.', cards: [] };
    }

    // Determine card generation size & odds based on pack
    let cardCount = 3;
    let odds: Array<{ rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic', probability: number }> = [
      { rarity: 'Common', probability: 0.8 },
      { rarity: 'Rare', probability: 0.18 },
      { rarity: 'Epic', probability: 0.02 }
    ];

    if (packItemId === 'p_silver') {
      cardCount = 3;
      odds = [
        { rarity: 'Common', probability: 0.5 },
        { rarity: 'Rare', probability: 0.4 },
        { rarity: 'Epic', probability: 0.09 },
        { rarity: 'Legendary', probability: 0.01 }
      ];
    } else if (packItemId === 'p_gold') {
      cardCount = 5;
      odds = [
        { rarity: 'Common', probability: 0.3 },
        { rarity: 'Rare', probability: 0.45 },
        { rarity: 'Epic', probability: 0.2 },
        { rarity: 'Legendary', probability: 0.04 },
        { rarity: 'Mythic', probability: 0.01 }
      ];
    } else if (packItemId === 'p_legendary') {
      cardCount = 5;
      odds = [
        { rarity: 'Rare', probability: 0.5 },
        { rarity: 'Epic', probability: 0.35 },
        { rarity: 'Legendary', probability: 0.12 },
        { rarity: 'Mythic', probability: 0.03 }
      ];
    }

    // Get candidate card templates
    const templates = this.storeItems.filter(item => item.type === 'card');
    if (templates.length === 0) {
      return { success: false, message: 'Templates de cards não encontrados.', cards: [] };
    }

    const pulledCards: CardCollectionRow[] = [];
    const nowStr = new Date().toISOString();

    for (let i = 0; i < cardCount; i++) {
      // Pick rarity tier
      const r = Math.random();
      let cum = 0;
      let selectedRarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' = 'Common';
      for (const o of odds) {
        cum += o.probability;
        if (r <= cum) {
          selectedRarity = o.rarity;
          break;
        }
      }

      // Safeguard: guarantee Rare/Epic based on packs
      if (i === 1 && (packItemId === 'p_silver' || packItemId === 'p_legendary') && selectedRarity === 'Common') {
        selectedRarity = packItemId === 'p_silver' ? 'Rare' : 'Epic';
      }

      // Filter templates matching rarity
      let pool = templates.filter(t => t.rarity === selectedRarity);
      if (pool.length === 0) {
        pool = templates; // fallback to any
      }

      // Pick random template
      const template = pool[Math.floor(Math.random() * pool.length)];

      // Check if user already owns it to update level XP
      const existingOwned = this.cardCollection.find(cc => cc.user_id === userId && cc.card_id === template.id);
      if (existingOwned) {
        existingOwned.xp += 10; // add duplicate reward progression!
        pulledCards.push({ ...existingOwned }); // return updated
      } else {
        const newCol: CardCollectionRow = {
          id: 'cc_' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          card_id: template.id,
          name: template.name,
          rarity: template.rarity,
          level: 1,
          xp: 0,
          translation_en: template.details?.trad_en || '',
          translation_pt: template.details?.trad_pt || '',
          image: template.image,
          acquired_at: nowStr
        };
        this.cardCollection.push(newCol);
        pulledCards.push(newCol);
      }
    }

    // Consume pack
    this.userInventory[invIdx].quantity -= 1;
    if (this.userInventory[invIdx].quantity <= 0) {
      this.userInventory.splice(invIdx, 1);
    }

    this.saveUserInventory();
    this.saveCardCollection();

    let textEarned = pulledCards.map(c => `[${c.rarity}] ${c.name}`).join(', ');

    return {
      success: true,
      message: `Pacote aberto! Vocâ retirou ${pulledCards.length} cards fantásticos: ${textEarned}.`,
      cards: pulledCards,
      user
    };
  }

  // Upgrade card levels using card duplicate XP + OSS Coins!
  public upgradeCard(userId: string, userCardId: string): { success: boolean, message: string, card?: CardCollectionRow, user?: UserRow } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'Fighter/user not logged in.' };

    const card = this.cardCollection.find(cc => cc.id === userCardId && cc.user_id === userId);
    if (!card) return { success: false, message: 'Card not found in your collection.' };

    // Upgrade thresholds (Clash royale mechanics!)
    // Level 1 -> 2: Needs 10 Duplicate XP + 100 OSS Coins
    // Level 2 -> 3: Needs 20 Duplicate XP + 250 OSS Coins
    // Level 3 -> 4: Needs 40 Duplicate XP + 600 OSS Coins
    // Level 4 -> 5+: Needs 80 Duplicate XP + 1200 OSS Coins
    const currentLvl = card.level || 1;
    let requiredXp = 10;
    let requiredCoins = 100;

    if (currentLvl === 2) {
      requiredXp = 20;
      requiredCoins = 250;
    } else if (currentLvl === 3) {
      requiredXp = 40;
      requiredCoins = 600;
    } else if (currentLvl >= 4) {
      requiredXp = 80;
      requiredCoins = 1200;
    }

    if (card.xp < requiredXp) {
      return { success: false, message: `Acúmulo de cartas insuficiente! Você possui ${card.xp}/${requiredXp} de progresso para subir de nível.` };
    }

    if (user.coins === undefined) user.coins = 0;
    if (user.coins < requiredCoins) {
      return { success: false, message: `OSS Coins insuficientes! Você precisa de ${requiredCoins} moedas, mas atualmente possui ${user.coins}.` };
    }

    // Execute Level Up!
    user.coins -= requiredCoins;
    card.xp -= requiredXp;
    card.level = currentLvl + 1;
    card.acquired_at = new Date().toISOString(); // trigger refresh

    this.save();
    this.saveCardCollection();

    // Log the transaction
    const newPur: PurchaseRow = {
      id: 'pur_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      item_id: card.card_id,
      item_name: `Upgrade: ${card.name} Lvl ${card.level}`,
      amount: requiredCoins,
      currency: 'OSS',
      payment_method: 'Coins',
      created_at: new Date().toISOString()
    };
    this.purchases.push(newPur);
    this.savePurchases();

    return {
      success: true,
      message: `Sensacional! Seu card '${card.name}' subiu para o Nível ${card.level}! Suas técnicas estão cada vez mais refinadas.`,
      card,
      user
    };
  }

  // Create auction listing in Marketplace
  public createMarketplaceListing(
    userId: string,
    userCardId: string,
    listedPrice: number
  ): { success: boolean, message: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'Guerreiro não autenticado.' };

    const card = this.cardCollection.find(cc => cc.id === userCardId && cc.user_id === userId);
    if (!card) return { success: false, message: 'Card de técnicas não encontrado no seu deck.' };

    if (listedPrice <= 0) {
      return { success: false, message: 'Insira um preço de venda superior a 0 OSS Coins.' };
    }

    // Create listing row
    const newListing: MarketplaceListingRow = {
      id: 'list_' + Math.random().toString(36).substr(2, 9),
      seller_id: userId,
      seller_name: `${user.first_name} ${user.last_name}`,
      seller_belt: user.belt_rank,
      seller_image: user.profile_image,
      card_id: card.card_id,
      item_name: card.name,
      rarity: card.rarity,
      price: Math.floor(listedPrice),
      is_sold: false,
      created_at: new Date().toISOString()
    };

    // Remove or delete card from seller collection to put in escrow/listed status
    const cardIdx = this.cardCollection.findIndex(cc => cc.id === userCardId);
    if (cardIdx !== -1) {
      this.cardCollection.splice(cardIdx, 1);
    }

    this.marketplace.push(newListing);
    this.saveMarketplace();
    this.saveCardCollection();

    return {
      success: true,
      message: `Card '${newListing.item_name}' anunciado com sucesso no Marketplace do tatame por ${newListing.price} OSS Coins!`
    };
  }

  // Buy listed card from Marketplace auction
  public buyMarketplaceListing(buyerId: string, listingId: string): { success: boolean, message: string, buyer?: UserRow } {
    const buyer = this.getUserById(buyerId);
    if (!buyer) return { success: false, message: 'Comprador não autenticado.' };

    const listing = this.marketplace.find(l => l.id === listingId);
    if (!listing) return { success: false, message: 'Anúncio não encontrado ou já indisponível.' };
    if (listing.is_sold) return { success: false, message: 'Este card já foi vendido para outro guerreiro.' };
    if (listing.seller_id === buyerId) return { success: false, message: 'Você não pode comprar seu próprio card anunciado.' };

    if (buyer.coins === undefined) buyer.coins = 0;
    if (buyer.coins < listing.price) {
      return { success: false, message: `Moedas insuficientes! O anúncio custa ${listing.price} OSS Coins, você tem ${buyer.coins}.` };
    }

    const seller = this.getUserById(listing.seller_id);
    const nowStr = new Date().toISOString();

    // Deduct coins from buyer
    buyer.coins -= listing.price;

    // Credit coins to seller (safely)
    if (seller) {
      if (seller.coins === undefined) seller.coins = 0;
      seller.coins += listing.price;
      seller.updated_at = nowStr;
    }

    // Assign card ownership to the buyer!
    const newCard: CardCollectionRow = {
      id: 'cc_' + Math.random().toString(36).substr(2, 9),
      user_id: buyerId,
      card_id: listing.card_id || 'c_custom',
      name: listing.item_name,
      rarity: listing.rarity,
      level: 1,
      xp: 0,
      translation_en: '',
      translation_pt: '',
      image: listing.rarity === 'Common' ? '🦾' : listing.rarity === 'Rare' ? '🔺' : listing.rarity === 'Epic' ? '🦁' : '👑',
      acquired_at: nowStr
    };

    // Let's resolve specific translation properties based on template seeded
    const templ = this.getStoreItemById(listing.card_id || '');
    if (templ) {
      newCard.translation_en = templ.details?.trad_en || '';
      newCard.translation_pt = templ.details?.trad_pt || '';
      newCard.image = templ.image;
    }

    this.cardCollection.push(newCard);

    // Update listing state to Sold
    listing.is_sold = true;
    listing.buyer_id = buyerId;
    listing.buyer_name = `${buyer.first_name} ${buyer.last_name}`;

    // Record purchase histories
    const newPurBuyer: PurchaseRow = {
      id: 'pur_' + Math.random().toString(36).substr(2, 9),
      user_id: buyerId,
      item_id: listing.card_id || 'market_item',
      item_name: `Marketplace: ${listing.item_name}`,
      amount: listing.price,
      currency: 'OSS',
      payment_method: 'Coins',
      created_at: nowStr
    };
    this.purchases.push(newPurBuyer);

    this.save();
    this.saveCardCollection();
    this.saveMarketplace();
    this.savePurchases();

    return {
      success: true,
      message: `Espetacular! Você comprou o card '${listing.item_name}' de ${listing.seller_name} por ${listing.price} moedas!`,
      buyer
    };
  }

  // Cancel listed card auction and return to owner's collection
  public cancelMarketplaceListing(userId: string, listingId: string): { success: boolean, message: string } {
    const listingIdx = this.marketplace.findIndex(l => l.id === listingId && l.seller_id === userId);
    if (listingIdx === -1) return { success: false, message: 'Anúncio não encontrado ou você não é o dono.' };

    const listing = this.marketplace[listingIdx];
    if (listing.is_sold) return { success: false, message: 'Não é possível cancelar um card já vendido.' };

    const nowStr = new Date().toISOString();
    // Return card to seller cardCollection
    const returnCard: CardCollectionRow = {
      id: 'cc_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      card_id: listing.card_id || 'c_custom',
      name: listing.item_name,
      rarity: listing.rarity,
      level: 1,
      xp: 0,
      translation_en: '',
      translation_pt: '',
      image: '🎴',
      acquired_at: nowStr
    };

    const templ = this.getStoreItemById(listing.card_id || '');
    if (templ) {
      returnCard.translation_en = templ.details?.trad_en || '';
      returnCard.translation_pt = templ.details?.trad_pt || '';
      returnCard.image = templ.image;
    }

    this.cardCollection.push(returnCard);
    
    // Remove listing
    this.marketplace.splice(listingIdx, 1);

    this.saveCardCollection();
    this.saveMarketplace();

    return {
      success: true,
      message: 'Anúncio removido! Seu card retornou para a sua coleção com segurança.'
    };
  }

  // --- FINANCIAL getters and setters ---
  public getAdminBankAccounts() {
    return this.adminBankAccounts;
  }

  public saveAdminBankAccount(account: AdminBankAccount) {
    const idx = this.adminBankAccounts.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      this.adminBankAccounts[idx] = account;
    } else {
      this.adminBankAccounts.push(account);
    }
    this.saveAdminBankAccounts();
    return account;
  }

  public getTransactions() {
    return this.transactions;
  }

  public addTransaction(tx: Omit<TransactionRow, 'id' | 'created_at'>) {
    const newTx: TransactionRow = {
      ...tx,
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.transactions.unshift(newTx);
    this.saveTransactions();
    return newTx;
  }

  public getSubscriptions() {
    return this.subscriptions;
  }

  public addSubscription(sub: Omit<SubscriptionRow, 'id' | 'created_at'>) {
    const newSub: SubscriptionRow = {
      ...sub,
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.subscriptions.unshift(newSub);
    this.saveSubscriptions();
    return newSub;
  }

  public updateSubscriptionStatus(id: string, status: SubscriptionRow['status']) {
    const sub = this.subscriptions.find(s => s.id === id);
    if (sub) {
      sub.status = status;
      this.saveSubscriptions();
      return { success: true, subscription: sub };
    }
    return { success: false, message: 'Assinatura não localizada.' };
  }

  public getStoreSales() {
    return this.storeSales;
  }

  public addStoreSale(sale: Omit<StoreSaleRow, 'id' | 'created_at'>) {
    const newSale: StoreSaleRow = {
      ...sale,
      id: 'sale_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.storeSales.unshift(newSale);
    this.saveStoreSales();
    return newSale;
  }

  public getAdminSecurityLogs() {
    return this.adminSecurityLogs;
  }

  public getAdminActionLogs() {
    return this.adminActionLogs;
  }

  public addAdminActionLog(adminId: string, adminName: string, action: string, targetUser: string, ip: string) {
    const newLog: AdminActionLog = {
      id: 'actlog_' + Math.random().toString(36).substr(2, 9),
      admin_id: adminId,
      admin_name: adminName,
      action,
      target_user: targetUser,
      ip_address: ip,
      created_at: new Date().toISOString()
    };
    this.adminActionLogs.unshift(newLog);
    this.saveAdminActionLogs();
    
    // Also log to general security logs for comprehensive audit coverage
    this.addSecurityLog(
      adminName,
      `Ação Admin: ${action}`,
      ip,
      `Efetuado pelo admin ID ${adminId} sobre o usuário: ${targetUser}`
    );
    
    return newLog;
  }

  public addSecurityLog(adminName: string, action: string, ip: string, details: string) {
    const newLog: AdminSecurityLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      admin_name: adminName,
      action,
      ip_address: ip,
      details,
      created_at: new Date().toISOString()
    };
    this.adminSecurityLogs.unshift(newLog);
    this.saveAdminSecurityLogs();
    return newLog;
  }

  public getPayouts() {
    return this.adminPayouts;
  }

  public addPayoutRequest(amount: number, bankAccountId: string, pixKey: string) {
    const newPayout: AdminPayoutRequest = {
      id: 'payout_' + Math.random().toString(36).substr(2, 9),
      amount,
      status: 'Pendente',
      bank_account_id: bankAccountId,
      pix_key: pixKey,
      created_at: new Date().toISOString()
    };
    this.adminPayouts.unshift(newPayout);
    this.saveAdminPayouts();
    return newPayout;
  }

  public updatePayoutStatus(id: string, status: AdminPayoutRequest['status']) {
    const payout = this.adminPayouts.find(p => p.id === id);
    if (payout) {
      payout.status = status;
      this.saveAdminPayouts();
      return { success: true, payout };
    }
    return { success: false, message: 'Solicitação de saque não localizada.' };
  }

  public saveAdminBankAccounts() {
    try {
      fs.writeFileSync(ADMIN_BANK_ACCOUNTS_FILE, JSON.stringify(this.adminBankAccounts, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write admin bank file", e);
    }
  }

  public saveTransactions() {
    try {
      fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(this.transactions, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write transactions file", e);
    }
  }

  public saveSubscriptions() {
    try {
      fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(this.subscriptions, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write subscriptions file", e);
    }
  }

  public saveStoreSales() {
    try {
      fs.writeFileSync(STORE_SALES_FILE, JSON.stringify(this.storeSales, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write store sales file", e);
    }
  }

  public saveAdminSecurityLogs() {
    try {
      fs.writeFileSync(ADMIN_SECURITY_LOGS_FILE, JSON.stringify(this.adminSecurityLogs, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write security logs file", e);
    }
  }

  public saveAdminActionLogs() {
    try {
      fs.writeFileSync(ADMIN_ACTION_LOGS_FILE, JSON.stringify(this.adminActionLogs, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write admin action logs file", e);
    }
  }

  public saveAdminPayouts() {
    try {
      fs.writeFileSync(ADMIN_PAYOUTS_FILE, JSON.stringify(this.adminPayouts, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write admin payouts file", e);
    }
  }

  public getPayments() {
    return this.payments;
  }

  public getPixPayments() {
    return this.pixPayments;
  }

  public getOssCoinPurchases() {
    return this.ossCoinPurchases;
  }

  public addPayment(payment: Omit<PaymentRow, 'id' | 'created_at'>) {
    const user = this.getUserById(payment.user_id);
    const userName = user ? `${user.first_name} ${user.last_name}` : 'Atleta Desconhecido';

    const newPayment: PaymentRow = {
      ...payment,
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.payments.unshift(newPayment);
    this.savePayments();

    // Sync with global transactions collection for admin dashboard statistics
    const newTx: TransactionRow = {
      id: newPayment.id,
      user_id: newPayment.user_id,
      user_name: userName,
      amount: newPayment.amount, // in BRL cents
      method: (newPayment.method as string) === 'Cartão de Crédito' || (newPayment.method as string) === 'Cartão de Débito' ? 'Cartão de Crédito' : 
              (newPayment.method as string) === 'Google Pay' ? 'Google Pay' : 
              (newPayment.method as string) === 'Apple Pay' ? 'Apple Pay' : 
              (newPayment.method as string) === 'Mercado Pago' ? 'Mercado Pago' : 
              (newPayment.method as string) === 'PayPal' ? 'PayPal' : 
              (newPayment.method as string) === 'PIX' ? 'PIX' : 'Stripe',
      status: newPayment.status === 'Recusado' ? 'Falhado' : (newPayment.status as any),
      created_at: newPayment.created_at
    };
    this.transactions.unshift(newTx);
    this.saveTransactions();

    return newPayment;
  }

  public addPixPayment(paymentId: string, qrCode: string, copiaCola: string, expiresMinutes = 10) {
    const newPix: PIXPaymentRow = {
      id: 'pix_' + Math.random().toString(36).substr(2, 9),
      payment_id: paymentId,
      qr_code: qrCode,
      copia_cola: copiaCola,
      expires_at: new Date(Date.now() + expiresMinutes * 60000).toISOString()
    };
    this.pixPayments.push(newPix);
    this.savePixPayments();
    return newPix;
  }

  public addOssCoinPurchase(userId: string, packName: string, amountPaid: number, coinsReceived: number) {
    const newPurchase: OSSCoinPurchaseRow = {
      id: 'ocp_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      package: packName,
      amount_paid: amountPaid,
      coins_received: coinsReceived,
      created_at: new Date().toISOString()
    };
    this.ossCoinPurchases.unshift(newPurchase);
    this.saveOssCoinPurchases();
    return newPurchase;
  }

  public updatePaymentStatus(paymentId: string, status: PaymentRow['status']) {
    const payment = this.payments.find(p => p.id === paymentId || p.transaction_id === paymentId);
    if (payment) {
      payment.status = status;
      this.savePayments();

      const tx = this.transactions.find(t => t.id === payment.id || t.id === paymentId);
      if (tx) {
        tx.status = status === 'Recusado' ? 'Falhado' : (status as any);
        this.saveTransactions();
      }
      return { success: true, payment };
    }
    return { success: false };
  }

  public confirmPixPayment(paymentId: string): { success: boolean, message: string, user?: UserRow, purchase?: PurchaseRow } {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment) return { success: false, message: 'Cobrança PIX não encontrada.' };
    
    if (payment.status === 'Aprovado') {
      const user = this.getUserById(payment.user_id);
      return { success: true, message: 'Este PIX já foi confirmado e liberado.', user };
    }

    payment.status = 'Aprovado';
    this.savePayments();

    // Sync with global transactions collection
    const tx = this.transactions.find(t => t.id === paymentId);
    if (tx) {
      tx.status = 'Aprovado';
      this.saveTransactions();
    }

    const user = this.getUserById(payment.user_id);
    if (!user) return { success: false, message: 'Comprador não localizado no sistema.' };

    const item = this.getStoreItemById(payment.item_id || '');
    if (!item) return { success: false, message: 'Item de referência não localizado na vitrine.' };

    const nowStr = new Date().toISOString();

    // Perform actual delivery of resources here:
    if ((item.type as string) === 'premium_sub' || (item.type as string) === 'premium_sub_annual' || (item.type as string) === 'vip_sub' || (item.type as string) === 'vip_sub_annual' || (item.type as string) === 'vip') {
      const isAnnual = (item.type as string).includes('annual');
      const isVip = (item.type as string).includes('vip') || item.id === 'vip_membership';
      const planName: 'Free' | 'Premium' | 'VIP' = isVip ? 'VIP' : 'Premium';

      // Expire previous subscriptions
      this.subscriptions.forEach(sub => {
        if (sub.user_id === user.id && sub.status === 'Ativa') {
          sub.status = 'Expirada';
        }
      });

      const durationDays = isAnnual ? 365 : 30;
      const expDate = new Date(Date.now() + durationDays * 86400000);

      const newSub: SubscriptionRow = {
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        user_id: user.id,
        user_name: user.first_name + ' ' + user.last_name,
        plan: planName,
        status: 'Ativa',
        price: item.price,
        created_at: nowStr,
        expires_at: expDate.toISOString(),
        renewal_date: expDate.toISOString()
      };
      this.subscriptions.push(newSub);
      this.saveSubscriptions();

      if (isVip) {
        user.is_vip = true;
      }
    } else if ((item.type as string) === 'coin_pack') {
      let coinsGiven = 0;
      if (item.id === 'pack_coins_500') coinsGiven = 500 + 50;
      if (item.id === 'pack_coins_1000') coinsGiven = 1000 + 100;
      if (item.id === 'pack_coins_5000') coinsGiven = 5000 + 1000;
      if (item.id === 'pack_coins_10000') coinsGiven = 10000 + 2500;

      if (user.coins === undefined) user.coins = 0;
      user.coins += coinsGiven;
      this.addOssCoinPurchase(user.id, item.id, item.price, coinsGiven);
    }

    // Process delivery package for cosmetics, packages, etc. if required
    if (item.type === 'cosmetic') {
      if (!user.unlocked_cosmetics) user.unlocked_cosmetics = [];
      if (!user.unlocked_cosmetics.includes(item.id)) user.unlocked_cosmetics.push(item.id);
    }

    // Create standard purchase row also for general logging
    const newPurchase: PurchaseRow = {
      id: 'pur_' + Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      item_id: item.id,
      item_name: item.name,
      amount: item.price,
      currency: 'BRL',
      payment_method: 'PIX',
      created_at: nowStr
    };
    this.purchases.push(newPurchase);

    // Save databases
    this.save();
    this.saveUserInventory();
    this.savePurchases();

    return {
      success: true,
      message: `PIX confirmado com sucesso! Seu produto '${item.name}' foi liberado instantaneamente.`,
      user,
      purchase: newPurchase
    };
  }

  public savePayments() {
    try {
      fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(this.payments, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write payments file", e);
    }
  }

  public savePixPayments() {
    try {
      fs.writeFileSync(PIX_PAYMENTS_FILE, JSON.stringify(this.pixPayments, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write pix payments file", e);
    }
  }

  public saveOssCoinPurchases() {
    try {
      fs.writeFileSync(OSS_COIN_PURCHASES_FILE, JSON.stringify(this.ossCoinPurchases, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write oss coin purchases file", e);
    }
  }

  // DYNAMIC PRICING PERSISTENCE SAVERS
  public saveStorePricing() {
    try {
      fs.writeFileSync(STORE_PRICING_FILE, JSON.stringify(this.storePricingTable, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write store pricing file", e);
    }
  }

  public saveSubscriptionPlans() {
    try {
      fs.writeFileSync(SUBSCRIPTION_PLANS_FILE, JSON.stringify(this.subscriptionPlansTable, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write subscription plans file", e);
    }
  }

  public savePromotions() {
    try {
      fs.writeFileSync(PROMOTIONS_FILE, JSON.stringify(this.promotionsTable, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write promotions file", e);
    }
  }

  public savePriceAdminLogs() {
    try {
      fs.writeFileSync(PRICE_ADMIN_LOGS_FILE, JSON.stringify(this.priceAdminLogsTable, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write price admin logs file", e);
    }
  }

  public saveMarketplaceConfig() {
    try {
      fs.writeFileSync(MARKETPLACE_CONFIG_FILE, JSON.stringify(this.marketplaceConfigTable, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to write marketplace config file", e);
    }
  }

  // DYNAMIC PRICING MANAGEMENT GETTERS & SETTERS
  public getStorePricing(): StorePricingRow[] {
    return this.storePricingTable;
  }

  public getSubscriptionPlans(): SubscriptionPlanRow[] {
    return this.subscriptionPlansTable;
  }

  public getPromotions(): PromotionRow[] {
    return this.promotionsTable;
  }

  public getPriceAdminLogs(): PriceAdminLog[] {
    return this.priceAdminLogsTable;
  }

  public getMarketplaceConfig(): MarketplaceConfigRow {
    return this.marketplaceConfigTable;
  }

  public addPriceAdminLog(adminId: string, action: string, oldValue: string, newValue: string) {
    const newLog: PriceAdminLog = {
      id: 'pl_' + Math.random().toString(36).substr(2, 9),
      admin_id: adminId,
      action,
      old_value: oldValue,
      new_value: newValue,
      created_at: new Date().toISOString()
    };
    this.priceAdminLogsTable.unshift(newLog);
    this.savePriceAdminLogs();
    return newLog;
  }

  public createStorePricing(item_name: string, category: StorePricingRow['category'], price_brl: number, active: boolean, adminName: string) {
    const pricingItem: StorePricingRow = {
      id: 'item_' + Math.random().toString(36).substr(2, 9),
      item_name,
      category,
      price_brl,
      active,
      updated_at: new Date().toISOString()
    };
    this.storePricingTable.push(pricingItem);
    this.saveStorePricing();

    // Log the price addition
    this.addPriceAdminLog(
      adminName,
      `Criado Item de Preço: ${category}`,
      'Inexistente',
      `${item_name} - Preço: R$ ${(price_brl / 100).toFixed(2)} - Status: ${active ? 'Ativo' : 'Inativo'}`
    );

    return pricingItem;
  }

  public updateStorePricing(id: string, item_name: string, category: StorePricingRow['category'], price_brl: number, active: boolean, adminName: string) {
    const index = this.storePricingTable.findIndex(itm => itm.id === id);
    if (index === -1) {
      // If it doesn't exist, create it with this ID
      const newItem: StorePricingRow = {
        id,
        item_name,
        category,
        price_brl,
        active,
        updated_at: new Date().toISOString()
      };
      this.storePricingTable.push(newItem);
      this.saveStorePricing();
      this.addPriceAdminLog(adminName, `Registrado Preço de Item: ${category}`, 'Inexistente', `${item_name}: R$ ${(price_brl/100).toFixed(2)}`);
      return newItem;
    }

    const old = this.storePricingTable[index];
    const oldStr = `${old.item_name} - Preço: R$ ${(old.price_brl / 100).toFixed(2)} - Status: ${old.active ? 'Ativo' : 'Inativo'}`;
    const newStr = `${item_name} - Preço: R$ ${(price_brl / 100).toFixed(2)} - Status: ${active ? 'Ativo' : 'Inativo'}`;

    this.storePricingTable[index] = {
      ...old,
      item_name,
      category,
      price_brl,
      active,
      updated_at: new Date().toISOString()
    };
    this.saveStorePricing();

    // Log update
    this.addPriceAdminLog(adminName, `Modificado Preço de Item: ${category}`, oldStr, newStr);

    return this.storePricingTable[index];
  }

  public deleteStorePricing(id: string, adminName: string) {
    const index = this.storePricingTable.findIndex(itm => itm.id === id);
    if (index === -1) return false;

    const old = this.storePricingTable[index];
    const oldStr = `${old.item_name} - Preço: R$ ${(old.price_brl / 100).toFixed(2)}`;

    this.storePricingTable.splice(index, 1);
    this.saveStorePricing();

    this.addPriceAdminLog(adminName, 'Removido Item de Preço', oldStr, 'Excluído Permanentemente');
    return true;
  }

  public updateSubscriptionPlan(id: string, plan_name: string, monthly_price: number, yearly_price: number, benefits: string[], adminName: string) {
    const index = this.subscriptionPlansTable.findIndex(p => p.id === id);
    if (index === -1) return null;

    const old = this.subscriptionPlansTable[index];
    const oldStr = `${old.plan_name} - Mensal: R$ ${(old.monthly_price/100).toFixed(2)} - Anual: R$ ${(old.yearly_price/100).toFixed(2)}`;
    const newStr = `${plan_name} - Mensal: R$ ${(monthly_price/100).toFixed(2)} - Anual: R$ ${(yearly_price/100).toFixed(2)}`;

    this.subscriptionPlansTable[index] = {
      ...old,
      plan_name,
      monthly_price,
      yearly_price,
      benefits
    };
    this.saveSubscriptionPlans();

    this.addPriceAdminLog(adminName, 'Modificado Plano de Assinatura', oldStr, newStr);
    return this.subscriptionPlansTable[index];
  }

  public createPromotion(title: string, discount_percentage: number, start_date: string, end_date: string, promo_code?: string, cashback_percentage?: number, adminName: string = 'Admin') {
    const newPromo: PromotionRow = {
      id: 'promo_' + Math.random().toString(36).substr(2, 9),
      title,
      discount_percentage,
      start_date,
      end_date,
      promo_code,
      cashback_percentage
    };
    this.promotionsTable.push(newPromo);
    this.savePromotions();

    this.addPriceAdminLog(
      adminName,
      'Promoção / Cupom Criado',
      'Inexistente',
      `Título: ${title} - Desconto: ${discount_percentage}% - Cupom: ${promo_code || 'Nenhum'} - Cashback: ${cashback_percentage || 0}%`
    );
    return newPromo;
  }

  public updatePromotion(id: string, title: string, discount_percentage: number, start_date: string, end_date: string, promo_code?: string, cashback_percentage?: number, adminName: string = 'Admin') {
    const index = this.promotionsTable.findIndex(p => p.id === id);
    if (index === -1) return null;

    const old = this.promotionsTable[index];
    const oldStr = `Título: ${old.title} - Desconto: ${old.discount_percentage}% - Cupom: ${old.promo_code || 'N/A'}`;
    const newStr = `Título: ${title} - Desconto: ${discount_percentage}% - Cupom: ${promo_code || 'N/A'}`;

    this.promotionsTable[index] = {
      ...old,
      title,
      discount_percentage,
      start_date,
      end_date,
      promo_code,
      cashback_percentage
    };
    this.savePromotions();

    this.addPriceAdminLog(adminName, 'Promoção / Cupom Atualizado', oldStr, newStr);
    return this.promotionsTable[index];
  }

  public deletePromotion(id: string, adminName: string) {
    const index = this.promotionsTable.findIndex(p => p.id === id);
    if (index === -1) return false;

    const old = this.promotionsTable[index];
    const oldStr = `Título: ${old.title} - Cupom: ${old.promo_code || 'N/A'}`;

    this.promotionsTable.splice(index, 1);
    this.savePromotions();

    this.addPriceAdminLog(adminName, 'Removida Promoção / Cupom', oldStr, 'Removida');
    return true;
  }

  public updateMarketplaceConfig(tax_percentage: number, commission_percentage: number, min_price: number, max_price: number, adminName: string) {
    const oldStr = `Taxa: ${this.marketplaceConfigTable.tax_percentage}% - Comiss: ${this.marketplaceConfigTable.commission_percentage}% - Limites: [${this.marketplaceConfigTable.min_price}, ${this.marketplaceConfigTable.max_price}]`;
    const newStr = `Taxa: ${tax_percentage}% - Comiss: ${commission_percentage}% - Limites: [${min_price}, ${max_price}]`;

    this.marketplaceConfigTable = {
      tax_percentage,
      commission_percentage,
      min_price,
      max_price
    };
    this.saveMarketplaceConfig();

    this.addPriceAdminLog(adminName, 'Atualizada Taxação do Marketplace', oldStr, newStr);
    return this.marketplaceConfigTable;
  }
}

export const dbStore = new DatabaseManager();
