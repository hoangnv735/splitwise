
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Expense, Settlement, Balance, AttendeeGroup, ProjectData } from '@/lib/types';
import { calculateBalances, optimizeTransactions, consolidateIndividualPayments } from '@/lib/calculations';
import { AppHeader } from '@/components/AppHeader';
import { AttendeeManager } from '@/components/AttendeeManager';
import { GroupManager } from '@/components/GroupManager';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummaryTable } from '@/components/ExpenseSummaryTable';
import { BalanceSheetDisplay } from '@/components/BalanceSheetDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TestTubeDiagonal, Save, Upload, FileJson, Rows, Columns } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


const ALL_ATTENDEES_GROUP_ID = 'system-all-attendees';
const ALL_ATTENDEES_GROUP_NAME = 'All Attendees';
const PROJECT_DATA_VERSION = 1;

const DEMO_ATTENDEES = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
const DEMO_EXPENSES_DATA: Omit<Expense, 'id'>[] = [
  { description: 'Team Lunch at "The Grand Eatery"', amount: 120, paidBy: 'Alice', participants: ['Alice', 'Bob', 'Charlie'] },
  { description: 'Coffee & Pastries', amount: 35.50, paidBy: 'Bob', participants: ['Alice', 'Bob', 'Charlie', 'David'] },
  { description: 'Park Entrance Fee', amount: 20, paidBy: 'Charlie', participants: ['Charlie', 'David', 'Eve'] },
  { description: 'Shared Taxi Ride', amount: 25, paidBy: 'David', participants: ['Alice', 'David', 'Eve'] },
  { description: 'Activity Supplies', amount: 45, paidBy: 'Eve', participants: DEMO_ATTENDEES },
];


