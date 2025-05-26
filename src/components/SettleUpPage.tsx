
'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Expense, Settlement, Balance, AttendeeGroup } from '@/lib/types';
import { calculateBalances, optimizeTransactions } from '@/lib/calculations';
import { AppHeader } from '@/components/AppHeader';
import { AttendeeManager } from '@/components/AttendeeManager';
import { GroupManager } from '@/components/GroupManager';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummaryTable } from '@/components/ExpenseSummaryTable';
import { BalanceSheetDisplay } from '@/components/BalanceSheetDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, TestTubeDiagonal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ALL_ATTENDEES_GROUP_ID = 'system-all-attendees';
const ALL_ATTENDEES_GROUP_NAME = 'All Attendees';

const DEMO_ATTENDEES = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
const DEMO_EXPENSES: Omit<Expense, 'id'>[] = [
  { description: 'Team Lunch at "The Grand Eatery"', amount: 120, paidBy: 'Alice', participants: ['Alice', 'Bob', 'Charlie'] },
  { description: 'Coffee & Pastries', amount: 35.50, paidBy: 'Bob', participants: ['Alice', 'Bob', 'Charlie', 'David'] },
  { description: 'Park Entrance Fee', amount: 20, paidBy: 'Charlie', participants: ['Charlie', 'David', 'Eve'] },
  { description: 'Shared Taxi Ride', amount: 25, paidBy: 'David', participants: ['Alice', 'David', 'Eve'] },
  { description: 'Picnic Blanket & Supplies', amount: 45, paidBy: 'Eve', participants: DEMO_ATTENDEES },
];


