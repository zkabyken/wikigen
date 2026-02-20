export function ThinkingIndicator({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
