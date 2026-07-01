const fs = require('fs');

let f = fs.readFileSync('src/views/FileManagerView.tsx', 'utf8');

if (!f.includes('handleDatabaseRestore')) {
    f = f.replace(`const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);`, `const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);\n  const fileInputRef = React.useRef<HTMLInputElement>(null);`);
    
    const dbImportFn = `
  const handleDatabaseRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("آیا از بازیابی پایگاه داده اطمینان دارید؟ تمام اطلاعات فعلی با اطلاعات فایل جایگزین خواهد شد.")) {
        e.target.value = "";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const res = await fetch("/api/database/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert("پایگاه داده با موفقیت بازیابی شد. صفحه برای اعمال تغییرات رفرش می‌شود.");
        window.location.reload();
      } else {
        alert(data.error || "خطا در بازیابی پایگاه داده");
      }
    } catch (err) {
      console.error(err);
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };
`;
    f = f.replace(`const fetchFiles = async () => {`, `${dbImportFn}\n  const fetchFiles = async () => {`);
    
    f = f.replace(`<a \n                 href="/api/database/export" \n                 download`, `<input type="file" ref={fileInputRef} className="hidden" accept=".db,.sqlite" onChange={handleDatabaseRestore} />\n               <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-rose-200">\n                 بازیابی پایگاه داده\n               </button>\n               <a \n                 href="/api/database/export" \n                 download`);
    
    fs.writeFileSync('src/views/FileManagerView.tsx', f);
}