export default function SettleUpPage() {
  const [attendees, setAttendees] = useState<string[]>([]);
  const [userCreatedGroups, setUserCreatedGroups] = useState<AttendeeGroup[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const { toast } = useToast();

  const handleAttendeesChange = useCallback((newAttendees: string[]) => {
    setAttendees(newAttendees);
    
    setUserCreatedGroups(prevGroups => 
      prevGroups.map(group => ({
        ...group,
        members: group.members.filter(member => newAttendees.includes(member)),
      })).filter(group => group.members.length > 0 || group.isSystemGroup)
    );

    setExpenses(prevExpenses => 
      prevExpenses.map(exp => ({
        ...exp,
        paidBy: newAttendees.includes(exp.paidBy) ? exp.paidBy : '',
        participants: exp.participants.filter(p => newAttendees.includes(p)),
      })).filter(exp => exp.paidBy !== '' && (exp.participants.length > 0 || newAttendees.length === 0))
    );

    setBalances([]);
    setSettlements([]);
  }, []);

  const handleAddGroup = useCallback((groupName: string, members: string[]) => {
    if (groupName.toLowerCase() === ALL_ATTENDEES_GROUP_NAME.toLowerCase()) {
      toast({
        title: 'Reserved Name',
        description: `"${ALL_ATTENDEES_GROUP_NAME}" is a reserved name and cannot be used.`,
        variant: 'destructive',
      });
      return;
    }
    const newGroup: AttendeeGroup = {
      id: crypto.randomUUID(),
      name: groupName,
      members,
      isSystemGroup: false,
    };
    setUserCreatedGroups(prevGroups => [...prevGroups, newGroup]);
  }, [toast]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    if (groupId === ALL_ATTENDEES_GROUP_ID) {
      toast({
        title: 'Cannot Delete',
        description: `The "${ALL_ATTENDEES_GROUP_NAME}" group cannot be deleted.`,
        variant: 'destructive',
      });
      return;
    }
    setUserCreatedGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
    toast({ title: 'Group Deleted', description: 'The attendee group has been removed.' });
  }, [toast]);

  const handleAddExpense = useCallback((newExpense: Expense) => {
    setExpenses(prevExpenses => [...prevExpenses, newExpense]);
    setBalances([]);
    setSettlements([]);
  }, []);

  const handleDeleteExpense = useCallback((expenseId: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseId));
    setBalances([]); 
    setSettlements([]);
  }, []);

  const handleCalculate = () => {
    if (attendees.length === 0 && expenses.length > 0) {
       toast({
        title: "Cannot Calculate",
        description: "There are expenses but no attendees. Please add attendees or remove expenses.",
        variant: "destructive",
      });
      setBalances([]);
      setSettlements([]);
      return;
    }
    if (expenses.length === 0) {
      toast({
        title: "No Expenses to Calculate",
        description: "There are no expenses to calculate. Add some first!",
        variant: "default", // Changed from destructive
      });
      setBalances([]);
      setSettlements([]);
      return;
    }
     if (attendees.length === 0 && expenses.length === 0) { // Should not be reached if button disabled
       toast({
        title: "Nothing to Calculate",
        description: "Please add attendees and expenses.",
        variant: "default",
      });
      return;
    }

    const validExpenses = expenses.filter(exp => exp.participants.length > 0 && attendees.includes(exp.paidBy));
    
    if(validExpenses.length === 0 && expenses.length > 0) {
      toast({
        title: "Invalid Expenses for Calculation",
        description: "None of the current expenses have valid participants or payers from the current attendee list. Please check your expenses or attendees.",
        variant: "destructive",
      });
      setBalances([]);
      setSettlements([]);
      return;
    }
    
    if(validExpenses.length === 0 && expenses.length === 0) { // Should not be reached due to earlier checks
        toast({
          title: "No Valid Expenses",
          description: "No valid expenses to calculate with the current attendees.",
          variant: "default",
        });
        setBalances([]);
        setSettlements([]);
        return;
    }


    const calculatedBalances = calculateBalances(attendees, validExpenses);
    setBalances(calculatedBalances);
    const optimizedSettlements = optimizeTransactions(calculatedBalances);
    setSettlements(optimizedSettlements);

    if (calculatedBalances.length > 0 || optimizedSettlements.length > 0) {
      toast({
        title: 'Calculation Complete',
        description: 'Balances and settlements have been updated.',
      });
    } else if (validExpenses.length > 0 && calculatedBalances.every(b => Math.abs(b.amount) < 0.01)) {
       toast({
        title: 'Calculation Complete',
        description: 'All expenses are perfectly settled among attendees!',
        variant: 'default' 
      });
    } else if (validExpenses.length === 0) {
        // This case should ideally be caught earlier
        toast({
            title: 'No Valid Expenses for Calculation',
            description: 'No expenses could be used for calculation with the current attendees.',
            variant: 'default',
        });
    }
  };

  const loadDemoData = () => {
    setAttendees([]); // Clear existing attendees first to ensure clean slate for demo members
    setUserCreatedGroups([]);
    setExpenses([]);
    setBalances([]);
    setSettlements([]);

    // Use a timeout to ensure state updates from clearing are processed before adding new data
    setTimeout(() => {
      setAttendees(DEMO_ATTENDEES);
      const demoExpensesWithIds: Expense[] = DEMO_EXPENSES.map(exp => ({
        ...exp,
        id: crypto.randomUUID(),
      }));
      setExpenses(demoExpensesWithIds);
      toast({
        title: 'Demo Data Loaded',
        description: 'Sample attendees and expenses have been added.',
      });
    }, 0);
  };


  const allAttendeesGroupForDisplay: AttendeeGroup = useMemo(() => ({
    id: ALL_ATTENDEES_GROUP_ID,
    name: ALL_ATTENDEES_GROUP_NAME,
    members: attendees, 
    isSystemGroup: true,
  }), [attendees]);

  const displayedGroups = useMemo(() => {
    const validUserGroups = userCreatedGroups.filter(g => g.members.some(m => attendees.includes(m)));
    return attendees.length > 0 ? [allAttendeesGroupForDisplay, ...validUserGroups] : [...validUserGroups];
  }, [allAttendeesGroupForDisplay, userCreatedGroups, attendees]);
  
  const canCalculate = expenses.length > 0 && attendees.length > 0 && expenses.some(e => e.participants.length > 0 && attendees.includes(e.paidBy));
  const showBalanceSheet = balances.length > 0 || settlements.length > 0 || (canCalculate && settlements.length === 0 && balances.every(b => Math.abs(b.amount) < 0.01));

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <div className="flex justify-end">
            <Button variant="outline" onClick={loadDemoData} size="sm">
                <TestTubeDiagonal className="mr-2 h-4 w-4" />
                Load Demo Data
            </Button>
        </div>
        
        <AttendeeManager attendees={attendees} onAttendeesChange={handleAttendeesChange} />
        
        <GroupManager 
          attendees={attendees} 
          groups={displayedGroups} 
          onAddGroup={handleAddGroup} 
          onDeleteGroup={handleDeleteGroup}
          reservedGroupName={ALL_ATTENDEES_GROUP_NAME}
        />
        
        <ExpenseForm 
          attendees={attendees} 
          groups={displayedGroups} 
          onAddExpense={handleAddExpense} 
        />

        {expenses.length > 0 && (
          <ExpenseSummaryTable 
            expenses={expenses} 
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {(attendees.length > 0 || expenses.length > 0) && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <Button 
                onClick={handleCalculate} 
                className="w-full text-lg py-6" 
                size="lg" 
                disabled={!canCalculate && !(expenses.length === 0 && attendees.length > 0)} // Disable if no valid expenses or if no expenses AND no attendees
              >
                <Calculator className="mr-2 h-5 w-5" /> Calculate Balances & Settle Up
              </Button>
            </CardContent>
          </Card>
        )}
        
        {showBalanceSheet && (
           <BalanceSheetDisplay settlements={settlements} balances={balances} />
        )}
        
      </main>
      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground border-t">
        SettleUp Picnics &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

