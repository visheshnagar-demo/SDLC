import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({
  columns = [],
  data = [],
  searchKey = "",
  searchPlaceholder = "Search records...",
  pageSize = 10,
  emptyMessage = "No records found.",
  actions,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    if (searchKey && item[searchKey]) {
      return String(item[searchKey])
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    }
    return Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase()),
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-xl border border-[#DBE5E0] shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[#DBE5E0] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#6B7A73]" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-[#F5FAF7] border border-[#DBE5E0] rounded-lg text-sm text-[#171F24] focus:outline-none focus:ring-1 focus:ring-[#0D7A52]"
          />
        </div>
        {actions && (
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {actions}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#171F24]">
          <thead className="bg-[#F5FAF7] text-xs font-semibold text-[#6B7A73] uppercase tracking-wider border-b border-[#DBE5E0]">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DBE5E0]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="hover:bg-gray-50/75 transition"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-3.5 ${col.className || ""}`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-[#6B7A73] text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > pageSize && (
        <div className="p-3 border-t border-[#DBE5E0] flex items-center justify-between text-xs text-[#6B7A73] bg-[#F5FAF7]">
          <span>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + pageSize, filteredData.length)} of{" "}
            {filteredData.length} records
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-[#DBE5E0] bg-white text-[#171F24] disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-[#171F24]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-[#DBE5E0] bg-white text-[#171F24] disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
