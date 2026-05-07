'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

const CLOSE_DELAY = 150;
const GAP = 6;

interface Props {
  trigger: ReactNode;
  children: ReactNode;
  width?: number;
  triggerClassName?: string;
  popupClassName?: string;
}

export function HoverTapPopover({
  trigger,
  children,
  width = 240,
  triggerClassName = '',
  popupClassName = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; placeAbove: boolean } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const computePos = () => {
      if (!triggerRef.current) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const effectiveWidth = Math.min(width, vw - 16);
      const r = triggerRef.current.getBoundingClientRect();
      const popupH = popupRef.current?.offsetHeight ?? 0;
      const spaceBelow = vh - r.bottom;
      const placeAbove = popupH > 0 && spaceBelow < popupH + GAP + 8 && r.top > popupH + GAP + 8;
      const top = placeAbove ? r.top - GAP : r.bottom + GAP;
      const left = Math.max(
        effectiveWidth / 2 + 8,
        Math.min(vw - effectiveWidth / 2 - 8, r.left + r.width / 2),
      );
      setPos({ top, left, width: effectiveWidth, placeAbove });
    };
    computePos();
    const raf = requestAnimationFrame(computePos);

    const closeNow = () => setOpen(false);
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popupRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('scroll', closeNow, true);
    window.addEventListener('resize', closeNow);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', closeNow, true);
      window.removeEventListener('resize', closeNow);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open, width]);

  useEffect(() => () => cancelClose(), []);

  return (
    <>
      <span
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          cancelClose();
          setOpen(v => !v);
        }}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse') return;
          cancelClose();
          setOpen(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== 'mouse') return;
          scheduleClose();
        }}
        className={`inline-flex cursor-help select-none ${triggerClassName}`}
      >
        {trigger}
      </span>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popupRef}
          onPointerEnter={cancelClose}
          onPointerLeave={(e) => {
            if (e.pointerType !== 'mouse') return;
            scheduleClose();
          }}
          onClick={(e) => e.stopPropagation()}
          className={`fixed z-[60] bg-[#1a1a2e] text-white rounded-lg shadow-2xl border border-white/10 p-3 ${popupClassName}`}
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.width,
            transform: pos.placeAbove
              ? 'translate(-50%, -100%)'
              : 'translateX(-50%)',
          }}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}
