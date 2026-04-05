# QuickQuote Supabase Multitenant Migration Blueprint

## 1. Document Purpose

This document defines the full migration and rearchitecture plan for transforming QuickQuote from its current browser-persisted prototype into a commercially viable, multi-user, multi-tenant SaaS product built on Supabase.

This is intended to be the authoritative blueprint for:

- target architecture
- tenant isolation
- authentication and authorization
- database schema direction
- storage architecture for files and generated documents
- frontend refactor strategy
- backend service design
- migration sequencing
- operational readiness
- commercialization concerns

This document is written against the current codebase state as of April 5, 2026.

## 2. Current State Summary

### 2.1 Current runtime architecture

The application is currently a Vite + React + TypeScript frontend with no real backend. Business data is held in client-side Zustand stores and persisted in browser `localStorage`.

Primary sources:

- [src/store/index.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/store/index.ts)
- [src/store/pricingStore.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/store/pricingStore.ts)
- [src/types/index.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/types/index.ts)
- [src/types/pricing.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/types/pricing.ts)

### 2.2 Current persistence model

The application currently has three categories of persisted state:

1. Business state in `useStore`, persisted to `localStorage`
2. Pricing/catalog state in `usePricingStore`, persisted to `localStorage`
3. A few browser-local preferences such as color scheme and scanner state

This model is suitable for a local prototype but not for:

- multi-user collaboration
- tenant isolation
- commercial reliability
- auditability
- shared data access
- server-enforced permissions
- integrations
- storage of large files

### 2.3 Current seed and bootstrap sources

The current app bootstraps data from source-controlled files:

- [src/data/mockData.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/data/mockData.ts)
- [src/data/realData.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/data/realData.ts)
- [src/data/pricingData.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/data/pricingData.ts)
- [src/data/documentSettings.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/data/documentSettings.ts)
- [src/data/trackingDevices.json](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/data/trackingDevices.json)
- [src/data/orderTrackerBoards.json](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/data/orderTrackerBoards.json)

These should be reclassified into:

- system defaults
- development/demo fixtures
- import fixtures
- tenant onboarding templates

They must stop being treated as runtime persistence.

## 3. Business Goals of the Migration

The target product must support:

- multiple users per organization
- multiple organizations in the same shared platform
- strict tenant isolation
- cloud persistence across sessions and devices
- organization-level pricing catalogs and settings
- file uploads and file lifecycle management
- generated documents and historical snapshots
- secure invite-based collaboration
- production-grade security controls
- operational observability
- a path to subscription billing and feature entitlements

## 4. Non-Goals for the Initial Commercial Rewrite

These items should not block the core migration unless specifically prioritized:

- full offline support
- real-time collaborative editing of the same record at field level
- advanced analytics warehouse
- complete integration ecosystem on day one
- AI-specific productization beyond current UI workflow support

They can be added later if the architecture below is respected.

## 5. Architectural Principles

### 5.1 System of record

Supabase Postgres becomes the system of record for all structured business data.

### 5.2 Storage separation

Use:

- Postgres for structured metadata and relationships
- Supabase Storage for binary content and uploaded/generated files

### 5.3 Tenant ownership

Every tenant-owned record must be scoped by `organization_id`.

### 5.4 Database-enforced security

Authorization must be enforced with Row Level Security. The UI may hide actions, but RLS is the actual protection boundary.

### 5.5 Service-based frontend

React components must stop talking directly to persistence logic. Introduce a service/repository layer between UI and Supabase.

### 5.6 Historical integrity

Transactional documents such as quotes, orders, invoices, and purchase orders must preserve snapshots of business-critical values so past records remain accurate after catalog changes.

### 5.7 Server-owned critical workflows

The following workflows must become server-owned or transactionally controlled:

- quote number generation
- order number generation
- invoice number generation
- purchase order number generation
- quote-to-order conversion
- order-to-invoice generation
- file access token generation
- invitation acceptance
- organization provisioning

### 5.8 Defaults versus tenant data

Separate:

- system defaults shared by the product
- seeded starter data copied into a tenant
- tenant-owned records

## 6. Target Platform Architecture

## 6.1 Core platform components

- React frontend
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Edge Functions
- Background job runner strategy
- Monitoring and error reporting

### 6.2 Logical layers

#### Frontend

- route layer
- page components
- UI components
- local UI state
- domain service layer
- query/cache layer

#### Supabase

- authentication
- relational persistence
- storage
- row-level policies
- edge functions for privileged and integration logic

#### Operational layer

- migrations
- seeding
- observability
- support tooling
- billing and entitlement enforcement

## 7. Multitenant Model

