/** Style guide: compact dark-console numerals; the arrival label stays visibly secondary. */
type TimerValueProps = {
  value: string;
  reached?: boolean;
  urgent?: boolean;
  className?: string;
};

export function TimerValue({ value, reached = false, urgent = false, className = "" }: TimerValueProps) {
  return (
    <span className={`timer-value ${reached ? "is-reached" : ""} ${urgent ? "is-urgent" : ""} ${className}`}>
      {value}
      {reached && <small>到達</small>}
    </span>
  );
}
