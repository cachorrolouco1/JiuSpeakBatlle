import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';
import { dbStore, UserRow } from './server_db';
import { setupPvP } from './server_pvp_combat';

const app = express();
const PORT = 3000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'jiuspeak-master-secret';

// Parse JSON payloads up to 10MB to support base64 user profile uploads securely
app.use(express.json({ limit: '10mb' }));

// --- SECURITY PROTOCOLS ---

// 1. Spam Protection (IP Rate Limiting)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();

const spamProtector = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = ipRateLimits.get(ip);

  if (!record) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return next();
  }

  if (now > record.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return next();
  }

  record.count += 1;
  // Maximum 60 requests per minute for API routes
  if (record.count > 60) {
    return res.status(429).json({ 
      error: 'Muitas requisições. Por favor, aguarde 1 minuto para evitar spam.' 
    });
  }

  next();
};

// Apply spam protection to all api requests
app.use('/api/', spamProtector);

// 2. Brute Force Protection (Login Attempts Tracker)
interface BruteForceRecord {
  failedAttempts: number;
  lockUntil: number | null;
}
const bruteForceRegistry = new Map<string, BruteForceRecord>();

const checkBruteForce = (email: string): { allowed: boolean; waitTimeLeft?: number } => {
  const record = bruteForceRegistry.get(email.toLowerCase());
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockUntil && now < record.lockUntil) {
    const waitTimeLeft = Math.ceil((record.lockUntil - now) / 1000); // seconds
    return { allowed: false, waitTimeLeft };
  }

  if (record.lockUntil && now >= record.lockUntil) {
    // Lock expired, reset failed attempts
    bruteForceRegistry.set(email.toLowerCase(), { failedAttempts: 0, lockUntil: null });
  }

  return { allowed: true };
};

const registerFailedAttempt = (email: string) => {
  const normalizedEmail = email.toLowerCase();
  const record = bruteForceRegistry.get(normalizedEmail) || { failedAttempts: 0, lockUntil: null };
  
  record.failedAttempts += 1;
  if (record.failedAttempts >= 5) {
    // Lock out for 5 minutes (300,000 miliseconds)
    record.lockUntil = Date.now() + 5 * 60 * 1000;
  }
  
  bruteForceRegistry.set(normalizedEmail, record);
};

const clearFailedAttempts = (email: string) => {
  bruteForceRegistry.delete(email.toLowerCase());
};

// 3. User Authentication JWT Middleware
export interface AuthenticatedRequest extends express.Request {
  user?: UserRow;
}

const authenticateJWT = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(412).json({ error: 'Acesso negado. Token de autorização inválido ou ausente.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = dbStore.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não localizado no sistema.' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sessão expirada ou token inválido. Faça login novamente.' });
  }
};


// --- BACKEND API ENDPOINTS ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 2. Registration API
app.post('/api/auth/register', (req, res) => {
  const { 
    first_name, 
    last_name, 
    email, 
    phone, 
    address, 
    password, 
    confirm_password,
    terms_accepted,
    privacy_accepted,
    profile_image 
  } = req.body;

  // Frontend fields validation fallback in backend
  if (!first_name || !last_name || !email || !phone || !address || !password || !confirm_password) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios precisam ser preenchidos.' });
  }

  // Email structure checking
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Por favor, forneça um endereço de e-mail válido.' });
  }

  // Password confirmation check
  if (password !== confirm_password) {
    return res.status(400).json({ error: 'A confirmação de senha não coincide com a senha inserida.' });
  }

  // Password structural strength checking
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.' 
    });
  }

  // Acceptances checking
  if (!terms_accepted || !privacy_accepted) {
    return res.status(400).json({ error: 'Você deve aceitar os Termos de Uso e a Política de Privacidade para cadastrar-se.' });
  }

  // Telefone minimal length check
  const telecomDigits = phone.replace(/\D/g, '');
  if (telecomDigits.length < 10) {
    return res.status(400).json({ error: 'Número de telefone inválido. Informe o código de área correspondente.' });
  }

  // Check unique constraints for database matching SQL rules
  const existingUser = dbStore.getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'Este endereço de e-mail já está cadastrando um atleta na plataforma JiuSpeak.' });
  }

  try {
    // Password cryptography
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    // Profile photo upload standard or custom fallback
    const matchedProfileImg = profile_image || '🥋';

    // Simulated email verification token generated securely
    const verificationToken = 'v_tok_' + Math.random().toString(36).substr(2, 12);

    // Create record matching users columns requested in prompt
    const newUser = dbStore.createUser({
      first_name,
      last_name,
      email,
      phone,
      address,
      password_hash,
      profile_image: matchedProfileImg
    });

    // Save token dynamically inside database store matching standard verification models
    dbStore.updateUser(newUser.id, { 
      verification_token: verificationToken,
      email_verified: false 
    });

    // Sign jwt token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    // Inform instructions output simulator that simulation has printed
    console.log(`[JiuSpeak Notification] Email de confirmação de cadastro enviado para ${email}. Link: http://localhost:3000/api/auth/verify/${verificationToken}`);

    res.status(201).json({
      message: 'Cadastro efetuado com sucesso! Um e-mail de verificação foi emitido.',
      token,
      verification_link_simulated: `/api/auth/verify/${verificationToken}`,
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        profile_image: newUser.profile_image,
        belt_rank: newUser.belt_rank,
        xp: newUser.xp,
        streak: newUser.streak,
        email_verified: false,
        created_at: newUser.created_at
      }
    });

  } catch (err: any) {
    res.status(500).json({ error: 'Erro interno do servidor ao criar conta. Tente novamente.', details: err.message });
  }
});

