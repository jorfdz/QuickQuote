# QuickQuote Database Schema Reference

Complete field-level reference for all 53 tables in the QuickQuote Supabase schema. This document consolidates:

- `supabase/migrations/001_complete_schema.sql` — base schema
- `supabase/migrations/002_created_updated_by.sql` — audit columns on business tables
- `supabase/migrations/003_junction_table_audit_fields.sql` — audit columns on junction tables

Use this as the authoritative source when generating seed / INSERT scripts.

---

## Conventions

- `PK` = primary key • `FK` = foreign key • `UQ` = unique • `NN` = not null
- All timestamps are `timestamptz` (PostgreSQL timestamp with time zone)
- `numeric(p,s)` = precision `p`, scale `s`
- JSON columns are `jsonb`
- Columns annotated *(added in 002)* or *(added in 003)* came from later migrations

---

## 1. IDENTITY, TENANCY & AUDIT

### `profiles`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, FK→auth.users.id ON DELETE CASCADE |
| email | text | NN |
| full_name | text | |
| first_name | text | |
| last_name | text | |
| phone | text | |
| avatar_url | text | |
| default_organization_id | uuid | |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `organizations`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| name | text | NN |
| slug | text | UQ, NN |
| status | text | NN, DEFAULT 'active', CHECK in ('active','suspended','deactivated') |
| owner_profile_id | uuid | NN, FK→profiles.id |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `organization_memberships`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| profile_id | uuid | NN, FK→profiles.id ON DELETE CASCADE |
| role | text | NN, DEFAULT 'viewer', CHECK in ('owner','admin','manager','csr','sales','estimator','production','accounting','viewer') |
| status | text | NN, DEFAULT 'active', CHECK in ('active','suspended','removed') |
| joined_at | timestamptz | NN, DEFAULT now() |
| | | UQ(organization_id, profile_id) |

### `organization_invitations`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| email | text | NN |
| role | text | NN, DEFAULT 'viewer', CHECK same role list as memberships |
| token_hash | text | NN |
| invited_by | uuid | NN, FK→profiles.id |
| expires_at | timestamptz | NN |
| accepted_at | timestamptz | |
| revoked_at | timestamptz | |
| created_at | timestamptz | NN, DEFAULT now() |

### `audit_logs`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | FK→organizations.id ON DELETE SET NULL |
| actor_id | uuid | FK→profiles.id |
| entity_type | text | NN |
| entity_id | uuid | |
| action | text | NN |
| summary | text | |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NN, DEFAULT now() |

### `subscription_plans` *(system-wide, not tenant-scoped)*
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| name | text | NN |
| slug | text | UQ, NN |
| max_users | int | |
| max_storage_gb | numeric(8,2) | |
| features | jsonb | DEFAULT '{}' |
| price_monthly | numeric(10,2) | |
| price_yearly | numeric(10,2) | |
| is_active | boolean | NN, DEFAULT true |
| created_at | timestamptz | NN, DEFAULT now() |

### `subscription_accounts`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, UQ, FK→organizations.id ON DELETE CASCADE |
| plan_id | uuid | FK→subscription_plans.id |
| status | text | NN, DEFAULT 'trial', CHECK in ('trial','active','past_due','canceled','suspended') |
| trial_ends_at | timestamptz | |
| current_period_start | timestamptz | |
| current_period_end | timestamptz | |
| external_customer_id | text | |
| external_subscription_id | text | |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

---

## 2. CONFIGURATION & COUNTERS

### `document_counters`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| document_type | text | NN, CHECK in ('quote','order','invoice','purchase_order','customer') |
| prefix | text | NN, DEFAULT '' |
| current_value | bigint | NN, DEFAULT 0 |
| padding | int | NN, DEFAULT 6 |
| | | UQ(organization_id, document_type) |

