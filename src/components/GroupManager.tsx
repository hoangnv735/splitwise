
'use client';

import type * as React from 'react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Users, PlusCircle, Trash2, CheckSquare, Square, Info, Pencil, XCircle } from 'lucide-react';
import type { AttendeeGroup } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface GroupManagerProps {
  attendees: string[];
  groups: AttendeeGroup[];
  onAddGroup: (groupName: string, members: string[]) => void;
  onUpdateGroup: (group: AttendeeGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onEditGroup: (groupId: string) => void;
  groupToEdit: AttendeeGroup | null;
  onCancelEdit: () => void;
  reservedGroupName?: string;
}

export function GroupManager({
  attendees,
  groups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onEditGroup,
  groupToEdit,
  onCancelEdit,
  reservedGroupName
}: GroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { toast } = useToast();
  const isEditing = !!groupToEdit;

  useEffect(() => {
    // Filter selected members if attendees list changes
    setSelectedMembers(prevSelected => prevSelected.filter(member => attendees.includes(member)));
  }, [attendees]);

  useEffect(() => {
    if (isEditing && groupToEdit) {
      setNewGroupName(groupToEdit.name);
      // Ensure selected members are valid within the current attendees list
      setSelectedMembers(groupToEdit.members.filter(member => attendees.includes(member)));
    } else {
      setNewGroupName('');
      setSelectedMembers([]);
    }
  }, [isEditing, groupToEdit, attendees]);

  const handleMemberToggle = (member: string) => {
    setSelectedMembers(prev =>
      prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
    );
  };

  const handleSelectAllMembers = () => {
    setSelectedMembers([...attendees]);
  };

  const handleDeselectAllMembers = () => {
    setSelectedMembers([]);
  };

  const handleSubmitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGroupName = newGroupName.trim();

    if (!trimmedGroupName) {
      toast({ title: 'Group Name Required', description: 'Please enter a name for the group.', variant: 'destructive' });
      return;
    }
    if (reservedGroupName && trimmedGroupName.toLowerCase() === reservedGroupName.toLowerCase() && (!isEditing || groupToEdit?.name.toLowerCase() !== reservedGroupName.toLowerCase())) {
       toast({ title: 'Reserved Name', description: `"${reservedGroupName}" is a reserved group name. Please choose another.`, variant: 'destructive' });
      return;
    }
    const existingGroupWithSameName = groups.find(g =>
        !g.isSystemGroup &&
        g.name.toLowerCase() === trimmedGroupName.toLowerCase() &&
        (!isEditing || g.id !== groupToEdit?.id)
    );

    if (existingGroupWithSameName) {
      toast({ title: 'Group Name Exists', description: 'A group with this name already exists. Please choose a different name.', variant: 'destructive' });
      return;
    }
     if (selectedMembers.length === 0) {
      toast({ title: 'No Members Selected', description: 'Please select at least one member for the group.', variant: 'destructive' });
      return;
    }

    if (isEditing && groupToEdit) {
      onUpdateGroup({ ...groupToEdit, name: trimmedGroupName, members: selectedMembers });
    } else {
      onAddGroup(trimmedGroupName, selectedMembers);
    }
  };

  const handleCancelEditClick = () => {
    onCancelEdit();
    toast({ title: 'Edit Cancelled', variant: 'default' });
  };

  const visibleGroups = groups.filter(g => {
    if (g.isSystemGroup && g.id === 'system-all-attendees') {
      return attendees.length > 0;
    }
    return true;
  });


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Users className="mr-2 h-6 w-6 text-primary" />
          Manage Attendee Groups
        </CardTitle>
        <CardDescription>
          Create or edit groups. '{reservedGroupName}' includes all current attendees.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmitGroup} className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold flex items-center">
            {isEditing ? <Pencil className="mr-2 h-5 w-5 text-accent" /> : <PlusCircle className="mr-2 h-5 w-5 text-accent" />}
            {isEditing ? `Edit Group: ${groupToEdit?.name}` : 'Create New Group'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div> {/* Column 1: Group Name */}
              <Label htmlFor="groupName" className="block mb-1">Group Name</Label>
              <Input
                id="groupName"
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Core Team, Lunch Buddies"
                disabled={(attendees.length === 0 && !isEditing)}
              />
            </div>
            <div> {/* Column 2: Member Selection */}
              <div className="flex justify-between items-center mb-1">
                <Label>Select Members</Label>
                {attendees.length > 0 && (
                  <div className="space-x-1">
                    <Button type="button" variant="outline" size="sm" onClick={handleSelectAllMembers} disabled={attendees.length === 0}>
                      <CheckSquare className="mr-1 h-3 w-3" /> All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleDeselectAllMembers} disabled={attendees.length === 0 || selectedMembers.length === 0}>
                      <Square className="mr-1 h-3 w-3" /> None
                    </Button>
                  </div>
                )}
              </div>
              {attendees.length > 0 ? (
                <ScrollArea className="h-32 mt-1 rounded-md border p-2">
                  {attendees.map(attendee => (
                    <div key={attendee} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`member-${attendee}-${groupToEdit?.id || 'new'}`} // Ensure unique ID for checkbox
                        checked={selectedMembers.includes(attendee)}
                        onCheckedChange={() => handleMemberToggle(attendee)}
                        aria-label={`Select ${attendee}`}
                      />
                      <Label htmlFor={`member-${attendee}-${groupToEdit?.id || 'new'}`} className="font-normal">{attendee}</Label>
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground mt-1 py-1">Add attendees first to select members.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2"> {/* Added pt-2 for spacing */}
            <Button
              type="submit"
              disabled={(!newGroupName.trim() || (selectedMembers.length === 0 && !isEditing && attendees.length > 0) || (attendees.length === 0 && !isEditing) ) }
              className="w-full sm:flex-1"
            >
              {isEditing ? <Pencil className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isEditing ? 'Update Group' : 'Add Group'}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={handleCancelEditClick} className="w-full sm:flex-1">
                <XCircle className="mr-2 h-4 w-4" /> Cancel Edit
              </Button>
            )}
          </div>
        </form>

        {visibleGroups.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Existing Groups</h3>
            <ScrollArea className="h-40 rounded-md border">
              <ul className="p-2 space-y-2">
                {visibleGroups.map(group => (
                  <li key={group.id} className={`flex items-center justify-between p-3 rounded-md ${group.isSystemGroup ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50'}`}>
                    <div>
                      <p className="font-medium flex items-center">
                        {group.name}
                        {group.isSystemGroup &&
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="ml-2 h-4 w-4 text-primary cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This is a system-managed group representing all current attendees.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        }
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(group.isSystemGroup ? attendees : group.members.filter(m => attendees.includes(m))).map(member => (
                          <Badge key={member} variant={group.isSystemGroup ? 'default' : 'outline'} className="text-xs">{member}</Badge>
                        ))}
                         {group.members.filter(m => attendees.includes(m)).length === 0 && !group.isSystemGroup && <Badge variant="destructive" className="text-xs">No valid members</Badge>}
                         {attendees.length === 0 && group.isSystemGroup && <Badge variant="outline" className="text-xs">No attendees yet</Badge>}
                      </div>
                    </div>
                    {!group.isSystemGroup && (
                      <div className="flex items-center space-x-1">
                        <TooltipProvider>
                           <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-accent/20 hover:text-accent-foreground"
                                onClick={() => onEditGroup(group.id)}
                                aria-label={`Edit group ${group.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit Group</p></TooltipContent>
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
                                    aria-label={`Delete group ${group.name}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent><p>Delete Group</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the group: "{group.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  onDeleteGroup(group.id);
                                }}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
         {groups.filter(g => !g.isSystemGroup).length === 0 && attendees.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No custom groups created yet. Create one above!</p>
        )}
         {attendees.length === 0 && groups.filter(g => !g.isSystemGroup).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Add attendees to start managing groups.</p>
        )}
      </CardContent>
    </Card>
  );
}

    