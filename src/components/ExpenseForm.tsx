
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { ListPlus, DollarSign, UserCircle, Users, Users2Icon, Zap, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const expenseFormSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  paidBy: z.string().min(1, 'Payer is required.'),
  participants: z.array(z.string()).min(1, 'At least one participant is required.'),
  selectedGroupId: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  attendees: string[];
  groups: AttendeeGroup[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  expenseToEdit: Expense | null;
  onCancelEdit: () => void;
}

export function ExpenseForm({ attendees, groups, onAddExpense, onUpdateExpense, expenseToEdit, onCancelEdit }: ExpenseFormProps) {
  const { toast } = useToast();
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

  const watchedSelectedGroupId = form.watch('selectedGroupId');
  const isEditing = !!expenseToEdit;

  useEffect(() => {
    if (isEditing && expenseToEdit) {
      form.reset({
        description: expenseToEdit.description,
        amount: expenseToEdit.amount,
        paidBy: expenseToEdit.paidBy,
        participants: expenseToEdit.participants,
        selectedGroupId: groups.find(g =>
          g.members.length === expenseToEdit.participants.length &&
          g.members.every(m => expenseToEdit.participants.includes(m)) &&
          expenseToEdit.participants.every(p => g.members.includes(p))
        )?.id || undefined,
      });
      setFastInputText('');
    } else if (!isEditing) {
      const lastSelectedGroupId = form.getValues('selectedGroupId');
      form.reset({
        description: '',
        amount: 0,
        paidBy: '',
        participants: attendees,
        selectedGroupId: lastSelectedGroupId,
      });
      if (lastSelectedGroupId) {
        const group = groups.find(g => g.id === lastSelectedGroupId);
        if (group) {
          const validMembers = group.members.filter(member => attendees.includes(member));
          form.setValue('participants', validMembers, { shouldValidate: false });
        } else {
          form.setValue('participants', attendees, { shouldValidate: false });
          form.setValue('selectedGroupId', undefined);
        }
      } else {
        form.setValue('participants', attendees, { shouldValidate: false });
      }
    }
  }, [isEditing, expenseToEdit, form, groups, attendees]);


  useEffect(() => {
    if (isEditing) return;

    const currentSelectedGroupId = form.getValues('selectedGroupId');
    if (currentSelectedGroupId) {
      const group = groups.find(g => g.id === currentSelectedGroupId);
      if (group) {
        const validMembers = group.members.filter(member => attendees.includes(member));
        if (JSON.stringify(form.getValues('participants')) !== JSON.stringify(validMembers)) {
           form.setValue('participants', validMembers, { shouldValidate: true });
        }
      } else {
        form.setValue('participants', attendees, { shouldValidate: true });
        form.setValue('selectedGroupId', undefined);
      }
    } else {
       if (JSON.stringify(form.getValues('participants')) !== JSON.stringify(attendees)) {
        form.setValue('participants', attendees, { shouldValidate: true });
      }
    }

    const currentPaidBy = form.getValues('paidBy');
    if (currentPaidBy && !attendees.includes(currentPaidBy)) {
      form.setValue('paidBy', '', { shouldValidate: true });
    }
  }, [attendees, groups, form, watchedSelectedGroupId, isEditing]);


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
        form.setValue('selectedGroupId', undefined);
        form.setValue('participants', attendees, { shouldValidate: true });
      }
    } else {
      form.setValue('selectedGroupId', undefined);
      form.setValue('participants', attendees, { shouldValidate: true });
    }

    toast({
      title: 'Fast Entry Applied',
      description: toastMessage,
    });
    setFastInputText('');
  };


  function onSubmit(data: ExpenseFormValues) {
    if (isEditing && expenseToEdit) {
      onUpdateExpense({ ...data, id: expenseToEdit.id });
    } else {
      onAddExpense({
        id: crypto.randomUUID(),
        ...data,
      });
    }

    setFastInputText('');

    toast({
      title: isEditing ? 'Expense Updated' : 'Expense Added',
      description: `${data.description} for $${data.amount.toFixed(2)} ${isEditing ? 'updated' : 'added'} successfully.`,
    });
  }

  const handleCancelEdit = () => {
    onCancelEdit();
    toast({ title: 'Edit Cancelled', variant: 'default' });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <DollarSign className="mr-2 h-6 w-6 text-primary" />
          {isEditing ? 'Edit Expense' : 'Add New Expense'}
        </CardTitle>
        <CardDescription>{isEditing ? 'Update the details of this expense.' : 'Log a new expense and assign it.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3 mb-4 p-3 border rounded-lg bg-secondary/30">
              <Label htmlFor="fastInput" className="font-semibold flex items-center text-md">
                <Zap className="mr-2 h-5 w-5 text-accent" /> Fast Apply to Form
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
                  disabled={isEditing}
                />
                <Button type="button" onClick={handleApplyFastInput} variant="outline" size="sm" disabled={isEditing}>
                  Apply
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isEditing ? "Fast entry disabled while editing." : "Populates fields below. Then, review and submit."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Snacks, Drinks, Tickets" {...field} />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel className="flex items-center"><Users2Icon className="mr-1 h-4 w-4" />Select Group (for Participants)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value === "none" ? undefined : value);
                        }}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Attendees / Custom" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">All Attendees / Custom</SelectItem>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name} ({group.isSystemGroup && attendees.length > 0 ? attendees.length : group.members.filter(m => attendees.includes(m)).length} {group.members.filter(m => attendees.includes(m)).length === 1 && !group.isSystemGroup ? 'member' : 'members'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button type="submit" className="w-full sm:flex-1" disabled={attendees.length === 0}>
                <ListPlus className="mr-2 h-4 w-4" /> {isEditing ? 'Update Expense' : 'Add Expense'}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full sm:flex-1">
                  <XCircle className="mr-2 h-4 w-4" /> Cancel Edit
                </Button>
              )}
            </div>

            <div className="mt-4 space-y-2">
                <FormField
                  control={form.control}
                  name="participants"
                  render={() => (
                    <FormItem>
                      <div className="mb-1">
                        <FormLabel className="text-base flex items-center"><Users className="mr-1 h-4 w-4"/>Participants</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Select who shared this expense. {form.getValues('selectedGroupId') ? 'Adjust selection if needed.' : (isEditing ? '' : 'Defaults to all.')}
                        </p>
                      </div>
                      {attendees.length > 0 ? (
                        <ScrollArea className="h-32 rounded-md border p-2">
                          {attendees.map((attendee) => (
                            <FormField
                              key={attendee}
                              control={form.control}
                              name="participants"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={attendee}
                                    className="flex flex-row items-center space-x-2 space-y-0 py-1"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(attendee)}
                                        onCheckedChange={(checked) => {
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
                                    <FormLabel className="font-normal text-sm">
                                      {attendee}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </ScrollArea>
                      ) : (
                        <p className="text-sm text-muted-foreground p-2 border rounded-md text-center">Add attendees to select participants.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
