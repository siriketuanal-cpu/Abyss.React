import { useRef } from "react";

type Options = {
  onClick?: () => void;
  onLongPress: () => void;
  delay?: number;
  moveTolerance?: number;
};

/** v153準拠: 500msの長押しと、12pxを超える移動による取消を共通化する。 */
export function useLongPress({ onClick, onLongPress, delay = 500, moveTolerance = 12 }: Options) {
  const timer = useRef<number | null>(null);
  const held = useRef(false);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  };

  return {
    onPointerDown: (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      held.current = false;
      clear();
      origin.current = { x: event.clientX, y: event.clientY };
      timer.current = window.setTimeout(() => {
        timer.current = null;
        held.current = true;
        onLongPress();
      }, delay);
    },
    onPointerMove: (event: React.PointerEvent) => {
      if (!timer.current || !origin.current) return;
      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;
      if (dx * dx + dy * dy > moveTolerance * moveTolerance) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onClick: (event: React.MouseEvent) => {
      if (held.current) {
        event.preventDefault();
        event.stopPropagation();
        held.current = false;
        return;
      }
      onClick?.();
    },
  };
}