### `company_settings` *(one row per org)*
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, UQ, FK→organizations.id ON DELETE CASCADE |
| name | text | |
| email | text | |
| phone | text | |
| address | text | |
| city | text | |
| state | text | |
| zip | text | |
| website | text | |
| tagline | text | |
| primary_brand_color | text | DEFAULT '#2563eb' |
| default_tax_rate | numeric(6,4) | DEFAULT 0.07 |
| default_markup | numeric(6,4) | DEFAULT 0.45 |
| default_labor_rate | numeric(8,2) | DEFAULT 45.00 |
| quote_valid_days | int | DEFAULT 45 |
| currency | text | DEFAULT 'USD' |
| timezone | text | DEFAULT 'America/New_York' |
| default_bleed | numeric(6,3) | DEFAULT 0.125 |
| default_gutter | numeric(6,3) | DEFAULT 0 |
| default_bleed_wide | numeric(6,3) | DEFAULT 0 |
| default_gutter_wide | numeric(6,3) | DEFAULT 0 |
| open_links_in_new_tab | boolean | DEFAULT true |
| custom_terms | text[] | DEFAULT '{}' |
| custom_delivery_methods | text[] | DEFAULT '{}' |
| google_maps_api_key | text | |
| email_settings | jsonb | DEFAULT '{}' |
| logo_file_id | uuid | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `document_templates`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| template_type | text | NN, CHECK in ('quote','order','work_order','invoice','purchase_order') |
| body | text | NN, DEFAULT '' |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |
| | | UQ(organization_id, template_type) |

---

## 3. CUSTOMERS & CONTACTS

### `customers`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| customer_number | text | NN |
| name | text | NN |
| company | text | |
| email | text | |
| phone | text | |
| address | text | |
| city | text | |
| state | text | |
| zip | text | |
| country | text | DEFAULT 'US' |
| tax_exempt | boolean | NN, DEFAULT false |
| tax_id | text | |
| notes | text | |
| tags | text[] | DEFAULT '{}' |
| source | text | |
| external_id | text | |
| website | text | |
| sales_historically | numeric(12,2) | DEFAULT 0 |
| sales_12m | numeric(12,2) | DEFAULT 0 |
| account_number | text | |
| terms | text | |
| delivery_method | text | |
| third_party_shipping | boolean | DEFAULT false |
| third_party_carrier_account | text | |
| default_buyer_contact_id | uuid | |
| default_payer_contact_id | uuid | |
| created_by | uuid | FK→profiles.id |
| updated_by | uuid | FK→profiles.id |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |
| | | UQ(organization_id, customer_number) |

### `customer_shipping_addresses`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| customer_id | uuid | NN, FK→customers.id ON DELETE CASCADE |
| label | text | |
| address | text | |
| city | text | |
| state | text | |
| zip | text | |
| country | text | DEFAULT 'US' |
| is_default | boolean | NN, DEFAULT false |
| notes | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `contacts`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| customer_id | uuid | NN, FK→customers.id ON DELETE CASCADE |
| first_name | text | NN |
| last_name | text | NN |
| email | text | |
| phone | text | |
| mobile | text | |
| title | text | |
| is_primary | boolean | NN, DEFAULT false |
| notes | text | |
| external_id | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

---

## 4. VENDORS & PURCHASING

### `vendors`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| email | text | |
| phone | text | |
| website | text | |
| address | text | |
| city | text | |
| state | text | |
| zip | text | |
| account_number | text | |
| payment_terms | text | |
| notes | text | |
| tags | text[] | DEFAULT '{}' |
| is_outsourced_production | boolean | NN, DEFAULT false |
| created_by | uuid | FK→profiles.id |
| updated_by | uuid | FK→profiles.id |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `purchase_orders`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| number | text | NN |
| vendor_id | uuid | FK→vendors.id |
| order_id | uuid | FK→orders.id |
| status | text | NN, DEFAULT 'draft', CHECK in ('draft','sent','acknowledged','received','partial','canceled') |
| subtotal | numeric(12,2) | NN, DEFAULT 0 |
| tax | numeric(12,2) | NN, DEFAULT 0 |
| total | numeric(12,2) | NN, DEFAULT 0 |
| notes | text | |
| expected_date | date | |
| received_date | date | |
| sent_at | timestamptz | |
| acknowledged_at | timestamptz | |
| created_by | uuid | FK→profiles.id |
| updated_by | uuid | FK→profiles.id |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |
| | | UQ(organization_id, number) |

### `purchase_order_items`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| purchase_order_id | uuid | NN, FK→purchase_orders.id ON DELETE CASCADE |
| description | text | |
| quantity | numeric(10,2) | NN, DEFAULT 1 |
| unit | text | |
| unit_cost | numeric(12,4) | NN, DEFAULT 0 |
| total | numeric(12,4) | NN, DEFAULT 0 |
| order_item_id | uuid | |
| received_quantity | numeric(10,2) | DEFAULT 0 |
| position | int | NN, DEFAULT 0 |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |

