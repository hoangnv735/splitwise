
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Expense } from '@/lib/types';
import { suggestAttributions } from '@/ai/flows/suggest-attributions';
import { Wand2, ListPlus, DollarSign, UserCircle, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

const expenseFormSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  paidBy: z.string().min(1, 'Payer is required.'),
  participants: z.array(z.string()).min(1, 'At least one participant is required.'),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  attendees: string[];
  onAddExpense: (expense: Expense) => void;
}

export function ExpenseForm({ attendees, onAddExpense }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      paidBy: '',
      participants: [], // Initialize with empty, useEffect will populate based on attendees
    },
  });

  const watchedDescription = form.watch('description');

  useEffect(() => {
    // When attendees list changes, default participants to all current attendees
    form.setValue('participants', attendees, { shouldValidate: true });

    // Reset paidBy if the selected payer is no longer in attendees
    const currentPaidBy = form.getValues('paidBy');
    if (currentPaidBy && !attendees.includes(currentPaidBy)) {
      form.setValue('paidBy', '', { shouldValidate: true });
    }
  }, [attendees, form.setValue, form.getValues]);


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
      const suggestions = await suggestAttributions({ description, participants: attendees });
      const suggestedParticipants = Object.entries(suggestions)
        .filter(([, score]) => score > 0.5) // Threshold for suggestion
        .map(([name]) => name);
      
      if (suggestedParticipants.length > 0) {
        form.setValue('participants', suggestedParticipants, { shouldValidate: true });
        toast({
          title: 'Participants Suggested',
          description: 'AI has suggested participants based on the description.',
        });
      } else {
        toast({
          title: 'No Strong Suggestions',
          description: 'AI could not confidently suggest participants. Please select manually.',
        });
      }
    } catch (error) {
      console.error('AI Suggestion Error:', error);
      toast({
        title: 'AI Suggestion Error',
        description: 'Could not get suggestions from AI. Please try again or select manually.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  function onSubmit(data: ExpenseFormValues) {
    onAddExpense({
      id: crypto.randomUUID(),
      ...data,
    });
    // Reset the form, ensuring new participants default to all current attendees
    form.reset({
      description: '',
      amount: 0,
      paidBy: '', // Clears payer for the next entry
      participants: attendees, // Default to all attendees for the next expense
    });
    
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
        <CardDescription>Log a new expense and assign it to participants.</CardDescription>
      </CardHeader>
      <CardContent>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={attendees.length === 0}>
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
            <FormField
              control={form.control}
              name="participants"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base flex items-center"><Users className="mr-1 h-4 w-4"/>Participants</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Select who shared this expense. Defaults to all attendees.
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