// 3. Login API with brute force protection
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são de preenchimento obrigatório.' });
  }

  // Brute force check
  const bruteCheck = checkBruteForce(email);
  if (!bruteCheck.allowed) {
    return res.status(423).json({ 
      error: `Sua conta está bloqueada temporariamente para evitar ataques. Tente novamente em ${bruteCheck.waitTimeLeft} segundos.` 
    });
  }

  const user = dbStore.getUserByEmail(email);
  if (!user) {
    registerFailedAttempt(email);
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha inseridos.' });
  }

  // Verify encrypted hash password using bcrypt
  const validPass = bcrypt.compareSync(password, user.password_hash);
  if (!validPass) {
    registerFailedAttempt(email);
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha inseridos.' });
  }

  // Clear attempts registration on successful sign-in
  clearFailedAttempts(email);

  // Update online status in the database USERS representation
  dbStore.updateUser(user.id, { is_online: true });

  // Generate sign in JWT
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Login bem-sucedido!',
    token,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      profile_image: user.profile_image,
      belt_rank: user.belt_rank,
      xp: user.xp,
      streak: user.streak,
      email_verified: user.email_verified,
      is_online: true,
      created_at: user.created_at
    }
  });
});

// 4. Force status check / verify-email via token
app.get('/api/auth/verify/:token', (req, res) => {
  const { token } = req.params;
  const user = dbStore.getUserByVerificationToken(token);
  
  if (!user) {
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #030303; color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h1 style="color: #ff3b30;">Token Inválido ou Expirado</h1>
        <p style="color: #8e8e93;">Não conseguimos verificar este cadastro.</p>
        <a href="/" style="margin-top: 20px; display: inline-block; padding: 12px 24px; background: #e65100; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">Voltar para o JiuSpeak</a>
      </div>
    `);
  }

  dbStore.updateUser(user.id, { 
    email_verified: true, 
    verification_token: undefined 
  });

  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #030303; color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="color: #ffb300; font-size: 32px; font-weight: 900; letter-spacing: -0.5px; italic">JIUSPEAK ATLETA VERIFICADO! OSU!</h1>
      <p style="color: #aeaeae; max-width: 400px; line-height: 1.5;">Parabéns, ${user.first_name}! Seu e-mail foi verificado com sucesso. Você agora possui acesso premium aos servidores oficiais, ranking global e diplomas.</p>
      <div style="font-size: 64px; margin: 20px 0;">🥋✔️</div>
      <a href="/" style="margin-top: 20px; display: inline-block; padding: 15px 30px; background: #ffb300; color: black; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Acessar Portal do Aluno</a>
    </div>
  `);
});

// 5. Password recovery (forgot-password trigger)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Insira um e-mail cadastrado.' });
  }

  const user = dbStore.getUserByEmail(email);
  if (!user) {
    // Return positive to avoid profile harvesting but log locally
    console.log(`[JiuSpeak Forgot-Pwd Fail] Pedido de redefinição para e-mail não cadastrado: ${email}`);
    return res.json({ 
      message: 'Se este e-mail estiver cadastrado, uma mensagem com instruções de redefinição foi despachada.' 
    });
  }

  // Generate security recovery token and 15 mins expiry
  const recoveryToken = 'rec_' + Math.random().toString(36).substr(2, 10);
  const expiry = Date.now() + 15 * 60 * 1000;

  dbStore.updateUser(user.id, {
    reset_token: recoveryToken,
    reset_token_expiry: expiry.toString()
  });

  const resetLinkSimulated = `/api/auth/reset-password-page?token=${recoveryToken}`;
  console.log(`[JiuSpeak Notification] Link de recuperação gerado para ${email}: http://localhost:3000${resetLinkSimulated}`);

  res.json({
    message: 'Mensagem de redefinição despachada com sucesso!',
    reset_token_simulated: recoveryToken,
    reset_link_simulated: resetLinkSimulated
  });
});

// 6. Reset password validation and execution
app.post('/api/auth/reset-password', (req, res) => {
  const { token, new_password, confirm_password } = req.body;

  if (!token || !new_password || !confirm_password) {
    return res.status(400).json({ error: 'O token e as senhas são de preenchimento obrigatório.' });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ error: 'A confirmação de senha não coincide.' });
  }

  // Password structural strength checking
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(new_password)) {
    return res.status(400).json({ 
      error: 'A nova senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, dígitos e símbolos.' 
    });
  }

  const user = dbStore.getUserByResetToken(token);
  if (!user || !user.reset_token_expiry) {
    return res.status(400).json({ error: 'Token de redefinição inválido.' });
  }

  const expiry = Number(user.reset_token_expiry);
  if (Date.now() > expiry) {
    return res.status(400).json({ error: 'Token de redefinição expirou. Solicite um novo link de recuperação.' });
  }

  // Encrypt and save new password
  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(new_password, salt);

  dbStore.updateUser(user.id, {
    password_hash,
    reset_token: undefined,
    reset_token_expiry: undefined
  });

  res.json({ message: 'Senha redefinida com extremo sucesso! Efetue login com suas novas credenciais.' });
});

// 7. Get Authenticated User Profile
app.get('/api/users/me', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      profile_image: user.profile_image,
      belt_rank: user.belt_rank,
      xp: user.xp,
      streak: user.streak,
      coins: user.coins !== undefined ? user.coins : 2500,
      is_vip: user.is_vip || false,
      battle_pass_tier: user.battle_pass_tier || 1,
      battle_pass_xp: user.battle_pass_xp || 0,
      unlocked_cosmetics: user.unlocked_cosmetics || [],
      active_frame: user.active_frame || '',
      active_avatar_skin: user.active_avatar_skin || '',
      active_belt_skin: user.active_belt_skin || '',
      active_title: user.active_title || '',
      email_verified: user.email_verified,
      is_online: true,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  });
});

