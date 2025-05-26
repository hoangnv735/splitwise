
'use client';

import type { Expense } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Users, UserCircle, DollarSign, Trash2, Edit, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExpenseSummaryTableProps {
  expenses: Expense[];
  onDeleteExpense: (expenseId: string) => void;
  // onEditExpense: (expenseId: string) => void; // Placeholder for future edit functionality
}

export function ExpenseSummaryTable({ expenses, onDeleteExpense }: ExpenseSummaryTableProps) {
  const { toast } = useToast();

  const handleExportToCSV = () => {
    if (expenses.length === 0) {
      toast({
        title: 'No Expenses to Export',
        description: 'There are no expenses to export.',
        variant: 'default',
      });
      return;
    }

    const headers = ['Description', 'Amount', 'Paid By', 'Participants'];
    const csvRows = [
      headers.join(','),
      ...expenses.map(expense => {
        const participantsString = expense.participants.join('; '); 
        return [
          `"${expense.description.replace(/"/g, '""')}"`, 
          expense.amount.toFixed(2),
          `"${expense.paidBy.replace(/"/g, '""')}"`,
          `"${participantsString.replace(/"/g, '""')}"`,
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'splitwise_expenses.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: 'Export Successful',
        description: 'Expenses have been exported to splitwise_expenses.csv.',
      });
    } else {
       toast({
        title: 'Export Failed',
        description: 'Your browser does not support automatic file downloads.',
        variant: 'destructive',
      });
    }
  };

  if (expenses.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Expense Summary
          </CardTitle>
          <CardDescription>A detailed list of all logged expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No expenses logged yet. Add an expense using the form above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center text-2xl">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Expense Summary
          </CardTitle>
          <CardDescription>A detailed list of all logged expenses.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
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
                <TableHead className="text-center">Actions</TableHead>
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
                       {expense.participants.length === 0 && <Badge variant="destructive" className="text-xs">None</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-accent/20 hover:text-accent-foreground"
                                onClick={() => toast({ title: 'Edit (Coming Soon)', description: 'Full edit functionality will be implemented in a future update.'})}
                                aria-label={`Edit expense ${expense.description}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Expense (Coming Soon)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-destructive/20 hover:text-destructive"
                                  aria-label={`Delete expense ${expense.description}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Expense</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the expense: "{expense.description}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                onDeleteExpense(expense.id);
                                toast({ title: 'Expense Deleted', description: `"${expense.description}" has been removed.` });
                              }}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
