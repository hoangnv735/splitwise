'use client';

import type * as React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AttendeeManagerProps {
  attendees: string[];
  onAttendeesChange: (attendees: string[]) => void;
}

export function AttendeeManager({ attendees, onAttendeesChange }: AttendeeManagerProps) {
  const [newAttendeeName, setNewAttendeeName] = useState('');

  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAttendeeName.trim() && !attendees.includes(newAttendeeName.trim())) {
      onAttendeesChange([...attendees, newAttendeeName.trim()]);
      setNewAttendeeName('');
    }
  };

  const handleRemoveAttendee = (attendeeToRemove: string) => {
    onAttendeesChange(attendees.filter(attendee => attendee !== attendeeToRemove));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Users className="mr-2 h-6 w-6 text-primary" />
          Picnic Attendees
        </CardTitle>
        <CardDescription>Add or remove participants for the picnic.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddAttendee} className="flex gap-2 mb-4">
          <Input
            type="text"
            value={newAttendeeName}
            onChange={(e) => setNewAttendeeName(e.target.value)}
            placeholder="Enter attendee name"
            className="flex-grow"
            aria-label="New attendee name"
          />
          <Button type="submit" variant="outline">
            <UserPlus className="mr-2 h-4 w-4" /> Add Attendee
          </Button>
        </form>
        {attendees.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Current Attendees:</h3>
            <ul className="flex flex-wrap gap-2">
              {attendees.map(attendee => (
                <li key={attendee}>
                  <Badge variant="secondary" className="text-sm py-1 px-3 rounded-full flex items-center">
                    {attendee}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-5 w-5 hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => handleRemoveAttendee(attendee)}
                      aria-label={`Remove ${attendee}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No attendees added yet. Add some to get started!</p>
        )}
      </CardContent>
    </Card>
  );
}
