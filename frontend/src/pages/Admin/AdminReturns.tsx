import './Admin.css';
import { useEffect, useMemo, useState } from 'react';
import { X, Check, XCircle, Eye } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { AdminStateBlock } from './AdminStateBlocks';
import { useAdminToast } from './useAdminToast';
import { returnService, type ReturnRequest, type ReturnStatus } from '../../services/returnService';
import { PanelTabs } from '../../components/Panel/PanelPrimitives';
import Drawer from '../../components/Drawer/Drawer';
import {
  toDisplayOrderCode,
  toDisplayReturnCode,
} from '../../utils/displayCode';

const statusConfig: Record<ReturnStatus, { label: string; pillClass: string }> = {
  PENDING:   { label: 'Chờ duyệt',  pillClass: 'admin-pill pending' },
  APPROVED:  { label: 'Đã duyệt',   pillClass: 'admin-pill success' },
  REJECTED:  { label: 'Đã từ chối', pillClass: 'admin-pill danger' },
  COMPLETED: { label: 'Đã hoàn',    pillClass: 'admin-pill neutral' },
};

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'completed', label: 'Đã hoàn' },
  { key: 'rejected', label: 'Đã từ chối' },
] as const;

type TabKey = typeof TABS[number]['key'];

const PAGE_SIZE = 20;

const reasonLabel: Record<string, string> = {
  SIZE: 'Không đúng kích cỡ',
  DEFECT: 'Lỗi sản phẩm',
  CHANGE: 'Muốn đổi sản phẩm',
  OTHER: 'Lý do khác',
};

