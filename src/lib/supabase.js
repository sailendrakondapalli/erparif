import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'https://your-project-ref.supabase.co') {
  console.error('❌ VITE_SUPABASE_URL is not configured properly')
  console.error('Please update your .env file with your actual Supabase project URL')
  console.error('Get it from: https://supabase.com/dashboard/project/YOUR-PROJECT/settings/api')
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not configured properly')
  console.error('Please update your .env file with your actual Supabase anon key')
  console.error('Get it from: https://supabase.com/dashboard/project/YOUR-PROJECT/settings/api')
}

// Only create client if we have valid values
let supabase = null
if (supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://your-project-ref.supabase.co' && 
    supabaseAnonKey !== 'your-anon-key-here') {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.error('❌ Supabase client not initialized - check your environment variables')
}

export { supabase }

// Auth helpers
export const auth = {
  signUp: (email, password, userData) => supabase.auth.signUp({ email, password, options: { data: userData } }),
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getUser: () => supabase.auth.getUser(),
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (callback) => supabase.auth.onAuthStateChange(callback),
  resetPassword: (email) => supabase.auth.resetPasswordForEmail(email),
  updatePassword: (password) => supabase.auth.updateUser({ password })
}

// Database helpers with error handling
export const db = {
  // Profiles
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },
  
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Medicines
  getMedicines: async (filters = {}) => {
    let query = supabase
      .from('medicines')
      .select(`
        *,
        medicine_batches!inner(
          id,
          batch_number,
          expiry_date,
          current_quantity,
          mrp,
          selling_price
        )
      `)
      .eq('status', 'active')
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%, generic_name.ilike.%${filters.search}%`)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Stock movements
  createStockMovement: async (movement) => {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movement)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Sales
  createSale: async (saleData, saleItems) => {
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single()
    
    if (saleError) throw saleError

    // Add sale items
    const itemsWithSaleId = saleItems.map(item => ({
      ...item,
      sale_id: sale.id
    }))

    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .insert(itemsWithSaleId)
      .select()

    if (itemsError) throw itemsError

    return { sale, items }
  }
}

// Real-time subscriptions
export const subscriptions = {
  onStockChange: (callback) => {
    return supabase
      .channel('stock_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicine_batches' }, callback)
      .subscribe()
  },
  
  onSalesChange: (callback) => {
    return supabase
      .channel('sales_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, callback)
      .subscribe()
  }
}