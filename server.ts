import 'dotenv/config';
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

// Permite CORS (Cross-Origin Resource Sharing) para conectar tanto o Website quanto o Aplicativo Móvel (Flutter/Native/Web) de forma robusta
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

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

// 3.1. RBAC Guard Middleware (Only ADMIN is permitted)
const authorizeAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const user = req.user;
  const ALLOWED_ADMINS = ['maxtechbtbr@gmail.com', 'maxtechptbr@gmail.com', 'maxtechptbr9@gmail.com'];
  if (!user || (user.role !== 'ADMIN' && !user.is_admin) || !ALLOWED_ADMINS.includes(user.email.toLowerCase())) {
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
    dbStore.addSecurityLog(
      user ? `${user.first_name} ${user.last_name}` : 'Usuário Anônimo',
      'Tentativa de Acesso Negado',
      clientIp,
      `Tentativa não autorizada de acessar rota protegida: ${req.originalUrl}`
    );
    return res.status(403).json({ error: 'Acesso restrito. Somente administradores autorizados.' });
  }
  next();
};


// --- BACKEND API ENDPOINTS ---

// Dedicated administrative login starting path
app.post('/api/auth/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são de preenchimento obrigatório.' });
  }

  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
  const bruteCheck = checkBruteForce(email);
  if (!bruteCheck.allowed) {
    return res.status(423).json({ 
      error: `Sua conta está bloqueada temporariamente para evitar ataques. Tente novamente em ${bruteCheck.waitTimeLeft} segundos.` 
    });
  }

  const user = dbStore.getUserByEmail(email);
  if (!user) {
    registerFailedAttempt(email);
    dbStore.addSecurityLog(
      email || 'Anônimo',
      'Tentativa de Login Admin Negada',
      clientIp,
      'E-mail administrativo não cadastrado'
    );
    return res.status(401).json({ error: 'Credenciais inválidas ou e-mail incorreto.' });
  }

  const validPass = bcrypt.compareSync(password, user.password_hash);
  if (!validPass) {
    registerFailedAttempt(email);
    dbStore.addSecurityLog(
      `${user.first_name} ${user.last_name}`,
      'Tentativa de Login Admin Negada',
      clientIp,
      'Senha incorreta para acesso administrativo'
    );
    return res.status(401).json({ error: 'Credenciais inválidas ou senha incorreta.' });
  }

  const ALLOWED_ADMINS = ['maxtechbtbr@gmail.com', 'maxtechptbr@gmail.com', 'maxtechptbr9@gmail.com'];
  if (user.role !== 'ADMIN' && !user.is_admin || !ALLOWED_ADMINS.includes(user.email.toLowerCase())) {
    dbStore.addSecurityLog(
      `${user.first_name} ${user.last_name}`,
      'Acesso Administrativo Bloqueado',
      clientIp,
      `Usuário sem privilégios RBAC ADMIN tentou realizar login administrativo. Cargo: ${user.role || 'USER'}`
    );
    return res.status(403).json({ error: 'Acesso restrito. Somente administradores autorizados.' });
  }

  // Pre-approved! Now require 2FA challenge
  res.json({
    require2FA: true,
    id: user.id,
    email: user.email,
    message: 'Credenciais validadas com sucesso. Código de verificação 2FA requerido.'
  });
});