// 8. Edit Profile details including image upload Base64
app.put('/api/users/profile', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { first_name, last_name, phone, address, profile_image, belt_rank, xp, streak, active_frame, active_avatar_skin, active_belt_skin, active_title } = req.body;

  // Partial validation constraints
  const updates: Partial<UserRow> = {};
  if (first_name !== undefined) updates.first_name = first_name;
  if (last_name !== undefined) updates.last_name = last_name;
  if (phone !== undefined) {
    const telecomDigits = phone.replace(/\D/g, '');
    if (telecomDigits.length > 0 && telecomDigits.length < 10) {
      return res.status(400).json({ error: 'Número de telefone inválido. Insira os dígitos com código de área.' });
    }
    updates.phone = phone;
  }
  if (address !== undefined) updates.address = address;
  if (profile_image !== undefined) updates.profile_image = profile_image;
  
  // Progress & gamification tracking synchronization
  if (belt_rank !== undefined) updates.belt_rank = belt_rank;
  if (xp !== undefined && typeof xp === 'number') updates.xp = xp;
  if (streak !== undefined && typeof streak === 'number') updates.streak = streak;

  // Cosmetic active slots updates
  if (active_frame !== undefined) updates.active_frame = active_frame;
  if (active_avatar_skin !== undefined) updates.active_avatar_skin = active_avatar_skin;
  if (active_belt_skin !== undefined) updates.active_belt_skin = active_belt_skin;
  if (active_title !== undefined) updates.active_title = active_title;

  try {
    const updatedUser = dbStore.updateUser(user.id, updates);
    res.json({
      message: 'Perfil atualizado com sucesso!',
      user: {
        id: updatedUser?.id,
        first_name: updatedUser?.first_name,
        last_name: updatedUser?.last_name,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
        address: updatedUser?.address,
        profile_image: updatedUser?.profile_image,
        belt_rank: updatedUser?.belt_rank,
        xp: updatedUser?.xp,
        streak: updatedUser?.streak,
        coins: updatedUser?.coins !== undefined ? updatedUser?.coins : 2500,
        is_vip: updatedUser?.is_vip || false,
        battle_pass_tier: updatedUser?.battle_pass_tier || 1,
        battle_pass_xp: updatedUser?.battle_pass_xp || 0,
        unlocked_cosmetics: updatedUser?.unlocked_cosmetics || [],
        active_frame: updatedUser?.active_frame || '',
        active_avatar_skin: updatedUser?.active_avatar_skin || '',
        active_belt_skin: updatedUser?.active_belt_skin || '',
        active_title: updatedUser?.active_title || '',
        email_verified: updatedUser?.email_verified,
        is_online: true,
        created_at: updatedUser?.created_at,
        updated_at: updatedUser?.updated_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar alterações no perfil do guerreiro.', details: err.message });
  }
});

// 9. Synchronized Leaderboard Rank API
app.get('/api/ranking', (req, res) => {
  // Sort user db by XP to build real-time dynamic rank matching BJJ Leaderboard user interface
  const allUsers = dbStore.getUsers();
  const sorted = [...allUsers]
    .sort((a, b) => b.xp - a.xp)
    .map((usr, i) => ({
      rank: i + 1,
      name: `${usr.first_name} ${usr.last_name}`,
      belt: usr.belt_rank,
      xp: usr.xp,
      accuracy: usr.id.startsWith('usr_') ? 85 : 90 + (i % 3) * 3, // dynamic mock or user value
      avatar: usr.profile_image.startsWith('data:image') || usr.profile_image.length > 4 ? '👤' : usr.profile_image,
      country: usr.address.toLowerCase().includes('brasil') || usr.address.toLowerCase().includes('br') ? 'BR' : 'US',
      is_online: usr.is_online,
      id: usr.id
    }));

  res.json({ ranking: sorted });
});

// 10. Status online retrieve
app.get('/api/status', (req, res) => {
  const onlineCount = dbStore.getUsers().filter(u => u.is_online).length;
  res.json({
    onlineCount,
    totalCount: dbStore.getUsers().length
  });
});

// ==============================================
// 📊 JIUSPEAK FINANCIAL MANAGEMENT ENDPOINTS
// ==============================================

// Helper to check if user has admin permission simulator 
app.get('/api/finance/admin/stats', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const transactions = dbStore.getTransactions();
    const subscriptions = dbStore.getSubscriptions();
    const storeSales = dbStore.getStoreSales();
    const bankAccounts = dbStore.getAdminBankAccounts();
    const payouts = dbStore.getPayouts();
    const logs = dbStore.getAdminSecurityLogs();
    
    // Calculate dashboard statistics dynamically based on our persistent storage
    const totalTransactionsAmount = transactions
      .filter(tx => tx.status === 'Aprovado')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const subscriptionRevenue = subscriptions
      .filter(s => s.status === 'Ativa')
      .reduce((sum, s) => sum + s.price, 0);

    const salesRevenue = storeSales
      .reduce((sum, s) => sum + s.amount, 0);

    const totalRevenueCents = totalTransactionsAmount; // Or sum of subscriptions + store sales + marketplace splits

    // Marketplace fee calculator (e.g. 5% platform commission on premium coin items or simulated auctions)
    const marketplaceCommCents = 1850; // default simulation

    // Available balance for withdrawal consists of Approved Transactions less Processed Payouts
    const processedPayoutsCents = payouts
      .filter(p => p.status === 'Processado')
      .reduce((sum, p) => sum + p.amount, 0);

    const availableBalanceCents = Math.max(0, totalTransactionsAmount - processedPayoutsCents);

    res.json({
      success: true,
      stats: {
        totalRevenueCents,
        subscriptionRevenueCents: subscriptionRevenue,
        salesRevenueCents: salesRevenue,
        marketplaceCommCents,
        processedPayoutsCents,
        availableBalanceCents,
        activeSubscriptionsCount: subscriptions.filter(s => s.status === 'Ativa').length,
        totalTransactionsCount: transactions.length,
        suspiciousCount: transactions.filter(tx => tx.status === 'Suspeito').length,
        chargebackCount: transactions.filter(tx => tx.status === 'Chargeback').length,
        premiumUsersCount: subscriptions.filter(s => s.status === 'Ativa' && s.plan !== 'Free').length
      },
      transactions,
      subscriptions,
      storeSales,
      bankAccounts,
      payouts,
      logs
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao extrair estatísticas financeiras.', details: err.message });
  }
});

// Update or register Admin Bank Accounts with security audits
app.post('/api/finance/admin/bank', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const adminUser = req.user!;
    const { bank_name, agency, account_number, account_type, pix_key, owner_name, cpf_cnpj, code2FA } = req.body;

    if (!bank_name || !agency || !account_number || !account_type || !pix_key || !owner_name || !cpf_cnpj) {
      return res.status(400).json({ error: 'Todos os campos cadastrais bancários são obrigatórios.' });
    }

    // Simulate 2FA token security validation
    if (!code2FA) {
      return res.status(400).json({ error: 'Código de autenticação 2FA é requerido.' });
    }
    if (code2FA !== '123456' && code2FA !== '080808') {
      return res.status(400).json({ error: 'Código 2FA expirado ou inválido. Tente novamente.' });
    }

    const updatedAccount = dbStore.saveAdminBankAccount({
      id: 'bank_sample', // Keep single primary account for administration overview
      bank_name,
      agency,
      account_number,
      account_type,
      pix_key,
      owner_name,
      cpf_cnpj,
      created_at: new Date().toISOString()
    });

    // Record Security Logs immediately (Auditoria de segurança)
    dbStore.addSecurityLog(
      `${adminUser.first_name} ${adminUser.last_name}`,
      `Atualização de Dados Bancários`,
      req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1',
      `Cadastro de conta alterada para ${bank_name}, ag ${agency}, cc ${account_number}. Criptografado no disco.`
    );

    res.json({
      success: true,
      message: 'Cadastro de conta bancária criptografado e salvo com sucesso!',
      account: updatedAccount
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar dados bancários.', details: err.message });
  }
});

// Manual Payout Execution to registered bank account
app.post('/api/finance/admin/payout', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const adminUser = req.user!;
    const { amountCents } = req.body;

    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({ error: 'Valor do saque inválido ou abaixo de zero.' });
    }

    // Calculate current available balance
    const transactions = dbStore.getTransactions();
    const payouts = dbStore.getPayouts();
    
    const approvedTotal = transactions
      .filter(tx => tx.status === 'Aprovado')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const paidTotal = payouts
      .filter(p => p.status === 'Processado')
      .reduce((sum, p) => sum + p.amount, 0);

    const available = approvedTotal - paidTotal;

    if (amountCents > available) {
      return res.status(400).json({ error: `Saldo disponível insuficiente. Disponível: US$ ${(available / 100).toFixed(2)}` });
    }

    const bankAccounts = dbStore.getAdminBankAccounts();
    const activeAccount = bankAccounts[0] || {
      id: 'bank_sample',
      pix_key: 'financeiro@jiuspeak.com',
      bank_name: 'Banco do Brasil S.A.'
    };

    const payout = dbStore.addPayoutRequest(amountCents, activeAccount.id, activeAccount.pix_key);

    // Auto process manual request instantly for a fast and beautiful experience!
    dbStore.updatePayoutStatus(payout.id, 'Processado');

    // Audit logs
    dbStore.addSecurityLog(
      `${adminUser.first_name} ${adminUser.last_name}`,
      `Execução de Saque Manual`,
      req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1',
      `Saque manual de US$ ${(amountCents / 100).toFixed(2)} processado para chave PIX ${activeAccount.pix_key}.`
    );

    res.json({
      success: true,
      message: 'Solicitação de saque criada com sucesso e já enviada para processamento bancário!',
      payout: { ...payout, status: 'Processado' }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao solicitar saque administrativo.', details: err.message });
  }
});

// Configure recurring automatic payouts
app.post('/api/finance/admin/payout/auto', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const adminUser = req.user!;
    const { autoPayoutEnabled } = req.body;

    dbStore.addSecurityLog(
      `${adminUser.first_name} ${adminUser.last_name}`,
      `Configuração Saque Automático`,
      req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1',
      `Saque automático semanal programado definido para: ${autoPayoutEnabled ? 'ATIVADO' : 'DESATIVADO'}`
    );

    res.json({
      success: true,
      message: `Saque automático programado ${autoPayoutEnabled ? 'ativado para todas as segundas-feiras' : 'desativado'} com sucesso!`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao configurar agendamento.', details: err.message });
  }
});

// Manage Plan Subscriptions (Upgrades or edits)
app.post('/api/finance/admin/subscription', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const adminUser = req.user!;
    const { userId, newPlan } = req.body;

    if (!userId || !newPlan) {
      return res.status(400).json({ error: 'ID do usuário e novo plano são obrigatórios.' });
    }

    const targetUser = dbStore.getUsers().find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário de destino não encontrado no sistema.' });
    }

    // Toggle VIP property in user row accordingly
    if (newPlan === 'VIP' || newPlan === 'Premium') {
      targetUser.is_vip = true;
    } else {
      targetUser.is_vip = false;
    }
    dbStore.save();

    // Log the subscription registration
    const pricingMap = { Free: 0, Premium: 1500, VIP: 2990 };
    dbStore.addSubscription({
      user_id: targetUser.id,
      user_name: `${targetUser.first_name} ${targetUser.last_name}`,
      plan: newPlan,
      status: 'Ativa',
      price: pricingMap[newPlan as 'Free' | 'Premium' | 'VIP'] || 0,
      expires_at: new Date(Date.now() + 3600000 * 24 * 30).toISOString()
    });

    // Record system notification
    raiseNotification(
      userId,
      'badge',
      undefined,
      'Administração Financeira',
      '⚜️',
      `Seu plano foi atualizado para ${newPlan} pelo Administrador da plataforma! OSS!`
    );

    // Audit logs
    dbStore.addSecurityLog(
      `${adminUser.first_name} ${adminUser.last_name}`,
      `Assinatura Modificada`,
      req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1',
      `Modificado plano do aluno ${targetUser.first_name} (ID: ${userId}) para ${newPlan}.`
    );

    res.json({
      success: true,
      message: `Plano de ${targetUser.first_name} modificado para ${newPlan} com total sucesso!`,
      user: targetUser
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerenciar assinatura.', details: err.message });
  }
});

