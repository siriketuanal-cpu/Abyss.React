# 深淵タイマー React版 — GitHub公開・PWA利用ガイド

## 1. 配布ZIPをGitHubへ登録する

ZIPを展開し、展開後のフォルダ内にある`client`、`server`、`shared`、`.github`、`package.json`などを**同じ階層のまま**新しいGitHubリポジトリへ登録する。`node_modules`、`dist`、ローカル保存データは登録不要である。

GitHub Desktopを使う場合は、展開先フォルダを「Add local repository」で追加し、最初のコミットを作成してGitHubへPublishする。ターミナルを使う場合は、次のように実行する。

```bash
git init
git add .
git commit -m "Initial React PWA release"
git branch -M main
git remote add origin https://github.com/<GitHubユーザー名>/<リポジトリ名>.git
git push -u origin main
```

## 2. GitHub Pagesを有効にする

リポジトリを開き、**Settings → Pages → Build and deployment → Source**で**GitHub Actions**を選択する。次に`main`へpushすると、同梱済みの`.github/workflows/deploy-pages.yml`が型検証・計算テスト・本番ビルドを実行し、`dist/public`をPagesへ公開する。[1] [2]

初回の完了後、公開URLは通常`https://<GitHubユーザー名>.github.io/<リポジトリ名>/`となる。**Actions**タブの「Deploy React PWA to GitHub Pages」が緑の完了表示になってから開く。

> GitHub Pagesに公開した内容はインターネット上から閲覧できる。保存データはブラウザ内に留まるが、ソースコードや設定へ秘密情報を入れない。[1]

## 3. Android ChromeでPWAとして使う

公開URLをAndroid Chromeで開き、メニューから**ホーム画面に追加**または**アプリをインストール**を選ぶ。以後はホーム画面のアイコンから起動できる。React版の保存先は`dotabyss:react:v1`であり、単一HTML安定版の`dotabyss:unified:v1`とは別である。

今回の更新方式は、HTMLをネットワーク優先で取得し、サービスワーカーの更新を即時反映する。更新直後だけ古い画面が残る場合は、PWAを完全に閉じて通常Chromeで公開URLを一度開き、その後PWAを開き直す。

## 4. PWAアイコン

このZIPには、次の3種類のPNGアイコンがすでに含まれている。`icon-maskable-512.png`はAndroidの丸形・角丸形の切り抜き用である。

```text
client/public/icon-192.png
client/public/icon-512.png
client/public/icon-maskable-512.png
```

別の画像へ置き換える場合は、同じファイル名・寸法で上書きして`git add client/public/`、`git commit -m "Update PWA icons"`、`git push`を行う。`manifest.json`には通常用192px・512pxとmaskable用512pxが相対パスで設定されている。既存のPWAへアイコン更新を反映するには、一度ホーム画面から削除して再インストールすると確実である。

## 5. 今後の更新

修正後は、通常どおり`git add .`、`git commit -m "変更内容"`、`git push`を行う。`main`へpushするたびにGitHub Actionsが検証とPages公開を行う。公開失敗時は、リポジトリの**Actions**から失敗した工程を開き、`pnpm check`・`pnpm test`・`pnpm build`のどれで止まったか確認する。

## 6. ローカル確認

Node.js 22とpnpm 10を用意したうえで、次を実行する。

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm preview
```

`pnpm preview`は本番ビルドのローカル確認用であり、本番公開サーバーではない。[2]

## 参照

[1]: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site "GitHub Docs: Configuring a publishing source for your GitHub Pages site"
[2]: https://vite.dev/guide/static-deploy "Vite: Deploying a Static Site"
