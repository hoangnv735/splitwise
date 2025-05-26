'use client';

import type { Settlement, Balance } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Users, TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface BalanceSheetDisplayProps {
  settlements: Settlement[];
  balances: Balance[];
}

export function BalanceSheetDisplay({ settlements, balances }: BalanceSheetDisplayProps) {
  const hasData = balances.length > 0 || settlements.length > 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Scale className="mr-2 h-6 w-6 text-primary" />
          Settlement Summary
        </CardTitle>
        <CardDescription>Who owes whom and individual balances.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasData && <p className="text-muted-foreground text-center py-4">Calculate balances to see the settlement summary.</p>}
        
        {balances.length > 0 && (
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

        {settlements.length > 0 && (
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
        {hasData && settlements.length === 0 && balances.every(b => Math.abs(b.amount) < 0.01) && (
            <p className="text-muted-foreground text-center py-4 text-green-600 font-medium">🎉 All expenses are perfectly settled!</p>
        )}
      </CardContent>
    </Card>
  );
}