// Simulate new purchase transaction live to test real-time visualization graphs and telemetry updating
app.post('/api/finance/admin/transaction/simulate', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const adminUser = req.user!;
    const { amountUSD, method, status, buyerName, planType } = req.body;

    if (!amountUSD || amountUSD <= 0) {
      return res.status(400).json({ error: 'Insira um valor maior que zero para simular a cobrança.' });
    }

    const cents = Math.round(amountUSD * 100);
    const simulatedTx = dbStore.addTransaction({
      user_id: 'u_simulated',
      user_name: buyerName || 'Aluno Simulado',
      amount: cents,
      method: method || 'Cartão de Crédito',
      status: status || 'Aprovado'
    });

    if (status === 'Aprovado') {
      if (planType && (planType === 'Premium' || planType === 'VIP')) {
        dbStore.addSubscription({
          user_id: 'u_simulated',
          user_name: buyerName || 'Aluno Simulado',
          plan: planType,
          status: 'Ativa',
          price: cents,
          expires_at: new Date(Date.now() + 3600000 * 24 * 30).toISOString()
        });
      } else {
        dbStore.addStoreSale({
          buyer_id: 'u_simulated',
          buyer_name: buyerName || 'Aluno Simulado',
          item_id: 'item_sample',
          item_name: planType === 'StoreItem' ? 'Item Loja Virtual' : 'Pacote de Moedas Adicionais',
          amount: cents,
          payment_method: method || 'PIX'
        });
      }
    }

    dbStore.addSecurityLog(
      `${adminUser.first_name} ${adminUser.last_name}`,
      `Transação Simulada Criada`,
      req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1',
      `Transação simulada de US$ ${amountUSD.toFixed(2)} (${method}) com status ${status} injetada comercialmente.`
    );

    res.json({
      success: true,
      message: 'Transação comercial simulada com sucesso! Atualize o dashboard para visualizar.',
      transaction: simulatedTx
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao injetar simulação.', details: err.message });
  }
});