---

## 5. QUOTES

### `quotes`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| number | text | NN |
| status | text | NN, DEFAULT 'pending', CHECK in ('pending','hot','cold','won','lost') |
| customer_id | uuid | FK→customers.id |
| customer_name | text | |
| contact_id | uuid | FK→contacts.id |
| contact_name | text | |
| title | text | |
| description | text | |
| subtotal | numeric(12,2) | NN, DEFAULT 0 |
| tax_rate | numeric(6,4) | NN, DEFAULT 0 |
| tax_amount | numeric(12,2) | NN, DEFAULT 0 |
| total | numeric(12,2) | NN, DEFAULT 0 |
| quote_date | date | |
| valid_until | date | |
| csr_id | uuid | FK→profiles.id |
| sales_id | uuid | FK→profiles.id |
| notes | text | |
| internal_notes | text | |
| tags | text[] | DEFAULT '{}' |
| converted_to_order_id | uuid | |
| source | text | |
| ai_prompt | text | |
| status_changed_at | timestamptz | |
| bill_to_name | text | |
| bill_to_address | text | |
| bill_to_city | text | |
| bill_to_state | text | |
| bill_to_zip | text | |
| bill_to_country | text | |
| ship_to_same_as_bill | boolean | DEFAULT true |
| ship_to_name | text | |
| ship_to_address | text | |
| ship_to_city | text | |
| ship_to_state | text | |
| ship_to_zip | text | |
| ship_to_country | text | |
| ship_to_notes | text | |
| delivery_method | text | |
| terms | text | |
| created_by | uuid | FK→profiles.id |
| updated_by | uuid | FK→profiles.id |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |
| | | UQ(organization_id, number) |

### `quote_line_items`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| quote_id | uuid | NN, FK→quotes.id ON DELETE CASCADE |
| position | int | NN, DEFAULT 0 |
| product_family | text | |
| description | text | |
| quantity | int | NN, DEFAULT 1 |
| unit | text | |
| width | numeric(10,4) | |
| height | numeric(10,4) | |
| material_id | uuid | |
| material_name | text | |
| material_cost | numeric(12,4) | DEFAULT 0 |
| equipment_id | uuid | |
| equipment_name | text | |
| run_time | numeric(8,2) | |
| equipment_cost | numeric(12,4) | DEFAULT 0 |
| labor_hours | numeric(8,2) | DEFAULT 0 |
| labor_rate | numeric(8,2) | DEFAULT 0 |
| labor_cost | numeric(12,4) | DEFAULT 0 |
| vendor_id | uuid | |
| vendor_cost | numeric(12,4) | DEFAULT 0 |
| setup_cost | numeric(12,4) | DEFAULT 0 |
| additional_cost | numeric(12,4) | DEFAULT 0 |
| total_cost | numeric(12,4) | DEFAULT 0 |
| markup | numeric(8,4) | DEFAULT 0 |
| sell_price | numeric(12,4) | DEFAULT 0 |
| notes | text | |
| ups_per_sheet | int | |
| sheet_size | text | |
| template_id | uuid | |
| color_mode | text | |
| sides | text | |
| folding_type | text | |
| drilling_type | text | |
| cutting_enabled | boolean | DEFAULT false |
| sheets_per_stack | int | |
| product_id | uuid | |
| product_name | text | |
| category_name | text | |
| pricing_context | jsonb | DEFAULT '{}' |
| is_multi_part | boolean | DEFAULT false |
| multi_part_name | text | |
| multi_part_description | text | |
| parent_line_item_id | uuid | FK→quote_line_items.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

---

## 6. ORDERS

