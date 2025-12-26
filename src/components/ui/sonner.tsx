import { Toaster as Sonner } from "sonner"

import { useTheme } from "@/components/theme-provider"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster() {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNameFunction(toast) {
          return `${
            toast.type === "error"
              ? "group toast group-[.toaster]:bg-red-600 group-[.toaster]:text-white group-[.toaster]:border-red-700"
              : toast.type === "success"
                ? "group toast group-[.toaster]:bg-green-600 group-[.toaster]:text-white group-[.toaster]:border-green-700"
                : "group toast group-[.toaster]:bg-white group-[.toaster]:text-black"
          }`
        },
      }}
      position="top-center"
    />
  )
}
