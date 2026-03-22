import './Admin.css';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, X, Check, XCircle,
  ChevronRight, Eye, Trash2, Package, ArrowUpDown, Filter, Link2
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { AdminStateBlock, AdminTableSkeleton } from './AdminStateBlocks';
import AdminConfirmDialog from './AdminConfirmDialog';
import { AdminPagination } from './AdminPagination';
import { useAdminListState } from './useAdminListState';
import { ADMIN_VIEW_KEYS } from './adminListView';
import { useAdminViewState } from './useAdminViewState';
import { useAdminToast } from './useAdminToast';
import { ADMIN_DICTIONARY } from './adminDictionary';
import {
  adminReturnService,
  reasonLabel,
  resolutionLabel,
  type ReturnRequest,
  type ReturnStatus,
} from './adminReturnService';
import { AdminToast } from './AdminStateBlocks';

// ── Helpers ───────────────────────────────────────────────────────────────
const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
};

// ── Status helpers ─────────────────────────────────────────────────────────
const statusConfig: Record<ReturnStatus, { label: string; pillClass: string }> = {
  pending:   { label: ADMIN_DICTIONARY.returns.status.pending,  pillClass: 'admin-pill pending'  },
  approved:  { label: ADMIN_DICTIONARY.returns.status.approved, pillClass: 'admin-pill success'  },
  rejected:  { label: ADMIN_DICTIONARY.returns.status.rejected, pillClass: 'admin-pill danger'   },
  completed: { label: ADMIN_DICTIONARY.returns.status.completed, pillClass: 'admin-pill neutral'  },
};

const StatusBadge = ({ status }: { status: ReturnStatus }) => {
  const { label, pillClass } = statusConfig[status];
  return <span className={pillClass}>{label}</span>;
};

const TABS = [
  { key: 'all', label: ADMIN_DICTIONARY.returns.tabs.all },
  { key: 'pending', label: ADMIN_DICTIONARY.returns.tabs.pending },
  { key: 'approved', label: ADMIN_DICTIONARY.returns.tabs.approved },
  { key: 'completed', label: ADMIN_DICTIONARY.returns.tabs.completed },
  { key: 'rejected', label: ADMIN_DICTIONARY.returns.tabs.rejected },
] as const;

type TabKey = typeof TABS[number]['key'];