// ==============================================
// 🥋 JIUSPEAK VIRTUAL STORE & ECONOMY ENDPOINTS
// ==============================================

// 1. Get available store items (including cards, packs, cosmetics, boosters, VIP)
app.get('/api/store/items', (req, res) => {
  try {
    const items = dbStore.getStoreItems();
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar vitrine da loja.', details: err.message });
  }
});

// 2. Get user inventory
app.get('/api/store/inventory', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const inventory = dbStore.getUserInventory(userId);
    res.json({ inventory });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao resgatar inventário do usuário.', details: err.message });
  }
});

// 3. Get user card collection of technique cards
app.get('/api/store/cards', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const cards = dbStore.getUserCardCollection(userId);
    res.json({ cards });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao resgatar coleção de cards.', details: err.message });
  }
});

// 4. Get purchases history
app.get('/api/store/purchases', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const purchases = dbStore.getUserPurchases(userId);
    res.json({ purchases });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao resgatar histórico de transações.', details: err.message });
  }
});

// 5. Purchase an item (OSS Coins, simulated PIX, Stripe, Apple Pay, Google Pay, Mobile Play Store)
app.post('/api/store/buy', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { itemId, paymentMethod } = req.body;

    if (!itemId || !paymentMethod) {
      return res.status(400).json({ error: 'ID do item e método de pagamento são obrigatórios.' });
    }

    const result = dbStore.buyStoreItem(userId, itemId, paymentMethod);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // Trigger social notification for VIP purchase
    const item = dbStore.getStoreItemById(itemId);
    if (item && (item.type === 'vip' || item.type === 'battlepass')) {
      raiseNotification(
        userId,
        'badge',
        undefined,
        'JiuSpeak Store',
        '💎',
        `Parabéns! Seu plano ${item.name} foi ativado com extremo sucesso. Aproveite suas vantagens!`
      );
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar compra na loja.', details: err.message });
  }
});

// 6. Open a card pack (Gacha random roll reveal animation triggers)
app.post('/api/store/pack/open', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { packItemId } = req.body;

    if (!packItemId) {
      return res.status(400).json({ error: 'ID do pacote a ser aberto é obrigatório.' });
    }

    const result = dbStore.openCardPack(userId, packItemId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao abrir pacote no servidor.', details: err.message });
  }
});

// 7. Level up BJJ technique cards using duplicates XP and OSS coins
app.post('/api/store/card/upgrade', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { userCardId } = req.body;

    if (!userCardId) {
      return res.status(400).json({ error: 'ID do card da sua coleção é obrigatório.' });
    }

    const result = dbStore.upgradeCard(userId, userCardId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao realizar o upgrade de card.', details: err.message });
  }
});

// 8. Claim daily surprise chest reward
app.post('/api/store/daily-claim', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const result = dbStore.claimDailyBonusChest(userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao resgatar recompensa diária.', details: err.message });
  }
});

// 9. Get marketplace auction listings
app.get('/api/store/marketplace', (req, res) => {
  try {
    const listings = dbStore.getMarketplaceListings();
    res.json({ listings });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar anúncios do marketplace.', details: err.message });
  }
});

// 10. List technique card on marketplace
app.post('/api/store/marketplace/list', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { userCardId, price } = req.body;

    if (!userCardId || price === undefined) {
      return res.status(400).json({ error: 'ID do card de coleção e preço de venda são necessários.' });
    }

    const result = dbStore.createMarketplaceListing(userId, userCardId, Number(price));
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao publicar seu anúncio no leilão.', details: err.message });
  }
});