// Dedicated administrative login verification endpoint (2FA verification)
app.post('/api/auth/admin/verify-2fa', (req, res) => {
  const { id, code2FA } = req.body;
  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
  
  if (!id || !code2FA) {
    return res.status(400).json({ error: 'ID de usuário e código 2FA são obrigatórios.' });
  }

  const user = dbStore.getUserById(id);
  const ALLOWED_ADMINS = ['maxtechbtbr@gmail.com', 'maxtechptbr@gmail.com', 'maxtechptbr9@gmail.com'];
  if (!user || (user.role !== 'ADMIN' && !user.is_admin) || !ALLOWED_ADMINS.includes(user.email.toLowerCase())) {
    return res.status(403).json({ error: 'Acesso restrito. Usuário inválido ou não autorizado.' });
  }

  if (code2FA !== '123456' && code2FA !== '080808') {
    dbStore.addSecurityLog(
      `${user.first_name} ${user.last_name}`,
      'Falha de Verificação 2FA',
      clientIp,
      `Código 2FA incorreto inserido: ${code2FA}`
    );
    return res.status(401).json({ error: 'Código 2FA inválido ou expirado. Tente novamente.' });
  }

  clearFailedAttempts(user.email);
  const lastLoginStr = new Date().toISOString();
  dbStore.updateUser(user.id, { is_online: true, last_login: lastLoginStr });

  dbStore.addSecurityLog(
    `${user.first_name} ${user.last_name}`,
    'Autenticação de Acesso Admin',
    clientIp,
    'Login de administrador aprovado via autenticação 2FA'
  );

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Acesso administrativo autorizado!',
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
      role: user.role || 'ADMIN',
      is_admin: true,
      permissions: user.permissions || ['all'],
      last_login: lastLoginStr,
      created_at: user.created_at
    }
  });
});

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
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Erro interno do servidor ao criar conta. Tente novamente.' 
    });
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

  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
  const user = dbStore.getUserByEmail(email);
  if (!user) {
    registerFailedAttempt(email);
    dbStore.addSecurityLog(
      email || 'Anônimo',
      'Falha de Autenticação',
      clientIp,
      'Tentativa de login com e-mail não cadastrado'
    );
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha inseridos.' });
  }

  // SUSPENSION CHECK
  if (user.verification_token === 'BLOCKED') {
    dbStore.addSecurityLog(
      `${user.first_name} ${user.last_name}`,
      'Acesso Rejeitado',
      clientIp,
      'Tentativa de login em conta suspensa'
    );
    return res.status(403).json({ error: 'Sua conta foi suspensa temporariamente por administradores para verificação de segurança.' });
  }

  // Verify encrypted hash password using bcrypt
  const validPass = bcrypt.compareSync(password, user.password_hash);
  if (!validPass) {
    registerFailedAttempt(email);
    dbStore.addSecurityLog(
      `${user.first_name} ${user.last_name}`,
      'Falha de Autenticação',
      clientIp,
      'Tentativa de login com senha incorreta'
    );
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha inseridos.' });
  }

  // Clear attempts registration on successful sign-in
  clearFailedAttempts(email);

  const lastLoginStr = new Date().toISOString();
  // Update online status and last login in the database USERS representation
  dbStore.updateUser(user.id, { is_online: true, last_login: lastLoginStr });

  dbStore.addSecurityLog(
    `${user.first_name} ${user.last_name}`,
    'Autenticação de Acesso',
    clientIp,
    `Login realizado com sucesso. Cargo: ${user.role || 'USER'}`
  );

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
      role: user.role || 'USER',
      is_admin: !!user.is_admin,
      permissions: user.permissions || ['user'],
      last_login: lastLoginStr,
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
      role: user.role || 'USER',
      is_admin: !!user.is_admin,
      permissions: user.permissions || ['user'],
      username: user.username,
      username_locked: !!user.username_locked,
      is_verified: !!user.is_verified,
      last_profile_update: user.last_profile_update,
      biography: user.biography || '',
      social_instagram: user.social_instagram || '',
      social_twitter: user.social_twitter || '',
      language: user.language || 'pt',
      theme_visual: user.theme_visual || 'dark',
      privacy_profile: user.privacy_profile || 'public',
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  });
});

