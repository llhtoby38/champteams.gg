'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CalcConditions } from '@/types/calc';
import { DEFAULT_CALC_CONDITIONS } from '@/types/calc';
import {
  Sun, CloudRain, Wind, Snowflake, Zap,
  Leaf, Brain, Sparkles, X, RotateCcw,
} from 'lucide-react';

interface CalcConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conditions: CalcConditions;
  onChange: (conditions: CalcConditions) => void;
}

const WEATHERS = [
  { value: 'Sun', label: 'Sun', icon: Sun, color: 'bg-orange-500' },
  { value: 'Rain', label: 'Rain', icon: CloudRain, color: 'bg-blue-500' },
  { value: 'Sand', label: 'Sand', icon: Wind, color: 'bg-amber-600' },
  { value: 'Snow', label: 'Snow', icon: Snowflake, color: 'bg-cyan-400' },
] as const;

const TERRAINS = [
  { value: 'Electric', label: 'Electric', icon: Zap, color: 'bg-yellow-500' },
  { value: 'Grassy', label: 'Grassy', icon: Leaf, color: 'bg-green-500' },
  { value: 'Psychic', label: 'Psychic', icon: Brain, color: 'bg-pink-500' },
  { value: 'Misty', label: 'Misty', icon: Sparkles, color: 'bg-purple-400' },
] as const;

const STATUSES = [
  { value: 'brn', label: 'Burn', color: 'text-red-500' },
  { value: 'par', label: 'Paralysis', color: 'text-yellow-600' },
  { value: 'psn', label: 'Poison', color: 'text-purple-500' },
  { value: 'tox', label: 'Toxic', color: 'text-purple-700' },
  { value: 'frz', label: 'Freeze', color: 'text-cyan-500' },
  { value: 'slp', label: 'Sleep', color: 'text-gray-500' },
] as const;

const BOOST_STATS = [
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
] as const;

