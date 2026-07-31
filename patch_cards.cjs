const fs = require('fs');
let code = fs.readFileSync('/tmp/CostAllocationView.tsx', 'utf8');

const gridStartStr = `<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
const startIndex = code.indexOf(gridStartStr);
if (startIndex === -1) throw new Error("Start not found");
const beforeGrid = code.substring(0, startIndex + gridStartStr.length);

const gridEndStr = `{displayCenters.length > chartsPerPage && (`;
const endIndex = code.indexOf(gridEndStr);
if (endIndex === -1) throw new Error("End not found");

// Find the start of the line for the end marker
let actualEndIndex = endIndex;
while(code[actualEndIndex - 1] === ' ' || code[actualEndIndex - 1] === '\t') {
    actualEndIndex--;
}

const afterGrid = code.substring(actualEndIndex);

const newGrid = `
              {displayCenters.slice((chartPage - 1) * chartsPerPage, chartPage * chartsPerPage).map((cc: any) => {
                const visualData = reportData?.costCenterVisuals?.find((v: any) => v.id === cc.id);
                const chartData = visualData?.chartData || [];
                const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
                return (
                  <div key={cc.id} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-[520px]">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <div className={\`w-2 h-2 rounded-full \${cc.is_active !== false ? 'bg-amber-500' : 'bg-slate-300'}\`}></div>
                          {cc.name}
                        </h3>
                        <div className="text-sm font-mono text-slate-500 mt-1">
                          مبلغ کل: {Number(cc.total_cost).toLocaleString()} ریال
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <label className="flex items-center gap-2 text-xs text-slate-600 bg-white border px-2 py-1 rounded shadow-sm cursor-pointer hover:bg-slate-50">
                            <input
                               type="checkbox"
                               checked={cc.is_active !== false}
                               onChange={(e) => {
                                 fetch(\`/api/cost-centers/\${cc.id}\`, {
                                    method: "PUT", headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ is_active: e.target.checked }),
                                 }).then(() => { fetchCenters(); fetchReport(); });
                               }}
                               className="accent-amber-500 rounded"
                            />
                            فعال
                         </label>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCenter(cc.id); }}
                          className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition border border-transparent hover:border-red-100"
                          title="حذف مرکز فعالیت"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-2 gap-3 text-sm">
                       <div>
                          <label className="block text-xs text-slate-500 mb-1">مبنای تسهیم</label>
                          <select
                             className="w-full border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-amber-400 bg-slate-50"
                             value={cc.allocation_base || "sales_value"}
                             onChange={(e) => {
                                fetch(\`/api/cost-centers/\${cc.id}\`, {
                                   method: "PUT", headers: { "Content-Type": "application/json" },
                                   body: JSON.stringify({ allocation_base: e.target.value }),
                                }).then(() => { fetchCenters(); fetchReport(); });
                             }}
                          >
                            <option value="sales_value">مبلغ فروش</option>
                            <option value="sales_qty">تعداد فروش</option>
                            <option value="purchase_value">مبلغ خرید</option>
                            <option value="purchase_qty">تعداد خرید</option>
                            <option value="evenly">مساوی</option>
                            <option value="invoices_sales">تعداد فاکتور فروش</option>
                            <option value="invoices_purchase">تعداد فاکتور خرید</option>
                            <option value="direct">مستقیم</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs text-slate-500 mb-1">سطح گروه</label>
                          <select
                             className="w-full border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-amber-400 bg-slate-50"
                             value={cc.allocation_level || "level_1"}
                             onChange={(e) => {
                                fetch(\`/api/cost-centers/\${cc.id}\`, {
                                   method: "PUT", headers: { "Content-Type": "application/json" },
                                   body: JSON.stringify({ allocation_level: e.target.value }),
                                }).then(() => { fetchCenters(); fetchReport(); });
                             }}
                          >
                            <option value="level_1">گروه اصلی</option>
                            <option value="level_2">زیرگروه</option>
                          </select>
                       </div>
                       <div className="col-span-2 relative">
                          <label className="block text-xs text-slate-500 mb-1">ردیف هدف (تخصیص به)</label>
                           {editingTargetId === cc.id ? (
                              <div className="absolute top-10 left-0 z-30 bg-white border border-slate-300 rounded shadow-lg p-2 min-w-[200px] w-full">
                                 <div className="max-h-40 overflow-auto custom-scrollbar mb-2 border-b pb-2">
                                    <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 cursor-pointer">
                                       <input type="checkbox" checked={editingTargetCategories.length === 0} onChange={() => setEditingTargetCategories([])} className="accent-amber-500 rounded" />
                                       <span className="text-xs font-medium text-slate-700">همه رده‌ها (یا خودکار)</span>
                                    </label>
                                    {availableCategories.map((cat: string) => (
                                       <label key={cat} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 cursor-pointer">
                                          <input type="checkbox" checked={editingTargetCategories.includes(cat)} onChange={(e) => {
                                             if(e.target.checked) setEditingTargetCategories([...editingTargetCategories, cat]);
                                             else setEditingTargetCategories(editingTargetCategories.filter(c => c !== cat));
                                          }} className="accent-amber-500 rounded" />
                                          <span className="text-xs text-slate-600 truncate">{cat}</span>
                                       </label>
                                    ))}
                                 </div>
                                 <div className="flex gap-2">
                                    <button onClick={() => {
                                       fetch(\`/api/cost-centers/\${cc.id}\`, {
                                          method: "PUT", headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ target_categories: editingTargetCategories.join(",") }),
                                       }).then(() => { setEditingTargetId(null); fetchCenters(); fetchReport(); });
                                    }} className="bg-amber-500 text-white text-xs px-3 py-1 rounded w-full">تایید</button>
                                    <button onClick={() => setEditingTargetId(null)} className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded w-full">انصراف</button>
                                 </div>
                              </div>
                           ) : (
                              <button onClick={() => {
                                 setEditingTargetId(cc.id);
                                 setEditingTargetCategories(cc.target_categories ? cc.target_categories.split(',') : []);
                              }} className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded text-xs outline-none hover:border-slate-300 w-full text-right truncate shadow-sm">
                                {cc.target_categories || "همه رده‌ها (یا خودکار)"}
                              </button>
                           )}
                       </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-4">
                      <div className="h-full flex items-center justify-center">
                        {chartData.length > 0 ? (
                          <div className="w-full flex h-full items-center">
                            <div className="flex-1 max-w-[150px] flex items-center justify-center">
                              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                {chartData.map((d: any, i: number, arr: any[]) => {
                                  const total = arr.reduce((acc: any, curr: any) => acc + curr.value, 0);
                                  const prevTotal = arr.slice(0, i).reduce((acc: any, curr: any) => acc + curr.value, 0);
                                  if (total === 0 || (d.value === total && total > 0)) {
                                    return <circle key={d.name} cx="50" cy="50" r="40" fill={COLORS[i % COLORS.length]} />;
                                  }
                                  const startAngle = (total > 0 ? (prevTotal / total) : 0) * 360;
                                  const endAngle = (total > 0 ? ((prevTotal + d.value) / total) : 0) * 360;
                                  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
                                  const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
                                  const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
                                  const x2 = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
                                  const y2 = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);
                                  const pathData = [\`M 50 50\`, \`L \${x1} \${y1}\`, \`A 40 40 0 \${largeArcFlag} 1 \${x2} \${y2}\`, \`Z\`].join(" ");
                                  return <path key={d.name} d={pathData} fill={COLORS[i % COLORS.length]} />;
                                })}
                              </svg>
                            </div>
                            <div className="flex-1 flex flex-col justify-start overflow-auto px-4 gap-2 custom-scrollbar max-h-full">
                              {chartData.map((d: any, i: number) => (
                                <div key={d.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1">
                                  <div className="flex items-center gap-2 truncate">
                                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    <span className="truncate text-slate-700" title={d.name}>{d.name}</span>
                                  </div>
                                  <span className="font-mono text-slate-500 font-medium shrink-0 pl-1 text-left min-w-[35px]">
                                    {visualData?.chartTotalCost > 0 ? ((d.value / visualData.chartTotalCost) * 100).toFixed(0) : 0}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-sm text-center">
                            هیچ جذبی صورت نگرفته است.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
`;

fs.writeFileSync('/tmp/new_view.tsx', beforeGrid + newGrid + afterGrid);