// 11. Buy item listings from marketplace auction of another fighter
app.post('/api/store/marketplace/buy', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const buyerId = req.user!.id;
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ error: 'ID do anúncio é obrigatório.' });
    }

    const result = dbStore.buyMarketplaceListing(buyerId, listingId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // Raise notification for listing seller about card sold and revenue credited
    const listing = dbStore.getMarketplaceListings().find(l => l.id === listingId);
    if (listing) {
      raiseNotification(
        listing.seller_id,
        'badge',
        buyerId,
        buyerId,
        '🥋',
        `Parabéns! Seu card anunciado '${listing.item_name}' foi comprado por ${result.buyer?.first_name} por ${listing.price} OSS Coins.`
      );
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao comprar item anunciado do marketplace.', details: err.message });
  }
});

// 12. Cancel auction listing on marketplace
app.post('/api/store/marketplace/cancel', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ error: 'ID do anúncio é obrigatório.' });
    }

    const result = dbStore.cancelMarketplaceListing(userId, listingId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao cancelar o anúncio no servidor.', details: err.message });
  }
});

// --- SOCIAL NETWORK INTEGRATION API ENDPOINTS ---

// In-Memory notifications store
interface UserSocialNotification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'challenge' | 'badge';
  sender_id?: string;
  sender_name: string;
  sender_image: string;
  message: string;
  created_at: string;
  read: boolean;
}

const notificationsDb = new Map<string, UserSocialNotification[]>();

const raiseNotification = (userId: string, type: UserSocialNotification['type'], senderId: string | undefined, senderName: string, senderImage: string, message: string) => {
  if (!notificationsDb.has(userId)) {
    notificationsDb.set(userId, []);
  }
  const current = notificationsDb.get(userId) || [];
  const newNotif: UserSocialNotification = {
    id: 'not_' + Math.random().toString(36).substr(2, 9),
    type,
    sender_id: senderId,
    sender_name: senderName,
    sender_image: senderImage,
    message,
    created_at: new Date().toISOString(),
    read: false
  };
  notificationsDb.set(userId, [newNotif, ...current].slice(0, 50));
};

// 12. Get All Active Social Posts
app.get('/api/social/posts', (req, res) => {
  res.json({ posts: dbStore.getEnrichedSocialPosts() });
});

// 13. Create Social Post (Manual or automated triggers)
app.post('/api/social/posts', authenticateJWT as express.RequestHandler, (req: AuthenticatedRequest, res) => {
  const { type, image_url, content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Conteúdo do post é obrigatório.' });
  }
  const userId = req.user!.id;
  const post = dbStore.addSocialPost(userId, type || 'community', image_url || '🥋', content);
  
  // Return enriched post
  const enriched = {
    ...post,
    user_name: `${req.user!.first_name} ${req.user!.last_name}`,
    user_image: req.user!.profile_image,
    user_belt: req.user!.belt_rank
  };
  res.json({ message: 'Post publicado com sucesso!', post: enriched });
});

// 14. Toggle Like on Post
app.post('/api/social/posts/:id/like', authenticateJWT as express.RequestHandler, (req: AuthenticatedRequest, res) => {
  const postId = req.params.id;
  const userId = req.user!.id;
  const { liked, count } = dbStore.toggleLikeSocialPost(postId, userId);
  
  // Find post user to raise notification
  const post = dbStore.getEnrichedSocialPosts().find(p => p.id === postId);
  if (post && post.user_id !== userId && liked) {
    raiseNotification(
      post.user_id,
      'like',
      userId,
      `${req.user!.first_name} ${req.user!.last_name}`,
      req.user!.profile_image,
      `curtiu sua publicação: "${post.content.slice(0, 30)}..."`
    );
  }

  res.json({ liked, count });
});

// 15. Comment on Post
app.post('/api/social/posts/:id/comment', authenticateJWT as express.RequestHandler, (req: AuthenticatedRequest, res) => {
  const postId = req.params.id;
  const userId = req.user!.id;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório.' });
  }

  const name = `${req.user!.first_name} ${req.user!.last_name}`;
  const comment = dbStore.addCommentSocialPost(postId, userId, name, content);
  
  if (!comment) {
    return res.status(404).json({ error: 'Publicação não localizada.' });
  }

  // Raise notification for commenter
  const post = dbStore.getEnrichedSocialPosts().find(p => p.id === postId);
  if (post && post.user_id !== userId) {
    raiseNotification(
      post.user_id,
      'comment',
      userId,
      name,
      req.user!.profile_image,
      `comentou na sua publicação: "${content.slice(0, 30)}..."`
    );
  }

  res.json({ comment });
});

// 16. Get social notifications
app.get('/api/social/notifications', authenticateJWT as express.RequestHandler, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const notifs = notificationsDb.get(userId) || [];
  res.json({ notifications: notifs });
});

// 17. Simular uma notificação social imediata no dojo
app.post('/api/social/notifications/sim-trigger', authenticateJWT as express.RequestHandler, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { type, sender_name, message } = req.body;
  if (!type || !sender_name || !message) {
    return res.status(400).json({ error: 'Campos type, sender_name e message são obrigatórios.' });
  }

  raiseNotification(
    userId,
    type,
    undefined,
    sender_name,
    '👤',
    message
  );

  res.json({ success: true, notifications: notificationsDb.get(userId) || [] });
});