### 7.1 Tenant primitive

The core tenant primitive will be `organizations`.

Each organization represents a customer workspace and owns:

- users via memberships
- business data
- pricing data
- settings
- files
- generated documents
- integration connections
- usage and billing context

### 7.2 User model

A user is represented by:

- a Supabase Auth identity
- a `profiles` row
- one or more `organization_memberships`

This allows a single user to belong to multiple organizations.

### 7.3 Membership model

Memberships are separate from profiles and carry the active role within an organization.

Recommended roles:

- `owner`
- `admin`
- `manager`
- `csr`
- `sales`
- `estimator`
- `production`
- `accounting`
- `viewer`

### 7.4 Workspace switching

The frontend must support an active organization context. All tenant-scoped queries and mutations must run within that selected organization.

### 7.5 Tenant isolation rules

Every tenant-owned table must:

- include `organization_id`
- include RLS policies scoped to membership
- prevent users from reading or mutating data across organizations

## 8. Authentication and Authorization

### 8.1 Authentication

Use Supabase Auth for:

- email/password login
- magic link optional
- invitation acceptance
- password reset
- session refresh

### 8.2 Identity bootstrap

After authentication, create or hydrate:

- `profiles`
- memberships
- active organization selection

### 8.3 Invitation flow

Recommended flow:

1. Owner/admin invites user by email into an organization
2. Invitation row is created with role and expiry
3. User receives invite link
4. User signs up or logs in
5. Edge Function validates invite and creates membership
6. Audit log entry is written

### 8.4 Authorization model

Authorization must have three layers:

1. UI affordance checks
2. service-layer guardrails
3. RLS and database-level enforcement

UI checks improve UX only. They are not sufficient.

### 8.5 Permission strategy

Store coarse organization role on memberships. Derive permissions in one of two ways:

- hardcoded permission map in application services and RLS
- explicit role-permission tables if the product needs custom role management

Initial recommendation:

- start with a fixed permission matrix
- introduce custom roles later only if product demand justifies the added complexity

### 8.6 Recommended initial permission boundaries

#### Owner

- full organization control
- billing
- membership management
- integrations
- settings
- all business records

#### Admin

- all operations except transfer ownership and some billing actions

#### Manager

- broad operational control
- pricing and workflow management
- no billing ownership

#### CSR / Sales / Estimator / Production / Accounting / Viewer

Each should be restricted based on business workflow needs. The exact matrix should be formalized before implementation.

### 8.7 Session security

Implement:

- secure session handling via Supabase client
- inactivity handling if required
- session invalidation on critical membership changes
- audit logging on login-related events where useful

## 9. Security Architecture

### 9.1 Security objectives

- prevent tenant data leakage
- protect files and generated documents
- protect credentials and integration secrets
- maintain change traceability
- reduce blast radius of compromised user accounts

### 9.2 Security controls

Mandatory controls:

- RLS on all tenant tables
- RLS on file metadata tables
- private storage buckets by default
- signed URLs for downloads
- server-side invite acceptance
- no service-role credentials in the client
- secrets only in server-side environments or Edge Functions

### 9.3 Sensitive data treatment

Sensitive data categories:

- customer contact data
- invoice/payment data
- internal notes
- uploaded documents
- integration credentials
- API keys

Storage requirements:

- secrets stored outside the client
- minimal PII duplication
- audit access to sensitive admin actions

### 9.4 Input and upload validation

Validate:

- file size
- file extension
- MIME type
- required metadata
- numeric business values
- uniqueness-sensitive document generation flows

### 9.5 Audit logging

Introduce a generalized `audit_logs` table covering:

- actor
- organization
- entity type
- entity id
- action
- summary
- structured metadata
- created timestamp

Critical audited events:

- membership and invitation changes
- settings changes
- pricing catalog changes
- quote/order/invoice/PO state changes
- file upload/delete/link actions
- integration changes

### 9.6 Operational security

Add:

- environment separation for local, staging, production
- least-privilege admin procedures
- change management for migrations
- regular backups
- restore testing

## 10. Data Domain Inventory

The current codebase expresses two major business domains that must be migrated.

### 10.1 Platform domain

New platform tables required for SaaS operation:

- `profiles`
- `organizations`
- `organization_memberships`
- `organization_invitations`
- `organization_settings`
- `subscription_accounts`
- `subscription_plans`
- `feature_flags`
- `api_keys`
- `audit_logs`
- `integration_connections`
- `webhook_endpoints`
- `import_jobs`
- `export_jobs`

### 10.2 Core business domain

Derived from [src/types/index.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/types/index.ts):

