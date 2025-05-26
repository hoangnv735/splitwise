
'use client';

import type * as React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X, Users, PlusCircle, Trash2 } from 'lucide-react';
import type { AttendeeGroup } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface GroupManagerProps {
  attendees: string[];
  groups: AttendeeGroup[];
  onAddGroup: (groupName: string, members: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
}

export function GroupManager({ attendees, groups, onAddGroup, onDeleteGroup }: GroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { toast } = useToast();

  const handleMemberToggle = (member: string) => {
    setSelectedMembers(prev =>
      prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
    );
  };

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast({ title: 'Group Name Required', description: 'Please enter a name for the group.', variant: 'destructive' });
      return;
    }
    if (selectedMembers.length === 0) {
      toast({ title: 'No Members Selected', description: 'Please select at least one member for the group.', variant: 'destructive' });
      return;
    }
    if (groups.some(g => g.name.toLowerCase() === newGroupName.trim().toLowerCase())) {
      toast({ title: 'Group Name Exists', description: 'A group with this name already exists. Please choose a different name.', variant: 'destructive' });
      return;
    }

    onAddGroup(newGroupName.trim(), selectedMembers);
    setNewGroupName('');
    setSelectedMembers([]);
    toast({ title: 'Group Added', description: `Group "${newGroupName.trim()}" created successfully.`});
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Users className="mr-2 h-6 w-6 text-primary" />
          Manage Attendee Groups
        </CardTitle>
        <CardDescription>Create and manage groups of attendees for easier expense splitting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAddGroupSubmit} className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold flex items-center"><PlusCircle className="mr-2 h-5 w-5 text-accent" />Create New Group</h3>
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g., Core Team, Lunch Buddies"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Select Members</Label>
            {attendees.length > 0 ? (
              <ScrollArea className="h-32 mt-1 rounded-md border p-2">
                {attendees.map(attendee => (
                  <div key={attendee} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`member-${attendee}`}
                      checked={selectedMembers.includes(attendee)}
                      onCheckedChange={() => handleMemberToggle(attendee)}
                    />
                    <Label htmlFor={`member-${attendee}`} className="font-normal">{attendee}</Label>
                  </div>
                ))}
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">Add attendees first to select members for a group.</p>
            )}
          </div>
          <Button type="submit" disabled={attendees.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Group
          </Button>
        </form>

        {groups.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Existing Groups</h3>
            <ScrollArea className="h-40 rounded-md border">
              <ul className="p-2 space-y-2">
                {groups.map(group => (
                  <li key={group.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {group.members.map(member => (
                          <Badge key={member} variant="outline" className="text-xs">{member}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => onDeleteGroup(group.id)}
                      aria-label={`Delete group ${group.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
         {groups.length === 0 && attendees.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No groups created yet. Create one above!</p>
        )}
      </CardContent>
    </Card>
  );
}