// 18. Get Public/Social Profile of any user by ID or Username Slug
app.get('/api/social/user/:identifier', (req, res) => {
  const ident = req.params.identifier;
  const allUsers = dbStore.getUsers();
  
  // Match check
  let found = allUsers.find(u => u.id === ident);
  if (!found) {
    // Try slug compare (first_name + last_name lowercased without space)
    found = allUsers.find(u => {
      const slug = `${u.first_name}${u.last_name}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      return slug === ident.toLowerCase().replace(/[^a-z0-9]/g, '');
    });
  }

  if (!found) {
    return res.status(404).json({ error: 'Perfil de atleta não localizado.' });
  }

  const pRank = dbStore.getRankingByUserId(found.id);
  const achievements = dbStore.getUserAchievements(found.id);
  const followers = dbStore.getFollowers(found.id);
  const following = dbStore.getFollowing(found.id);

  // Calc Global rank
  const sorted = [...allUsers].sort((a,b) => b.xp - a.xp);
  const globalRankIndex = sorted.findIndex(u => u.id === found!.id);
  const globalRank = globalRankIndex !== -1 ? globalRankIndex + 1 : 999;

  res.json({
    user: {
      id: found.id,
      first_name: found.first_name,
      last_name: found.last_name,
      username: `${found.first_name.toLowerCase()}${found.last_name.toLowerCase()}`.replace(/[^a-z0-9]/g, ''),
      email: found.id.startsWith('u') ? found.email : 'protegido@jiuspeak.com',
      profile_image: found.profile_image,
      belt_rank: found.belt_rank,
      xp: found.xp,
      streak: found.streak,
      created_at: found.created_at
    },
    stats: {
      elo: pRank.elo,
      wins: pRank.wins,
      losses: pRank.losses,
      streak: pRank.streak,
      rank: globalRank
    },
    followers_count: followers.length,
    following_count: following.length,
    achievements: achievements.map(a => a.badge)
  });
});

// 19. Toggle follow user
app.post('/api/social/user/:id/follow', authenticateJWT as express.RequestHandler, (req: AuthenticatedRequest, res) => {
  const targetId = req.params.id;
  const selfId = req.user!.id;
  if (targetId === selfId) {
    return res.status(400).json({ error: 'Você não pode seguir a si mesmo.' });
  }

  const targetUser = dbStore.getUserById(targetId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Perfil alvo não encontrado.' });
  }

  const { followed } = dbStore.toggleFollowUser(selfId, targetId);
  
  if (followed) {
    // Trigger notification on target user
    raiseNotification(
      targetId,
      'follow',
      selfId,
      `${req.user!.first_name} ${req.user!.last_name}`,
      req.user!.profile_image,
      'começou a seguir seu progresso no JiuSpeak! OSS!'
    );
  }

  res.json({ followed, followers_count: dbStore.getFollowers(targetId).length });
});

// 20. Get followers checklist
app.get('/api/social/user/:id/followers', (req, res) => {
  const userId = req.params.id;
  const followers = dbStore.getFollowers(userId).map(f => {
    const u = dbStore.getUserById(f.follower_id);
    return u ? { id: u.id, name: `${u.first_name} ${u.last_name}`, image: u.profile_image, belt: u.belt_rank } : null;
  }).filter(Boolean);

  const following = dbStore.getFollowing(userId).map(f => {
    const u = dbStore.getUserById(f.following_id);
    return u ? { id: u.id, name: `${u.first_name} ${u.last_name}`, image: u.profile_image, belt: u.belt_rank } : null;
  }).filter(Boolean);

  res.json({ followers, following });
});

// 21. Get User Badges / Achievements
app.get('/api/social/user/:id/achievements', (req, res) => {
  const userId = req.params.id;
  const achievements = dbStore.getUserAchievements(userId);
  res.json({ achievements });
});

// 22. Unlock Badge manually
app.post('/api/social/user/:id/unlock-badge', authenticateJWT as express.RequestHandler, (req: AuthenticatedRequest, res) => {
  const { badge } = req.body;
  const userId = req.params.id;
  if (!badge) {
    return res.status(400).json({ error: 'Nome da badge é obrigatório.' });
  }

  if (req.user!.id !== userId) {
    return res.status(403).json({ error: 'Sem permissão para desbloquear conquistas de terceiros.' });
  }

  const unlocked = dbStore.unlockAchievement(userId, badge);
  res.json({ success: true, unlocked });
});

// 11. Fake Login Google & Apple Simulation Backend (Returns quick auth token)
app.post('/api/auth/social-sign-in', (req, res) => {
  const { provider, email, first_name, last_name, profile_image } = req.body;
  if (!email || !provider) {
    return res.status(400).json({ error: 'Provedor social inválido.' });
  }

  // Check if exists
  let user = dbStore.getUserByEmail(email);
  if (!user) {
    // Register immediately as social verified user
    user = dbStore.createUser({
      first_name: first_name || 'Atleta',
      last_name: last_name || 'Social',
      email: email,
      phone: 'Provedor Social',
      address: 'Provedor Social',
      password_hash: bcrypt.hashSync(Math.random().toString(36), 10),
      profile_image: profile_image || '🥋'
    });
    dbStore.updateUser(user.id, { email_verified: true, is_online: true });
  } else {
    dbStore.updateUser(user.id, { is_online: true });
  }

  // Sign JWT
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: `Autenticado com sucesso via ${provider}!`,
    token,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      profile_image: user.profile_image,
      belt_rank: user.belt_rank,
      xp: user.xp,
      streak: user.streak,
      email_verified: true,
      is_online: true
    }
  });
});


// ==============================================
// 🇧🇷 REAL-TIME PIX PAYMENT WEBHOOK & CONFIRMATION
// ==============================================
app.post('/api/payments/pix/confirm', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'ID do pagamento PIX é obrigatório.' });
    }

    const result = dbStore.confirmPixPayment(paymentId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // Emit live notification receipt
    raiseNotification(
      result.user!.id,
      'badge',
      undefined,
      'JiuSpeak Pagamentos',
      '✅',
      `Pagamento de R$ ${(result.purchase!.amount / 100).toFixed(2).replace('.', ',')} compensado via PIX com sucesso! '${result.purchase!.item_name}' liberado.`
    );

    // Give cashback (5% in OSS Coins bounds)
    const cashbackAmt = Math.round(result.purchase!.amount * 0.05 / 10);
    if (cashbackAmt > 0) {
      result.user!.coins = (result.user!.coins || 0) + cashbackAmt;
      dbStore.save();
      raiseNotification(
        result.user!.id,
        'badge',
        undefined,
        'Cashback Recebido',
        '🪙',
        `Você recebeu um bônus cashback de ${cashbackAmt} OSS Coins por pagar via PIX!`
      );
    }

    // Add security audit log
    dbStore.addSecurityLog(
      'Sistema PIX Webhook',
      'Confirmação Automática de PIX',
      '187.12.34.56',
      `Pagamento aprovado via QR Code para o item: ${result.purchase!.item_name} (Usuário ID: ${result.user!.id}). Recurso liberado com sucesso.`
    );

    res.json({
      success: true,
      message: result.message,
      user: result.user,
      purchase: result.purchase,
      cashbackCoins: cashbackAmt
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro interno ao processar recebimento do PIX.', details: err.message });
  }
});


// ===================================================
// 🛠️ JIUSPEAK DYNAMIC PRICING & PROMOTION ADMIN API
// ===================================================

// Get all dynamic pricing resources
app.get('/api/pricing/all', (req, res) => {
  try {
    res.json({
      success: true,
      storePricing: dbStore.getStorePricing(),
      subscriptionPlans: dbStore.getSubscriptionPlans(),
      promotions: dbStore.getPromotions(),
      adminLogs: dbStore.getPriceAdminLogs(),
      marketplaceConfig: dbStore.getMarketplaceConfig()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao carregar dados de precificação.', details: err.message });
  }
});

// Update or register a store price item
app.post('/api/pricing/store/update', (req, res) => {
  try {
    const { id, item_name, category, price_brl, active, adminName } = req.body;
    if (!item_name || !category || price_brl === undefined) {
      return res.status(400).json({ success: false, error: 'Campos item_name, category e price_brl são obrigatórios.' });
    }
    const updated = dbStore.updateStorePricing(id || ('item_' + Math.random().toString(36).substr(2, 9)), item_name, category, Number(price_brl), active !== false, adminName || 'Admin');
    res.json({ success: true, item: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao salvar alteração de preço.', details: err.message });
  }
});

// Create a new store price item
app.post('/api/pricing/store/create', (req, res) => {
  try {
    const { item_name, category, price_brl, active, adminName } = req.body;
    if (!item_name || !category || price_brl === undefined) {
      return res.status(400).json({ success: false, error: 'Campos nome, categoria e valor BRL são requeridos.' });
    }
    const created = dbStore.createStorePricing(item_name, category, Number(price_brl), active !== false, adminName || 'Admin');
    res.json({ success: true, item: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao criar item de faturamento.', details: err.message });
  }
});

// Delete standard price item
app.delete('/api/pricing/store/:id', (req, res) => {
  try {
    const id = req.params.id;
    const adminName = (req.query.adminName as string) || 'Admin';
    const deleted = dbStore.deleteStorePricing(id, adminName);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao desativar precificação.', details: err.message });
  }
});

// Update subscription plan benefits & prices
app.post('/api/pricing/plans/update', (req, res) => {
  try {
    const { id, plan_name, monthly_price, yearly_price, benefits, adminName } = req.body;
    if (!id || !plan_name || monthly_price === undefined || yearly_price === undefined) {
      return res.status(400).json({ success: false, error: 'Falta ID, nome ou valores do plano de assinantes.' });
    }
    const updated = dbStore.updateSubscriptionPlan(id, plan_name, Number(monthly_price), Number(yearly_price), benefits || [], adminName || 'Admin');
    res.json({ success: true, plan: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao editar plano de assinatura.', details: err.message });
  }
});

// Create or update promotion/discount/coupon
app.post('/api/pricing/promotions/update', (req, res) => {
  try {
    const { id, title, discount_percentage, start_date, end_date, promo_code, cashback_percentage, adminName } = req.body;
    if (!title || discount_percentage === undefined) {
      return res.status(400).json({ success: false, error: 'Título e % de Desconto são obrigatórios.' });
    }

    let result;
    if (id) {
      result = dbStore.updatePromotion(id, title, Number(discount_percentage), start_date || new Date().toISOString(), end_date || new Date(Date.now() + 86400000 * 30).toISOString(), promo_code, cashback_percentage !== undefined ? Number(cashback_percentage) : 0, adminName || 'Admin');
    } else {
      result = dbStore.createPromotion(title, Number(discount_percentage), start_date || new Date().toISOString(), end_date || new Date(Date.now() + 86400000 * 30).toISOString(), promo_code, cashback_percentage !== undefined ? Number(cashback_percentage) : 0, adminName || 'Admin');
    }

    res.json({ success: true, promotion: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao programar promoção.', details: err.message });
  }
});

// Delete a promotion/coupon
app.delete('/api/pricing/promotions/:id', (req, res) => {
  try {
    const id = req.params.id;
    const adminName = (req.query.adminName as string) || 'Admin';
    const deleted = dbStore.deletePromotion(id, adminName);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao deletar promoção.', details: err.message });
  }
});

// Update marketplace tax rules
app.post('/api/pricing/marketplace/update', (req, res) => {
  try {
    const { tax_percentage, commission_percentage, min_price, max_price, adminName } = req.body;
    if (tax_percentage === undefined || commission_percentage === undefined) {
      return res.status(400).json({ success: false, error: 'Defina % da taxa e % de comissão.' });
    }
    const updated = dbStore.updateMarketplaceConfig(Number(tax_percentage), Number(commission_percentage), Number(min_price || 1), Number(max_price || 100000), adminName || 'Admin');
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao salvar regras de comissão e taxas.', details: err.message });
  }
});


// --- INTEGRATE VITE DEVSERVER ENGINE OR SERVE PRODUCTION BUNDLE ---

async function startServer() {
  // Setup interactive PvP matchmaking and WebSocket rooms
  setupPvP(io, app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Direct asset rendering based on express version safety
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[JiuSpeak Full-Stack] Server completed startup on port ${PORT}`);
  });
}

startServer();