- customers
- contacts
- quotes
- quote_line_items
- orders
- order_line_items
- invoices
- invoice_line_items
- vendors
- purchase_orders
- purchase_order_items
- workflows
- workflow_stages
- tracking_devices
- product_templates
- company_settings
- document_templates

### 10.3 Pricing domain

Derived from [src/types/pricing.ts](/Users/jorgefernandez/Documents/Projects/QuickQuote/src/types/pricing.ts):

- pricing_categories
- pricing_products
- pricing_equipment
- maintenance_records
- pricing_finishing
- pricing_labor
- pricing_brokered
- pricing_materials
- pricing_templates
- material_groups
- finishing_groups
- labor_groups
- brokered_groups
- material_change_history

### 10.4 File domain

New storage-aware tables:

- files
- file_versions
- file_links
- generated_documents
- upload_sessions
- file_access_logs

## 11. Recommended Database Design

This section defines the recommended relational direction. Exact DDL can be generated from this.

### 11.1 Shared structural conventions

For most tenant-owned tables:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- optional `created_by`
- optional `updated_by`
- soft delete fields only where business-appropriate

### 11.2 Profiles

`profiles`

- `id uuid primary key references auth.users(id)`
- `email text`
- `full_name text`
- `avatar_file_id uuid null`
- `default_organization_id uuid null`
- `created_at`
- `updated_at`

### 11.3 Organizations

`organizations`

- `id uuid primary key`
- `name text not null`
- `slug text unique`
- `status text`
- `owner_profile_id uuid`
- `created_at`
- `updated_at`

### 11.4 Organization memberships

`organization_memberships`

- `id uuid primary key`
- `organization_id uuid`
- `profile_id uuid`
- `role text`
- `status text`
- `joined_at timestamptz`
- unique `(organization_id, profile_id)`

### 11.5 Invitations

`organization_invitations`

- `id uuid primary key`
- `organization_id uuid`
- `email text`
- `role text`
- `token_hash text`
- `invited_by uuid`
- `expires_at timestamptz`
- `accepted_at timestamptz null`
- `revoked_at timestamptz null`

### 11.6 Customers and contacts

`customers`

- tenant-scoped
- mostly mirrors current `Customer`
- preserve source metadata such as import source

`contacts`

- tenant-scoped
- `customer_id` foreign key
- unique or business-rule-protected primary contact logic handled in service layer and possibly partial index if needed

### 11.7 Quotes

`quotes`

- `organization_id`
- `number text unique per organization`
- customer and contact references
- status
- title and description
- totals
- lifecycle timestamps
- notes/internal notes
- source metadata
- conversion linkage
- created_by/updated_by

`quote_line_items`

- `quote_id`
- position/order column
- fields required to render historical quote accurately
- optional references back to pricing tables
- pricing snapshot fields retained inline

Do not make historical quote rendering depend on current catalog data.

### 11.8 Orders

`orders`

- similar structure to quotes
- workflow assignment fields
- due/ship dates
- invoice relation
- PO/customer references

`order_line_items`

- normalized child table
- workflow stage assignment
- assigned user
- production notes
- time spent
- pricing snapshot fields

### 11.9 Invoices

`invoices`

- tenant-scoped
- server-generated invoice number
- customer reference
- totals
- status
- payment fields

`invoice_line_items`

- `invoice_id`
- `order_id` optional
- `order_item_id` optional
- quantity/unit/unit_price/total

### 11.10 Vendors and purchase orders

`vendors`

- tenant-scoped
- supplier details

`purchase_orders`

- server-generated number
- vendor relation
- order relation optional
- status
- totals
- notes and milestone dates

`purchase_order_items`

- normalized child rows

### 11.11 Workflows

`workflows`

- tenant-scoped
- name, description, active flag
- default marker
- applicable product families

`workflow_stages`

- `workflow_id`
- stage name
- order index
- color
- completion flag
- default assignee

### 11.12 Tracking devices

`tracking_devices`

- tenant-scoped
- device code unique within organization
- workflow and stage linkage
- active flag

### 11.13 Company settings and document templates

`company_settings`

- one row per organization

`document_templates`

- one row per organization or multiple rows by template type
- template body stored as text or JSONB depending on templating system direction

### 11.14 Pricing domain normalization

#### Categories and products

- `pricing_categories`
- `pricing_products`

For many-to-many relations, create junction tables rather than arrays where queryability matters.

Examples:

- `pricing_product_categories`
- `pricing_material_groups_categories`
- `pricing_finishing_categories`
- `pricing_finishing_products`

Where product/category assignments are numerous and query-driven, relational tables are preferred over arrays.