### `orders`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| number | text | NN |
| status | text | NN, DEFAULT 'in_progress', CHECK in ('in_progress','on_hold','completed','canceled') |
| quote_id | uuid | FK→quotes.id |
| quote_number | text | |
| customer_id | uuid | FK→customers.id |
| customer_name | text | |
| contact_id | uuid | FK→contacts.id |
| contact_name | text | |
| title | text | |
| description | text | |
| subtotal | numeric(12,2) | NN, DEFAULT 0 |
| tax_rate | numeric(6,4) | NN, DEFAULT 0 |
| tax_amount | numeric(12,2) | NN, DEFAULT 0 |
| total | numeric(12,2) | NN, DEFAULT 0 |
| due_date | date | |
| ship_date | date | |
| csr_id | uuid | FK→profiles.id |
| sales_id | uuid | FK→profiles.id |
| workflow_id | uuid | |
| current_stage_id | text | |
| tracking_mode | text | NN, DEFAULT 'order', CHECK in ('order','item') |
| notes | text | |
| internal_notes | text | |
| po_number | text | |
| invoice_id | uuid | |
| bill_to_name | text | |
| bill_to_address | text | |
| bill_to_city | text | |
| bill_to_state | text | |
| bill_to_zip | text | |
| bill_to_country | text | |
| ship_to_same_as_bill | boolean | DEFAULT true |
| ship_to_name | text | |
| ship_to_address | text | |
| ship_to_city | text | |
| ship_to_state | text | |
| ship_to_zip | text | |
| ship_to_country | text | |
| ship_to_notes | text | |
| delivery_method | text | |
| terms | text | |
| created_by | uuid | FK→profiles.id |
| updated_by | uuid | FK→profiles.id |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |
| | | UQ(organization_id, number) |

### `order_line_items`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| order_id | uuid | NN, FK→orders.id ON DELETE CASCADE |
| position | int | NN, DEFAULT 0 |
| product_family | text | |
| description | text | |
| quantity | int | NN, DEFAULT 1 |
| unit | text | |
| width | numeric(10,4) | |
| height | numeric(10,4) | |
| material_id | uuid | |
| material_name | text | |
| material_cost | numeric(12,4) | DEFAULT 0 |
| equipment_id | uuid | |
| equipment_name | text | |
| run_time | numeric(8,2) | |
| equipment_cost | numeric(12,4) | DEFAULT 0 |
| labor_hours | numeric(8,2) | DEFAULT 0 |
| labor_rate | numeric(8,2) | DEFAULT 0 |
| labor_cost | numeric(12,4) | DEFAULT 0 |
| vendor_id | uuid | |
| vendor_cost | numeric(12,4) | DEFAULT 0 |
| setup_cost | numeric(12,4) | DEFAULT 0 |
| additional_cost | numeric(12,4) | DEFAULT 0 |
| total_cost | numeric(12,4) | DEFAULT 0 |
| markup | numeric(8,4) | DEFAULT 0 |
| sell_price | numeric(12,4) | DEFAULT 0 |
| notes | text | |
| ups_per_sheet | int | |
| sheet_size | text | |
| template_id | uuid | |
| color_mode | text | |
| sides | text | |
| folding_type | text | |
| drilling_type | text | |
| cutting_enabled | boolean | DEFAULT false |
| sheets_per_stack | int | |
| product_id | uuid | |
| product_name | text | |
| category_name | text | |
| pricing_context | jsonb | DEFAULT '{}' |
| is_multi_part | boolean | DEFAULT false |
| multi_part_name | text | |
| multi_part_description | text | |
| parent_line_item_id | uuid | FK→order_line_items.id ON DELETE CASCADE |
| workflow_stage_id | text | |
| assigned_user_id | uuid | FK→profiles.id |
| completed_at | timestamptz | |
| time_spent | numeric(8,2) | |
| production_notes | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

---

## 7. INVOICES

### `invoices`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| number | text | NN |
| status | text | NN, DEFAULT 'draft', CHECK in ('draft','sent','posted','paid','overdue','void') |
| customer_id | uuid | FK→customers.id |
| customer_name | text | |
| subtotal | numeric(12,2) | NN, DEFAULT 0 |
| tax_rate | numeric(6,4) | NN, DEFAULT 0 |
| tax_amount | numeric(12,2) | NN, DEFAULT 0 |
| total | numeric(12,2) | NN, DEFAULT 0 |
| due_date | date | |
| paid_date | date | |
| paid_amount | numeric(12,2) | DEFAULT 0 |
| notes | text | |
| created_by | uuid | FK→profiles.id |
| updated_by | uuid | FK→profiles.id |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |
| | | UQ(organization_id, number) |

