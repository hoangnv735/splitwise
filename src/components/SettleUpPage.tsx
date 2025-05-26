
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
import { Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ALL_ATTENDEES_GROUP_ID = 'system-all-attendees';
const ALL_ATTENDEES_GROUP_NAME = 'All Attendees';

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
      })).filter(group => group.members.length > 0) 
    );

    setExpenses(prevExpenses => 
      prevExpenses.map(exp => ({
        ...exp,
        paidBy: newAttendees.includes(exp.paidBy) ? exp.paidBy : '',
        participants: exp.participants.filter(p => newAttendees.includes(p)),
      })).filter(exp => exp.paidBy !== '' && exp.participants.length > 0)
    );

    setBalances([]);
    setSettlements([]);
  }, []);

  const handleAddGroup = useCallback((groupName: string, members: string[]) => {
    if (groupName === ALL_ATTENDEES_GROUP_NAME) {
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
      // Should not happen if delete button is hidden, but as a safeguard
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

  const handleCalculate = () => {
    if (attendees.length === 0 || expenses.length === 0) {
      toast({
        title: "Cannot Calculate",
        description: "Please add attendees and expenses before calculating.",
        variant: "destructive",
      });
      return;
    }
    const calculatedBalances = calculateBalances(attendees, expenses);
    setBalances(calculatedBalances);
    const optimizedSettlements = optimizeTransactions(calculatedBalances);
    setSettlements(optimizedSettlements);
  };

  const allAttendeesGroupForDisplay: AttendeeGroup = useMemo(() => ({
    id: ALL_ATTENDEES_GROUP_ID,
    name: ALL_ATTENDEES_GROUP_NAME,
    members: attendees,
    isSystemGroup: true,
  }), [attendees]);

  const displayedGroups = useMemo(() => {
    return attendees.length > 0 ? [allAttendeesGroupForDisplay, ...userCreatedGroups] : [...userCreatedGroups];
  }, [allAttendeesGroupForDisplay, userCreatedGroups, attendees.length]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-5xl">
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
          groups={displayedGroups} // Pass displayedGroups which includes "All Attendees"
          onAddExpense={handleAddExpense} 
        />

        {expenses.length > 0 && (
          <ExpenseSummaryTable expenses={expenses} />
        )}

        {(attendees.length > 0 && expenses.length > 0) && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <Button onClick={handleCalculate} className="w-full text-lg py-6" size="lg" disabled={attendees.length === 0 || expenses.length === 0}>
                <Calculator className="mr-2 h-5 w-5" /> Calculate Balances & Settle Up
              </Button>
            </CardContent>
          </Card>
        )}
        
        {(balances.length > 0 || settlements.length > 0 || (expenses.length > 0 && attendees.length > 0 && settlements.length === 0 && balances.every(b => Math.abs(b.amount) < 0.01))) && (
           <BalanceSheetDisplay settlements={settlements} balances={balances} />
        )}
        
      </main>
      <footer className="text-center py-4 mt-auto text-sm text-muted-foreground border-t">
        SettleUp Picnics &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
