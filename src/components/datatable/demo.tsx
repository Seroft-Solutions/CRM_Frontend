"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

// Demo data type
interface Person {
  id: string
  name: string
  email: string
  role: string
}

// Demo data
const data: Person[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "User",
  },
  // Add more demo data as needed
]

export function DataTableDemo() {
  // Define columns
  const columns: ColumnDef<Person>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
    },
  ]

  const onRowClick = (row: Person) => {
    console.log("Row clicked:", row)
  }

  const onSelectionChange = (rows: Person[]) => {
    console.log("Selected rows:", rows)
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={data}
        onRowClick={onRowClick}
        onSelectionChange={onSelectionChange}
      />
    </div>
  )
}
