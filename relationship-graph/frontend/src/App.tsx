import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-2xl font-semibold">Relationship Graph</h1>
      <p className="text-muted-foreground">
        Phase 1 initialized — frontend toolchain (React 19 + Vite + Tailwind v4 + shadcn/ui) is ready.
      </p>
      <Button>It works</Button>
    </div>
  )
}

export default App
