import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'
import { getUserId } from '../_shared/auth.ts'

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

    // GET /transactions - List all transactions
    if (method === 'GET' && pathParts.length === 1) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /transactions/:id - Get single transaction
    if (method === 'GET' && pathParts.length === 2) {
      const id = pathParts[1]
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /transactions - Create new transaction
    if (method === 'POST' && pathParts.length === 1) {
      const body = await req.json()
      const payload = { ...body, user_id: userId }

      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /transactions/import - Bulk import
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'import') {
      const body = await req.json()
      const transactions = body.transactions

      if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new Error('transactions array is required')
      }

      const payloads = transactions.map((tx: any) => ({
        ...tx,
        user_id: userId,
      }))

      const { data, error } = await supabase
        .from('transactions')
        .insert(payloads)
        .select()

      if (error) throw error
      return new Response(
        JSON.stringify({ imported: data?.length || 0, transactions: data }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // PUT /transactions/:id - Update transaction
    if (method === 'PUT' && pathParts.length === 2) {
      const id = pathParts[1]
      const updates = await req.json()
      delete updates.id
      delete updates.user_id

      const { data, error } = await supabase
        .from('transactions')
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

    // DELETE /transactions/:id - Delete transaction
    if (method === 'DELETE' && pathParts.length === 2) {
      const id = pathParts[1]

      const { error } = await supabase
        .from('transactions')
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