### `invoice_line_items`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| invoice_id | uuid | NN, FK→invoices.id ON DELETE CASCADE |
| order_id | uuid | FK→orders.id |
| order_item_id | uuid | |
| description | text | |
| quantity | numeric(10,2) | NN, DEFAULT 1 |
| unit | text | |
| unit_price | numeric(12,4) | NN, DEFAULT 0 |
| total | numeric(12,4) | NN, DEFAULT 0 |
| position | int | NN, DEFAULT 0 |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |

### `invoice_orders` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| invoice_id | uuid | NN, FK→invoices.id ON DELETE CASCADE |
| order_id | uuid | NN, FK→orders.id |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(invoice_id, order_id) |

---

## 8. WORKFLOWS / PRODUCTION

### `workflows`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| is_active | boolean | NN, DEFAULT true |
| is_default | boolean | NN, DEFAULT false |
| product_families | text[] | DEFAULT '{}' |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `workflow_stages`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| workflow_id | uuid | NN, FK→workflows.id ON DELETE CASCADE |
| name | text | NN |
| sort_order | int | NN, DEFAULT 0 |
| color | text | DEFAULT '#6B7280' |
| is_complete | boolean | NN, DEFAULT false |
| default_assignee_id | uuid | FK→profiles.id |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `tracking_devices`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| code | text | NN |
| description | text | |
| workflow_id | uuid | FK→workflows.id |
| stage_id | uuid | FK→workflow_stages.id |
| is_active | boolean | NN, DEFAULT true |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |
| | | UQ(organization_id, code) |

---

## 9. PRICING — CATEGORIES & PRODUCTS

### `pricing_categories`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| sort_order | int | NN, DEFAULT 0 |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `pricing_products`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| aliases | text[] | DEFAULT '{}' |
| default_quantity | int | |
| default_material_id | uuid | |
| default_material_name | text | |
| default_final_size | text | |
| default_final_width | numeric(10,4) | |
| default_final_height | numeric(10,4) | |
| default_equipment_id | uuid | |
| default_equipment_name | text | |
| default_color | text | |
| default_sides | text | |
| default_folding | text | |
| is_template | boolean | DEFAULT false |
| default_finishing_ids | uuid[] | DEFAULT '{}' |
| default_pricing_context | jsonb | DEFAULT '{}' |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `pricing_product_categories` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| product_id | uuid | NN, FK→pricing_products.id ON DELETE CASCADE |
| category_id | uuid | NN, FK→pricing_categories.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(product_id, category_id) |

---

## 10. PRICING — EQUIPMENT & MAINTENANCE

### `pricing_equipment`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| category_applies | text | |
| color_capability | text | |
| cost_unit | text | CHECK in ('per_click','per_sqft') |
| cost_type | text | CHECK in ('cost_only','cost_plus_time','time_only') |
| markup_multiplier | numeric(8,4) | |
| unit_cost | numeric(12,6) | |
| color_unit_cost | numeric(12,6) | |
| black_unit_cost | numeric(12,6) | |
| color_tiers | jsonb | DEFAULT '[]' |
| black_tiers | jsonb | DEFAULT '[]' |
| sqft_tiers | jsonb | DEFAULT '[]' |
| initial_setup_fee | numeric(12,4) | DEFAULT 0 |
| units_per_hour | numeric(10,2) | |
| time_cost_per_hour | numeric(10,2) | |
| time_cost_markup | numeric(8,4) | |
| image_file_id | uuid | |
| markup_type | text | |
| use_pricing_tiers | boolean | DEFAULT false |
| auto_add_category_ids | uuid[] | DEFAULT '{}' |
| maintenance_vendor_id | uuid | |
| sort_order | int | NN, DEFAULT 0 |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `maintenance_records`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| equipment_id | uuid | NN, FK→pricing_equipment.id ON DELETE CASCADE |
| scheduled_on | date | |
| service_date | date | |
| serviced_by_vendor_id | uuid | FK→vendors.id |
| serviced_by_vendor_name | text | |
| description | text | |
| status | text | CHECK in ('Requested','Scheduled','Completed','Canceled') |
| notes | text | |
| next_maintenance_date | date | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |

---

## 11. PRICING — MATERIALS

