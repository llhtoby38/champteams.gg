'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { TeamViolation } from '@/lib/pokemon/validate-team';

interface TeamValidationDialogProps {
  open: boolean;
  onClose: () => void;
  violations: TeamViolation[];
  /** When provided, shows a "Save Anyway" button (for save flow). */
  onSaveAnyway?: () => void;
  /** Context label — "loaded" vs "saving" */
  context: 'load' | 'save';
}

export function TeamValidationDialog({
  open, onClose, violations, onSaveAnyway, context,
}: TeamValidationDialogProps) {
  const itemViolations = violations.filter(v => v.type === 'item');
  const moveViolations = violations.filter(v => v.type === 'move');

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            {context === 'load' ? 'Team Has Illegal Entries' : 'Illegal Items or Moves'}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {context === 'load'
            ? 'This team has items or moves that are not allowed in the current format. Please fix them before saving.'
            : 'Your team has items or moves not allowed in this format. Please fix them to save a legal team.'}
        </p>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {itemViolations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Illegal Items</h4>
              <ul className="space-y-1">
                {itemViolations.map((v, i) => (
                  <li key={`item-${i}`} className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 rounded px-2.5 py-1.5">
                    <span className="font-medium">{v.pokemonName}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-red-600 font-medium">{v.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {moveViolations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Illegal Moves</h4>
              <ul className="space-y-1">
                {moveViolations.map((v, i) => (
                  <li key={`move-${i}`} className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 rounded px-2.5 py-1.5">
                    <span className="font-medium">{v.pokemonName}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-red-600 font-medium">{v.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {context === 'save' ? 'Go Back & Fix' : 'OK, I\'ll Fix It'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
