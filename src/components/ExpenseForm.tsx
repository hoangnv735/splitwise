
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Expense, AttendeeGroup } from '@/lib/types';
import { suggestAttributions } from '@/ai/flows/suggest-attributions';
import { Wand2, ListPlus, DollarSign, UserCircle, Users, Users2Icon, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const expenseFormSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  paidBy: z.string().min(1, 'Payer is required.'),
  participants: z.array(z.string()).min(1, 'At least one participant is required.'),
  selectedGroupId: z.string().optional(), // For tracking selected group
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  attendees: string[];
  groups: AttendeeGroup[];
  onAddExpense: (expense: Expense) => void;
}

export function ExpenseForm({ attendees, groups, onAddExpense }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [fastInputText, setFastInputText] = useState('');
  
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      paidBy: '',
      participants: attendees, 
      selectedGroupId: undefined,
    },
  });

  const watchedDescription = form.watch('description');
  const watchedSelectedGroupId = form.watch('selectedGroupId');

  useEffect(() => {
    // This effect ensures participants are correctly set based on attendees and selected group
    // It also handles scenarios where attendees list changes or paidBy becomes invalid
    const currentSelectedGroupId = form.getValues('selectedGroupId');
    if (currentSelectedGroupId) {
      const group = groups.find(g => g.id === currentSelectedGroupId);
      if (group) {
        const validMembers = group.members.filter(member => attendees.includes(member));
        // Only update if different to avoid re-renders / potential loops
        if (JSON.stringify(form.getValues('participants')) !== JSON.stringify(validMembers)) {
           form.setValue('participants', validMembers, { shouldValidate: true });
        }
      } else {
        // Group ID is set but group not found (e.g. deleted), reset to all attendees
        form.setValue('participants', attendees, { shouldValidate: true });
        form.setValue('selectedGroupId', undefined); // Clear invalid group ID
      }
    } else {
      // No group selected, default to all attendees
       if (JSON.stringify(form.getValues('participants')) !== JSON.stringify(attendees)) {
        form.setValue('participants', attendees, { shouldValidate: true });
      }
    }

    // Validate paidBy
    const currentPaidBy = form.getValues('paidBy');
    if (currentPaidBy && !attendees.includes(currentPaidBy)) {
      form.setValue('paidBy', '', { shouldValidate: true });
    }
  }, [attendees, groups, form, watchedSelectedGroupId]); // Re-run when selectedGroupId changes from dropdown or fast input


  const handleSuggestParticipants = async () => {
    const description = form.getValues('description');
    if (!description || attendees.length === 0) {
      toast({
        title: 'Suggestion Failed',
        description: 'Please enter a description and add attendees first.',
        variant: 'destructive',
      });
      return;
    }
    setIsSuggesting(true);
    try {
      form.setValue('selectedGroupId', undefined); // Clear group selection when AI suggests
      const suggestions = await suggestAttributions({ description, participants: attendees });
      const suggestedParticipants = Object.entries(suggestions)
        .filter(([, score]) => score > 0.5)
        .map(([name]) => name);
      
      if (suggestedParticipants.length > 0) {
        form.setValue('participants', suggestedParticipants, { shouldValidate: true });
        toast({
          title: 'Participants Suggested',
          description: 'AI has suggested participants. Group selection cleared.',
        });
      } else {
        toast({
          title: 'No Strong Suggestions',
          description: 'AI could not confidently suggest. Please select manually.',
        });
        form.setValue('participants', attendees, { shouldValidate: true }); // Default to all if no suggestion
      }
    } catch (error) {
      console.error('AI Suggestion Error:', error);
      toast({
        title: 'AI Suggestion Error',
        description: 'Could not get suggestions. Please try again or select manually.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleApplyFastInput = () => {
    if (!fastInputText.trim()) {
      toast({ title: 'Fast Entry Empty', description: 'Please enter expense details.', variant: 'destructive' });
      return;
    }

    const parts = fastInputText.split(',').map(part => part.trim());
    
    if (parts.length < 3 || parts.length > 4) {
      toast({
        title: 'Invalid Fast Entry Format',
        description: 'Expected: Desc, Amount, Payer OR Desc, Amount, Payer, GroupName',
        variant: 'destructive',
      });
      return;
    }

    const [desc, amountStr, payerName, groupNameInput = ''] = parts;
    const amountNum = parseFloat(amountStr);

    if (!desc) {
      toast({ title: 'Invalid Fast Entry', description: 'Description cannot be empty.', variant: 'destructive' });
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: 'Invalid Fast Entry', description: 'Amount must be a positive number.', variant: 'destructive' });
      return;
    }
    if (!payerName) {
      toast({ title: 'Invalid Fast Entry', description: 'Payer name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!attendees.includes(payerName)) {
      toast({
        title: 'Invalid Fast Entry Payer',
        description: `Attendee "${payerName}" not found. Ensure payer is in attendees list.`,
        variant: 'destructive',
      });
      return;
    }

    form.setValue('description', desc, { shouldValidate: true });
    form.setValue('amount', amountNum, { shouldValidate: true });
    form.setValue('paidBy', payerName, { shouldValidate: true });

    let toastMessage = 'Description, Amount, and Payer fields updated.';

    if (parts.length === 4 && groupNameInput) {
      const group = groups.find(g => g.name.toLowerCase() === groupNameInput.toLowerCase());
      if (group) {
        const validMembers = group.members.filter(member => attendees.includes(member));
        form.setValue('participants', validMembers, { shouldValidate: true });
        form.setValue('selectedGroupId', group.id, { shouldValidate: true });
        toastMessage += ` Participants set to group "${group.name}".`;
      } else {
        toast({
          title: 'Group Not Found',
          description: `Group "${groupNameInput}" not found. Participants set to all attendees. Please verify.`,
          variant: 'destructive',
        });
        form.setValue('selectedGroupId', undefined); // Clear group if not found
        form.setValue('participants', attendees, { shouldValidate: true }); // Default to all
      }
    } else {
      // 3 parts or 4th part is empty, clear selected group, participants default via useEffect
      form.setValue('selectedGroupId', undefined);
      // The useEffect will handle setting participants to all attendees
    }

    toast({
      title: 'Fast Entry Applied',
      description: toastMessage,
    });
    setFastInputText('');
  };


  function onSubmit(data: ExpenseFormValues) {
    onAddExpense({
      id: crypto.randomUUID(),
      description: data.description,
      amount: data.amount,
      paidBy: data.paidBy,
      participants: data.participants,
    });
    
    const lastSelectedGroupId = form.getValues('selectedGroupId');
    
    form.reset({
      description: '',
      amount: 0,
      paidBy: '',
      participants: attendees, 
      selectedGroupId: lastSelectedGroupId, // Remember last selected group
    });

    // If a group was selected, re-apply its members to participants after reset
    if (lastSelectedGroupId) {
        const group = groups.find(g => g.id === lastSelectedGroupId);
        if (group) {
            const validMembers = group.members.filter(member => attendees.includes(member));
            form.setValue('participants', validMembers, { shouldValidate: false }); // No need to re-validate
        } else {
            // If group somehow became invalid, default to all attendees
            form.setValue('participants', attendees, { shouldValidate: false });
            form.setValue('selectedGroupId', undefined);
        }
    } else {
         form.setValue('participants', attendees, { shouldValidate: false });
    }


    setFastInputText('');
    
    toast({
      title: 'Expense Added',
      description: `${data.description} for $${data.amount.toFixed(2)} added successfully.`,
    });
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <DollarSign className="mr-2 h-6 w-6 text-primary" />
          Add New Expense
        </CardTitle>
        <CardDescription>Log a new expense and assign it to participants or groups.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-6 p-4 border rounded-lg bg-secondary/30">
          <Label htmlFor="fastInput" className="font-semibold flex items-center text-base">
            <Zap className="mr-2 h-5 w-5 text-accent" /> Fast Expense Entry
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="fastInput"
              type="text"
              value={fastInputText}
              onChange={(e) => setFastInputText(e.target.value)}
              placeholder="e.g., Food, 20, Alice [, GroupName]"
              className="flex-grow"
              aria-label="Fast expense entry: Description, Amount, Payer [, GroupName]"
            />
            <Button type="button" onClick={handleApplyFastInput} variant="outline" size="sm">
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter expense: Description, Amount, Payer [, Optional GroupName], separated by commas.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Picnic snacks, Drinks, Park entry fee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><UserCircle className="mr-1 h-4 w-4"/>Paid By</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={attendees.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who paid" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {attendees.map(attendee => (
                        <SelectItem key={attendee} value={attendee}>
                          {attendee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {attendees.length === 0 && <p className="text-sm text-muted-foreground">Add attendees to select a payer.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {groups.length > 0 && attendees.length > 0 && (
              <FormField
                control={form.control}
                name="selectedGroupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Users2Icon className="mr-1 h-4 w-4" />Select Group (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? undefined : value);
                        // useEffect will handle participant update
                      }} 
                      value={field.value || "none"} // "none" represents no group / all attendees / custom
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group or all attendees" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">All Attendees / Custom</SelectItem>
                        {groups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} ({group.isSystemGroup && attendees.length > 0 ? attendees.length : group.members.length} {group.members.length === 1 && !group.isSystemGroup ? 'member' : 'members'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="participants"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base flex items-center"><Users className="mr-1 h-4 w-4"/>Participants</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Select who shared this expense. {form.getValues('selectedGroupId') ? 'Adjust selection if needed.' : 'Defaults to all attendees.'}
                    </p>
                  </div>
                  {attendees.length > 0 && watchedDescription && (
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSuggestParticipants}
                        disabled={isSuggesting || attendees.length === 0 || !watchedDescription}
                        className="mb-2"
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isSuggesting ? 'Suggesting...' : 'Suggest Participants (AI)'}
                      </Button>
                  )}
                  {attendees.length > 0 ? (
                    <ScrollArea className="h-40 rounded-md border p-4">
                      {attendees.map((attendee) => (
                        <FormField
                          key={attendee}
                          control={form.control}
                          name="participants"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={attendee}
                                className="flex flex-row items-start space-x-3 space-y-0 py-2"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(attendee)}
                                    onCheckedChange={(checked) => {
                                      // When manually changing checkbox, clear selected group ID
                                      // as it's now a custom selection.
                                      if (form.getValues('selectedGroupId')) {
                                        form.setValue('selectedGroupId', undefined);
                                      }
                                      return checked
                                        ? field.onChange([...(field.value || []), attendee])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== attendee
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {attendee}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </ScrollArea>
                  ) : (
                     <p className="text-sm text-muted-foreground">Add attendees to select participants.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={attendees.length === 0}>
              <ListPlus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