### 11.15 Pricing materials

`pricing_materials`

- tenant-scoped
- cost model fields
- vendor metadata
- favorite flags
- image file relation instead of inline base64

Related tables where justified:

- `pricing_material_groups`
- `pricing_material_group_assignments`
- `pricing_material_product_assignments`
- `pricing_material_category_assignments`
- `pricing_material_history`

The current material history pattern should become a more consistent relational history table.

### 11.16 Equipment and maintenance

`pricing_equipment`

- tenant-scoped
- pricing logic fields
- image file relation
- maintenance vendor relation

`maintenance_records`

- normalized child table under equipment

### 11.17 Finishing, labor, brokered services

These can be modeled as separate top-level tables with assignment junction tables.

Examples:

- `pricing_finishing`
- `pricing_finishing_categories`
- `pricing_finishing_products`
- `pricing_labor`
- `pricing_labor_categories`
- `pricing_brokered`
- `pricing_brokered_categories`

### 11.18 Generated numbering

Add organization-scoped counters or sequence-backed functions for:

- quotes
- orders
- invoices
- purchase orders

Recommended implementation:

- `document_counters` table keyed by `(organization_id, document_type)`
- server-side function increments atomically within a transaction

### 11.19 JSONB usage guidance

Use JSONB only where flexibility is more valuable than strict normalization:

- document template bodies
- audit metadata
- integration settings
- webhook payloads
- import/export job diagnostics

Avoid storing core relational entities only in JSONB.

## 12. File and Storage Architecture

Files are a first-class platform concern in the commercial product.

### 12.1 File use cases

The product must support:

- customer attachments
- quote attachments
- proofs
- artwork uploads
- production files
- purchase order attachments
- invoice attachments
- generated PDFs
- material photos
- equipment photos
- organization logos and branding
- import source files
- export packages

### 12.2 Storage principles

- binary files go to Supabase Storage
- file metadata goes to Postgres
- file access is tenant-scoped
- private by default
- document outputs can be immutable

### 12.3 Bucket strategy

Recommended buckets:

- `org-private-files`
- `org-public-assets`
- `generated-documents`
- `imports`
- `exports`
- `avatars`
- `temp-uploads`

### 12.4 Path convention

Recommended storage path:

`org/{organization_id}/{entity_type}/{entity_id}/{file_id}/{filename}`

Examples:

- `org/{orgId}/quotes/{quoteId}/{fileId}/artwork.pdf`
- `org/{orgId}/orders/{orderId}/{fileId}/production.zip`
- `org/{orgId}/branding/company/{fileId}/logo.png`

### 12.5 File metadata schema

`files`

- `id uuid`
- `organization_id uuid`
- `uploaded_by uuid`
- `bucket text`
- `storage_path text`
- `filename text`
- `original_filename text`
- `mime_type text`
- `extension text`
- `size_bytes bigint`
- `checksum text`
- `status text`
- `visibility text`
- `is_generated boolean`
- `created_at`
- `updated_at`
- `deleted_at`

### 12.6 File versioning

If versioning is required for artwork/proofs:

`file_versions`

- `id uuid`
- `file_id uuid`
- `version_number integer`
- `bucket text`
- `storage_path text`
- `size_bytes`
- `checksum`
- `created_by`
- `created_at`

Initial implementation may defer user-visible versioning while still preserving the schema path for it.

### 12.7 Linking files to business entities

`file_links`

- `id uuid`
- `organization_id uuid`
- `file_id uuid`
- `entity_type text`
- `entity_id uuid`
- `link_role text`
- `created_by uuid`
- `created_at`

Suggested `link_role` values:

- `attachment`
- `artwork`
- `proof`
- `production`
- `invoice_pdf`
- `quote_pdf`
- `po_pdf`
- `logo`
- `photo`
- `import_source`
- `export_package`

### 12.8 Generated documents

`generated_documents`

- `id uuid`
- `organization_id uuid`
- `entity_type text`
- `entity_id uuid`
- `document_type text`
- `file_id uuid`
- `template_version text or jsonb`
- `generated_by uuid`
- `generated_at`
- `is_final boolean`

Use this for immutable PDFs of quotes, invoices, and purchase orders that were sent externally.

### 12.9 Access model for files

File access must require:

- authenticated user
- active membership in the file's organization
- appropriate permission for the linked entity

### 12.10 Signed URLs

Signed URLs should be generated only after application-level permission checks.

Recommended flow:

1. Client requests file access through service layer
2. Service calls Edge Function or guarded RPC
3. Function verifies membership and permission
4. Signed URL is generated with short expiry

### 12.11 Public assets

