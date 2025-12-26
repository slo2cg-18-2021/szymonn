import JSZip from 'jszip'

export async function exportApp() {
  const zip = new JSZip()

  const filesToExport = [
    { path: '/index.html', type: 'text' },
    { path: '/tailwind.config.js', type: 'text' },
    { path: '/README.md', type: 'text' },
    { path: '/INSTRUKCJA.md', type: 'text' },
    { path: '/src/App.tsx', type: 'text' },
    { path: '/src/main.css', type: 'text' },
    { path: '/src/ErrorFallback.tsx', type: 'text' },
    { path: '/src/lib/utils.ts', type: 'text' },
    { path: '/src/hooks/use-online-status.ts', type: 'text' },
    { path: '/src/components/BarcodeScanner.tsx', type: 'text' },
    { path: '/src/components/ProductTable.tsx', type: 'text' },
    { path: '/src/components/ConnectionIndicator.tsx', type: 'text' },
  ]

  for (const file of filesToExport) {
    try {
      const response = await fetch(file.path)
      if (response.ok) {
        const content = await response.text()
        zip.file(file.path, content)
      }
    } catch (error) {
      console.warn(`Nie można pobrać pliku: ${file.path}`)
    }
  }

  const uiComponentsDir = zip.folder('src/components/ui')
  const uiComponents = [
    'accordion.tsx', 'alert-dialog.tsx', 'alert.tsx', 'aspect-ratio.tsx',
    'avatar.tsx', 'badge.tsx', 'breadcrumb.tsx', 'button.tsx',
    'calendar.tsx', 'card.tsx', 'carousel.tsx', 'chart.tsx',
    'checkbox.tsx', 'collapsible.tsx', 'command.tsx', 'context-menu.tsx',
    'dialog.tsx', 'drawer.tsx', 'dropdown-menu.tsx', 'form.tsx',
    'hover-card.tsx', 'input-otp.tsx', 'input.tsx', 'label.tsx',
    'menubar.tsx', 'navigation-menu.tsx', 'pagination.tsx', 'popover.tsx',
    'progress.tsx', 'radio-group.tsx', 'resizable.tsx', 'scroll-area.tsx',
    'select.tsx', 'separator.tsx', 'sheet.tsx', 'sidebar.tsx',
    'skeleton.tsx', 'slider.tsx', 'sonner.tsx', 'switch.tsx',
    'table.tsx', 'tabs.tsx', 'textarea.tsx', 'toggle-group.tsx',
    'toggle.tsx', 'tooltip.tsx',
  ]

  for (const component of uiComponents) {
    try {
      const response = await fetch(`/src/components/ui/${component}`)
      if (response.ok) {
        const content = await response.text()
        uiComponentsDir?.file(component, content)
      }
    } catch (error) {
      console.warn(`Nie można pobrać UI komponenty: ${component}`)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'spark-template-app.zip'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