### `pricing_materials`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| material_type | text | CHECK in ('paper','roll_media','rigid_substrate','blanks') |
| name | text | NN |
| size | text | |
| size_width | numeric(10,4) | |
| size_height | numeric(10,4) | |
| pricing_model | text | CHECK in ('cost_per_m','cost_per_unit','cost_per_sqft') |
| price_per_m | numeric(12,4) | |
| cost_per_unit | numeric(12,6) | |
| cost_per_sqft | numeric(12,6) | |
| roll_cost | numeric(12,4) | |
| roll_length | numeric(10,2) | |
| pricing_tiers | jsonb | DEFAULT '[]' |
| minimum_charge | numeric(12,4) | |
| markup_type | text | CHECK in ('percent','multiplier','profit_percent') |
| markup | numeric(8,4) | |
| is_favorite | boolean | DEFAULT false |
| use_count | int | DEFAULT 0 |
| image_file_id | uuid | |
| description | text | |
| vendor_name | text | |
| vendor_id | uuid | |
| vendor_material_id | text | |
| vendor_contact_name | text | |
| vendor_contact_title | text | |
| vendor_sales_rep | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `material_groups`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `material_group_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| material_id | uuid | NN, FK→pricing_materials.id ON DELETE CASCADE |
| group_id | uuid | NN, FK→material_groups.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(material_id, group_id) |

### `material_category_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| material_id | uuid | NN, FK→pricing_materials.id ON DELETE CASCADE |
| category_id | uuid | NN, FK→pricing_categories.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(material_id, category_id) |

### `material_product_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| material_id | uuid | NN, FK→pricing_materials.id ON DELETE CASCADE |
| product_id | uuid | NN, FK→pricing_products.id ON DELETE CASCADE |
| is_favorite | boolean | DEFAULT false |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(material_id, product_id) |

### `material_group_categories` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| group_id | uuid | NN, FK→material_groups.id ON DELETE CASCADE |
| category_id | uuid | NN, FK→pricing_categories.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(group_id, category_id) |

### `material_change_history`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| material_id | uuid | FK→pricing_materials.id ON DELETE SET NULL |
| material_name | text | |
| action | text | NN, CHECK in ('created','updated','deleted') |
| changes | jsonb | DEFAULT '[]' |
| user_id | uuid | FK→profiles.id |
| user_name | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |

---

## 12. PRICING — FINISHING

### `pricing_finishing`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| cost_type | text | |
| charge_basis | text | |
| perimeter_mode | text | |
| perimeter_interval_inches | numeric(8,2) | |
| unit_cost | numeric(12,6) | |
| hourly_cost | numeric(10,2) | |
| output_per_hour | numeric(10,2) | |
| initial_setup_fee | numeric(12,4) | DEFAULT 0 |
| markup_percent | numeric(8,4) | |
| minimum_charge | numeric(12,4) | |
| is_fixed_charge | boolean | DEFAULT false |
| fixed_charge_amount | numeric(12,4) | |
| fixed_charge_cost | numeric(12,4) | |
| sheets_per_stack | int | |
| stacks_per_hour | numeric(10,2) | |
| pricing_mode | text | CHECK in ('cost_markup','rate_card','fixed') |
| sell_rate | numeric(12,6) | |
| sell_rate_tiers | jsonb | DEFAULT '[]' |
| auto_add_category_ids | uuid[] | DEFAULT '{}' |
| notes | text | |
| sort_order | int | NN, DEFAULT 0 |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `finishing_groups`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `finishing_group_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| finishing_id | uuid | NN, FK→pricing_finishing.id ON DELETE CASCADE |
| group_id | uuid | NN, FK→finishing_groups.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(finishing_id, group_id) |

### `finishing_category_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| finishing_id | uuid | NN, FK→pricing_finishing.id ON DELETE CASCADE |
| category_id | uuid | NN, FK→pricing_categories.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(finishing_id, category_id) |

### `finishing_product_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| finishing_id | uuid | NN, FK→pricing_finishing.id ON DELETE CASCADE |
| product_id | uuid | NN, FK→pricing_products.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(finishing_id, product_id) |

---

## 13. PRICING — LABOR