Only assets intentionally meant to be public should use `org-public-assets`, for example:

- published logos for portal display
- optional public proof sharing assets if productized later

### 12.12 Upload controls

Implement:

- max file size by file category and plan
- allow-list MIME types
- extension checks
- upload progress
- failure recovery
- temporary staging paths if needed

### 12.13 Malware and file safety

At commercial launch, at minimum:

- restrict dangerous executable file types
- validate MIME and extension
- log uploads

Future enhancement:

- asynchronous malware scanning pipeline
- quarantine status in file metadata

### 12.14 Retention and deletion

Decide file lifecycle per category:

- soft-delete metadata first
- delayed hard-delete for recovery window
- storage cleanup jobs
- retention exceptions for immutable accounting artifacts if legally required

### 12.15 Storage quotas

Per organization usage should be metered for:

- total bytes
- generated documents
- private file count
- upload bandwidth if needed later

This is needed for commercial plan enforcement.

## 13. RLS Strategy

### 13.1 General pattern

For each tenant-owned table:

- permit access only to authenticated users
- allow rows only where the current user has an active membership in the row's `organization_id`

### 13.2 Helper pattern

Create helper SQL functions such as:

- `is_member_of_org(org_id uuid)`
- `has_org_role(org_id uuid, role text)`
- `has_org_permission(org_id uuid, permission text)`

This keeps policies consistent and maintainable.

### 13.3 Read policies

Most tables:

- all active members can read, unless more restrictive business rules are needed

### 13.4 Write policies

Use role-based restrictions:

- owners/admins/managers may mutate most admin/configuration tables
- operational roles may mutate only relevant business records
- viewers read only

### 13.5 File metadata policies

`files`, `file_links`, and `generated_documents` must also be tenant-scoped under RLS.

### 13.6 Storage policies

Bucket access should be constrained by path conventions and metadata checks. The exact implementation depends on whether downloads are direct or always signed through a function. The safer initial path is signed URLs via controlled functions.

## 14. Frontend Refactor Plan

### 14.1 Current frontend problem

The current app uses Zustand as both:

- local application state
- persistence boundary

This is the core architectural issue to fix.

### 14.2 Target frontend state model

#### Keep Zustand for

- ephemeral UI state
- modal state
- search/filter preferences
- transient workflow state
- currently selected organization and session-local context if useful

#### Move out of Zustand

- long-lived business truth
- business CRUD persistence
- identity and permission authority
- cross-device synchronization

### 14.3 Introduce service modules

Recommended structure:

- `src/lib/supabase/client.ts`
- `src/lib/supabase/types.ts`
- `src/lib/session/`
- `src/services/auth/`
- `src/services/organizations/`
- `src/services/customers/`
- `src/services/contacts/`
- `src/services/quotes/`
- `src/services/orders/`
- `src/services/invoices/`
- `src/services/vendors/`
- `src/services/purchaseOrders/`
- `src/services/workflows/`
- `src/services/pricing/`
- `src/services/files/`
- `src/services/settings/`
- `src/services/integrations/`

### 14.4 Service responsibilities

- query execution
- DTO mapping
- permission-sensitive orchestration
- error normalization
- optimistic updates only where safe
- signed URL handling
- server function invocation

### 14.5 Query/caching approach

The current app can continue without a dedicated query library initially, but for a commercial rewrite a query cache layer should be strongly considered.

Recommended option:

- add TanStack Query

Benefits:

- cache invalidation
- loading/error states
- mutation lifecycle
- background refetch

If not introduced immediately, services must still be written in a way that allows later adoption.

### 14.6 Store migration strategy

#### `src/store/index.ts`

Refactor into:

- session/workspace UI state
- maybe derived view state

Remove server-owned business persistence responsibility.

#### `src/store/pricingStore.ts`

Refactor into:

- pricing page UI helpers
- pricing editor temporary form state

Replace data source with service-backed queries.

### 14.7 File upload UI refactor

Image/file fields that currently accept URLs or inline state should be changed to:

- upload widget
- returned file metadata reference
- preview through signed URL or public URL depending on asset type

Targets include:

- materials
- equipment
- branding assets
- quote/order attachments

## 15. Backend and Edge Function Strategy

### 15.1 When to use client queries directly

Safe for:

- normal tenant-scoped CRUD where RLS fully protects access
- simple reads
- simple writes

### 15.2 When to use Edge Functions

Use Edge Functions for:

- invitation acceptance
- organization provisioning
- server-owned numbering flows
- quote-to-order conversion if atomic multi-table mutation is needed
- order-to-invoice generation
- file signed URL generation if centralized permission logic is desired
- integrations and webhooks
- import/export jobs
- privileged admin tasks

