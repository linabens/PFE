import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Activity,
  Coffee,
  Grid3X3,
  QrCode,
  Star,
  Bell,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
  Search,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useAppStore } from "@/stores/appStore"

interface CommandMenuProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandMenu({ open, setOpen }: CommandMenuProps) {
  const navigate = useNavigate()
  const { products } = useAppStore()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])

  const runCommand = React.useCallback(
    (command: () => void) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type to search pages or products..." />
      <CommandList className="glass-card border-none">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/orders"))}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Live Orders</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/products"))}>
            <Coffee className="mr-2 h-4 w-4" />
            <span>Products Management</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/categories"))}>
            <Grid3X3 className="mr-2 h-4 w-4" />
            <span>Categories</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/tables"))}>
            <QrCode className="mr-2 h-4 w-4" />
            <span>Tables & QR</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/loyalty"))}>
            <Star className="mr-2 h-4 w-4" />
            <span>Loyalty Program</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/assistance"))}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Assistance Requests</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Reports & Settings">
          <CommandItem onSelect={() => runCommand(() => navigate("/revenue"))}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Revenue Reports</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/analytics"))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/staff"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Staff Accounts</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/system"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>System Settings</span>
          </CommandItem>
        </CommandGroup>
        {products.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Products">
              {products.slice(0, 5).map((product) => (
                <CommandItem
                  key={product.id}
                  onSelect={() => runCommand(() => navigate("/products"))}
                >
                  <Coffee className="mr-2 h-4 w-4 text-primary/60" />
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-[10px] text-muted-foreground">{product.category} • {product.price} TND</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
