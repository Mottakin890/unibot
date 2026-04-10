export default function WidgetNotFound() {
  return (
    <div className="flex h-svh w-full items-center justify-center bg-card p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-foreground">Chatbot not found</p>
        <p className="text-xs text-muted-foreground">
          This chatbot doesn&apos;t exist or may have been removed.
        </p>
      </div>
    </div>
  )
}
