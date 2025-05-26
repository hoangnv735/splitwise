
'use client';

import type { Settlement, Balance } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, TrendingUp, TrendingDown, Scale, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BalanceSheetDisplayProps {
  settlements: Settlement[];
  balances: Balance[];
}

export function BalanceSheetDisplay({ settlements, balances }: BalanceSheetDisplayProps) {
  const { toast } = useToast();
  const hasData = balances.length > 0 || settlements.length > 0;
  const allSettled = hasData && settlements.length === 0 && balances.every(b => Math.abs(b.amount) < 0.01);

  const handleExportToText = () => {
    if (!hasData && !allSettled) {
      toast({
        title: 'No Data to Export',
        description: 'Calculate balances first.',
        variant: 'default',
      });
      return;
    }

    let textOutput = "Splitwise Summary:\n\n";

    if (allSettled) {
      textOutput += "🎉 All expenses are perfectly settled!\n";
    } else {
      if (balances.length > 0) {
        textOutput += "--- Balances ---\n";
        balances.forEach(balance => {
          textOutput += `${balance.attendeeName}: ${balance.amount >= 0 ? `is owed $${Math.abs(balance.amount).toFixed(2)}` : `owes $${Math.abs(balance.amount).toFixed(2)}`}\n`;
        });
        textOutput += "\n";
      }

      if (settlements.length > 0) {
        textOutput += "--- Payments ---\n";
        settlements.forEach(settlement => {
          textOutput += `${settlement.from} pays ${settlement.to} $${settlement.amount.toFixed(2)}\n`;
        });
      } else if (balances.length > 0 && !allSettled) {
        textOutput += "--- Payments ---\nNo transactions needed, but balances are not zero (likely due to rounding or very small amounts).\n";
      }
    }

    navigator.clipboard.writeText(textOutput)
      .then(() => {
        toast({
          title: 'Copied to Clipboard!',
          description: 'Settlement summary text has been copied.',
        });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast({
          title: 'Copy Failed',
          description: 'Could not copy to clipboard. Your browser might not support it or permissions are denied.',
          variant: 'destructive',
        });
        // As a fallback, you could display the text in a modal for manual copying here.
        // For simplicity, this example just logs the error.
      });
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center text-2xl">
            <Scale className="mr-2 h-6 w-6 text-primary" />
            Settlement Summary
          </CardTitle>
          <CardDescription>Overview of balances and optimized payment transactions.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportToText} disabled={!hasData && !allSettled}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Export to Text
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasData && !allSettled && <p className="text-muted-foreground text-center py-4">Calculate balances to see the settlement summary.</p>}
        
        {allSettled && (
            <p className="text-center py-4 text-green-600 font-medium text-lg">🎉 All expenses are perfectly settled!</p>
        )}

        {balances.length > 0 && !allSettled && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Users className="mr-2 h-5 w-5 text-accent" />
              Individual Balances
            </h3>
            <ScrollArea className="h-[200px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map(balance => (
                    <TableRow key={balance.attendeeName}>
                      <TableCell>{balance.attendeeName}</TableCell>
                      <TableCell className={`text-right font-medium ${balance.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {balance.amount >= 0 ? <TrendingUp className="inline-block mr-1 h-4 w-4" /> : <TrendingDown className="inline-block mr-1 h-4 w-4" />}
                        ${Math.abs(balance.amount).toFixed(2)}
                        {balance.amount > 0 && " (is owed)"}
                        {balance.amount < 0 && " (owes)"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {settlements.length > 0 && !allSettled && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <ArrowRight className="mr-2 h-5 w-5 text-accent" />
              Optimized Transactions
            </h3>
            <ScrollArea className="h-[200px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement, index) => (
                    <TableRow key={index}>
                      <TableCell>{settlement.from}</TableCell>
                      <TableCell>{settlement.to}</TableCell>
                      <TableCell className="text-right">${settlement.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