function BoostSelector({ boosts, onChange }: {
  boosts: Partial<Record<string, number>>;
  onChange: (boosts: Partial<Record<string, number>>) => void;
}) {
  const adjust = (stat: string, delta: number) => {
    const current = boosts[stat] || 0;
    const next = Math.max(-6, Math.min(6, current + delta));
    const updated = { ...boosts };
    if (next === 0) delete updated[stat];
    else updated[stat] = next;
    onChange(updated);
  };

  return (
    <div className="flex gap-1.5 flex-wrap">
      {BOOST_STATS.map(({ key, label }) => {
        const val = boosts[key] || 0;
        const color = val > 0 ? 'text-green-600 border-green-400 bg-green-50' :
                      val < 0 ? 'text-red-600 border-red-400 bg-red-50' :
                      'text-muted-foreground border-border';
        return (
          <div key={key} className={`flex items-center gap-0 rounded border text-[10px] font-mono overflow-hidden ${color}`}>
            <button
              onClick={() => adjust(key, -1)}
              disabled={val <= -6}
              className="px-1 py-0.5 hover:bg-red-100 disabled:opacity-30 transition-colors"
              title={`${label} -1`}
            >
              −
            </button>
            <span className="px-1 py-0.5 min-w-[2.5rem] text-center select-none">
              {label} {val !== 0 && <span className="font-bold">{val > 0 ? `+${val}` : val}</span>}
            </span>
            <button
              onClick={() => adjust(key, 1)}
              disabled={val >= 6}
              className="px-1 py-0.5 hover:bg-green-100 disabled:opacity-30 transition-colors"
              title={`${label} +1`}
            >
              +
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TogglePill({ active, onClick, children, className = '' }: {
  active: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
        active
          ? 'bg-foreground text-background border-foreground'
          : 'border-border text-muted-foreground hover:border-foreground/30'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function CalcConditionsDialog({ open, onOpenChange, conditions, onChange }: CalcConditionsDialogProps) {
  const update = (patch: Partial<CalcConditions>) => onChange({ ...conditions, ...patch });

  const hasAny = conditions.weather !== '' || conditions.terrain !== '' || conditions.isTrickRoom ||
    Object.keys(conditions.attackerBoosts).length > 0 || conditions.attackerStatus !== '' ||
    Object.values(conditions.attackerSide).some(Boolean) ||
    Object.keys(conditions.defenderBoosts).length > 0 || conditions.defenderStatus !== '' ||
    Object.values(conditions.defenderSide).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        !fixed !top-14 !bottom-0 !left-0 !right-0
        !translate-x-0 !translate-y-0
        !max-w-none !rounded-none !rounded-t-xl
        sm:!top-1/2 sm:!bottom-auto sm:!left-1/2 sm:!right-auto
        sm:!-translate-x-1/2 sm:!-translate-y-1/2
        sm:!max-w-[480px] sm:!max-h-[80vh] sm:!rounded-xl
        flex flex-col gap-0 !p-0
      ">
        <DialogHeader className="px-4 pt-4 pb-0 shrink-0">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-sm">Battle Conditions</DialogTitle>
            {hasAny && (
              <button
                onClick={() => onChange({ ...DEFAULT_CALC_CONDITIONS })}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset All
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1">
          {/* Weather */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Weather</div>
            <div className="flex gap-1.5 flex-wrap">
              {WEATHERS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => update({ weather: conditions.weather === value ? '' : value })}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${
                    conditions.weather === value
                      ? `${color} text-white border-transparent`
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Terrain */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Terrain</div>
            <div className="flex gap-1.5 flex-wrap">
              {TERRAINS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => update({ terrain: conditions.terrain === value ? '' : value })}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${
                    conditions.terrain === value
                      ? `${color} text-white border-transparent`
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Trick Room */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Field</div>
            <div className="flex gap-1.5 flex-wrap">
              <TogglePill active={conditions.isTrickRoom} onClick={() => update({ isTrickRoom: !conditions.isTrickRoom })}>
                Trick Room
              </TogglePill>
            </div>
          </div>

          {/* Your Pokemon (Attacker) */}
          <div className="border rounded-lg p-3 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Your Pokemon</div>

            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Stat Boosts</div>
              <BoostSelector
                boosts={conditions.attackerBoosts}
                onChange={(attackerBoosts) => update({ attackerBoosts })}
              />
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Status</div>
              <div className="flex gap-1.5 flex-wrap">
                {STATUSES.map(({ value, label, color }) => (
                  <TogglePill
                    key={value}
                    active={conditions.attackerStatus === value}
                    onClick={() => update({ attackerStatus: conditions.attackerStatus === value ? '' : value })}
                  >
                    <span className={conditions.attackerStatus === value ? '' : color}>{label}</span>
                  </TogglePill>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Side Conditions</div>
              <div className="flex gap-1.5 flex-wrap">
                <TogglePill active={conditions.attackerSide.isHelpingHand}
                  onClick={() => update({ attackerSide: { ...conditions.attackerSide, isHelpingHand: !conditions.attackerSide.isHelpingHand } })}>
                  Helping Hand
                </TogglePill>
                <TogglePill active={conditions.attackerSide.isReflect}
                  onClick={() => update({ attackerSide: { ...conditions.attackerSide, isReflect: !conditions.attackerSide.isReflect } })}>
                  Reflect
                </TogglePill>
                <TogglePill active={conditions.attackerSide.isLightScreen}
                  onClick={() => update({ attackerSide: { ...conditions.attackerSide, isLightScreen: !conditions.attackerSide.isLightScreen } })}>
                  Light Screen
                </TogglePill>
                <TogglePill active={conditions.attackerSide.isAuroraVeil}
                  onClick={() => update({ attackerSide: { ...conditions.attackerSide, isAuroraVeil: !conditions.attackerSide.isAuroraVeil } })}>
                  Aurora Veil
                </TogglePill>
                <TogglePill active={conditions.attackerSide.isTailwind}
                  onClick={() => update({ attackerSide: { ...conditions.attackerSide, isTailwind: !conditions.attackerSide.isTailwind } })}>
                  Tailwind
                </TogglePill>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Ally Effects</div>
              <div className="flex gap-1.5 flex-wrap">
                <TogglePill active={conditions.attackerSide.isBattery}
                  onClick={() => update({ attackerSide: { ...conditions.attackerSide, isBattery: !conditions.attackerSide.isBattery } })}>
                  Battery
                </TogglePill>
                <TogglePill active={conditions.attackerSide.isPowerSpot}
                  onClick={() => update({ attackerSide: { ...conditions.attackerSide, isPowerSpot: !conditions.attackerSide.isPowerSpot } })}>
                  Power Spot
                </TogglePill>
                <TogglePill active={conditions.attackerSide.isSteelySpirit}
                  onClick={() => update({ attackerSide: { ...conditions.attackerSide, isSteelySpirit: !conditions.attackerSide.isSteelySpirit } })}>
                  Steely Spirit
                </TogglePill>
              </div>
            </div>
          </div>

          {/* Enemy Pokemon (Defender) */}
          <div className="border rounded-lg p-3 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-red-700">Enemy Pokemon</div>

            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Stat Boosts</div>
              <BoostSelector
                boosts={conditions.defenderBoosts}
                onChange={(defenderBoosts) => update({ defenderBoosts })}
              />
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Status</div>
              <div className="flex gap-1.5 flex-wrap">
                {STATUSES.map(({ value, label, color }) => (
                  <TogglePill
                    key={value}
                    active={conditions.defenderStatus === value}
                    onClick={() => update({ defenderStatus: conditions.defenderStatus === value ? '' : value })}
                  >
                    <span className={conditions.defenderStatus === value ? '' : color}>{label}</span>
                  </TogglePill>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Side Conditions</div>
              <div className="flex gap-1.5 flex-wrap">
                <TogglePill active={conditions.defenderSide.isReflect}
                  onClick={() => update({ defenderSide: { ...conditions.defenderSide, isReflect: !conditions.defenderSide.isReflect } })}>
                  Reflect
                </TogglePill>
                <TogglePill active={conditions.defenderSide.isLightScreen}
                  onClick={() => update({ defenderSide: { ...conditions.defenderSide, isLightScreen: !conditions.defenderSide.isLightScreen } })}>
                  Light Screen
                </TogglePill>
                <TogglePill active={conditions.defenderSide.isAuroraVeil}
                  onClick={() => update({ defenderSide: { ...conditions.defenderSide, isAuroraVeil: !conditions.defenderSide.isAuroraVeil } })}>
                  Aurora Veil
                </TogglePill>
                <TogglePill active={conditions.defenderSide.isHelpingHand}
                  onClick={() => update({ defenderSide: { ...conditions.defenderSide, isHelpingHand: !conditions.defenderSide.isHelpingHand } })}>
                  Helping Hand
                </TogglePill>
                <TogglePill active={conditions.defenderSide.isFriendGuard}
                  onClick={() => update({ defenderSide: { ...conditions.defenderSide, isFriendGuard: !conditions.defenderSide.isFriendGuard } })}>
                  Friend Guard
                </TogglePill>
                <TogglePill active={conditions.defenderSide.isTailwind}
                  onClick={() => update({ defenderSide: { ...conditions.defenderSide, isTailwind: !conditions.defenderSide.isTailwind } })}>
                  Tailwind
                </TogglePill>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
