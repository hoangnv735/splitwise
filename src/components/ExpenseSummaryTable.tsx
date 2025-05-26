'use client';

import type { Expense } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Users, UserCircle, DollarSign } from 'lucide-react';

interface ExpenseSummaryTableProps {
  expenses: Expense[];
  onDeleteExpense?: (expenseId: string) => void; // Optional: if deletion is needed from summary
}

export function ExpenseSummaryTable({ expenses, onDeleteExpense }: ExpenseSummaryTableProps) {
  if (expenses.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Expense Summary
          </CardTitle>
          <CardDescription>A detailed list of all logged picnic expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No expenses logged yet. Add an expense using the form above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <FileText className="mr-2 h-6 w-6 text-primary" />
          Expense Summary
        </CardTitle>
        <CardDescription>A detailed list of all logged picnic expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><FileText className="inline-block mr-1 h-4 w-4" />Description</TableHead>
                <TableHead className="text-right"><DollarSign className="inline-block mr-1 h-4 w-4" />Amount</TableHead>
                <TableHead><UserCircle className="inline-block mr-1 h-4 w-4" />Paid By</TableHead>
                <TableHead><Users className="inline-block mr-1 h-4 w-4" />Participants</TableHead>
                {/* Optional: Add Action column if onDeleteExpense is provided */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                  <TableCell>{expense.paidBy}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {expense.participants.map(participant => (
                        <Badge key={participant} variant="outline" className="text-xs">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
