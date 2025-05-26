import { Sprout } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-6 text-center border-b border-border/50 mb-8">
      <div className="flex items-center justify-center space-x-3">
        <Sprout className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold text-foreground tracking-tight">SettleUp Picnics</h1>
      </div>
      <p className="text-muted-foreground mt-2 text-lg">
        Easily split expenses for your group picnics.
      </p>
    </header>
  );
}