### 15.3 Server function boundary

Business operations spanning multiple tables should not be orchestrated only in React components. They should be moved into:

- Postgres functions called transactionally
- or Edge Functions that invoke transactional SQL logic

## 16. Numbering and Transactional Integrity

### 16.1 Problem in the current app

The current app generates quote/order/invoice/PO numbers from client-side counters in Zustand. This is unsafe for multi-user concurrency.

### 16.2 Target approach

Create atomic server-side generation per organization.

Recommended pattern:

- `document_counters` table
- SQL function increments counter in a transaction
- returns formatted document number

### 16.3 Transaction-sensitive workflows

The following should be implemented as atomic operations:

- create quote with line items
- create order from quote
- create invoice from order(s)
- create purchase order and attach to order
- mark purchase order received and move linked workflow if required

## 17. Historical Snapshots and Immutability

### 17.1 Why snapshots are necessary

Pricing catalog data changes over time. Historical quotes and orders must not recalculate off current catalog values.

### 17.2 Snapshot rules

Quote and order line items must store:

- material names at time of pricing
- equipment names at time of pricing
- labor and vendor values
- calculated costs and sell price
- dimensions and quantity
- markup and totals

Optional foreign keys to current catalog data may still exist, but they cannot be the source of truth for historical rendering.

### 17.3 Finalized documents

Generated external documents should be persistable as immutable files:

- quote PDF sent to customer
- invoice PDF
- purchase order PDF

## 18. Defaults, Templates, and Tenant Seeding

### 18.1 Current issue

The current codebase mixes:

- demo data
- real imported data
- default settings

### 18.2 Target model

Separate into:

- system default templates in a seed source
- onboarding copy routines
- per-tenant editable records

### 18.3 Onboarding flow

For a new organization:

1. create organization
2. create owner membership
3. create company settings
4. create document template defaults
5. copy starter pricing data if selected
6. copy starter workflows/tracking defaults if selected
7. create audit entries

### 18.4 Seed data strategy

Retain current data files as migration/bootstrap inputs, but stop wiring them directly into runtime state.

## 19. Integration Architecture

### 19.1 Current state

The existing integrations page is UI-only and does not represent real backend capability.

### 19.2 Target model

Add:

- `integration_connections`
- `webhook_endpoints`
- `webhook_deliveries`
- `sync_runs`
- `sync_errors`

### 19.3 Secrets handling

Integration secrets must never be stored in frontend code or browser storage.

Use:

- encrypted server-side storage pattern
- environment secrets
- Edge Functions

### 19.4 Webhook model

Support webhook subscriptions for:

- quote events
- order events
- invoice events
- customer events
- purchase order events

### 19.5 Import/export jobs

Large import and export flows should be modeled as jobs:

- source file uploaded to Storage
- `import_jobs` row created
- processor runs
- results and errors stored

## 20. Billing and Commercial Entitlements

### 20.1 Why this must be modeled now

Even if subscription billing is not implemented in the first delivery, the architecture should support plan enforcement without schema churn.

### 20.2 Billing domain

Recommended tables:

- `subscription_plans`
- `subscription_accounts`
- `subscription_entitlements`
- `usage_counters`

### 20.3 Likely entitlements

- max users
- storage quota
- number of organizations if needed for reseller use cases
- integrations access
- API access
- advanced pricing module
- audit retention length
- export capability

### 20.4 Plan enforcement areas

- member invitations
- file uploads
- storage retention
- API key creation
- premium modules

## 21. Observability and Operations

### 21.1 Logging

Capture:

- client errors
- server errors
- function failures
- storage failures
- import/export failures

### 21.2 Monitoring

Required:

- database health
- edge function health
- storage usage
- auth anomalies
- error rates

### 21.3 Backups and recovery

Implement:

- scheduled database backups
- storage backup/retention strategy
- restore runbooks
- periodic restore testing

### 21.4 Support tooling

Eventually required:

- tenant admin/support console
- support-safe access patterns
- organization suspension
- usage inspection
- import repair utilities

## 22. Performance and Scalability Considerations

### 22.1 Query performance

Add indexes for:

- `organization_id`
- document numbers
- customer/contact foreign keys
- status fields used in lists
- workflow lookups
- file link lookups

### 22.2 Pagination

List pages should transition from full in-memory collections to paginated queries:

- customers
- quotes
- orders
- invoices
- materials
- equipment

### 22.3 Search

Current global search is client-side. Commercially, this will eventually need server-backed search. Initial migration can keep limited client behavior per loaded datasets, but the long-term plan should include indexed server search.

