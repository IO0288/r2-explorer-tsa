# R2-Explorer App

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/r2-explorer-template)

![R2 Explorer Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/e3c4ab7e-43f2-49df-6317-437f4ae8ce00/public)

<!-- dash-content-start -->

R2-Explorer brings a familiar Google Drive-like interface to your Cloudflare R2 storage buckets, making file management simple and intuitive.

## Key Features

- **🔒 Security**
  - Basic Authentication support
  - Cloudflare Access integration
  - Self-hosted on your Cloudflare account

- **📁 File Management**
  - Drag-and-drop file upload
  - Folder creation and organization
  - Multi-part upload for large files
  - Right-click context menu for advanced options
  - HTTP/Custom metadata editing

- **👀 File Handling**
  - In-browser file preview
    - PDF documents
    - Images
    - Text files
    - Markdown
    - CSV
    - Logpush files
  - In-browser file editing
  - Folder upload support

- **📧 Email Integration**
  - Receive and process emails via Cloudflare Email Routing
  - View email attachments directly in the interface

- **🔎 Observability**
  - View real-time logs associated with any deployed Worker using `wrangler tail`
  <!-- dash-content-end -->

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/r2-explorer-template#setup-steps) before deploying.

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```
npm create cloudflare@latest -- --template=cloudflare/templates/r2-explorer-template
```

A live public deployment of this template is available at [https://demo.r2explorer.com](https://demo.r2explorer.com)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Create a [R2 Bucket](https://developers.cloudflare.com/r2/get-started/) with the name "r2-explorer-bucket":
   ```bash
   npx wrangler r2 bucket create r2-explorer-bucket
   ```
3. Deploy the project!
   ```bash
   npm run deploy
   ```
4. Monitor your worker
   ```bash
   npx wrangler tail
   ```

## Next steps

This instance enables file uploads and management (`readonly: false`) and disables
Email Explorer (`emailRouting: false`) in `src/index.ts`.

The left sidebar is removed. Upload files, upload folders, create folders, and
create files are available in a responsive toolbar above the file browser.

File rows have checkboxes for multiple selection. The header checkbox selects
all currently loaded files (excluding folders); loading additional pages does
not automatically select new files. Selection is cleared when the directory,
search, or listing changes.

Use **批量获取直链** for selected files, or **获取直链** in a file's ellipsis
menu. The dialog lists one download URL per line and supports **复制全部** or
manual copying. These URLs use the selected bucket's configured `publicUrl`
domain and follow that domain's public access settings. Configure
`buckets.<name>.publicUrl` in `src/index.ts` before using this action. Object key
path segments are escaped for safe URLs, including Chinese names, spaces, and
special characters.

The selection UI is maintained in `dashboard/file-management.js`, and download
URL generation in `dashboard/direct-links.mjs`. Run `npm test` to verify URL
encoding.

This internal deployment removes R2 Explorer sharing features: the share
management button, share creation menu, share-password dialog, and share API
routes are disabled. Existing `/share/...` URLs no longer resolve.

The management site and its Worker API are protected with Basic Auth. The
credentials are read from Cloudflare Worker Secrets at request time and are
not stored in this repository. Configure them before deploying:

```bash
npx wrangler secret put R2_EXPLORER_USERNAME
npx wrangler secret put R2_EXPLORER_PASSWORD
```

The configured password protects the R2 Explorer management site and API. The
bucket's public file domain (`https://tsa.cdn.z02.dev`) remains independently
public and is not covered by this Worker authentication.

`scripts/build-dashboard.mjs` copies the dependency's dashboard into
`dist/dashboard` and customizes the layout without changing `node_modules`.
`npm run dev` and `npm run deploy` rebuild it automatically. When invoking
Wrangler directly, run `npm run build:dashboard` first.

The customization uses the compiled component boundaries in `r2-explorer` 1.2.0.
After upgrading this dependency, review the build script if the upstream layout
changes; an unmatched component causes the build to fail explicitly.

Configure authentication before deploying a writable instance,
[learn more here](https://r2explorer.com/getting-started/security/).
