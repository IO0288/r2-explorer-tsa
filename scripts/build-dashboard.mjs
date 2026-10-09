import { cp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const upstream = join(root, "node_modules/r2-explorer/dashboard");
const output = join(root, "dist/dashboard");
const html = await readFile(join(upstream, "index.html"), "utf8");
const asset = html.match(/src="\/assets\/(index\.[^"/]+\.js)"/)?.[1];
if (!asset) throw new Error("Cannot locate the upstream dashboard entry point.");
let source = await readFile(join(upstream, "assets", asset), "utf8");

// Match the upstream component boundaries explicitly so upgrades fail visibly
// rather than silently reverting to the default sidebar.
function replaceOnce(before, after) {
	if (source.split(before).length !== 2) {
		throw new Error("Dashboard structure changed; review the customization before upgrading.");
	}
	source = source.replace(before, after);
}

function replaceRender(start, end, render) {
	const from = source.indexOf(start);
	const to = source.indexOf(end, from);
	if (from < 0 || to < 0) throw new Error("Cannot locate the upstream component render function.");
	replaceOnce(source.slice(from, to), render);
}

replaceRender("function _sfc_render$g(", "var LeftSidebar=", `
function _sfc_render$g(u) {
  const folder = resolveComponent("create-folder");
  const file = resolveComponent("create-file");
  const actions = u.mainStore.apiReadonly
    ? [h("span", { class: "text-grey-7" }, "Read only")]
    : [
        h(QBtn, { color: "primary", icon: "upload_file", label: "Upload Files", onClick: () => u.$bus.emit("openFilesUploader") }),
        h(QBtn, { color: "primary", outline: true, icon: "drive_folder_upload", label: "Upload Folder", onClick: () => u.$bus.emit("openFoldersUploader") }),
        h(QBtn, { color: "primary", outline: true, icon: "create_new_folder", label: "New Folder", onClick: () => u.$refs.createFolder.open() }),
        h(QBtn, { color: "primary", outline: true, icon: "note_add", label: "New File", onClick: () => u.$refs.createFile.open() })
      ];
  return h("div", { class: "row items-center q-gutter-sm q-pa-md bg-grey-1 text-dark", role: "toolbar", "aria-label": "File management" }, [
    ...actions,
    h(folder, { ref: "createFolder" }),
    h(file, { ref: "createFile" })
  ]);
}
`);

replaceRender("function _sfc_render$c(", "var MainLayout=", `
function _sfc_render$c() {
  const top = resolveComponent("top-bar");
  const actions = resolveComponent("left-sidebar");
  const page = resolveComponent("router-view");
  return h(QLayout, { view: "hHh LpR lFr" }, { default: () => [
    h(QHeader, { reveal: true, class: "bg-green text-white" }, { default: () => [
      h(QToolbar, null, { default: () => [h(top)] }),
      h(actions)
    ] }),
    h(QPageContainer, null, { default: () => [h(page)] })
  ] });
}
`);

replaceOnce('createVNode(QBtn,{dense:"",flat:"",round:"",icon:"menu",onClick:d[0]||(d[0]=S=>u.$emit("toggle"))}),', "");

// No Info button remains, so the sidebar's update-check request is unnecessary.
const componentStart = source.indexOf('name:"LeftSidebar"');
const mountedStart = source.indexOf("async mounted(){", componentStart);
const mountedEnd = source.indexOf("setup(){", mountedStart);
if (mountedStart < 0 || mountedEnd < 0) throw new Error("Cannot locate the sidebar update check.");
replaceOnce(source.slice(mountedStart, mountedEnd), "");

const directLinks = await readFile(join(root, "dashboard/direct-links.mjs"), "utf8");
const fileManagement = await readFile(join(root, "dashboard/file-management.js"), "utf8");
replaceOnce('const _sfc_main$1={name:"FileContextMenu"',
	`${directLinks.replace("export function", "function")}\n${fileManagement}\nconst _sfc_main$1={name:"FileContextMenu"`);

// Reuse the upstream table, paging, menus, and dialogs. Selection is file-only
// and reset whenever the current listing is replaced.
replaceOnce('rows:[],cursor:null,hasMore:!0,searchQuery:""',
	'rows:[],selectedRows:[],cursor:null,hasMore:!0,searchQuery:""');
replaceOnce('resetAndFetchFiles:async function(){this.rows=[]',
	'resetAndFetchFiles:async function(){this.selectedRows=[],this.rows=[]');
replaceOnce('createVNode(S,{ref:"uploader"},{default:withCtx(()=>[createVNode(QTable,',
	'tsaFileSelectionToolbar(u),createVNode(S,{ref:"uploader"},{default:withCtx(()=>[createVNode(QTable,');
