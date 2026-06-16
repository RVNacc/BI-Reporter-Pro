import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  DatabaseZap,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { UploadedFile, MODULES } from "../types";
import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";

export default function FileManagerView() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Mapping State
  const [selectedModule, setSelectedModule] = useState("products");
  const [stagedFile, setStagedFile] = useState<{
    tempFilename: string;
    originalName: string;
    headers: string[];
  } | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (error) {
      console.error("Error fetching files", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-preview", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setStagedFile(data);

        // Auto-match headers by checking exact string match (case insensitive)
        const newMappings: Record<string, string> = {};
        const config = MODULES[selectedModule];
        config.fields.forEach((f) => {
          const match = data.headers.find(
            (header: string) => header.trim() === f.label.trim(),
          );
          if (match) newMappings[f.key] = match;
        });
        setMappings(newMappings);
      } else {
        alert("خطا در پیش‌پردازش فایل.");
      }
    } catch (error) {
      console.error("Upload preview failed", error);
      alert("خطای سیستم در آپلود.");
    } finally {
      setIsUploading(false);
      event.target.value = ""; // reset input
    }
  };

  const handleCommitMapping = async () => {
    if (!stagedFile) return;

    // Validate required files
    const config = MODULES[selectedModule];
    const missing = config.fields.filter((f) => f.required && !mappings[f.key]);
    if (missing.length > 0) {
      alert(
        `لطفا فیلدهای اجباری را مطابقت دهید: ${missing.map((m) => m.label).join("، ")}`,
      );
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/upload-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempFilename: stagedFile.tempFilename,
          originalName: stagedFile.originalName,
          module_type: selectedModule,
          mappings,
        }),
      });
      if (res.ok) {
        setStagedFile(null);
        setMappings({});
        fetchFiles();
      } else {
        const errObj = await res.json().catch(() => ({}));
        alert("خطا در تایید و ذخیره فایل: " + (errObj?.error || "خطای نامشخص"));
      }
    } catch (error) {
      console.error("Commit error", error);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (id: number) => {
    if (!confirm("آیا از حذف این فایل و تمامی داده‌های آن مطمئن هستید؟"))
      return;

    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (res.ok) fetchFiles();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-blue-500 pr-3">
          مدیریت فایل‌ها و پایگاه داده
        </h1>
        <p className="text-slate-500 text-sm">
          بارگذاری، تشخیص ساختار و تطبیق فیلدهای اطلاعاتی برای داشبوردهای تحلیلی
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Upload OR Step 2: Mapping Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {!stagedFile ? (
            <>
              <h2 className="text-lg font-semibold mb-4 text-slate-700">
                مرحله ۱: انتخاب فایل اکسل
              </h2>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                نوع داده‌ها جهت تطبیق هوشمند:
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg p-2.5 mb-6 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                {Object.entries(MODULES).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 relative hover:bg-slate-100 transition duration-200 cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <RefreshCw
                    className="text-blue-500 mb-3 animate-spin"
                    size={40}
                  />
                ) : (
                  <UploadCloud className="text-blue-500 mb-3" size={40} />
                )}
                <p className="text-slate-700 font-medium mb-1">
                  {isUploading
                    ? "در حال پردازش..."
                    : "کلیک کنید یا فایل را بکشید"}
                </p>
                <p className="text-xs text-slate-500">
                  فرمت‌های پشتیبانی شده: اکسل (.xlsx, .xls) و CSV (.csv)
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-700">
                  مرحله ۲: تطبیق ستون‌ها
                </h2>
                <button
                  onClick={() => setStagedFile(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded mb-4">
                فایل <strong>{stagedFile.originalName}</strong> بارگذاری شد.
                لطفاً ستون‌های فایل خود را با فیلدهای سیستم مطابقت دهید.
              </div>

              <div className="flex-1 overflow-auto pr-1">
                {MODULES[selectedModule].fields.map((field) => (
                  <div key={field.key} className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <select
                      className={`w-full border rounded-lg p-2 text-sm outline-none ${!mappings[field.key] && field.required ? "border-amber-400 focus:ring-amber-500" : "border-slate-300 focus:ring-blue-500"}`}
                      value={mappings[field.key] || ""}
                      onChange={(e) =>
                        setMappings({
                          ...mappings,
                          [field.key]: e.target.value,
                        })
                      }
                    >
                      <option value="">-- انتخاب ستون فایل --</option>
                      {stagedFile.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCommitMapping}
                disabled={isUploading}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isUploading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                تایید نهایی و تزریق داده
              </button>
            </div>
          )}
        </div>

        {/* Database List Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <DatabaseZap size={20} className="text-emerald-500" />
              مدیریت منابع تغذیه شده
            </h2>
            <div className="flex gap-2 items-center">
               <a 
                 href="/api/database/export" 
                 download
                 className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-indigo-200"
               >
                 دانلود نسخه پشتیبان (SQLite)
               </a>
               <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                 {files.length} منبع داده
               </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">ردیف</th>
                  <th className="p-3 font-semibold">نام فایل</th>
                  <th className="p-3 font-semibold">ساختار داده</th>
                  <th className="p-3 font-semibold">تعداد رکوردها</th>
                  <th className="p-3 font-semibold">تاریخ بارگذاری</th>
                  <th className="p-3 font-semibold w-16 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      هیچ فایلی تا کنون بارگذاری نشده است.
                    </td>
                  </tr>
                ) : (
                  files.map((f, i) => (
                    <tr key={f.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-slate-500">{i + 1}</td>
                      <td className="p-3 flex items-center gap-2 text-slate-700 font-medium tracking-tight">
                        <FileSpreadsheet size={16} className="text-green-600" />
                        {f.original_name}
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                          {MODULES[f.module_type]?.label || "نامشخص"}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {f.row_count.toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-xs dir-ltr text-right">
                        {new Date(f.upload_date).toLocaleString("fa-IR")}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => deleteFile(f.id)}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
