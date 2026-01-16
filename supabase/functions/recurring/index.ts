import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'
import { getUserId } from '../_shared/auth.ts'
import { Frequency } from '../_shared/types.ts'

function generateUUID(): string {
  return crypto.randomUUID()
}

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

    // GET /recurring - List all recurring series
    if (method === 'GET' && pathParts.length === 1) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .not('recurring_id', 'is', null)
        .order('date', { ascending: true })

      if (error) throw error

      // Group by recurring_id
      const seriesMap = new Map()
      for (const tx of data || []) {
        if (tx.recurring_id) {
          if (!seriesMap.has(tx.recurring_id)) {
            seriesMap.set(tx.recurring_id, [])
          }
          seriesMap.get(tx.recurring_id).push(tx)
        }
      }

      const series = Array.from(seriesMap.entries()).map(([recurring_id, transactions]) => ({
        recurring_id,
        name: transactions[0]?.name,
        type: transactions[0]?.type,
        amount: transactions[0]?.amount,
        category_id: transactions[0]?.category_id,
        transaction_count: transactions.length,
        first_date: transactions[0]?.date,
        last_date: transactions[transactions.length - 1]?.date,
      }))

      return new Response(JSON.stringify(series), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /recurring/:recurringId - Get all transactions in a series
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] !== 'import') {
      const recurringId = pathParts[1]
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('recurring_id', recurringId)
        .order('date', { ascending: true })

      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('Recurring series not found')
      }

      return new Response(
        JSON.stringify({
          recurring_id: recurringId,
          transactions: data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // POST /recurring - Create new recurring series
    if (method === 'POST' && pathParts.length === 1) {
      const body = await req.json()
      const { transaction: baseTx, frequency, endDate } = body

      const recurringId = generateUUID()
      const newTransactions: any[] = []
      const start = new Date(baseTx.date)
      const end = new Date(endDate)
      let current = new Date(start)

      while (current <= end) {
        newTransactions.push({
          ...baseTx,
          user_id: userId,
          date: current.toISOString().slice(0, 10),
          recurring_id: recurringId,
        })

        if (frequency === 'weekly') {
          current.setDate(current.getDate() + 7)
        } else if (frequency === 'monthly') {
          current.setMonth(current.getMonth() + 1)
        } else if (frequency === 'yearly') {
          current.setFullYear(current.getFullYear() + 1)
        }
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(newTransactions)
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({
          recurring_id: recurringId,
          created: data?.length || 0,
          transactions: data,
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // PUT /recurring/:recurringId/end-date - Update end date
    if (
      method === 'PUT' &&
      pathParts.length === 3 &&
      pathParts[2] === 'end-date'
    ) {
      const recurringId = pathParts[1]
      const body = await req.json()
      const { endDate } = body

      if (!endDate) {
        throw new Error('endDate is required')
      }

      const deadline = new Date(endDate)

      // Get all transactions in the series
      const { data: seriesTxs, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('recurring_id', recurringId)
        .eq('user_id', userId)
        .order('date', { ascending: true })

      if (fetchError || !seriesTxs || seriesTxs.length === 0) {
        throw new Error('Recurring series not found')
      }

      // Delete future transactions beyond the new end date
      const toDeleteIds = seriesTxs
        .filter((t: any) => new Date(t.date) > deadline)
        .map((t: any) => t.id)

      if (toDeleteIds.length > 0) {
        await supabase.from('transactions').delete().in('id', toDeleteIds)
      }

      // Extend if needed
      const validTxs = seriesTxs
        .filter((t: any) => new Date(t.date) <= deadline)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

      let addedCount = 0
      let addedTransactions: any[] = []

      if (validTxs.length > 0) {
        const lastTx = validTxs[validTxs.length - 1]
        let intervalDays = 30

        if (validTxs.length >= 2) {
          const t1 = new Date(validTxs[validTxs.length - 2].date)
          const t2 = new Date(validTxs[validTxs.length - 1].date)
          intervalDays = Math.round(
            (t2.getTime() - t1.getTime()) / (1000 * 3600 * 24)
          )
        }

        if (intervalDays < 7) intervalDays = 7

        let current = new Date(lastTx.date)
        current.setDate(current.getDate() + intervalDays)

        const newPayloads = []
        while (current <= deadline) {
          newPayloads.push({
            user_id: userId,
            date: current.toISOString().slice(0, 10),
            name: lastTx.name,
            type: lastTx.type,
            amount: lastTx.amount,
            category_id: lastTx.category_id,
            notes: lastTx.notes,
            recurring_id: recurringId,
          })
          current.setDate(current.getDate() + intervalDays)
        }

        if (newPayloads.length > 0) {
          const { data: inserted, error: insertError } = await supabase
            .from('transactions')
            .insert(newPayloads)
            .select()

          if (!insertError && inserted) {
            addedCount = inserted.length
            addedTransactions = inserted
          }
        }
      }

      return new Response(
        JSON.stringify({
          recurring_id: recurringId,
          deleted: toDeleteIds.length,
          added: addedCount,
          addedTransactions,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // POST /recurring/:recurringId/end - End subscription
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'end') {
      const recurringId = pathParts[1]
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: seriesTxs, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('recurring_id', recurringId)
        .eq('user_id', userId)

      if (fetchError || !seriesTxs || seriesTxs.length === 0) {
        throw new Error('Recurring series not found')
      }

      const toDeleteIds = seriesTxs
        .filter((t: any) => new Date(t.date) > today)
        .map((t: any) => t.id)

      if (toDeleteIds.length > 0) {
        await supabase.from('transactions').delete().in('id', toDeleteIds)
      }

      return new Response(
        JSON.stringify({
          recurring_id: recurringId,
          deleted_future_transactions: toDeleteIds.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // PUT /recurring/:recurringId - Update all transactions in series
    if (method === 'PUT' && pathParts.length === 2) {
      const recurringId = pathParts[1]
      const updates = await req.json()

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('recurring_id', recurringId)
        .eq('user_id', userId)
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({
          recurring_id: recurringId,
          updated: data?.length || 0,
          transactions: data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // DELETE /recurring/:recurringId - Delete entire series
    if (method === 'DELETE' && pathParts.length === 2) {
      const recurringId = pathParts[1]

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('recurring_id', recurringId)
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
