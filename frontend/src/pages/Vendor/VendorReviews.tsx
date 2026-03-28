import './Vendor.css';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Link2, MessageSquare, Star } from 'lucide-react';
import VendorLayout from './VendorLayout';
import { PanelFloatingBar, PanelStatsGrid, PanelTabs } from '../../components/Panel/PanelPrimitives';
import {
  PanelDrawerFooter,
  PanelDrawerHeader,
  PanelDrawerSection,
  PanelSearchField,
} from '../../components/Panel/PanelPrimitives';
import { reviewService, type Review } from '../../services/reviewService';
import { authService } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import { AdminStateBlock } from '../Admin/AdminStateBlocks';
import AdminConfirmDialog from '../Admin/AdminConfirmDialog';
import Drawer from '../../components/Drawer/Drawer';

const TABS = [
  { key: 'all', label: 'Táº¥t cáº£' },
  { key: 'need_reply', label: 'Cáº§n pháº£n há»“i' },
  { key: 'negative', label: 'ÄÃ¡nh giÃ¡ tiÃªu cá»±c' },
] as const;

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="vendor-rating-stars">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={14}
        style={{
          color: star <= rating ? '#facc15' : '#d1d5db',
          fill: star <= rating ? '#facc15' : 'none',
        }}
      />
    ))}
  </div>
);

