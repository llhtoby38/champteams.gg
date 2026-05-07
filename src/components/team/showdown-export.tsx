'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import type { PokemonSet } from '@/types/pokemon';
import { exportTeamToShowdown } from '@/lib/pokemon/export';

interface ShowdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pokemon: PokemonSet[];
  teamName: string;
  initialTab?: 'export' | 'import';
  onImport?: (text: string) => void;
}

export function ShowdownExport({
  open, onOpenChange, pokemon, teamName, initialTab = 'export', onImport,
}: ShowdownDialogProps) {
  const [tab, setTab] = useState<'export' | 'import'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');

  const text = exportTeamToShowdown(pokemon);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (importText.trim() && onImport) {
      onImport(importText);
      setImportText('');
      onOpenChange(false);
    }
  };

  // Sync tab when dialog opens with a specific initialTab
  const handleOpenChange = (v: boolean) => {
    if (v) setTab(initialTab);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-lg">
        <DialogHeader>
          <DialogTitle>Showdown Paste</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 border-b -mt-2">
          <button
            onClick={() => setTab('export')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'export' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setTab('import')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'import' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Import
          </button>
        </div>

        {tab === 'export' ? (
          <>
            <div className="relative">
              <pre className="bg-muted p-3 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                {text || 'No Pokemon configured yet.'}
              </pre>
              {text && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <><Check className="h-3 w-3 mr-1" /> Copied</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-1" /> Copy</>
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Paste this into Pokemon Showdown&apos;s teambuilder to import your team.
            </p>
          </>
        ) : (
          <>
            <textarea
              className="w-full h-48 text-xs font-mono bg-muted border rounded-lg p-3 resize-y min-h-[10rem] max-h-[60vh] focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Paste Showdown team text here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleImport} disabled={!importText.trim()}>
                Apply
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a Showdown team export to load Pokemon into your builder.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
