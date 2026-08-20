import { ADMIN_EMAIL_PRIMARY } from './firebaseService';

export interface CustomerProfile {
  username: string;
  phone: string;
  location: string;
  address: string;
  createdAt?: string;
  loggedInAt?: string;
}

export type ActiveCustomerSession = CustomerProfile;
export type StoredCustomerAccount = CustomerProfile;

interface CustomerRecord extends CustomerProfile {
  password: string;
}

const ACTIVE_CUSTOMER_KEY = 'panchu_active_customer';
const CUSTOMERS_DB_KEY = 'panchu_customers_db';
const GUEST_DETAILS_KEY = 'panchu_guest_saved_details';
const ALL_ADMIN_KEYS = ['panchu_admin', 'isAdmin', 'admin_role', 'panchu_admin_auth', 'adminUser', 'panchu_admin_token'];

/**
 * Checks if a given identifier is an admin email or reserved admin username
 */
export function isUserAdminIdentifier(identifier?: string | null): boolean {
  if (!identifier) return false;
  const normalized = identifier.toLowerCase().trim();
  const adminEmailNorm = ADMIN_EMAIL_PRIMARY.toLowerCase().trim();
  return (
    normalized === adminEmailNorm ||
    normalized === 'admin' ||
    normalized === 'owner' ||
    normalized === 'panchu_admin'
  );
}

/**
 * Security mandate: Ensure NO admin credentials or roles exist in localStorage.
 */
export function purgeAdminFromStorage(): void {
  if (typeof window === 'undefined') return;

  ALL_ADMIN_KEYS.forEach(k => {
    try {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    } catch {
      // ignore
    }
  });

  try {
    const raw = localStorage.getItem(ACTIVE_CUSTOMER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isUserAdminIdentifier(parsed?.username) || isUserAdminIdentifier(parsed?.email)) {
        localStorage.removeItem(ACTIVE_CUSTOMER_KEY);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Retrieve database of local registered customers
 */
function getCustomersDb(): Record<string, CustomerRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOMERS_DB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Persist database of local registered customers
 */
function saveCustomersDb(db: Record<string, CustomerRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOMERS_DB_KEY, JSON.stringify(db));
  } catch (err) {
    console.warn('Customer storage save notice:', err);
  }
}

/**
 * Register a new customer with username and password, with optional phone & location
 */
export function registerCustomer(params: {
  username: string;
  password: string;
  phone?: string;
  location?: string;
  address?: string;
}): { success: boolean; error?: string; customer?: CustomerProfile } {
  const cleanUsername = params.username.trim();
  const cleanPassword = params.password.trim();

  if (!cleanUsername) {
    return { success: false, error: 'Please enter a username.' };
  }

  if (cleanUsername.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters.' };
  }

  if (cleanUsername.length > 30) {
    return { success: false, error: 'Username must be 30 characters or fewer.' };
  }

  if (isUserAdminIdentifier(cleanUsername)) {
    return { success: false, error: 'This username is reserved. Please choose another username.' };
  }

  if (!cleanPassword) {
    return { success: false, error: 'Please enter a password.' };
  }

  if (cleanPassword.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  const db = getCustomersDb();
  const key = cleanUsername.toLowerCase();

  if (db[key]) {
    return { success: false, error: 'Username already taken. Please choose another or sign in.' };
  }

  const newRecord: CustomerRecord = {
    username: cleanUsername,
    password: cleanPassword,
    phone: params.phone?.trim() || '',
    location: params.location?.trim() || '',
    address: params.address?.trim() || '',
    createdAt: new Date().toISOString()
  };

  db[key] = newRecord;
  saveCustomersDb(db);

  const profile: CustomerProfile = {
    username: newRecord.username,
    phone: newRecord.phone,
    location: newRecord.location,
    address: newRecord.address,
    loggedInAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(ACTIVE_CUSTOMER_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Active session save notice:', e);
  }

  purgeAdminFromStorage();
  return { success: true, customer: profile };
}

export const registerCustomerAccount = registerCustomer;

/**
 * Log in customer with username and password
 */
export function loginCustomer(
  username: string,
  password: string
): { success: boolean; error?: string; customer?: CustomerProfile } {
  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: 'Please enter both username and password.' };
  }

  if (isUserAdminIdentifier(cleanUsername)) {
    return { success: false, error: 'This is the Owner account. Please use Owner Login via /admin.' };
  }

  const db = getCustomersDb();
  const key = cleanUsername.toLowerCase();
  const existing = db[key];

  if (!existing) {
    return { success: false, error: 'Account not found. Please check your username or sign up.' };
  }

  if (existing.password !== cleanPassword) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  const profile: CustomerProfile = {
    username: existing.username,
    phone: existing.phone || '',
    location: existing.location || '',
    address: existing.address || '',
    loggedInAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(ACTIVE_CUSTOMER_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Active session save notice:', e);
  }

  purgeAdminFromStorage();
  return { success: true, customer: profile };
}

export const loginCustomerAccount = loginCustomer;

/**
 * Retrieve active customer session
 */
export function getActiveCustomer(): CustomerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_CUSTOMER_KEY);
    if (!raw) return null;
    const parsed: CustomerProfile = JSON.parse(raw);
    if (!parsed || !parsed.username || isUserAdminIdentifier(parsed.username)) {
      purgeAdminFromStorage();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Update active customer profile (phone, location, address, password)
 */
export function updateCustomerProfile(
  username: string,
  updates: {
    phone?: string;
    location?: string;
    address?: string;
    newPassword?: string;
  }
): { success: boolean; error?: string; customer?: CustomerProfile } {
  if (!username) return { success: false, error: 'User not specified.' };

  const db = getCustomersDb();
  const key = username.toLowerCase();
  const existing = db[key];

  if (existing) {
    if (updates.phone !== undefined) existing.phone = updates.phone.trim();
    if (updates.location !== undefined) existing.location = updates.location.trim();
    if (updates.address !== undefined) existing.address = updates.address.trim();
    if (updates.newPassword && updates.newPassword.trim().length >= 4) {
      existing.password = updates.newPassword.trim();
    }
    db[key] = existing;
    saveCustomersDb(db);
  }

  const updatedProfile: CustomerProfile = {
    username: existing?.username || username,
    phone: updates.phone !== undefined ? updates.phone.trim() : (existing?.phone || ''),
    location: updates.location !== undefined ? updates.location.trim() : (existing?.location || ''),
    address: updates.address !== undefined ? updates.address.trim() : (existing?.address || ''),
    loggedInAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(ACTIVE_CUSTOMER_KEY, JSON.stringify(updatedProfile));
  } catch (e) {
    console.warn('Session save notice:', e);
  }

  return { success: true, customer: updatedProfile };
}

export function updateActiveCustomerProfile(updates: {
  phone?: string;
  location?: string;
  address?: string;
  newPassword?: string;
}): CustomerProfile | null {
  const active = getActiveCustomer();
  if (!active) return null;
  const res = updateCustomerProfile(active.username, updates);
  return res.customer || null;
}

/**
 * Log out active customer
 */
export function logoutCustomer(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_CUSTOMER_KEY);
  } catch (err) {
    console.warn('Customer logout notice:', err);
  }
}

