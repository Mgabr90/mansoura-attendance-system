import { NextRequest, NextResponse } from 'next/server'
import { getBot } from '@/lib/telegram-bot'
import { prisma } from '@/lib/prisma'

// Webhook endpoint for Telegram bot
export async function POST(request: NextRequest) {
  try {
    // Verify request is from Telegram (optional but recommended)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN
    if (!telegramToken) {
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      )
    }

    // Parse the webhook update
    const update = await request.json()
    
    // Log the webhook for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Telegram webhook received:', JSON.stringify(update, null, 2))
    }

    // Get bot instance and handle the update
    const bot = getBot()
    await bot.handleWebhook(update)

    // Log server activity
    await prisma.serverActivity.create({
      data: {
        type: 'webhook',
        message: `Telegram webhook processed: update_id ${update.update_id}`,
        metadata: { update_id: update.update_id }
      }
    }).catch(err => console.error('Failed to log webhook activity:', err))

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Webhook error:', error)
    
    // Log error to database
    try {
      await prisma.serverActivity.create({
        data: {
          type: 'error',
          message: `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metadata: { error: error instanceof Error ? error.stack : String(error) }
        }
      })
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET requests (for webhook setup verification)
export async function GET() {
  return NextResponse.json({
    message: 'El Mansoura CIH Telegram Bot Webhook',
    status: 'active',
    timestamp: new Date().toISOString()
  })
} 