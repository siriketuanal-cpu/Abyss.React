/** Style guide: a small, sober management drawer that does not compete with timer cards. */
type Props = {
  hasBackup: boolean;
  resetConfirm: boolean;
  onRestore: () => void;
  onResetRequest: () => void;
  onResetConfirm: () => void;
  onResetCancel: () => void;
};

export function DataRecoveryPanel({ hasBackup, resetConfirm, onRestore, onResetRequest, onResetConfirm, onResetCancel }: Props) {
  return (
    <section className="data-panel" aria-label="React版データ管理">
      <div className="data-panel-copy"><strong>データ管理</strong><span>このReact移行版だけを対象にします</span></div>
      <div className="data-actions">
        <button type="button" className="data-button" disabled={!hasBackup} onClick={onRestore}>直前保存を復元</button>
        {!resetConfirm ? <button type="button" className="data-button danger" onClick={onResetRequest}>React版を初期化</button> : <span className="reset-confirm"><button type="button" className="data-button danger solid" onClick={onResetConfirm}>初期化する</button><button type="button" className="data-button" onClick={onResetCancel}>取消</button></span>}
      </div>
    </section>
  );
}