const VendorReviews = () => {
  const { addToast } = useToast();
  const storeId = authService.getSession()?.user.storeId || '';
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'need_reply' | 'negative'>('all');
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [confirmReplyIds, setConfirmReplyIds] = useState<string[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canVendorReply = reviewService.canVendorReply();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!storeId) {
        if (!mounted) return;
        setAllReviews([]);
        setLoadError('Cannot resolve current vendor store.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);
        const rows = await reviewService.getReviewsByStore(storeId);
        if (!mounted) return;
        setAllReviews(rows);
      } catch {
        if (!mounted) return;
        setAllReviews([]);
        setLoadError('Cannot load reviews for this store.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [storeId, reloadKey]);

  const reviews = useMemo(() => {
    return allReviews.filter((review) => {
      const keyword = query.trim().toLowerCase();
      const matchesSearch =
        !keyword || `${review.productName} ${review.content} ${review.orderId}`.toLowerCase().includes(keyword);
      const matchesTab =
        activeTab === 'all'
          ? true
          : activeTab === 'need_reply'
            ? !review.shopReply
            : review.rating <= 3;
      return matchesSearch && matchesTab;
    });
  }, [activeTab, allReviews, query]);

  const stats = useMemo(() => {
    return {
      total: allReviews.length,
      needReply: allReviews.filter((review) => !review.shopReply).length,
      negative: allReviews.filter((review) => review.rating <= 3).length,
      average: allReviews.length
        ? (allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length).toFixed(1)
        : '0.0',
    };
  }, [allReviews]);

  const resetCurrentView = () => {
    setQuery('');
    setActiveTab('all');
    setSelected(new Set());
  };

  const shareCurrentView = async () => {
    await navigator.clipboard.writeText(window.location.href);
    addToast('ÄÃ£ sao chÃ©p bá»™ lá»c hiá»‡n táº¡i cá»§a Ä‘Ã¡nh giÃ¡ shop', 'success');
  };

  const submitReply = (id: string) => {
    if (!canVendorReply) {
      addToast('Seller reply API is not available yet. You can view reviews in read-only mode.', 'info');
      return;
    }

    const content = (replyDrafts[id] || '').trim();
    if (!content) {
      addToast('HÃ£y nháº­p ná»™i dung pháº£n há»“i trÆ°á»›c khi gá»­i', 'info');
      return;
    }
    setReplyDrafts((current) => ({ ...current, [id]: '' }));
    setConfirmReplyIds(null);
    setSelected(new Set());
    addToast('Seller reply API is not available yet. Draft saved locally only.', 'info');
  };

  const selectedNeedReply = Array.from(selected).filter((id) => {
    if (!canVendorReply) return false;
    const current = reviews.find((review) => review.id === id);
    return current && !current.shopReply && (replyDrafts[id] || '').trim();
  });

  const statItems = [
    {
      key: 'all',
      label: 'Tá»•ng Ä‘Ã¡nh giÃ¡',
      value: stats.total,
      sub: `Äiá»ƒm trung bÃ¬nh: ${stats.average}`,
      onClick: () => setActiveTab('all'),
    },
    {
      key: 'need_reply',
      label: 'Cáº§n pháº£n há»“i',
      value: stats.needReply,
      sub: 'ÄÃ¡nh giÃ¡ chÆ°a cÃ³ pháº£n há»“i tá»« shop',
      tone: 'warning',
      onClick: () => setActiveTab('need_reply'),
    },
    {
      key: 'negative',
      label: 'ÄÃ¡nh giÃ¡ â‰¤ 3 sao',
      value: stats.negative,
      sub: 'TÃ­n hiá»‡u cáº§n chÄƒm sÃ³c Æ°u tiÃªn',
      tone: 'info',
      onClick: () => setActiveTab('negative'),
    },
    {
      key: 'reply_rate',
      label: 'Tá»· lá»‡ pháº£n há»“i',
      value: stats.total ? `${Math.round(((stats.total - stats.needReply) / stats.total) * 100)}%` : '0%',
      sub: 'Tá»· lá»‡ Ä‘Ã¡nh giÃ¡ Ä‘Ã£ Ä‘Æ°á»£c shop chÄƒm sÃ³c',
      tone: 'success',
      onClick: () => setActiveTab('all'),
    },
  ] as const;

  const tabItems = TABS.map((tab) => ({ key: tab.key, label: tab.label }));


  return (
    <VendorLayout
      title="ÄÃ¡nh giÃ¡, pháº£n há»“i vÃ  uy tÃ­n shop"
      breadcrumbs={['KÃªnh NgÆ°á»i BÃ¡n', 'ÄÃ¡nh giÃ¡ vÃ  pháº£n há»“i']}
      actions={
        <>
          <PanelSearchField
            placeholder="TÃ¬m theo sáº£n pháº©m, ná»™i dung hoáº·c mÃ£ Ä‘Æ¡n"
            value={query}
            onChange={setQuery}
          />
          <button className="admin-ghost-btn" onClick={() => void shareCurrentView()}>
            <Link2 size={16} />
            Chia sáº» bá»™ lá»c
          </button>
          <button className="admin-ghost-btn" onClick={resetCurrentView}>Äáº·t láº¡i</button>
        </>
      }
    >
      <PanelStatsGrid items={[...statItems]} accentClassName="vendor-stat-button" />

      <PanelTabs
        items={tabItems}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'all' | 'need_reply' | 'negative')}
        accentClassName="vendor-active-tab"
      />

      <section className="admin-panels single">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Danh sÃ¡ch Ä‘Ã¡nh giÃ¡</h2>
              {!canVendorReply ? (
                <p className="admin-muted small">Táº¡m thá»i cháº¿ Ä‘á»™ read-only: backend chÆ°a cung cáº¥p API seller reply.</p>
              ) : null}
            </div>
          </div>
          {loading ? (
            <AdminStateBlock
              type="empty"
              title="Äang táº£i danh sÃ¡ch Ä‘Ã¡nh giÃ¡"
              description="Há»‡ thá»‘ng Ä‘ang Ä‘á»“ng bá»™ dá»¯ liá»‡u pháº£n há»“i cá»§a gian hÃ ng."
            />
          ) : loadError ? (
            <AdminStateBlock
              type="empty"
              title="KhÃ´ng táº£i Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡"
              description={loadError}
              actionLabel="Thá»­ láº¡i"
              onAction={() => setReloadKey((key) => key + 1)}
            />
          ) : reviews.length === 0 ? (
            <AdminStateBlock
              type={query.trim() ? 'search-empty' : 'empty'}
              title={query.trim() ? 'KhÃ´ng cÃ³ Ä‘Ã¡nh giÃ¡ phÃ¹ há»£p' : 'ChÆ°a cÃ³ Ä‘Ã¡nh giÃ¡ cáº§n xá»­ lÃ½'}
              description={
                query.trim()
                  ? 'Thá»­ Ä‘á»•i tá»« khÃ³a hoáº·c tab Ä‘á»ƒ xem láº¡i hÃ ng Ä‘á»£i pháº£n há»“i cá»§a shop.'
                  : 'Khi khÃ¡ch Ä‘á»ƒ láº¡i Ä‘Ã¡nh giÃ¡, seller panel sáº½ hiá»ƒn thá»‹ táº¡i Ä‘Ã¢y.'
              }
              actionLabel={query.trim() ? 'Äáº·t láº¡i bá»™ lá»c' : undefined}
              onAction={query.trim() ? resetCurrentView : undefined}
            />
          ) : (
            <div className="admin-table" role="table" aria-label="Báº£ng Ä‘Ã¡nh giÃ¡ cá»§a shop">
              <div className="admin-table-row vendor-reviews admin-table-head" role="row">
                <div role="columnheader">
                  <input
                    type="checkbox"
                    checked={selected.size === reviews.length && reviews.length > 0}
                    onChange={(event) => setSelected(event.target.checked ? new Set(reviews.map((item) => item.id)) : new Set())}
                  />
                </div>
                <div role="columnheader">Sáº£n pháº©m</div>
                <div role="columnheader">ÄÃ¡nh giÃ¡</div>
                <div role="columnheader">Ná»™i dung</div>
                <div role="columnheader">Tráº¡ng thÃ¡i</div>
                <div role="columnheader">Pháº£n há»“i</div>
                <div role="columnheader">HÃ nh Ä‘á»™ng</div>
              </div>

              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  className="admin-table-row vendor-reviews"
                  role="row"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.14) }}
                  whileHover={{ y: -1 }}
                  onClick={() => setActiveReview(review)}
                  style={{ cursor: 'pointer' }}
                >
                  <div role="cell" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(review.id)}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.target.checked) next.add(review.id);
                        else next.delete(review.id);
                        setSelected(next);
                      }}
                    />
                  </div>
                  <div role="cell" className="vendor-admin-product-cell">
                    <img src={review.productImage} alt={review.productName} className="vendor-admin-thumb" />
                    <div className="vendor-admin-product-copy">
                      <div className="admin-bold">{review.productName}</div>
                      <div className="admin-muted small">ÄÆ¡n #{review.orderId}</div>
                    </div>
                  </div>
                  <div role="cell">
                    <RatingStars rating={review.rating} />
                    <div className="admin-muted small">{review.createdAt}</div>
                  </div>
                  <div role="cell" className="vendor-review-content">{review.content}</div>
                  <div role="cell">
                    <span className={`admin-pill ${review.rating <= 3 ? 'pending' : 'success'}`}>
                      {review.rating <= 3 ? 'Cáº§n chÄƒm sÃ³c' : 'á»”n Ä‘á»‹nh'}
                    </span>
                  </div>
                  <div role="cell">
                    {review.shopReply ? (
                      <div className="vendor-reply-badge">
                        <span className="admin-bold">ÄÃ£ pháº£n há»“i</span>
                        <span className="admin-muted small">{review.shopReply.createdAt}</span>
                      </div>
                    ) : (
                      <span className="badge amber">ChÆ°a pháº£n há»“i</span>
                    )}
                  </div>
                  <div role="cell" className="admin-actions" onClick={(event) => event.stopPropagation()}>
                    <button
                      className="admin-icon-btn subtle"
                      onClick={() => setActiveReview(review)}
                      aria-label="Xem chi tiáº¿t Ä‘Ã¡nh giÃ¡"
                      title="Xem chi tiáº¿t Ä‘Ã¡nh giÃ¡"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <PanelFloatingBar show={selected.size > 0} className="vendor-floating-bar">
        <div className="admin-floating-content">
          <span>ÄÃ£ chá»n {selected.size} Ä‘Ã¡nh giÃ¡</span>
          <div className="admin-actions">
            <button className="admin-ghost-btn" onClick={() => setSelected(new Set())}>Bá» chá»n</button>
            {selectedNeedReply.length > 0 ? (
              <button className="admin-ghost-btn" onClick={() => setConfirmReplyIds(selectedNeedReply)}>
                Gá»­i pháº£n há»“i Ä‘Ã£ chá»n
              </button>
            ) : null}
          </div>
        </div>
      </PanelFloatingBar>

      <AdminConfirmDialog
        open={Boolean(confirmReplyIds?.length)}
        title="Gá»­i pháº£n há»“i cho cÃ¡c Ä‘Ã¡nh giÃ¡ Ä‘Ã£ chá»n"
        description="CÃ¡c Ä‘Ã¡nh giÃ¡ nÃ y sáº½ nháº­n pháº£n há»“i tá»« shop ngay sau khi xÃ¡c nháº­n."
        selectedItems={confirmReplyIds || []}
        selectedNoun="Ä‘Ã¡nh giÃ¡"
        confirmLabel="Gá»­i pháº£n há»“i"
        onCancel={() => setConfirmReplyIds(null)}
        onConfirm={() => confirmReplyIds?.forEach((id) => submitReply(id))}
      />

      <Drawer open={Boolean(activeReview)} onClose={() => setActiveReview(null)}>
        {activeReview ? (
          <>
            <PanelDrawerHeader
              eyebrow="Chi tiáº¿t Ä‘Ã¡nh giÃ¡"
              title={activeReview.productName}
              onClose={() => setActiveReview(null)}
              closeLabel="ÄÃ³ng chi tiáº¿t Ä‘Ã¡nh giÃ¡"
            />
            <div className="drawer-body">
              <PanelDrawerSection title="ThÃ´ng tin Ä‘Ã¡nh giÃ¡">
                <div className="admin-card-list">
                  <div className="admin-card-row">
                    <span className="admin-bold">ÄÆ¡n hÃ ng</span>
                    <span className="admin-muted">#{activeReview.orderId}</span>
                  </div>
                  <div className="admin-card-row">
                    <span className="admin-bold">Sá»‘ sao</span>
                    <span><RatingStars rating={activeReview.rating} /></span>
                  </div>
                  <div className="admin-card-row">
                    <span className="admin-bold">Ná»™i dung</span>
                    <span className="admin-muted">{activeReview.content}</span>
                  </div>
                </div>
              </PanelDrawerSection>
              <PanelDrawerSection title="Pháº£n há»“i cá»§a shop">
                {activeReview.shopReply ? (
                  <div className="vendor-review-reply-box">
                    <strong>ÄÃ£ pháº£n há»“i:</strong> {activeReview.shopReply.content}
                  </div>
                ) : canVendorReply ? (
                  <div className="form-grid">
                    <label className="form-field full">
                      <span>Ná»™i dung pháº£n há»“i</span>
                      <textarea
                        rows={4}
                        value={replyDrafts[activeReview.id] || ''}
                        onChange={(event) =>
                          setReplyDrafts((current) => ({ ...current, [activeReview.id]: event.target.value }))
                        }
                        placeholder="Giáº£i thÃ­ch, xin lá»—i hoáº·c hÆ°á»›ng dáº«n khÃ¡ch hÃ ng..."
                      />
                    </label>
                  </div>
                ) : (
                  <div className="vendor-review-reply-box">
                    API pháº£n há»“i cho seller chÆ°a sáºµn sÃ ng. Báº¡n cÃ³ thá»ƒ theo dÃµi Ä‘Ã¡nh giÃ¡ á»Ÿ cháº¿ Ä‘á»™ xem.
                  </div>
                )}
              </PanelDrawerSection>
            </div>
            <PanelDrawerFooter>
              <button className="admin-ghost-btn" onClick={() => setActiveReview(null)}>ÄÃ³ng</button>
              {!activeReview.shopReply && canVendorReply ? (
                <button className="admin-primary-btn vendor-admin-primary" onClick={() => submitReply(activeReview.id)}>
                  <MessageSquare size={15} />
                  Gá»­i pháº£n há»“i
                </button>
              ) : null}
            </PanelDrawerFooter>
          </>
        ) : null}
      </Drawer>
    </VendorLayout>
  );
};

export default VendorReviews;