export const logoutCustomerAccount = logoutCustomer;

/**
 * Save customer details from checkout for future orders
 */
export function saveCustomerDetailsFromCheckout(details: {
  name?: string;
  phone?: string;
  location?: string;
  address?: string;
}): void {
  const active = getActiveCustomer();
  if (active) {
    updateCustomerProfile(active.username, {
      phone: details.phone || active.phone,
      location: details.location || active.location,
      address: details.address || active.address
    });
  } else if (details.name) {
    try {
      localStorage.setItem(GUEST_DETAILS_KEY, JSON.stringify({
        name: details.name || '',
        phone: details.phone || '',
        location: details.location || '',
        address: details.address || ''
      }));
    } catch {
      // ignore
    }
  }
}

/**
 * Retrieve saved checkout details
 */
export function getSavedCheckoutDetails(): {
  name: string;
  phone: string;
  location: string;
  address: string;
} {
  const active = getActiveCustomer();
  if (active) {
    return {
      name: active.username,
      phone: active.phone || '',
      location: active.location || '',
      address: active.address || ''
    };
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(GUEST_DETAILS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          name: parsed.name || '',
          phone: parsed.phone || '',
          location: parsed.location || '',
          address: parsed.address || ''
        };
      }
    } catch {
      // ignore
    }
  }

  return { name: '', phone: '', location: '', address: '' };
}

/**
 * Fallback helpers
 */
export function saveCustomerAccountToStorage(account: any): boolean {
  if (!account || !account.displayName) return false;
  return registerCustomer({
    username: account.displayName || account.email || 'customer',
    password: 'password123'
  }).success;
}

export const clearSavedCustomerAccount = logoutCustomer;
