# 深淵タイマー — React＋Vite PWA

Dot Abyss、Gジェネ、STAR LEAPの回復・日課を一画面で管理する、React＋Vite版のクライアント完結PWAです。既存HTML版とは独立した移行候補であり、回復サイクル・編集操作・保存処理をコンポーネント単位へ分離しています。

## 主な仕様

| 項目 | 内容 |
|---|---|
| ドットアビス | 3分回復、40基準の参考表示、長押し手入力、名称・ランク編集、放置報酬、デイリー |
| Gジェネ | 5分回復、2回タップ現在値編集、長押し上限編集、名称・デイリー |
| STAR LEAP | 討伐スタミナ、オーブ、4桁までの残り時間入力 |
| 保存 | ブラウザの`localStorage`。React版専用キーと直前バックアップを使用 |
| PWA | `manifest.json`とサービスワーカーを含むスタンドアロン起動対応 |

## 必要環境

Node.js 22以降とpnpm 10以降を推奨します。

```bash
pnpm install
pnpm dev
```

開発サーバーはViteが表示するURLで確認できます。型検証、回復計算テスト、本番ビルドは次のコマンドです。

```bash
pnpm check
pnpm test
pnpm build
```

## PWAとして使う方法

HTTPSで公開したURLをAndroid Chromeで開き、ブラウザメニューから**ホーム画面に追加**または**アプリをインストール**を選択します。GitHub Pagesで公開する場合は、リポジトリ配下のURLに合わせてViteの`base`設定を調整してください。

## 保存と復旧

React版は`dotabyss:react:v1`を使用します。保存前の直前状態は`dotabyss:react:backup:v1`へ保持されます。画面右上の**管理**から直前保存を復元できます。初期化はReact版のデータだけを対象にし、既存HTML版の`dotabyss:unified:v1`は削除しません。

## GitHub向けZIPの作成

この作業用プロジェクトでは、生成資産の保存場所が外部用に最適化されています。GitHubへ置くための自己完結ZIPは次で作成します。

```bash
pnpm export:github
```

生成されるZIPには、GitHubで必要なソース、設定、CI、PWA素材だけが含まれます。`node_modules`、`dist`、ログ、ローカル保存データ、環境固有の設定は含みません。

GitHub Pagesへ公開する具体的な手順、初回だけ必要なPWA更新、同梱済みのPWAアイコンの扱いは[`GITHUB_PUBLISHING_GUIDE.md`](./GITHUB_PUBLISHING_GUIDE.md)を参照してください。配布ZIPには192px・512px・maskable 512pxの3種のPNGアイコンを含めます。

## リポジトリ構成

```text
client/src/components/  # ゲーム別カード
client/src/hooks/       # 長押し・保存・単一更新ループ
client/src/lib/         # 型、回復計算、保存復旧
client/public/          # PWA manifest、service worker、GitHub用画像
.github/workflows/      # GitHub Actions CI
```

## ライセンス

ライセンスは未設定です。公開リポジトリにする前に、利用条件に合うライセンスをリポジトリ所有者が選択してください。
