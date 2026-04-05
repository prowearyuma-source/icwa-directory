import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type IcwaAgent = {
  id: number
  name: string
  primary_region: string
  icwa_designated_agent: string | null
  icwa_contact_title: string | null
  icwa_phone_1: string | null
  icwa_phone_2: string | null
  icwa_fax: string | null
  icwa_email_1: string | null
  icwa_email_2: string | null
  icwa_street_1: string | null
  icwa_street_2: string | null
  icwa_city: string | null
  icwa_state: string | null
  icwa_zip_code: string | null
  state_full: string | null
  tribe_affiliations: string | null
}
