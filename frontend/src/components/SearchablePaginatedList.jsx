import { useEffect, useMemo, useState } from "react";

const PAGE_SIZES = [5, 10, 20];

export function SearchablePaginatedTable({
  items,
  headers,
  getSearchText,
  renderRow,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  initialPageSize = 10,
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      getSearchText(item).toLowerCase().includes(normalized)
    );
  }, [getSearchText, items, query]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize, items]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <div style={styles.wrap}>
      <ListControls
        query={query}
        setQuery={setQuery}
        page={page}
        setPage={setPage}
        pageCount={pageCount}
        pageSize={pageSize}
        setPageSize={setPageSize}
        total={filteredItems.length}
        searchPlaceholder={searchPlaceholder}
      />
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} style={styles.th}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedItems.length > 0 ? (
              pagedItems.map((item, index) => renderRow(item, index))
            ) : (
              <tr>
                <td style={styles.emptyCell} colSpan={headers.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SearchablePaginatedBlocks({
  items,
  getSearchText,
  renderItem,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  initialPageSize = 5,
  gridStyle,
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      getSearchText(item).toLowerCase().includes(normalized)
    );
  }, [getSearchText, items, query]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize, items]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <div style={styles.wrap}>
      <ListControls
        query={query}
        setQuery={setQuery}
        page={page}
        setPage={setPage}
        pageCount={pageCount}
        pageSize={pageSize}
        setPageSize={setPageSize}
        total={filteredItems.length}
        searchPlaceholder={searchPlaceholder}
      />
      {pagedItems.length > 0 ? (
        <div style={gridStyle}>{pagedItems.map((item, index) => renderItem(item, index))}</div>
      ) : (
        <div style={styles.emptyBlock}>{emptyMessage}</div>
      )}
    </div>
  );
}

function ListControls({
  query,
  setQuery,
  page,
  setPage,
  pageCount,
  pageSize,
  setPageSize,
  total,
  searchPlaceholder,
}) {
  return (
    <div style={styles.controls}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        style={styles.searchInput}
      />
      <div style={styles.meta}>
        <span style={styles.metaText}>{total} result{total === 1 ? "" : "s"}</span>
        <select
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
          style={styles.select}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <div style={styles.pager}>
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            style={styles.pageButton}
          >
            Prev
          </button>
          <span style={styles.metaText}>
            {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
            style={styles.pageButton}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchInput: {
    minWidth: 240,
    flex: "1 1 280px",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    background: "white",
  },
  meta: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "9px 10px",
    background: "white",
  },
  pager: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  pageButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    background: "white",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: 14,
    background: "#f8fafc",
    color: "#334155",
    fontSize: 13,
  },
  emptyCell: {
    padding: 18,
    textAlign: "center",
    color: "#64748b",
    borderTop: "1px solid #e2e8f0",
  },
  emptyBlock: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 20,
    color: "#64748b",
    textAlign: "center",
  },
};
