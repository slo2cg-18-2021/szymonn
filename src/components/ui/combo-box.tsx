import * as React from "react"
import { Check, CaretUpDown, Plus } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboBoxProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  onAddNew?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

export function ComboBox({
  options,
  value,
  onChange,
  onAddNew,
  placeholder = "Wybierz...",
  searchPlaceholder = "Szukaj...",
  emptyText = "Nie znaleziono.",
  className,
  disabled = false
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  )

  const showAddNew = inputValue.trim() !== "" && 
    !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase()) &&
    onAddNew

  const handleAddNew = () => {
    if (inputValue.trim() && onAddNew) {
      onAddNew(inputValue.trim())
      onChange(inputValue.trim())
      setInputValue("")
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-11 font-normal", className)}
          disabled={disabled}
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {showAddNew ? (
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 w-full px-2 py-3 text-sm hover:bg-accent cursor-pointer text-left"
                >
                  <Plus className="h-4 w-4" />
                  Dodaj "{inputValue}"
                </button>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option)
                    setInputValue("")
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
              {showAddNew && filteredOptions.length > 0 && (
                <CommandItem
                  value={`add-new-${inputValue}`}
                  onSelect={handleAddNew}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
