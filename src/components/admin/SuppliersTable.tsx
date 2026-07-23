import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Supplier } from '@/types/database'

const KIND_LABELS: Record<Supplier['kind'], string> = {
  medical: 'Medisch',
  staffing: 'Uitzendbureau',
  insurance: 'Verzekering',
  training: 'Training',
  government: 'Overheid',
  other: 'Overig',
}

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contactpersoon</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                Geen leveranciers/relaties gevonden.
              </TableCell>
            </TableRow>
          )}
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell>
                <Link href={`/admin/suppliers/${supplier.id}`} className="font-medium text-foreground hover:underline">
                  {supplier.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{KIND_LABELS[supplier.kind]}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{supplier.contactName || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
