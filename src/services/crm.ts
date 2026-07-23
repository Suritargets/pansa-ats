'use server'

/**
 * crm.ts
 * WAT:    Server Actions voor clients (externe klanten) en suppliers (leveranciers/relaties).
 * WAAROM: `<form action={...}>` + FormData — geen client-side JS nodig, matcht het patroon
 *         van de rest van de admin-CRUD-schermen.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/roles'
import { clients, suppliers, type ClientStatus, type SupplierKind } from '../../drizzle/schema'

function readClientFields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    industry: String(formData.get('industry') ?? '').trim() || null,
    contactName: String(formData.get('contactName') ?? '').trim() || null,
    contactEmail: String(formData.get('contactEmail') ?? '').trim() || null,
    contactPhone: String(formData.get('contactPhone') ?? '').trim() || null,
    address: String(formData.get('address') ?? '').trim() || null,
    status: (String(formData.get('status') ?? 'active') as ClientStatus) || 'active',
    notes: String(formData.get('notes') ?? '').trim() || null,
  }
}

export async function createClient(formData: FormData): Promise<void> {
  await requireSession([...STAFF_ROLES])

  const [row] = await db.insert(clients).values(readClientFields(formData)).returning({ id: clients.id })

  revalidatePath('/admin/clients')
  redirect(`/admin/clients/${row.id}?saved=1`)
}

export async function updateClient(id: string, formData: FormData): Promise<void> {
  await requireSession([...STAFF_ROLES])

  await db
    .update(clients)
    .set({ ...readClientFields(formData), updatedAt: new Date() })
    .where(eq(clients.id, id))

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${id}`)
  redirect(`/admin/clients/${id}?saved=1`)
}

function readSupplierFields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    kind: (String(formData.get('kind') ?? 'other') as SupplierKind) || 'other',
    contactName: String(formData.get('contactName') ?? '').trim() || null,
    contactEmail: String(formData.get('contactEmail') ?? '').trim() || null,
    contactPhone: String(formData.get('contactPhone') ?? '').trim() || null,
    address: String(formData.get('address') ?? '').trim() || null,
    notes: String(formData.get('notes') ?? '').trim() || null,
  }
}

export async function createSupplier(formData: FormData): Promise<void> {
  await requireSession([...STAFF_ROLES])

  const [row] = await db.insert(suppliers).values(readSupplierFields(formData)).returning({ id: suppliers.id })

  revalidatePath('/admin/suppliers')
  redirect(`/admin/suppliers/${row.id}?saved=1`)
}

export async function updateSupplier(id: string, formData: FormData): Promise<void> {
  await requireSession([...STAFF_ROLES])

  await db
    .update(suppliers)
    .set({ ...readSupplierFields(formData), updatedAt: new Date() })
    .where(eq(suppliers.id, id))

  revalidatePath('/admin/suppliers')
  revalidatePath(`/admin/suppliers/${id}`)
  redirect(`/admin/suppliers/${id}?saved=1`)
}