export default function SettleUpPage() {
  const [attendees, setAttendees] = useState<string[]>([]);
  const [userCreatedGroups, setUserCreatedGroups] = useState<AttendeeGroup[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'single' | 'dual'>('single');


  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleAttendeesChange = useCallback((newAttendees: string[]) => {
    setAttendees(newAttendees);
    
    setUserCreatedGroups(prevGroups => 
      prevGroups.map(group => ({
        ...group,
        members: group.members.filter(member => newAttendees.includes(member)),
      })).filter(group => group.isSystemGroup || group.members.length > 0) 
    );

    setExpenses(prevExpenses => 
      prevExpenses.map(exp => ({
        ...exp,
        paidBy: newAttendees.includes(exp.paidBy) ? exp.paidBy : '', 
        participants: exp.participants.filter(p => newAttendees.includes(p)),
      }))
      .filter(exp => exp.paidBy !== '' && (exp.participants.length > 0 || newAttendees.length === 0)) 
    );

    setBalances([]);
    setSettlements([]);
    setEditingExpenseId(null); 
    setEditingGroupId(null);
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
    toast({ title: 'Group Added', description: `Group "${groupName}" created successfully.` });
  }, [toast]);

  const handleUpdateGroup = useCallback((updatedGroup: AttendeeGroup) => {
    setUserCreatedGroups(prevGroups => 
      prevGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
    setEditingGroupId(null);
    toast({ title: 'Group Updated', description: `Group "${updatedGroup.name}" updated successfully.` });
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
    if (editingGroupId === groupId) {
      setEditingGroupId(null);
    }
    toast({ title: 'Group Deleted', description: 'The attendee group has been removed.' });
  }, [toast, editingGroupId]);

  const handleAddExpense = useCallback((newExpense: Expense) => {
    setExpenses(prevExpenses => [...prevExpenses, newExpense]);
    setBalances([]);
    setSettlements([]);
  }, []);

  const handleUpdateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prevExpenses => 
      prevExpenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp)
    );
    setEditingExpenseId(null);
    setBalances([]);
    setSettlements([]);
    toast({ title: 'Expense Updated', description: `Expense "${updatedExpense.description}" updated.` });
  }, [toast]);


  const handleDeleteExpense = useCallback((expenseId: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseId));
    if (editingExpenseId === expenseId) {
      setEditingExpenseId(null);
    }
    setBalances([]); 
    setSettlements([]);
  }, [editingExpenseId]);

  const handleCalculate = () => {
    if (attendees.length === 0 && expenses.length > 0) {
       toast({
        title: "Cannot Calculate",
        description: "There are expenses but no attendees. Please add attendees or remove invalid expenses.",
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
        variant: "default",
      });
      if (attendees.length > 0) {
        setBalances(attendees.map(name => ({ attendeeName: name, amount: 0 })));
      } else {
        setBalances([]);
      }
      setSettlements([]);
      return;
    }
     if (attendees.length === 0 && expenses.length === 0) { 
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
    
    if(validExpenses.length === 0 && expenses.length === 0) { 
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
    const finalSettlements = consolidateIndividualPayments(optimizedSettlements);
    setSettlements(finalSettlements);

    if (calculatedBalances.length > 0 || finalSettlements.length > 0) {
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
        toast({
            title: 'No Valid Expenses for Calculation',
            description: 'No expenses could be used for calculation with the current attendees.',
            variant: 'default',
        });
    }
  };

  const loadDemoData = () => {
    setAttendees([]); 
    setUserCreatedGroups([]);
    setExpenses([]);
    setBalances([]);
    setSettlements([]);
    setEditingExpenseId(null);
    setEditingGroupId(null);

    setTimeout(() => {
      setAttendees(DEMO_ATTENDEES);
      const demoExpensesWithIds: Expense[] = DEMO_EXPENSES_DATA.map(exp => ({
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

  const handleSaveProject = () => {
    const projectData: ProjectData = {
      version: PROJECT_DATA_VERSION,
      attendees,
      userCreatedGroups,
      expenses,
    };
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'splitwise_project.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: 'Project Saved', description: 'Project data downloaded as splitwise_project.json.' });
  };

  const handleLoadProjectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File content is not a string.');
        }
        const loadedData = JSON.parse(text) as Partial<ProjectData>;

        if (
          !loadedData ||
          typeof loadedData !== 'object' ||
          !Array.isArray(loadedData.attendees) ||
          !Array.isArray(loadedData.userCreatedGroups) ||
          !Array.isArray(loadedData.expenses) ||
          (loadedData.version && typeof loadedData.version !== 'number')
        ) {
          throw new Error('Invalid project file structure.');
        }
        
        const isValidAttendees = loadedData.attendees.every(a => typeof a === 'string');

        if (!isValidAttendees) {
            throw new Error('Invalid data within project file.');
        }

        setAttendees(loadedData.attendees as string[]);
        setUserCreatedGroups(loadedData.userCreatedGroups as AttendeeGroup[]);
        setExpenses(loadedData.expenses as Expense[]);
        
        setBalances([]);
        setSettlements([]);
        setEditingExpenseId(null);
        setEditingGroupId(null);
        
        toast({ title: 'Project Loaded', description: 'Project data loaded successfully.' });
      } catch (error) {
        console.error("Error loading project file:", error);
        let errorMessage = 'Failed to load project file.';
        if (error instanceof Error) {
            errorMessage = error.message.includes('Invalid') ? error.message : 'File is not valid JSON or has incorrect structure.';
        }
        toast({
          title: 'Load Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };
  
  const toggleLayoutMode = () => {
    setLayoutMode(prevMode => {
      const newMode = prevMode === 'dual' ? 'single' : 'dual';
      toast({
        title: 'Layout Changed',
        description: `Switched to ${newMode}-column layout.`,
      });
      return newMode;
    });
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
  const showBalanceSheet = balances.length > 0 || settlements.length > 0 || (balances.length > 0 && settlements.length === 0 && balances.every(b => Math.abs(b.amount) < 0.01));

  const expenseToEdit = useMemo(() => {
    return expenses.find(exp => exp.id === editingExpenseId) || null;
  }, [expenses, editingExpenseId]);

  const groupToEdit = useMemo(() => {
    return userCreatedGroups.find(g => g.id === editingGroupId) || null;
  }, [userCreatedGroups, editingGroupId]);

  const handleSetEditingExpense = (id: string | null) => {
    setEditingExpenseId(id);
    if (id !== null) setEditingGroupId(null); 
  };

  const handleSetEditingGroup = (id: string | null) => {
    setEditingGroupId(id);
    if (id !== null) setEditingExpenseId(null); 
  };


  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <FileJson className="mr-2 h-5 w-5 text-primary" />
              Project Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-end flex-wrap">
            <Button variant="outline" onClick={handleSaveProject} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Project
            </Button>
            <div className="flex flex-col items-start w-full sm:w-auto sm:flex-grow">
                <Label htmlFor="load-project-input" className="mb-1 text-sm font-medium">Load Project (JSON):</Label>
                <Input
                    id="load-project-input"
                    type="file"
                    accept=".json"
                    onChange={handleLoadProjectFile}
                    ref={fileInputRef}
                    className="w-full file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
            </div>
             <Button variant="outline" onClick={loadDemoData} size="sm" className="w-full sm:w-auto">
                <TestTubeDiagonal className="mr-2 h-4 w-4" />
                Load Demo
            </Button>
             <Button variant="outline" onClick={toggleLayoutMode} size="sm" className="w-full sm:w-auto">
                {layoutMode === 'dual' ? <Rows className="mr-2 h-4 w-4" /> : <Columns className="mr-2 h-4 w-4" />}
                {layoutMode === 'dual' ? 'Single-Column' : 'Dual-Column'} View
            </Button>
          </CardContent>
        </Card>
        
        <div className={cn(
            "grid gap-8 items-start",
            layoutMode === 'dual' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
          )}>
          <AttendeeManager attendees={attendees} onAttendeesChange={handleAttendeesChange} />
          <GroupManager 
            attendees={attendees} 
            groups={displayedGroups} 
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onEditGroup={handleSetEditingGroup}
            groupToEdit={groupToEdit}
            onCancelEdit={() => setEditingGroupId(null)}
            reservedGroupName={ALL_ATTENDEES_GROUP_NAME}
          />
        </div>
        
        <div className={cn(
          "grid gap-8 items-start",
          layoutMode === 'dual' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        )}>
          <div>
            <ExpenseForm 
              attendees={attendees} 
              groups={displayedGroups} 
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              expenseToEdit={expenseToEdit}
              onCancelEdit={() => handleSetEditingExpense(null)}
            />
          </div>
          {expenses.length > 0 && (
            <div>
              <ExpenseSummaryTable 
                expenses={expenses} 
                onDeleteExpense={handleDeleteExpense}
                onEditExpense={handleSetEditingExpense}
              />
            </div>
          )}
        </div>

        {(attendees.length > 0 || expenses.length > 0) && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <Button 
                onClick={handleCalculate} 
                className="w-full text-lg py-6" 
                size="lg" 
                disabled={!canCalculate && !(expenses.length === 0 && attendees.length > 0)}
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
        Splitwise App &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

