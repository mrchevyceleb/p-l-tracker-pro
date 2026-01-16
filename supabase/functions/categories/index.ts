import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'
import { getUserId } from '../_shared/auth.ts'
import { Category } from '../_shared/types.ts'

const SEED_CATEGORIES: Omit<Category, 'id' | 'user_id'>[] = [
  { name: 'Sales', type: 'income', deductibility_percentage: 0 },
  { name: 'Consulting', type: 'income', deductibility_percentage: 0 },
  { name: 'Freelance', type: 'income', deductibility_percentage: 0 },
  { name: 'Other Income', type: 'income', deductibility_percentage: 0 },
  { name: 'Software & Tools', type: 'expense', deductibility_percentage: 100 },
  { name: 'Office Supplies', type: 'expense', deductibility_percentage: 100 },
  { name: 'Professional Services', type: 'expense', deductibility_percentage: 100 },
  { name: 'Marketing', type: 'expense', deductibility_percentage: 100 },
  { name: 'Travel', type: 'expense', deductibility_percentage: 100 },
  { name: 'Meals & Entertainment', type: 'expense', deductibility_percentage: 50 },
  { name: 'Other Expense', type: 'expense', deductibility_percentage: 100 },
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const userId = await getUserId(req)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method

    // GET /categories - List all categories
    if (method === 'GET' && pathParts.length === 1) {
      let { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name')

      if (error) throw error

      // Seed default categories if none exist
      if (!data || data.length === 0) {
        const seedPayload = SEED_CATEGORIES.map((cat) => ({
          ...cat,
          user_id: userId,
        }))

        const { data: seeded, error: seedError } = await supabase
          .from('categories')
          .insert(seedPayload)
          .select()

        if (seedError) throw seedError
        data = seeded
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /categories/:id - Get single category
    if (method === 'GET' && pathParts.length === 2) {
      const id = pathParts[1]
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /categories - Create new category
    if (method === 'POST' && pathParts.length === 1) {
      const body = await req.json()
      const payload = { ...body, user_id: userId }

      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /categories/:id - Update category
    if (method === 'PUT' && pathParts.length === 2) {
      const id = pathParts[1]
      const updates = await req.json()
      delete updates.id
      delete updates.user_id

      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // DELETE /categories/:id - Delete category
    if (method === 'DELETE' && pathParts.length === 2) {
      const id = pathParts[1]

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes('authorization') ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