replaceOnce('createVNode(S,{ref:"uploader"},{default:withCtx(()=>[createVNode(QTable,{ref:"table",rows:u.rows,columns:u.columns,"row-key":"name",loading:u.loading',
	'createVNode(S,{ref:"uploader"},{default:withCtx(()=>[createVNode(QTable,{ref:"table",rows:u.rows,columns:u.columns,"row-key":"key",selection:"multiple",selected:u.selectedRows,"onUpdate:selected":q=>u.selectedRows=q.filter(row=>row.type==="file"),loading:u.loading');
replaceOnce('onRowClick:u.openRowDlbClick},{loading:withCtx',
	'onRowClick:u.openRowDlbClick},{"header-selection":()=>tsaSelectionCheckbox(u),"body-selection":q=>tsaSelectionCheckbox(u,q.row),loading:withCtx');
replaceOnce('["rows","columns","loading","onRowDblclick","onRowClick"]',
	'["rows","columns","loading","selected","onRowDblclick","onRowClick"]');
replaceOnce('"table-class":"file-list"', '"table-class":"file-list tsa-file-selection"');

// Both the ellipsis menu and the right-click menu use FileContextMenu.
replaceOnce('key:4,clickable:"",onClick:m.copyPublicUrl',
	'key:4,clickable:"",onClick:()=>tsaShowDirectLinks(u,[g.prop.row])');
replaceOnce('createTextVNode("Copy Public URL")', 'createTextVNode("获取直链")');
replaceOnce('createTextVNode("Direct link via public domain")', 'createTextVNode("直接下载文件，沿用当前访问权限")');

// Remove share management and the complete share dialog (passwords, expiry,
// download limits), including references in both file context menus.
const manageStart = source.indexOf('createVNode(QBtn,{flat:"",dense:"",icon:"link",color:"primary",label:"Manage Shares"');
const manageEnd = source.indexOf(']),tsaFileSelectionToolbar(u)', manageStart);
if (manageStart < 0 || manageEnd < 0) throw new Error("Cannot locate share management controls.");
replaceOnce(source.slice(manageStart, manageEnd), "");
const shareMenuStart = source.indexOf('g.prop.row.type==="file"?withDirectives((openBlock(),createBlock(QItem,{key:3,clickable:"",onClick:m.createShareLink');
const shareMenuEnd = source.indexOf('withDirectives((openBlock(),createBlock(QItem,{clickable:"",onClick:m.copyInternalLink', shareMenuStart);
if (shareMenuStart < 0 || shareMenuEnd < 0) throw new Error("Cannot locate the create-share menu item.");
replaceOnce(source.slice(shareMenuStart, shareMenuEnd), "");
replaceOnce('createShareLink:function(){this.$emit("createShareLink",this.prop.row)},', "");
const shareListener = ',onCreateShareLink:u.$refs.shareFile.openCreateShare';
if (source.split(shareListener).length !== 3) throw new Error("Cannot locate both share event listeners.");
source = source.replaceAll(shareListener, "");
replaceOnce('FilePreview,ShareFile}', 'FilePreview}');
replaceOnce(',w=resolveComponent("share-file")', "");
replaceOnce(',createVNode(w,{ref:"shareFile"},null,512)', "");
const shareComponentStart = source.indexOf(',ShareFile_vue_vue_type_style_index_0_scoped_true_lang');
const shareComponentEnd = source.indexOf(',ElementType;', shareComponentStart);
if (shareComponentStart < 0 || shareComponentEnd < 0) throw new Error("Cannot locate the share dialog component.");
replaceOnce(source.slice(shareComponentStart, shareComponentEnd + ',ElementType;'.length), ';var ElementType;');

const customizedAsset = `index.${createHash("sha256").update(source).digest("hex").slice(0, 12)}.js`;
await rm(output, { recursive: true, force: true });
await cp(upstream, output, { recursive: true });
await writeFile(join(output, "assets", asset), source);
await rename(join(output, "assets", asset), join(output, "assets", customizedAsset));
const stylesheet = await readFile(join(root, "dashboard/file-management.css"), "utf8");
const stylesheetAsset = `file-management.${createHash("sha256").update(stylesheet).digest("hex").slice(0, 12)}.css`;
await writeFile(join(output, "assets", stylesheetAsset), stylesheet);
await writeFile(join(output, "index.html"), html.replace("</head>", `<link rel="stylesheet" href="/assets/${stylesheetAsset}"></head>`));

// Update lazy-loaded chunks as well as HTML to use the customized module.
async function updateReferences(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) await updateReferences(path);
		else if (/\.(js|html)$/.test(entry.name)) {
			const content = await readFile(path, "utf8");
			if (content.includes(asset)) await writeFile(path, content.replaceAll(asset, customizedAsset));
		}
	}
}
// The package also ships a duplicate spa directory; only the root app is served.
await rm(join(output, "spa"), { recursive: true, force: true });
await updateReferences(output);
console.log(`Built customized R2 dashboard: ${customizedAsset}`);
