import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY || ''

if (!resendApiKey) {
  console.error('Missing Resend API key')
}

export const resend = new Resend(resendApiKey)