// 8. Edit Profile details including image upload Base64
app.put('/api/users/profile', authenticateJWT as any, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { 
    first_name, 
    last_name, 
    username,
    phone, 
    address, 
    profile_image, 
    belt_rank, 
    xp, 
    streak, 
    active_frame, 
    active_avatar_skin, 
    active_belt_skin, 
    active_title,
    biography,
    social_instagram,
    social_twitter,
    language,
    theme_visual,
    privacy_profile,
    password
  } = req.body;

  // STRICT REQUIREMENT: Protect Name, Surname and Username from alteration by general users
  if ((first_name !== undefined && first_name !== user.first_name) ||
      (last_name !== undefined && last_name !== user.last_name) ||
      (username !== undefined && username !== user.username)) {
    return res.status(400).json({ error: 'Seu nome não pode ser alterado após o cadastro.' });
  }

  // Partial validation constraints
  const updates: Partial<UserRow> = {};
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

  // Advanced profile customization update
  if (biography !== undefined) updates.biography = biography;
  if (social_instagram !== undefined) updates.social_instagram = social_instagram;
  if (social_twitter !== undefined) updates.social_twitter = social_twitter;
  if (language !== undefined) updates.language = language;
  if (theme_visual !== undefined) updates.theme_visual = theme_visual;
  if (privacy_profile !== undefined) updates.privacy_profile = privacy_profile;

  // Passwords change validation and hash
  if (password !== undefined && password !== '') {
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve possuir pelo menos 6 caracteres.' });
    }
    updates.password_hash = bcrypt.hashSync(password, 10);
  }

  updates.last_profile_update = new Date().toISOString();

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
        role: updatedUser?.role || 'USER',
        is_admin: !!updatedUser?.is_admin,
        permissions: updatedUser?.permissions || ['user'],
        username: updatedUser?.username,
        username_locked: !!updatedUser?.username_locked,
        is_verified: !!updatedUser?.is_verified,
        last_profile_update: updatedUser?.last_profile_update,
        biography: updatedUser?.biography || '',
        social_instagram: updatedUser?.social_instagram || '',
        social_twitter: updatedUser?.social_twitter || '',
        language: updatedUser?.language || 'pt',
        theme_visual: updatedUser?.theme_visual || 'dark',
        privacy_profile: updatedUser?.privacy_profile || 'public',
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
app.get('/api/finance/admin/stats', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/finance/admin/bank', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/finance/admin/payout', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/finance/admin/payout/auto', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/finance/admin/subscription', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/finance/admin/transaction/simulate', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
    // Try exact or case-insensitive username comparison
    found = allUsers.find(u => u.username?.toLowerCase() === ident.toLowerCase());
  }
  if (!found) {
    // Try old slug fallback comparison
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
      username: found.username || `${found.first_name.toLowerCase()}${found.last_name.toLowerCase()}`.replace(/[^a-z0-9]/g, ''),
      email: found.id.startsWith('u') ? found.email : 'protegido@jiuspeak.com',
      profile_image: found.profile_image,
      belt_rank: found.belt_rank,
      xp: found.xp,
      streak: found.streak,
      biography: found.biography || '',
      social_instagram: found.social_instagram || '',
      social_twitter: found.social_twitter || '',
      language: found.language || 'pt',
      theme_visual: found.theme_visual || 'dark',
      privacy_profile: found.privacy_profile || 'public',
      role: found.role || 'USER',
      is_verified: !!found.is_verified,
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
app.get('/api/pricing/all', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/pricing/store/update', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/pricing/store/create', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.delete('/api/pricing/store/:id', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/pricing/plans/update', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/pricing/promotions/update', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.delete('/api/pricing/promotions/:id', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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
app.post('/api/pricing/marketplace/update', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
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


// --- SECTION: RBAC & ADMINISTRATIVE ACTIONS ---

// Get all users in system with complete fields (Only Admin)
app.get('/api/admin/users', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
  try {
    const list = dbStore.getUsers().map(u => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      username: u.username,
      belt_rank: u.belt_rank,
      xp: u.xp,
      streak: u.streak,
      role: u.role || 'USER',
      is_admin: !!u.is_admin,
      is_online: !!u.is_online,
      last_login: u.last_login || '',
      is_verified: !!u.is_verified,
      is_locked: !!u.username_locked,
      is_blocked: u.verification_token === 'BLOCKED',
      last_profile_update: u.last_profile_update,
      created_at: u.created_at
    }));
    res.json({ success: true, users: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao listar guerreiros.', details: err.message });
  }
});

// Update user role (promote to Moderator/Admin, demote) (Only Admin)
app.put('/api/admin/users/:id/role', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    const { role } = req.body;
    const admin = req.user!;
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

    if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Cargo (Role) inválido.' });
    }

    const targetUser = dbStore.getUserById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Guerreiro não localizado.' });
    }

    // Update role parameters
    const updates: Partial<UserRow> = {
      role,
      is_admin: role === 'ADMIN',
      permissions: role === 'ADMIN' ? ['all'] : (role === 'MODERATOR' ? ['moderate'] : ['user']),
    };

    dbStore.updateUser(targetId, updates);

    // LOG ACTION
    dbStore.addAdminActionLog(
      admin.id,
      `${admin.first_name} ${admin.last_name}`,
      `Alteração de Cargo para ${role}`,
      targetUser.email,
      clientIp
    );

    res.json({ success: true, message: `Cargo do usuário alterado para ${role} com sucesso!` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao alterar cargo do guerreiro.', details: err.message });
  }
});

// Block/Unblock user account (Only Admin)
app.put('/api/admin/users/:id/status', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    const { block } = req.body; // boolean value
    const admin = req.user!;
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

    const targetUser = dbStore.getUserById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Guerreiro não localizado.' });
    }

    const updates: Partial<UserRow> = {
      verification_token: block ? 'BLOCKED' : ''
    };
    dbStore.updateUser(targetId, updates);

    dbStore.addAdminActionLog(
      admin.id,
      `${admin.first_name} ${admin.last_name}`,
      block ? 'Bloqueio de Conta' : 'Desbloqueio de Conta',
      targetUser.email,
      clientIp
    );

    res.json({ success: true, message: block ? 'Guerreiro bloqueado militarmente com sucesso!' : 'Guerreiro desbloqueado com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar status da conta.', details: err.message });
  }
});

