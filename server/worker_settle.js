import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function settleBets() {
  console.log(`\n🏗️  Bet Settlement Worker - ${new Date().toISOString()}`)
  console.log('================================================\n')

  try {
    // Step 1: Find all matches that have finished
    console.log('1️⃣  Finding finished matches...')
    const { data: finishedMatches, error: matchError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, result, home_team_score, away_team_score')
      .eq('status', 'finished')

    if (matchError) {
      console.error('❌ Error fetching finished matches:', matchError.message)
      return
    }

    if (!finishedMatches || finishedMatches.length === 0) {
      console.log('✅ No finished matches found')
      return
    }

    console.log(`✅ Found ${finishedMatches.length} finished match(es)\n`)

    // Step 2: For each finished match, settle open bets
    let totalBetsSettled = 0
    let totalWinnings = 0

    for (const match of finishedMatches) {
      console.log(`⏳ Settling bets for: ${match.home_team} vs ${match.away_team}`)
      console.log(`   Result: ${match.result} (${match.home_team_score}-${match.away_team_score})`)

      // Find all open bets on this match
      const { data: openBets, error: betsError } = await supabase
        .from('bets')
        .select('id, user_id, stake, odds, selection')
        .eq('match_id', match.id)
        .eq('status', 'open')

      if (betsError) {
        console.error(`   ❌ Error fetching open bets: ${betsError.message}`)
        continue
      }

      if (!openBets || openBets.length === 0) {
        console.log('   No open bets to settle\n')
        continue
      }

      console.log(`   Found ${openBets.length} open bet(s)`)

      // Settle each bet
      for (const bet of openBets) {
        let betResult = 'lost'
        let winnings = 0

        // Determine if bet won or lost based on selection and match result
        if (bet.selection === 'home_team' && match.result === 'home_win') {
          betResult = 'won'
          winnings = bet.stake * bet.odds
        } else if (bet.selection === 'away_team' && match.result === 'away_win') {
          betResult = 'won'
          winnings = bet.stake * bet.odds
        } else if (bet.selection === 'draw' && match.result === 'draw') {
          betResult = 'won'
          winnings = bet.stake * bet.odds
        }

        // Update bet status
        const { error: updateError } = await supabase
          .from('bets')
          .update({
            status: betResult,
            result: betResult,
            winnings: winnings
          })
          .eq('id', bet.id)

        if (updateError) {
          console.error(`   ❌ Error updating bet ${bet.id}: ${updateError.message}`)
          continue
        }

        // If bet won, update user balance
        if (betResult === 'won') {
          const { error: balanceError } = await supabase
            .rpc('add_balance', {
              p_user_id: bet.user_id,
              p_amount: winnings
            })

          if (balanceError) {
            console.error(`   ⚠️  Error updating user balance: ${balanceError.message}`)
          } else {
            console.log(`   ✅ Bet ${bet.id} WON (+${winnings.toFixed(2)})`)
            totalWinnings += winnings
          }
        } else {
          console.log(`   ❌ Bet ${bet.id} LOST (-${bet.stake.toFixed(2)})`)
        }

        totalBetsSettled++
      }

      console.log('')
    }

    console.log('================================================')
    console.log(`📊 Settlement Summary`)
    console.log(`   Total bets settled: ${totalBetsSettled}`)
    console.log(`   Total winnings distributed: ${totalWinnings.toFixed(2)}`)
    console.log(`   Timestamp: ${new Date().toISOString()}`)
    console.log('================================================\n')

  } catch (err) {
    console.error('❌ Settlement worker failed:', err.message)
  }
}

// Run settlement immediately if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  settleBets().then(() => {
    console.log('✅ Settlement complete\n')
    process.exit(0)
  }).catch(err => {
    console.error('❌ Settlement failed:', err)
    process.exit(1)
  })
}

export { settleBets }
