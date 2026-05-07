'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ImportConfirmDialogProps {
  slotCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportConfirmDialog({ slotCount, onConfirm, onCancel }: ImportConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-background border rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Replace Builder Content?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your builder currently has <span className="font-medium text-foreground">{slotCount} Pokémon</span>.
              Importing this team will replace your current builder content.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
          💡 To keep your current team, go to <strong>Builder → Save</strong> before importing.
        </p>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Go Back
          </Button>
          <Button size="sm" onClick={onConfirm}>
            Override & Import
          </Button>
        </div>
      </div>
    </div>
  );
}