// Force administrative toggle of user online state simulating connections/disconnections (Only Admin)
app.put('/api/admin/users/:id/simulate-connection', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    const { is_online } = req.body; // boolean
    const admin = req.user!;
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

    const targetUser = dbStore.getUserById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Guerreiro não localizado.' });
    }

    const updates: Partial<UserRow> = {
      is_online: !!is_online,
    };
    if (is_online) {
      updates.last_login = new Date().toISOString();
    }
    dbStore.updateUser(targetId, updates);

    dbStore.addAdminActionLog(
      admin.id,
      `${admin.first_name} ${admin.last_name}`,
      is_online ? 'Simulação de Conexão' : 'Simulação de Desconexão',
      targetUser.email,
      clientIp
    );

    res.json({ 
      success: true, 
      message: is_online 
        ? `Guerreiro ${targetUser.first_name} agora simulado como ONLINE no Dojo!` 
        : `Guerreiro ${targetUser.first_name} agora simulado como OFFLINE (Desconectado)!` 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao simular conexão.', details: err.message });
  }
});

// Force administrative password reset (Only Admin)
app.put('/api/admin/users/:id/password', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    const { password } = req.body;
    const admin = req.user!;
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'A nova senha deve possuir pelo menos 6 caracteres.' });
    }

    const targetUser = dbStore.getUserById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Guerreiro não localizado.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    dbStore.updateUser(targetId, { password_hash });

    dbStore.addAdminActionLog(
      admin.id,
      `${admin.first_name} ${admin.last_name}`,
      'Redefinição Administrativa de Senha',
      targetUser.email,
      clientIp
    );

    res.json({ success: true, message: 'Senha redefinida com autoridade pelo administrador!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao redefinir senha do guerreiro.', details: err.message });
  }
});

// Force administrative profile corrections (change names or username) (Only Admin)
app.put('/api/admin/users/:id/profile', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    const { first_name, last_name, username } = req.body;
    const admin = req.user!;
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

    const targetUser = dbStore.getUserById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Guerreiro não localizado.' });
    }

    const updates: Partial<UserRow> = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (username !== undefined) {
      const cleanedUsername = username.toLowerCase().replace(/[^a-z0-9.]/g, '');
      if (!cleanedUsername) {
        return res.status(400).json({ success: false, error: 'Formato de username inválido.' });
      }
      const collision = dbStore.getUsers().find(u => u.id !== targetId && u.username?.toLowerCase() === cleanedUsername);
      if (collision) {
        return res.status(400).json({ success: false, error: 'Este username único já está em uso.' });
      }
      updates.username = cleanedUsername;
    }

    dbStore.updateUser(targetId, updates);

    // LOG
    const correctedString = `Correção Cadastral: ${first_name || targetUser.first_name} ${last_name || targetUser.last_name} (@${username || targetUser.username})`;
    dbStore.addAdminActionLog(
      admin.id,
      `${admin.first_name} ${admin.last_name}`,
      correctedString,
      targetUser.email,
      clientIp
    );

    res.json({ success: true, message: 'Correções cadastrais aplicadas com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao aplicar correções cadastrais.', details: err.message });
  }
});

// List audit action logs (Only Admin)
app.get('/api/admin/logs', authenticateJWT as any, authorizeAdmin as any, (req: AuthenticatedRequest, res) => {
  try {
    res.json({ success: true, logs: dbStore.getAdminActionLogs() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao carregar registros de auditoria.', details: err.message });
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
