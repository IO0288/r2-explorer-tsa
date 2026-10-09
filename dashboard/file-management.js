// This module is embedded in the upstream bundle by build-dashboard.mjs and
// shares its Vue/Quasar component bindings.
function tsaShowDirectLinks(component, rows) {
	try {
		const files = rows.filter((row) => row.type === "file");
		if (!files.length) throw new Error("请先选择文件。");
		const links = files.map((row) => tsaDirectLink(
			component.mainStore.serverUrl, component.selectedBucket, row.key,
		)).join("\n");
		component.q.dialog({
			title: `文件直链（${files.length}）`,
			message: "每行一个链接，沿用当前 Worker 的访问权限。也可选中文本手动复制。",
			prompt: { model: links, type: "textarea", readonly: true, autogrow: true },
			ok: { label: "复制全部" },
			cancel: { label: "关闭", flat: true },
		}).onOk(async () => {
			try {
				await navigator.clipboard.writeText(links);
				component.q.notify({ type: "positive", message: `已复制 ${files.length} 个文件直链` });
			} catch {
				component.q.notify({ type: "negative", message: "复制失败，请重新打开直链窗口并手动复制。" });
			}
		});
	} catch (error) {
		component.q.notify({ type: "negative", message: error.message });
	}
}

function tsaFileSelectionToolbar(component) {
	return h("div", { class: "row items-center q-gutter-sm q-mb-sm", role: "toolbar", "aria-label": "文件多选" }, [
		h("span", { "aria-live": "polite" }, `已选 ${component.selectedRows.length} 个文件`),
		h(QBtn, {
			outline: true, color: "primary", icon: "link", label: "批量获取直链",
			disable: !component.selectedRows.length,
			onClick: () => tsaShowDirectLinks(component, component.selectedRows),
		}),
		h(QBtn, {
			flat: true, color: "primary", label: "清空选择", disable: !component.selectedRows.length,
			onClick: () => { component.selectedRows = []; },
		}),
	]);
}

function tsaSelectionCheckbox(component, row) {
	const files = component.rows.filter((item) => item.type === "file");
	const selected = new Set(component.selectedRows.map((item) => item.key));
	const all = !row;
	const checked = all ? files.length > 0 && files.every((item) => selected.has(item.key)) : selected.has(row.key);
	const disabled = all ? !files.length : row.type !== "file";
	return h("span", {
		class: "inline-flex items-center", onClick: (event) => event.stopPropagation(),
		onDblclick: (event) => event.stopPropagation(),
		onKeydown: (event) => event.stopPropagation(),
	}, [h("input", {
		type: "checkbox", checked, disabled,
		indeterminate: all && !checked && files.some((item) => selected.has(item.key)),
		"aria-label": all ? "全选已加载的文件" : `选择 ${row.name}`,
		style: { width: "18px", height: "18px", cursor: disabled ? "default" : "pointer" },
		onChange: (event) => {
			if (disabled) return;
			if (all) component.selectedRows = event.target.checked ? files : [];
			else component.selectedRows = event.target.checked
				? [...component.selectedRows.filter((item) => item.key !== row.key), row]
				: component.selectedRows.filter((item) => item.key !== row.key);
		},
	})]);
}
