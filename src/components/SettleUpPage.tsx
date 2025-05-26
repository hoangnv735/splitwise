'use client';

import { useState, useCallback } from 'react';
import type { Expense, Settlement, Balance } from '@/lib/types';
import { calculateBalances, optimizeTransactions } from '@/lib/calculations';
import { AppHeader } from '@/components/AppHeader';
import { AttendeeManager } from '@/components/AttendeeManager';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummaryTable } from '@/components/ExpenseSummaryTable';
import { BalanceSheetDisplay } from '@/components/BalanceSheetDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SettleUpPage() {
  const [attendees, setAttendees] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);

  const handleAttendeesChange = useCallback((newAttendees: string[]) => {
    setAttendees(newAttendees);
    // If an attendee is removed, also remove them from expenses' paidBy and participants list
    // This is a simple way, more robust logic might be needed for complex scenarios
    setExpenses(prevExpenses => 
      prevExpenses.map(exp => ({
        ...exp,
        paidBy: newAttendees.includes(exp.paidBy) ? exp.paidBy : '', // Or set to first attendee?
        participants: exp.participants.filter(p => newAttendees.includes(p)),
      })).filter(exp => exp.paidBy !== '' && exp.participants.length > 0) // Remove expenses that become invalid
    );

    // Reset calculations if attendees change
    setBalances([]);
    setSettlements([]);
  }, []);

  const handleAddExpense = useCallback((newExpense: Expense) => {
    setExpenses(prevExpenses => [...prevExpenses, newExpense]);
    // Reset calculations if new expense is added
    setBalances([]);
    setSettlements([]);
  }, []);

  const handleCalculate = () => {
    if (attendees.length === 0 || expenses.length === 0) {
      // Optionally, show a toast message
      return;
    }
    const calculatedBalances = calculateBalances(attendees, expenses);
    setBalances(calculatedBalances);
    const optimizedSettlements = optimizeTransactions(calculatedBalances);
    setSettlements(optimizedSettlements);
  };
  
  // Function to delete an expense (optional, not implemented in ExpenseSummaryTable yet)
  // const handleDeleteExpense = useCallback((expenseId: string) => {
  //   setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== expenseId));
  //   setBalances([]);
  //   setSettlements([]);
  // }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <AttendeeManager attendees={attendees} onAttendeesChange={handleAttendeesChange} />
        
        <ExpenseForm attendees={attendees} onAddExpense={handleAddExpense} />

        {expenses.length > 0 && (
          <ExpenseSummaryTable expenses={expenses} />
        )}

        {(attendees.length > 0 && expenses.length > 0) && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <Button onClick={handleCalculate} className="w-full text-lg py-6" size="lg">
                <Calculator className="mr-2 h-5 w-5" /> Calculate Balances & Settle Up
              </Button>
            </CardContent>
          </Card>
        )}
        
        {(balances.length > 0 || settlements.length > 0) && (
           <BalanceSheetDisplay settlements={settlements} balances={balances} />
        )}
        
      </main>
      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground border-t">
        SettleUp Picnics &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