### `pricing_labor`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| charge_basis | text | CHECK in ('per_hour','per_sqft','per_unit','per_1000','flat') |
| hourly_cost | numeric(10,2) | |
| initial_setup_fee | numeric(12,4) | DEFAULT 0 |
| markup_percent | numeric(8,4) | |
| is_pre_press | boolean | DEFAULT false |
| is_fixed_charge | boolean | DEFAULT false |
| fixed_charge_amount | numeric(12,4) | |
| fixed_charge_cost | numeric(12,4) | |
| minimum_charge | numeric(12,4) | |
| output_per_hour | numeric(10,2) | |
| pricing_mode | text | CHECK in ('cost_markup','rate_card','fixed') |
| sell_rate | numeric(12,6) | |
| sell_rate_tiers | jsonb | DEFAULT '[]' |
| auto_add_category_ids | uuid[] | DEFAULT '{}' |
| notes | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `labor_groups`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `labor_group_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| labor_id | uuid | NN, FK→pricing_labor.id ON DELETE CASCADE |
| group_id | uuid | NN, FK→labor_groups.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(labor_id, group_id) |

### `labor_category_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| labor_id | uuid | NN, FK→pricing_labor.id ON DELETE CASCADE |
| category_id | uuid | NN, FK→pricing_categories.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(labor_id, category_id) |

---

## 14. PRICING — BROKERED