// ── Main Component ─────────────────────────────────────────────────────────
const AdminReturns = () => {
  const t = ADMIN_DICTIONARY.returns;
  const c = ADMIN_DICTIONARY.common;

  const view = useAdminViewState({
    storageKey: ADMIN_VIEW_KEYS.returns ?? 'admin_returns_view',
    path: '/admin/returns',
    validStatusKeys: ['all', 'pending', 'approved', 'completed', 'rejected'],
    defaultStatus: 'all',
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allReturns, setAllReturns] = useState<ReturnRequest[]>(() => adminReturnService.getAll());

  const { toast, pushToast } = useAdminToast();

  const statusFilter: 'all' | ReturnStatus =
    (view.status === 'pending' || view.status === 'approved' || view.status === 'completed' || view.status === 'rejected')
      ? view.status
      : 'all';

  const { search, isLoading, filteredItems, pagedItems, page, totalPages, startIndex, endIndex, next, prev, setPage, setSearch } =
    useAdminListState<ReturnRequest>({
      items: allReturns,
      searchValue: view.search,
      onSearchChange: view.setSearch,
      getSearchText: (item) => `${item.id} ${item.customerName} ${item.orderId}`,
      filterPredicate: statusFilter === 'all' ? undefined : (item) => item.status === statusFilter,
      pageSize: 10,
    });

  const [drawerItem, setDrawerItem] = useState<ReturnRequest | null>(null);
  const [drawerNote, setDrawerNote] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = adminReturnService.getStats();

  const tabCounts: Record<TabKey, number> = {
    all: allReturns.length,
    pending: allReturns.filter((r) => r.status === 'pending').length,
    approved: allReturns.filter((r) => r.status === 'approved').length,
    completed: allReturns.filter((r) => r.status === 'completed').length,
    rejected: allReturns.filter((r) => r.status === 'rejected').length,
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const changeTab = (key: TabKey) => {
    setSelected(new Set());
    view.setStatus(key);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(filteredItems.map(r => r.id)));
    else setSelected(new Set());
  };

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  const bulkStatusUpdate = (status: ReturnStatus) => {
    let updatedCount = 0;
    selected.forEach(id => {
      const result = adminReturnService.updateStatus(id, status);
      if (result) updatedCount++;
    });
    if (updatedCount > 0) {
      const latest = adminReturnService.getAll();
      setAllReturns(latest);
      setSelected(new Set());
      pushToast(ADMIN_DICTIONARY.messages.returns.bulkUpdated(updatedCount, statusConfig[status].label));
    }
  };

  const bulkDelete = () => {
    selected.forEach(id => adminReturnService.delete(id));
    setAllReturns(adminReturnService.getAll());
    setSelected(new Set());
    pushToast(ADMIN_DICTIONARY.messages.returns.bulkDeleted(selected.size));
  };

  const openDrawer = (item: ReturnRequest) => {
    setDrawerItem(item);
    setDrawerNote(item.adminNote || '');
  };

  const closeDrawer = () => {
    setDrawerItem(null);
    setDrawerNote('');
  };

  const applyStatus = (id: string, status: ReturnStatus) => {
    const updated = adminReturnService.updateStatus(id, status, drawerNote.trim() || undefined);
    if (updated) {
      setAllReturns((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (drawerItem?.id === id) setDrawerItem(updated);
      pushToast(ADMIN_DICTIONARY.messages.returns.statusUpdated(statusConfig[status].label));
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    adminReturnService.delete(deleteTarget.id);
    setAllReturns((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (drawerItem?.id === deleteTarget.id) closeDrawer();
    setDeleteTarget(null);
    pushToast(ADMIN_DICTIONARY.messages.returns.deleted);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // ── Render ─────────────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => stats, [stats]);

  const shareCurrentView = async () => {
    try {
      await view.shareCurrentView();
      pushToast(ADMIN_DICTIONARY.messages.viewCopied);
    } catch {
      pushToast(ADMIN_DICTIONARY.messages.copyFailed);
    }
  };

  const resetCurrentView = () => {
    setSelected(new Set());
    view.resetCurrentView();
    setSearch('');
    setAllReturns(adminReturnService.getAll());
    pushToast(ADMIN_DICTIONARY.messages.returns.resetView);
  };

  return (
    <AdminLayout
      title={t.title}
      actions={
        <>
          <div className="admin-search">
            <Search size={16} />
            <input
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-ghost-btn" onClick={() => pushToast(ADMIN_DICTIONARY.messages.advancedFilterComingSoon)}>
            <Filter size={16} /> {c.filter}
          </button>
          <button className="admin-ghost-btn" onClick={shareCurrentView}>
            <Link2 size={16} /> {ADMIN_DICTIONARY.actions.shareView}
          </button>
          <button className="admin-ghost-btn" onClick={resetCurrentView}>
            {ADMIN_DICTIONARY.actions.resetView}
          </button>
        </>
      }
    >
      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="admin-stats grid-4">
        <div className="admin-stat-card">
          <div className="admin-stat-label">{t.stats.total}</div>
          <div className="admin-stat-value">{statusCounts.total}</div>
          <div className="admin-stat-sub">{t.statsSub.total}</div>
        </div>
        <div
          className={`admin-stat-card ${stats.pending > 0 ? 'warning' : ''}`}
          onClick={() => changeTab('pending')}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-stat-label">{t.stats.pending}</div>
          <div className="admin-stat-value">{statusCounts.pending}</div>
          <div className="admin-stat-sub">{t.statsSub.pending}</div>
        </div>
        <div
          className="admin-stat-card success"
          onClick={() => changeTab('approved')}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-stat-label">{t.stats.approved}</div>
          <div className="admin-stat-value">{statusCounts.approved}</div>
          <div className="admin-stat-sub">{t.statsSub.approved}</div>
        </div>
        <div
          className="admin-stat-card"
          onClick={() => changeTab('completed')}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-stat-label">{t.stats.completed}</div>
          <div className="admin-stat-value">{statusCounts.completed}</div>
          <div className="admin-stat-sub">{t.statsSub.completed}</div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => changeTab(tab.key)}
          >
            <span>{tab.label}</span>
            <span className="admin-tab-count">{tabCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {view.hasViewContext && (
        <div className="admin-view-summary">
          <span className="summary-chip">{c.statusLabel}: {TABS.find(tab => tab.key === statusFilter)?.label}</span>
          {search.trim() && <span className="summary-chip">{c.keyword}: {search.trim()}</span>}
          <button className="summary-clear" onClick={resetCurrentView}>{c.clearFilters}</button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <AdminTableSkeleton rows={5} columns={6} />
      ) : filteredItems.length === 0 ? (
        <AdminStateBlock
          type={search.trim() ? 'search-empty' : 'empty'}
          title={search.trim() ? t.empty.searchTitle : t.empty.defaultTitle}
          description={search.trim() ? t.empty.searchDescription : t.empty.defaultDescription}
          actionLabel={ADMIN_DICTIONARY.actions.resetFilters}
          onAction={resetCurrentView}
        />
      ) : (
        <>
          <div className="admin-table" role="table" aria-label="Danh sách đổi trả">
            <div className="admin-table-row admin-table-head returns-row" role="row">
              <div role="columnheader">
                <input
                  type="checkbox"
                  checked={selected.size === filteredItems.length && filteredItems.length > 0}
                  onChange={e => toggleAll(e.target.checked)}
                />
              </div>
              <div role="columnheader" className="sortable">
                <button className="sort-trigger">{t.columns.requestId} <ArrowUpDown size={14} /></button>
              </div>
              <div role="columnheader">{t.columns.customer}</div>
              <div role="columnheader">{t.columns.orderId}</div>
              <div role="columnheader">{t.columns.reason}</div>
              <div role="columnheader" className="sortable">
                <button className="sort-trigger">{t.columns.createdAt} <ArrowUpDown size={14} /></button>
              </div>
              <div role="columnheader">{t.columns.status}</div>
              <div role="columnheader">{t.columns.actions}</div>
            </div>

            {pagedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                className="admin-table-row returns-row"
                role="row"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.15) }}
                whileHover={{ y: -1 }}
                onClick={() => openDrawer(item)}
                style={{ cursor: 'pointer' }}
              >
                <div role="cell" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={e => toggleOne(item.id, e.target.checked)}
                  />
                </div>
                <div role="cell" className="admin-bold">{item.id}</div>
                <div role="cell" className="customer-info-cell">
                  <div className="customer-avatar initials">{getInitials(item.customerName)}</div>
                  <div className="customer-text">
                    <p className="admin-bold customer-name">{item.customerName}</p>
                    <p className="admin-muted customer-email">{item.customerEmail || item.customerPhone}</p>
                  </div>
                </div>
                <div role="cell" className="admin-muted">{item.orderId}</div>
                <div role="cell">{reasonLabel(item.reason)}</div>
                <div role="cell" className="admin-muted">{formatDate(item.createdAt)}</div>
                <div role="cell"><StatusBadge status={item.status} /></div>
                <div role="cell" className="admin-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="admin-icon-btn subtle" title="Xem chi tiết" onClick={() => openDrawer(item)}>
                    <Eye size={15} />
                  </button>
                  {item.status === 'pending' && (
                    <>
                      <button
                        className="admin-icon-btn success"
                        title="Duyệt"
                        onClick={() => applyStatus(item.id, 'approved')}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        className="admin-icon-btn subtle danger-icon"
                        title={ADMIN_DICTIONARY.actionTitles.hide}
                        aria-label={ADMIN_DICTIONARY.actionTitles.hide}
                        onClick={() => applyStatus(item.id, 'rejected')}
                      >
                        <XCircle size={15} />
                      </button>
                    </>
                  )}
                  {item.status === 'approved' && (
                    <button
                      className="admin-icon-btn"
                      title="Đánh dấu hoàn tất"
                      onClick={() => applyStatus(item.id, 'completed')}
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    className="admin-icon-btn subtle danger-icon"
                    title={ADMIN_DICTIONARY.actionTitles.delete}
                    aria-label={ADMIN_DICTIONARY.actionTitles.delete}
                    onClick={() => setDeleteTarget({ id: item.id, name: item.id })}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {!isLoading && filteredItems.length > 0 && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              total={filteredItems.length}
              onPageChange={setPage}
              onPrev={prev}
              onNext={next}
              selectedNoun={t.selectedNoun}
            />
          )}
        </>
      )}

      {/* ── Detail Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerItem && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />
            <motion.div
              className="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              {/* Drawer Header */}
              <div className="drawer-header">
                <div>
                  <p className="drawer-eyebrow">{t.drawerTitle}</p>
                  <h3>{drawerItem.id}</h3>
                </div>
                <button className="admin-icon-btn" onClick={closeDrawer}><X size={18} /></button>
              </div>

              <div className="drawer-body">
                {/* Status */}
                <section className="drawer-section">
                  <h4>Trạng thái</h4>
                  <StatusBadge status={drawerItem.status} />
                </section>

                {/* Customer Info */}
                <section className="drawer-section">
                  <h4>Khách hàng</h4>
                  <div className="admin-card-row">
                    <span className="admin-muted small">Tên</span>
                    <span className="admin-bold">{drawerItem.customerName}</span>
                  </div>
                  {drawerItem.customerPhone && (
                    <div className="admin-card-row">
                      <span className="admin-muted small">SĐT</span>
                      <span>{drawerItem.customerPhone}</span>
                    </div>
                  )}
                  <div className="admin-card-row">
                    <span className="admin-muted small">Mã đơn</span>
                    <span><ChevronRight size={12} /> {drawerItem.orderId}</span>
                  </div>
                </section>

                {/* Return Address */}
                <section className="drawer-section">
                  <h4>{ADMIN_DICTIONARY.returns.returnAddress.title}</h4>
                  <div className="return-address-card">
                    <p className="admin-bold">{ADMIN_DICTIONARY.returns.returnAddress.warehouse}</p>
                    <p className="admin-muted">{ADMIN_DICTIONARY.returns.returnAddress.line1}</p>
                    <p className="admin-muted">{ADMIN_DICTIONARY.returns.returnAddress.line2}</p>
                  </div>
                </section>

                {/* Return Details */}
                <section className="drawer-section">
                  <h4>Chi tiết yêu cầu</h4>
                  <div className="admin-card-row">
                    <span className="admin-muted small">Lý do</span>
                    <span className="admin-bold">{reasonLabel(drawerItem.reason)}</span>
                  </div>
                  <div className="admin-card-row">
                    <span className="admin-muted small">Giải pháp</span>
                    <span>{resolutionLabel(drawerItem.resolution)}</span>
                  </div>
                  {drawerItem.note && (
                    <div style={{ marginTop: 8 }}>
                      <p className="admin-muted small">Ghi chú khách:</p>
                      <p style={{ marginTop: 4, fontStyle: 'italic', fontSize: '13px', color: '#475569' }}>{drawerItem.note}</p>
                    </div>
                  )}
                </section>

                {/* Items */}
                <section className="drawer-section">
                  <h4>Sản phẩm đổi trả</h4>
                  {drawerItem.items.map((item) => (
                    <div key={item.id} className="admin-order-item">
                      <img src={item.image} alt={item.name} className="admin-order-item-img" />
                      <div>
                        <p className="admin-bold">{item.name}</p>
                        <p className="admin-muted small">{item.variant}</p>
                        <p className="admin-muted small">{item.price.toLocaleString('vi-VN')} đ</p>
                      </div>
                    </div>
                  ))}
                </section>

                {/* Admin Note */}
                <section className="drawer-section">
                  <h4>Ghi chú nội bộ</h4>
                  <textarea
                    className="confirm-reason-input"
                    placeholder="Ghi chú dành cho nội bộ..."
                    value={drawerNote}
                    onChange={(e) => setDrawerNote(e.target.value)}
                    rows={3}
                  />
                </section>

                {/* Actions */}
                {(drawerItem.status === 'pending' || drawerItem.status === 'approved') && (
                  <section className="drawer-section">
                    <h4>Hành động xử lý</h4>
                    <div className="admin-actions" style={{ marginTop: '10px' }}>
                      {drawerItem.status === 'pending' && (
                        <>
                          <button
                            className="admin-primary-btn"
                            onClick={() => applyStatus(drawerItem.id, 'approved')}
                          >
                            <Check size={14} /> Duyệt yêu cầu
                          </button>
                          <button
                            className="admin-ghost-btn danger"
                            onClick={() => applyStatus(drawerItem.id, 'rejected')}
                          >
                            <XCircle size={14} /> Từ chối
                          </button>
                        </>
                      )}
                      {drawerItem.status === 'approved' && (
                        <button
                          className="admin-primary-btn"
                          onClick={() => applyStatus(drawerItem.id, 'completed')}
                        >
                          <Package size={14} /> Đánh dấu hoàn tất
                        </button>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa yêu cầu đổi trả"
        description="Bạn có chắc chắn muốn xóa yêu cầu đổi trả này?"
        selectedItems={deleteTarget ? [deleteTarget.name] : undefined}
        selectedNoun="yêu cầu"
        confirmLabel="Xóa"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {/* ── Floating Bulk Actions ────────────────────────────────────────── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            className="admin-floating-bar"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 22 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="admin-floating-content">
              <span>{c.selected(selected.size, 'yêu cầu')}</span>
              <div className="admin-actions">
                <button className="admin-ghost-btn" onClick={() => bulkStatusUpdate('approved')}>
                  <Check size={14} /> Duyệt hàng loạt
                </button>
                <button className="admin-ghost-btn" onClick={() => bulkStatusUpdate('rejected')}>
                  <XCircle size={14} /> Từ chối
                </button>
                <button className="admin-ghost-btn danger" onClick={bulkDelete}>
                  <Trash2 size={14} /> Xóa
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      <AdminToast toast={toast} />
    </AdminLayout>
  );
};

export default AdminReturns;