const resolutionLabel: Record<string, string> = {
  EXCHANGE: 'Đổi sản phẩm',
  REFUND: 'Hoàn tiền',
};

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminReturns = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allReturns, setAllReturns] = useState<ReturnRequest[]>([]);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [drawerItem, setDrawerItem] = useState<ReturnRequest | null>(null);
  const [drawerNote, setDrawerNote] = useState('');
  const { pushToast } = useAdminToast();

  const statusFilter: ReturnStatus | null =
    activeTab === 'pending' ? 'PENDING'
      : activeTab === 'approved' ? 'APPROVED'
        : activeTab === 'completed' ? 'COMPLETED'
          : activeTab === 'rejected' ? 'REJECTED'
            : null;

  const drawerItemCount = useMemo(
    () => (drawerItem ? drawerItem.items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0) : 0),
    [drawerItem],
  );

  const drawerRefundTotal = useMemo(
    () => (drawerItem ? drawerItem.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) : 0),
    [drawerItem],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const [res, allRes, pendingRes, approvedRes, completedRes, rejectedRes] = await Promise.all([
          returnService.listAdmin({
            status: statusFilter || undefined,
            page: 0,
            size: PAGE_SIZE,
          }),
          returnService.listAdmin({ page: 0, size: 1 }),
          returnService.listAdmin({ status: 'PENDING', page: 0, size: 1 }),
          returnService.listAdmin({ status: 'APPROVED', page: 0, size: 1 }),
          returnService.listAdmin({ status: 'COMPLETED', page: 0, size: 1 }),
          returnService.listAdmin({ status: 'REJECTED', page: 0, size: 1 }),
        ]);
        if (!active) return;
        setAllReturns(res.content);
        setTabCounts({
          all: allRes.totalElements,
          pending: pendingRes.totalElements,
          approved: approvedRes.totalElements,
          completed: completedRes.totalElements,
          rejected: rejectedRes.totalElements,
        });
      } catch {
        if (active) pushToast('Không tải được danh sách đối trả');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [statusFilter, pushToast]);

  const filteredItems = useMemo(() => {
    const searchText = searchQuery.trim().toLowerCase();
    if (!searchText) return allReturns;
    return allReturns.filter((item) =>
      item.id.toLowerCase().includes(searchText) ||
      (item.code || '').toLowerCase().includes(searchText) ||
      (item.orderCode || '').toLowerCase().includes(searchText) ||
      (item.customerName || '').toLowerCase().includes(searchText)
    );
  }, [allReturns, searchQuery]);

  const pagedItems = filteredItems;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(pagedItems.map((r) => r.id)) : new Set());
  };

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  const applyStatus = async (id: string, status: ReturnStatus) => {
    try {
      const updated = await returnService.updateStatus(id, status, drawerNote);
      setAllReturns((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setDrawerItem((current) => (current && current.id === id ? updated : current));
      pushToast(`Đã cập nhật trạng thái yêu cầu trả hàng`);
      setDrawerNote('');
    } catch {
      pushToast('Không thể cập nhật trạng thái yêu cầu');
    }
  };

  const resetCurrentView = () => {
    setActiveTab('all');
    setSearchQuery('');
    setSelected(new Set());
  };

  return (
    <AdminLayout
      title="Hoàn đơn"
      breadcrumbs={['Đơn hàng', 'Quản lý hoàn trả']}
    >
      <PanelTabs
        items={TABS.map((tab) => ({
          key: tab.key,
          label: tab.label,
          count: tabCounts[tab.key],
        }))}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
      />

      <section className="admin-panels single">
        <div className="admin-panel">
          {isLoading ? (
            <AdminStateBlock type="empty" title="Đang tải danh sách hoàn trả" description="Đang đồng bộ dữ liệu từ hệ thống." />
          ) : filteredItems.length === 0 ? (
            <AdminStateBlock
              type={searchQuery.trim() ? 'search-empty' : 'empty'}
              title={searchQuery.trim() ? 'Không tìm thấy yêu cầu phù hợp' : 'Chưa có yêu cầu hoàn trả'}
              description={searchQuery.trim() ? 'Thử đổi từ khóa hoặc đặt lại bộ lọc.' : 'Khi khách gửi yêu cầu trả hàng, danh sách sẽ xuất hiện tại đây.'}
              actionLabel="Đặt lại"
              onAction={resetCurrentView}
            />
          ) : (
            <>
              <div className="admin-table" role="table" aria-label="Bảng yêu cầu hoàn trả">
                <div className="admin-table-row admin-table-head returns-row" role="row">
                  <div role="columnheader">
                    <input type="checkbox" checked={selected.size === pagedItems.length && pagedItems.length > 0} onChange={(e) => toggleAll(e.target.checked)} />
                  </div>
                  <div role="columnheader">Mã yêu cầu</div>
                  <div role="columnheader">Sản phẩm</div>
                  <div role="columnheader">Khách hàng</div>
                  <div role="columnheader">Gian hàng</div>
                  <div role="columnheader">Lý do</div>
                  <div role="columnheader">Trạng thái</div>
                  <div role="columnheader">Hành động</div>
                </div>

                {pagedItems.map((item) => (
                  <div key={item.id} className="admin-table-row returns-row" role="row" onClick={() => setDrawerItem(item)} style={{ cursor: 'pointer' }}>
                    <div role="cell" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(item.id)} onChange={(e) => toggleOne(item.id, e.target.checked)} />
                    </div>
                    <div role="cell" title={toDisplayReturnCode(item.code)}>
                      <span className="admin-bold returns-ellipsis">{toDisplayReturnCode(item.code)}</span>
                    </div>
                    <div role="cell" title={item.items.map(i => i.productName).join(', ')}>
                      <div className="returns-ellipsis">
                        {item.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>
                    <div role="cell" title={item.customerName}>
                      <div className="admin-bold returns-ellipsis">{item.customerName}</div>
                    </div>
                    <div role="cell" title={item.storeName || 'Chưa xác định'}>
                      <span className="admin-muted returns-ellipsis">{item.storeName || 'Chưa xác định'}</span>
                    </div>
                    <div role="cell" title={item.reason}>
                      <span className="admin-muted returns-ellipsis">{item.reason}</span>
                    </div>
                    <div role="cell"><span className={statusConfig[item.status].pillClass}>{statusConfig[item.status].label}</span></div>
                    <div role="cell" className="admin-actions returns-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="admin-icon-btn subtle" title="Xem chi tiết" onClick={() => setDrawerItem(item)}><Eye size={16} /></button>
                      {item.status === 'PENDING' && (
                        <>
                          <button className="admin-icon-btn subtle" title="Duyệt" onClick={() => void applyStatus(item.id, 'APPROVED')}><Check size={16} /></button>
                          <button className="admin-icon-btn subtle danger-icon" title="Từ chối" onClick={() => void applyStatus(item.id, 'REJECTED')}><XCircle size={16} /></button>
                        </>
                      )}
                      {item.status === 'APPROVED' && (
                        <button className="admin-icon-btn subtle" title="Hoàn tất" onClick={() => void applyStatus(item.id, 'COMPLETED')}><Check size={16} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="table-footer">
                <span className="table-footer-meta">Hiển thị {pagedItems.length} yêu cầu</span>
              </div>
            </>
          )}
        </div>
      </section>

      <Drawer open={Boolean(drawerItem)} onClose={() => { setDrawerItem(null); setDrawerNote(''); }}>
        {drawerItem ? (
          <>
            <div className="drawer-header returns-drawer-header">
              <div>
                <p className="drawer-eyebrow">Yêu cầu hoàn trả</p>
                <h3>{toDisplayReturnCode(drawerItem.code)}</h3>
                <div className="returns-drawer-status-line">
                  <span className={statusConfig[drawerItem.status].pillClass}>{statusConfig[drawerItem.status].label}</span>
                  <span className="admin-pill neutral">{resolutionLabel[drawerItem.resolution] || drawerItem.resolution}</span>
                </div>
              </div>
              <button className="admin-icon-btn" onClick={() => { setDrawerItem(null); setDrawerNote(''); }}><X size={16} /></button>
            </div>
            <div className="drawer-body">
              <section className="drawer-section">
                <h4>Tổng quan yêu cầu</h4>
                <div className="returns-meta-grid">
                  <article className="returns-meta-card">
                    <span className="returns-meta-label">Mã đơn</span>
                    <strong>{toDisplayOrderCode(drawerItem.orderCode)}</strong>
                  </article>
                  <article className="returns-meta-card">
                    <span className="returns-meta-label">Khách hàng</span>
                    <strong>{drawerItem.customerName}</strong>
                    <small className="admin-muted">{drawerItem.customerEmail || 'Chưa có email'}</small>
                  </article>
                  <article className="returns-meta-card">
                    <span className="returns-meta-label">Gian hàng</span>
                    <strong>{drawerItem.storeName || 'Chưa xác định'}</strong>
                    <small className="admin-muted">{drawerItem.customerPhone || 'Chưa có SĐT khách'}</small>
                  </article>
                  <article className="returns-meta-card">
                    <span className="returns-meta-label">Thời gian tạo</span>
                    <strong>{formatDateTime(drawerItem.createdAt)}</strong>
                    <small className="admin-muted">Cập nhật: {formatDateTime(drawerItem.updatedAt)}</small>
                  </article>
                </div>
              </section>

              <section className="drawer-section">
                <h4>Lý do và ghi chú khách</h4>
                <div className="returns-reason-box">
                  <div className="admin-card-row">
                    <span className="admin-bold">Lý do</span>
                    <span className="admin-muted">{reasonLabel[drawerItem.reason] || drawerItem.reason}</span>
                  </div>
                  <div className="admin-card-row">
                    <span className="admin-bold">Ghi chú khách</span>
                    <span className="admin-muted">{drawerItem.note?.trim() || 'Không có ghi chú bổ sung'}</span>
                  </div>
                </div>
              </section>

              {drawerItem.items.length > 0 && (
                <section className="drawer-section">
                  <h4>Sản phẩm trả lại ({drawerItemCount})</h4>
                  <div className="returns-items-list">
                  {drawerItem.items.map((item) => (
                    <article key={item.orderItemId} className="returns-item-card">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="returns-item-image" />
                      ) : (
                        <div className="returns-item-image placeholder">SP</div>
                      )}
                      <div className="returns-item-content">
                        <strong className="returns-item-name">{item.productName}</strong>
                        <small className="admin-muted">{item.variantName || 'Biến thể mặc định'}</small>
                        <div className="returns-item-meta">
                          <span>x{item.quantity}</span>
                          <span>{formatVnd(item.unitPrice)}</span>
                          <span className="admin-bold">{formatVnd(item.unitPrice * item.quantity)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                  </div>
                  <div className="returns-summary-row">
                    <span className="admin-muted">Giá trị hoàn dự kiến</span>
                    <strong>{formatVnd(drawerRefundTotal)}</strong>
                  </div>
                </section>
              )}

              <section className="drawer-section">
                <h4>Ghi chú kiểm duyệt</h4>
                <div className="returns-note-box">
                  <p className="returns-note-label">Ghi chú hiện tại</p>
                  <p className="returns-note-text">{drawerItem.adminNote?.trim() || 'Chưa có ghi chú kiểm duyệt'}</p>
                </div>
                <div className="returns-note-input-wrap">
                  <label htmlFor="admin-return-note" className="returns-note-label">Cập nhật ghi chú mới</label>
                  <textarea
                    id="admin-return-note"
                    value={drawerNote}
                    onChange={(e) => setDrawerNote(e.target.value)}
                    rows={4}
                    placeholder="Nhập ghi chú nội bộ cho lần cập nhật trạng thái này..."
                    className="returns-note-input"
                  />
                </div>
              </section>
            </div>
            <div className="drawer-footer">
              <button className="admin-ghost-btn" onClick={() => { setDrawerItem(null); setDrawerNote(''); }}>Đóng</button>
              {drawerItem.status === 'PENDING' && (
                <>
                  <button className="admin-ghost-btn danger" onClick={() => void applyStatus(drawerItem.id, 'REJECTED')}><XCircle size={14} /> Từ chối</button>
                  <button className="admin-primary-btn" onClick={() => void applyStatus(drawerItem.id, 'APPROVED')}><Check size={14} /> Duyệt</button>
                </>
              )}
              {drawerItem.status === 'APPROVED' && (
                <button className="admin-primary-btn" onClick={() => void applyStatus(drawerItem.id, 'COMPLETED')}><Check size={14} /> Hoàn tất</button>
              )}
            </div>
          </>
        ) : null}
      </Drawer>
    </AdminLayout>
  );
};

export default AdminReturns;