### 22.4 Concurrency

For high-value records, consider:

- `updated_at` conflict awareness
- optimistic locking fields if needed
- atomic mutation functions

## 23. Compliance and Data Governance Considerations

This is not legal advice, but the architecture should support:

- data deletion requests
- tenant export
- auditability
- retention windows
- access traceability

Areas needing policy decisions:

- invoice/document retention
- deleted file recovery window
- support access policy
- public versus private file sharing

## 24. Migration Risks

### 24.1 Architectural risks

- directly replacing local store calls with raw Supabase calls will create a brittle codebase
- leaving numbering client-side will produce collisions
- weak RLS will create tenant leakage
- preserving embedded arrays too aggressively will make reporting and mutation harder

### 24.2 Product risks

- mixing system defaults with tenant-owned data will complicate onboarding and support
- not snapshotting pricing will break historical quote integrity
- weak file controls will create security and support issues

### 24.3 Delivery risks

- trying to migrate every module at once is high risk
- changing UI and backend patterns simultaneously without service boundaries will slow delivery

## 25. Recommended Migration Strategy

Migrate incrementally behind new service boundaries. Do not attempt a big-bang rewrite of all modules simultaneously.

### 25.1 Phase 0: Design and decision freeze

Objectives:

- freeze tenant model
- freeze role matrix
- freeze schema direction
- freeze file/storage strategy
- define MVP commercial scope

Deliverables:

- approved architecture blueprint
- permission matrix
- schema mapping sheet
- file classification policy

### 25.2 Phase 1: Supabase foundation

Objectives:

- create Supabase projects for local/staging/prod
- define environment variables
- create migration workflow
- set up auth basics
- create storage buckets

Deliverables:

- Supabase project setup
- migration tooling
- environment contract

### 25.3 Phase 2: Platform schema and RLS

Objectives:

- create platform tables
- create organization and membership model
- create audit tables
- create file metadata tables
- create base business tables
- implement RLS

Deliverables:

- SQL migrations
- helper SQL functions
- policies

### 25.4 Phase 3: Frontend service layer

Objectives:

- add Supabase client integration
- build service modules
- stop using stores as persistence boundaries
- add auth/session context

Deliverables:

- service layer scaffolding
- session/workspace handling
- UI-state-only stores

### 25.5 Phase 4: Authentication and onboarding

Objectives:

- sign-in/up flows
- invitations
- organization provisioning
- active workspace switching
- starter tenant seeding

Deliverables:

- auth pages
- onboarding flows
- invite acceptance flow

### 25.6 Phase 5: Core data migration

Recommended order:

1. customers
2. contacts
3. quotes and quote line items
4. orders and order line items
5. invoices and invoice line items
6. vendors
7. purchase orders and items

For each domain:

- create schema
- create services
- migrate list/detail pages
- remove local persisted dependency
- test tenant isolation

### 25.7 Phase 6: File storage rollout

Objectives:

- implement upload/download service
- implement file metadata
- add branding asset uploads
- add material and equipment photo uploads
- add quote/order/invoice/PO attachments
- add generated document persistence

Deliverables:

- files service
- upload UI components
- signed URL flow
- storage usage metering basis

### 25.8 Phase 7: Pricing module migration

Objectives:

- migrate pricing categories, products, materials, equipment, finishing, labor, brokered services
- move history tracking into database-backed model
- support file-backed images
- preserve pricing snapshot behavior in quotes/orders

Deliverables:

- pricing schema
- pricing services
- migrated pricing pages

### 25.9 Phase 8: Workflows and settings

Objectives:

- workflows and stages
- tracking devices
- company settings
- document templates

Deliverables:

- service-backed settings pages
- tenant-scoped production workflow persistence

### 25.10 Phase 9: Business operation hardening

Objectives:

- server-side numbering
- transactional conversion functions
- audit logging expansion
- conflict handling
- pagination
- server search planning

Deliverables:

- atomic workflow functions
- audit coverage
- scaled list handling

### 25.11 Phase 10: Integrations and export/import backbone

Objectives:

- webhook endpoints
- integration connections
- import/export jobs
- source file retention

Deliverables:

- Edge Function integration framework
- job tracking schema

### 25.12 Phase 11: Commercial readiness

Objectives:

- billing support
- quotas
- support tooling
- backups and restore procedures
- staging validation
- security review

Deliverables:

- launch checklist
- operational runbooks
- commercial plan enforcement hooks

## 26. Data Migration from Current Codebase

### 26.1 Source categories

Current data falls into:

- hardcoded defaults
- real imported sample data
- user-created browser data

### 26.2 Migration approach