### `pricing_brokered`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| cost_basis | text | CHECK in ('per_unit','per_sqft','per_linear_ft','flat') |
| unit_cost | numeric(12,6) | |
| initial_setup_fee | numeric(12,4) | DEFAULT 0 |
| markup_percent | numeric(8,4) | |
| vendor_id | uuid | FK→vendors.id |
| vendor_name | text | |
| pricing_mode | text | CHECK in ('cost_markup','rate_card','fixed') |
| sell_rate | numeric(12,6) | |
| sell_rate_tiers | jsonb | DEFAULT '[]' |
| auto_add_category_ids | uuid[] | DEFAULT '{}' |
| notes | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `brokered_groups`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| description | text | |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `brokered_group_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| brokered_id | uuid | NN, FK→pricing_brokered.id ON DELETE CASCADE |
| group_id | uuid | NN, FK→brokered_groups.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(brokered_id, group_id) |

### `brokered_category_assignments` *(junction)*
| Column | Type | Constraints / Default |
|---|---|---|
| brokered_id | uuid | NN, FK→pricing_brokered.id ON DELETE CASCADE |
| category_id | uuid | NN, FK→pricing_categories.id ON DELETE CASCADE |
| created_by | uuid | FK→profiles.id *(added in 003)* |
| updated_by | uuid | FK→profiles.id *(added in 003)* |
| created_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| updated_at | timestamptz | NN, DEFAULT now() *(added in 003)* |
| | | PK(brokered_id, category_id) |

---

## 15. PRICING — TEMPLATES

### `product_templates`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| product_family | text | |
| icon | text | |
| description | text | |
| default_line_item | jsonb | DEFAULT '{}' |
| is_favorite | boolean | DEFAULT false |
| usage_count | int | DEFAULT 0 |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

### `pricing_templates`
| Column | Type | Constraints / Default |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| organization_id | uuid | NN, FK→organizations.id ON DELETE CASCADE |
| name | text | NN |
| category_id | uuid | |
| category_name | text | |
| product_id | uuid | |
| product_name | text | |
| quantity | int | |
| final_width | numeric(10,4) | |
| final_height | numeric(10,4) | |
| material_id | uuid | |
| material_name | text | |
| equipment_id | uuid | |
| equipment_name | text | |
| color | text | |
| sides | text | |
| folding | text | |
| is_favorite | boolean | DEFAULT false |
| usage_count | int | DEFAULT 0 |
| created_by | uuid | FK→profiles.id *(added in 002)* |
| updated_by | uuid | FK→profiles.id *(added in 002)* |
| created_at | timestamptz | NN, DEFAULT now() |
| updated_at | timestamptz | NN, DEFAULT now() |

---

## Seed / INSERT Script Guidance

### Insert order (FK-safe)

1. `profiles` *(pre-provisioned via `auth.users` + `handle_new_user` trigger)*
2. `organizations` → `organization_memberships` → `organization_invitations`
3. `subscription_plans` → `subscription_accounts`
4. `document_counters`, `company_settings`, `document_templates`
5. `customers` → `customer_shipping_addresses` → `contacts`
6. `vendors`
7. `workflows` → `workflow_stages` → `tracking_devices`
8. `pricing_categories` → `pricing_products` → `pricing_product_categories`
9. `pricing_equipment` → `maintenance_records`
10. `pricing_materials` → `material_groups` → material junctions → `material_change_history`
11. `pricing_finishing` → `finishing_groups` → finishing junctions
12. `pricing_labor` → `labor_groups` → labor junctions
13. `pricing_brokered` → `brokered_groups` → brokered junctions
14. `product_templates`, `pricing_templates`
15. `quotes` → `quote_line_items` *(parents before children due to self-FK `parent_line_item_id`)*
16. `orders` → `order_line_items` *(same self-FK consideration)*
17. `invoices` → `invoice_line_items` → `invoice_orders`
18. `purchase_orders` → `purchase_order_items`
19. `audit_logs`

### Trigger considerations

- `set_created_by()` / `set_updated_by()` **overwrite** `created_by` / `updated_by` with `auth.uid()` on INSERT/UPDATE. When seeding as a service role, either:
  - Run `SET LOCAL role TO postgres;` with `SET LOCAL "request.jwt.claim.sub" TO '<uuid>';`, or
  - Temporarily disable them: `ALTER TABLE <t> DISABLE TRIGGER trg_set_created_by, trg_set_updated_by;`
- `update_updated_at()` auto-stamps `updated_at` on UPDATE — no impact on INSERT.
- `handle_new_user()` auto-inserts into `profiles` from `auth.users` — don't double-insert.

### Unique constraints to respect

- `organizations.slug`
- `customers(organization_id, customer_number)`
- `quotes(organization_id, number)`
- `orders(organization_id, number)`
- `invoices(organization_id, number)`
- `purchase_orders(organization_id, number)`
- `tracking_devices(organization_id, code)`
- `document_counters(organization_id, document_type)`
- `document_templates(organization_id, template_type)`
- `organization_memberships(organization_id, profile_id)`
- `subscription_accounts.organization_id`
- `company_settings.organization_id`
- `subscription_plans.slug`

### Self-referencing FKs (insert parents before children)

- `quote_line_items.parent_line_item_id` → `quote_line_items.id`
- `order_line_items.parent_line_item_id` → `order_line_items.id`

### Tenant scoping

Every tenant-scoped table has `organization_id` — ensure every inserted row carries the correct org ID, or RLS will hide it from application queries.

### Literal syntax for PostgreSQL

- Array columns (`text[]`, `uuid[]`): `ARRAY['a','b']::text[]` or `'{a,b}'::text[]`
- JSONB columns: `'{"key":"value"}'::jsonb` or `'[]'::jsonb`
- UUIDs: `'00000000-0000-0000-0000-000000000000'::uuid` or use `gen_random_uuid()`

### CHECK constraint enums reference (for generating valid data)

| Table.column | Valid values |
|---|---|
| organizations.status | active, suspended, deactivated |
| organization_memberships.role | owner, admin, manager, csr, sales, estimator, production, accounting, viewer |
| organization_memberships.status | active, suspended, removed |
| document_counters.document_type | quote, order, invoice, purchase_order, customer |
| document_templates.template_type | quote, order, work_order, invoice, purchase_order |
| quotes.status | pending, hot, cold, won, lost |
| orders.status | in_progress, on_hold, completed, canceled |
| orders.tracking_mode | order, item |
| invoices.status | draft, sent, posted, paid, overdue, void |
| purchase_orders.status | draft, sent, acknowledged, received, partial, canceled |
| subscription_accounts.status | trial, active, past_due, canceled, suspended |
| pricing_equipment.cost_unit | per_click, per_sqft |
| pricing_equipment.cost_type | cost_only, cost_plus_time, time_only |
| maintenance_records.status | Requested, Scheduled, Completed, Canceled |
| pricing_materials.material_type | paper, roll_media, rigid_substrate, blanks |
| pricing_materials.pricing_model | cost_per_m, cost_per_unit, cost_per_sqft |
| pricing_materials.markup_type | percent, multiplier, profit_percent |
| pricing_finishing.pricing_mode | cost_markup, rate_card, fixed |
| pricing_labor.charge_basis | per_hour, per_sqft, per_unit, per_1000, flat |
| pricing_labor.pricing_mode | cost_markup, rate_card, fixed |
| pricing_brokered.cost_basis | per_unit, per_sqft, per_linear_ft, flat |
| pricing_brokered.pricing_mode | cost_markup, rate_card, fixed |
| material_change_history.action | created, updated, deleted |
