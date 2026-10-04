export type UUID = string
export type Role = 'admin' | 'manager' | 'cashier'
export type RewardMode = 'flat' | 'spin' | 'customer_choice'
export type DiscountType = 'none' | 'birthday' | 'loyalty_flat' | 'loyalty_spin' | 'manual'
export type PaymentMethod = 'cash' | 'card' | 'esewa' | 'khalti' | 'fonepay' | 'bank_transfer' | 'other'
export type SaleStatus = 'completed' | 'voided'

export interface Showroom { id: UUID; name: string; code: string; address: string | null; phone: string | null; is_active: boolean; created_at: string }
export interface StaffProfile { id: UUID; full_name: string; role: Role; showroom_id: UUID | null; is_active: boolean; created_at: string }
export interface LoyaltySettings { id: number; shop_name: string; currency: string; pairs_for_reward: number; reward_mode: RewardMode; reward_flat_discount_pct: number; birthday_enabled: boolean; birthday_coupon_lead_days: number; birthday_applies_to_discounted_items: boolean; updated_at: string; updated_by: UUID | null }
export interface BirthdayDiscountTier { id: UUID; label: string; min_lifetime_spend: number; discount_pct: number }
export interface LoyaltyWheelSegment { id: UUID; label: string; discount_pct: number; weight: number; color: string; sort_order: number; is_active: boolean }
export interface Customer { id: UUID; phone: string; full_name: string; date_of_birth: string | null; dob_year_unknown: boolean; email: string | null; address: string | null; sms_consent: boolean; source: 'showroom' | 'legacy_import' | 'online'; legacy_customer_code: string | null; legacy_spend: number | null; notes: string | null; showroom_id: UUID | null; is_active: boolean; created_by: UUID | null; created_at: string; updated_at: string }
export interface Sale { id: UUID; invoice_no: string; showroom_id: UUID; customer_id: UUID | null; staff_id: UUID; sale_date: string; subtotal: number; discount_type: DiscountType; discount_pct: number; discount_amount: number; total_amount: number; payment_method: PaymentMethod; status: SaleStatus; void_reason: string | null; voided_at: string | null; notes: string | null; created_at: string }
export interface SaleItem { id: UUID; sale_id: UUID; sku: string | null; product_name: string; brand: string | null; category: string | null; size: string | null; quantity: number; unit_price: number; line_total: number; counts_for_loyalty: boolean; discount_eligible: boolean }
export interface LoyaltyLedger { id: UUID; customer_id: UUID; sale_id: UUID | null; pairs_delta: number; reason: 'purchase' | 'void_reversal' | 'legacy_import' | 'manual_adjustment'; note: string | null; created_by: UUID | null; created_at: string }
export interface LoyaltyRedemption { id: UUID; customer_id: UUID; sale_id: UUID; method: 'flat' | 'spin'; discount_pct: number; wheel_segment_id: UUID | null; status: 'applied' | 'reversed'; created_by: UUID | null; created_at: string }
export interface BirthdayCoupon { id: UUID; customer_id: UUID; coupon_code: string; coupon_year: number; discount_pct: number; issued_on: string; valid_on: string; status: 'issued' | 'redeemed' | 'expired' | 'cancelled'; redeemed_at: string | null; redeemed_sale_id: UUID | null; created_at: string }
export interface MessageTemplate { id: UUID; kind: 'welcome' | 'birthday_coupon' | 'reward_ready' | 'custom'; channel: 'sms' | 'viber' | 'whatsapp'; body: string; is_active: boolean }
export interface MessageLog { id: UUID; customer_id: UUID | null; kind: string; channel: string; phone: string; body: string; status: 'queued' | 'sent' | 'failed'; provider_message_id: string | null; error: string | null; related_coupon_id: UUID | null; created_at: string; sent_at: string | null }
export interface LegacyImportStaging { id: UUID; batch_id: UUID; row_number: number; legacy_customer_code: string | null; phone_raw: string | null; full_name: string | null; date_of_birth_raw: string | null; total_pairs: number | null; total_spend: number | null; last_purchase_date: string | null; raw: unknown; status: 'pending' | 'imported' | 'error'; error: string | null; imported_customer_id: UUID | null; created_at: string }
export interface AuditLog { id: UUID; table_name: string; record_id: UUID | null; action: string; actor_id: UUID | null; old_data: unknown; new_data: unknown; created_at: string }

export interface CustomerLoyaltyStatus { customer_id: UUID; cycle_size: number; total_pairs: number; progress_in_cycle: number; pairs_until_reward: number; reward_ready: boolean; completed_cycles: number }
export interface CustomerOverview extends CustomerLoyaltyStatus { id: UUID; phone: string; full_name: string; date_of_birth: string | null; dob_year_unknown: boolean; email: string | null; address: string | null; sms_consent: boolean; source: Customer['source']; is_active: boolean; created_at: string; lifetime_spend: number; visit_count: number; last_purchase_at: string | null; active_coupon_code: string | null; active_coupon_pct: number | null; active_coupon_valid_on: string | null }

export type WheelResult = { out_redemption_id: UUID; out_discount_pct: number; out_segment_id: UUID | null; out_segment_label: string | null }
export type ImportResult = { out_imported: number; out_errors: number }