#### Development and staging bootstrap

Use current TS/JSON files to seed:

- starter organizations
- demo tenants
- system defaults

#### Existing browser state

If preserving prototype-created browser data matters, create a one-time export/import tool:

- export current Zustand localStorage payloads
- transform to new schema
- import via protected admin tooling

If not needed, skip this and treat the commercial build as a clean platform cutover.

### 26.3 Seed classification

Classify existing files as:

- `system-defaults`
- `demo-fixtures`
- `import-samples`

### 26.4 Mapping examples

Current:

- `mockQuotes` -> tenant seed quotes or demo fixtures
- `realCustomers` -> import fixture or demo seed
- `DEFAULT_COMPANY_SETTINGS` -> onboarding default
- `trackingDevicesSeed` -> starter workflow seed option

## 27. Testing Strategy

### 27.1 Unit tests

Add tests for:

- service-layer transforms
- permission guards
- numbering functions
- file metadata linking

### 27.2 Integration tests

Add tests for:

- auth flows
- organization provisioning
- invite acceptance
- CRUD with RLS boundaries
- file upload and signed download
- quote-to-order conversion
- order-to-invoice creation

### 27.3 RLS tests

Mandatory:

- user in org A cannot access org B rows
- invited but not accepted user cannot access data
- viewer cannot mutate restricted records
- non-member cannot access file metadata or signed URL flow

### 27.4 UAT flows

Validate:

- onboarding
- customer/quote/order lifecycle
- pricing updates
- attachment handling
- generated document retrieval
- multi-user same-org behavior
- workspace switching

## 28. Release Strategy

### 28.1 Environment progression

- local developer Supabase
- staging
- production

### 28.2 Feature rollout

Roll out by module, not by random component. Keep old client-local patterns isolated and remove them domain by domain.

### 28.3 Cutover strategy

Preferred strategy:

- finish core infrastructure first
- migrate domain screens in sequence
- disable local business persistence once core modules are stable
- retain only harmless local UI preferences in browser storage

## 29. Immediate Implementation Backlog

This is the practical order of execution after approval of this document.

1. Add Supabase project configuration and environment scaffolding
2. Define SQL schema draft for platform tables, core business tables, pricing tables, and file tables
3. Define role and permission matrix in a separate document
4. Implement auth/session context in frontend
5. Introduce service-layer directory structure
6. Refactor `useStore` and `usePricingStore` to remove persistence responsibility
7. Implement organizations, memberships, invitations, and onboarding
8. Implement customers and contacts services and pages
9. Implement file metadata layer and storage upload/download services
10. Implement quotes and orders with server-side numbering and snapshot persistence
11. Implement invoices and purchase orders
12. Migrate pricing subsystem
13. Implement workflows, tracking, and settings
14. Add audit logging and hardening
15. Add integration/job framework
16. Add billing and usage enforcement

## 30. Recommended Repository Additions

Suggested new top-level structure:

- `docs/`
- `supabase/`
- `supabase/migrations/`
- `supabase/functions/`
- `src/lib/supabase/`
- `src/services/`
- `src/features/auth/`
- `src/features/organizations/`
- `src/features/files/`
- `src/features/quotes/`
- `src/features/orders/`

Optional:

- `scripts/` for seed/import/export tooling

## 31. Final Recommendations

### 31.1 Do not preserve the current persistence pattern

Do not evolve the current prototype by merely swapping `localStorage` with direct Supabase calls from pages. That would preserve the wrong architecture.

### 31.2 Make files first-class from the start

The platform now requires a serious file architecture. Add file metadata, file linking, storage policy, and generated document handling from the first database design pass.

### 31.3 Move critical business actions server-side early

Especially:

- numbering
- onboarding
- invitations
- conversions
- generated document persistence

### 31.4 Prioritize tenant isolation over speed

Weak multitenancy is not a recoverable product flaw. Get `organization_id`, memberships, and RLS right before scaling feature work.

### 31.5 Preserve historical integrity

Quotes, orders, invoices, purchase orders, and generated documents must remain historically accurate after pricing and settings evolve.

## 32. Definition of Success

The migration is successful when:

- all business data is stored in Supabase Postgres
- all uploaded and generated files are stored in Supabase Storage with metadata in Postgres
- tenant isolation is enforced by RLS
- users can authenticate, join organizations, and switch workspaces
- document numbering is server-owned
- quotes, orders, invoices, and POs preserve historical accuracy
- pricing data is tenant-owned and queryable
- audit logging is in place for critical actions
- the frontend no longer depends on browser persistence for business truth
- the product is operationally supportable and commercially extensible

