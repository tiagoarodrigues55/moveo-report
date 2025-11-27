import './globals.css'

export const metadata = {
  title: 'Relatório Moveo',
  description: 'Análise de conversas e ERV',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
