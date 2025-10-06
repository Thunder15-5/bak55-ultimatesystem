import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY as string
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase env missing')
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
