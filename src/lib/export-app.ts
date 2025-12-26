import JSZip from 'jszip'

  
    { path: '/index.html'
  
    { path: '/tailwind.co
    { path: '/README.md', type: 'text' },
    { path: '/INSTRUKCJA.md', type: 'text' }
    { path: '/src/App.tsx', type: 'text' },
    { path: '/src/main.css', type: 'text' },
    { path: '/src/ErrorFallback.tsx', type: 'text'
    { path: '/src/lib/utils.ts', type: 'text' }
    { path: '/README.md', type: 'text' },
    { path: '/src/hooks/use-online-sta
    { path: '/src/components/BarcodeScanner.t
    { path: '/src/components/ProductTable.tsx',
    { path: '/src/App.tsx', type: 'text' },
    { path: '/src/components/ConnectionIndic
    { path: '/src/main.css', type: 'text' },
  for (const file of filesToExport) {
      const response = await fetch(file.path)
        const content = await response.text()
      }
      console.warn(`Nie można pobrać pliku: ${fi
  }
  const uiComponentsDir = zip.folder('src/components/ui
    'accordion.tsx', 'alert-dialog.tsx', 'alert.tsx', 'aspect-
    'calendar.tsx', 'card.tsx', 'carousel.tsx', 'chart.tsx',
    'dialog.tsx', 'drawer.tsx', 'dropdown-menu.tsx', 'form.tsx',
    'menubar.tsx', 'navigation-menu.tsx', 'pagination.tsx', 'popover
    'select.tsx', 'separator.tsx', 'sheet.tsx', 'sidebar.tsx',
    'table.tsx', 'tabs.tsx', 'textarea.tsx', 'toggle-group.tsx
  ]
  for (const component of uiComponents) {
      const response = await fetch(`/src/components/ui/${component}`)
        const content = await response.text()
  ]
  
  for (const file of filesToExport) {
  const b
      const response = await fetch(file.path)
  link.href = url
        const content = await response.text()
  document.body.removeChild(link)
      }



  }





    'calendar.tsx', 'card.tsx', 'carousel.tsx', 'chart.tsx',

    'dialog.tsx', 'drawer.tsx', 'dropdown-menu.tsx', 'form.tsx',



    'select.tsx', 'separator.tsx', 'sheet.tsx', 'sidebar.tsx',




  










  }



  const url = URL.createObjectURL(blob)

  link.href = url

  document.body.appendChild(link)

  document.body.removeChild(link)

}
