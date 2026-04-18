import './Admin.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, RefreshCcw, Save, UploadCloud } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useAdminToast } from './useAdminToast';
import {
  adminBotScenarioService,
  type BotScenarioActionKey,
  type BotScenarioPayload,
  type BotScenarioSnapshot,
} from '../../services/adminBotScenarioService';
import { contentService, type ContentPage } from '../../services/contentService';

const QUICK_ACTION_ORDER: BotScenarioActionKey[] = ['ORDER_LOOKUP', 'SIZE_ADVICE', 'PRODUCT_FAQ'];

const QUICK_ACTION_LABEL: Record<BotScenarioActionKey, string> = {
  ORDER_LOOKUP: 'Tra cứu đơn hàng',
  SIZE_ADVICE: 'Tư vấn size',
  PRODUCT_FAQ: 'Hỏi đáp sản phẩm',
};

const normalizeKeywordList = (items: string[]) =>
  items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.findIndex((value) => value.toLowerCase() === item.toLowerCase()) === index);

const parseKeywords = (input: string) =>
  normalizeKeywordList(input.split(/[,;\n\r]+/).map((item) => item.trim()));

const ensureQuickActions = (quickActions: BotScenarioPayload['quickActions']) => {
  const byKey = new Map(quickActions.map((item) => [item.key, item]));
  return QUICK_ACTION_ORDER.map((key) => byKey.get(key) || { key, label: QUICK_ACTION_LABEL[key] });
};

const sortQuickActions = (payload: BotScenarioPayload): BotScenarioPayload => ({
  ...payload,
  quickActions: ensureQuickActions(payload.quickActions),
});

const stringifyPayload = (payload: BotScenarioPayload) => JSON.stringify(sortQuickActions(payload));

const AdminBotAI = () => {
  const { pushToast } = useAdminToast();

  const [snapshot, setSnapshot] = useState<BotScenarioSnapshot | null>(null);
  const [draft, setDraft] = useState<BotScenarioPayload | null>(null);

  const [faqItems, setFaqItems] = useState<ContentPage[]>([]);
  const [faqKeywordDrafts, setFaqKeywordDrafts] = useState<Record<string, string[]>>({});
  const [faqKeywordInputs, setFaqKeywordInputs] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingFaqId, setSavingFaqId] = useState<string | null>(null);

  const initializeFaqDrafts = (items: ContentPage[]) => {
    const keywordDraftMap: Record<string, string[]> = {};
    const keywordInputMap: Record<string, string> = {};

    items.forEach((item) => {
      keywordDraftMap[item.id] = normalizeKeywordList(item.keywords || []);
      keywordInputMap[item.id] = '';
    });

    setFaqKeywordDrafts(keywordDraftMap);
    setFaqKeywordInputs(keywordInputMap);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [scenarioSnapshot, faqList] = await Promise.all([
        adminBotScenarioService.getSnapshot(),
        contentService.list('FAQ'),
      ]);

      setSnapshot(scenarioSnapshot);
      setDraft(sortQuickActions(scenarioSnapshot.draft));
      setFaqItems(faqList);
      initializeFaqDrafts(faqList);
    } catch {
      pushToast('Không thể tải dữ liệu Bot/AI.');
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const hasDraftChanged = useMemo(() => {
    if (!snapshot || !draft) return false;
    return stringifyPayload(snapshot.draft) !== stringifyPayload(draft);
  }, [snapshot, draft]);

  const isDraftDifferentFromPublished = useMemo(() => {
    if (!snapshot || !draft) return false;
    return stringifyPayload(snapshot.published) !== stringifyPayload(draft);
  }, [snapshot, draft]);

  const currentStatus = isDraftDifferentFromPublished ? 'DRAFT' : 'PUBLISHED';
  const currentVersion =
    currentStatus === 'DRAFT'
      ? (snapshot?.draftMeta?.version ?? 0)
      : (snapshot?.publishedMeta?.version ?? 0);

  const updateDraftField = <K extends keyof BotScenarioPayload>(field: K, value: BotScenarioPayload[K]) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const updateQuickActionLabel = (key: BotScenarioActionKey, label: string) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        quickActions: current.quickActions.map((item) => (item.key === key ? { ...item, label } : item)),
      };
    });
  };

  const handleSaveDraft = async () => {
    if (!draft) return;

    try {
      setSavingDraft(true);
      const nextSnapshot = await adminBotScenarioService.saveDraft(sortQuickActions(draft));
      setSnapshot(nextSnapshot);
      setDraft(sortQuickActions(nextSnapshot.draft));
      pushToast('Đã lưu nháp kịch bản chatbot.');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Không thể lưu nháp.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const nextSnapshot = await adminBotScenarioService.publishDraft();
      setSnapshot(nextSnapshot);
      setDraft(sortQuickActions(nextSnapshot.draft));
      pushToast('Publish thành công. Kịch bản chatbot đã được áp dụng.');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Không thể publish kịch bản.');
    } finally {
      setPublishing(false);
    }
  };

  const handleResetDraft = async () => {
    try {
      const nextSnapshot = await adminBotScenarioService.resetDraftFromPublished();
      setSnapshot(nextSnapshot);
      setDraft(sortQuickActions(nextSnapshot.draft));
      pushToast('Đã khôi phục Draft từ bản Published gần nhất.');
    } catch {
      pushToast('Không thể khôi phục Draft.');
    }
  };

  const addKeywordsToFaq = (faqId: string) => {
    const rawInput = faqKeywordInputs[faqId] || '';
    const nextKeywords = parseKeywords(rawInput);
    if (!nextKeywords.length) {
      return;
    }

    setFaqKeywordDrafts((current) => {
      const existing = current[faqId] || [];
      return {
        ...current,
        [faqId]: normalizeKeywordList([...existing, ...nextKeywords]),
      };
    });

    setFaqKeywordInputs((current) => ({
      ...current,
      [faqId]: '',
    }));
  };

  const removeKeywordFromFaq = (faqId: string, keyword: string) => {
    setFaqKeywordDrafts((current) => ({
      ...current,
      [faqId]: (current[faqId] || []).filter((item) => item !== keyword),
    }));
  };

  const hasKeywordChanged = (item: ContentPage) => {
    const original = normalizeKeywordList(item.keywords || []);
    const edited = normalizeKeywordList(faqKeywordDrafts[item.id] || []);
    return JSON.stringify(original) !== JSON.stringify(edited);
  };

  const handleSaveFaqKeywords = async (item: ContentPage) => {
    const nextKeywords = normalizeKeywordList(faqKeywordDrafts[item.id] || []);
    try {
      setSavingFaqId(item.id);
      const updated = await contentService.update(item.id, {
        title: item.title,
        body: item.body,
        type: 'FAQ',
        displayOrder: item.displayOrder,
        keywords: nextKeywords,
      });

      setFaqItems((current) => current.map((faq) => (faq.id === item.id ? updated : faq)));
      setFaqKeywordDrafts((current) => ({
        ...current,
        [item.id]: normalizeKeywordList(updated.keywords || []),
      }));
      pushToast(`Đã cập nhật từ khóa cho FAQ: ${item.title}`);
    } catch {
      pushToast('Không thể lưu từ khóa cho FAQ.');
    } finally {
      setSavingFaqId(null);
    }
  };

  return (
    <AdminLayout title="Bot và AI" breadcrumbs={['Bot và AI', 'Quản lý kịch bản chatbot']}>
      <div className="bot-ai-v2-page">
        {loading || !draft || !snapshot ? (
          <section className="admin-panel">
            <p className="admin-muted">Đang tải dữ liệu quản trị chatbot...</p>
          </section>
        ) : (
          <>
            <div className="bot-ai-v2-split">
              <section className="bot-ai-v2-editor">
                <header className="bot-ai-v2-editor-head">
                  <div>
                    <h2>Quản lý kịch bản chatbot</h2>
                    <p className="admin-muted">
                      Phiên bản hiện tại: <strong>v{currentVersion}</strong> | Draft: <strong>v{snapshot.draftMeta?.version || 0}</strong> | Published:{' '}
                      <strong>v{snapshot.publishedMeta?.version || 0}</strong>
                    </p>
                  </div>
                  <span className={`bot-ai-v2-badge ${currentStatus === 'DRAFT' ? 'draft' : 'published'}`}>
                    {currentStatus}
                  </span>
                </header>

                <section className="bot-ai-v2-block">
                  <h3>Nội dung chính</h3>
                  <label>
                    Lời chào (Welcome Message)
                    <textarea
                      value={draft.welcomePrompt}
                      onChange={(e) => updateDraftField('welcomePrompt', e.target.value)}
                      rows={4}
                    />
                  </label>
                  <label>
                    Fallback Message (Khi bot không hiểu)
                    <textarea
                      value={draft.unknownPrompt}
                      onChange={(e) => updateDraftField('unknownPrompt', e.target.value)}
                      rows={3}
                    />
                  </label>
                </section>

                <section className="bot-ai-v2-block">
                  <h3>Quản lý nút tác vụ nhanh</h3>
                  <div className="bot-ai-v2-action-list">
                    {QUICK_ACTION_ORDER.map((actionKey) => (
                      <article key={actionKey} className="bot-ai-v2-action-item">
                        <div className="bot-ai-v2-action-title">
                          <strong>{QUICK_ACTION_LABEL[actionKey]}</strong>
                          <code>{actionKey}</code>
                        </div>
                        <input
                          value={draft.quickActions.find((item) => item.key === actionKey)?.label || ''}
                          onChange={(e) => updateQuickActionLabel(actionKey, e.target.value)}
                          placeholder="Nhập nhãn nút bấm..."
                        />
                      </article>
                    ))}
                  </div>
                </section>

                <section className="bot-ai-v2-block">
                  <h3>FAQ và từ khóa tìm kiếm</h3>
                  <div className="bot-ai-v2-table-wrap">
                    <table className="bot-ai-v2-table">
                      <thead>
                        <tr>
                          <th>Câu hỏi FAQ</th>
                          <th>Từ khóa (Tags)</th>
                          <th className="action-col">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faqItems.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="bot-ai-v2-empty-row">
                              Chưa có FAQ. Vui lòng tạo FAQ ở mục Content.
                            </td>
                          </tr>
                        ) : (
                          faqItems.map((item) => {
                            const keywordDraft = faqKeywordDrafts[item.id] || [];
                            const isSaving = savingFaqId === item.id;
                            const changed = hasKeywordChanged(item);

                            return (
                              <tr key={item.id}>
                                <td>
                                  <p className="faq-title">{item.title}</p>
                                  <p className="faq-body-preview">{item.body}</p>
                                </td>
                                <td>
                                  <div className="bot-ai-v2-tag-editor">
                                    <div className="bot-ai-v2-tags">
                                      {keywordDraft.map((keyword) => (
                                        <span key={`${item.id}-${keyword}`} className="bot-ai-v2-tag">
                                          {keyword}
                                          <button
                                            type="button"
                                            onClick={() => removeKeywordFromFaq(item.id, keyword)}
                                            aria-label={`Xóa từ khóa ${keyword}`}
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                    <div className="bot-ai-v2-tag-input-row">
                                      <input
                                        value={faqKeywordInputs[item.id] || ''}
                                        onChange={(e) =>
                                          setFaqKeywordInputs((current) => ({
                                            ...current,
                                            [item.id]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addKeywordsToFaq(item.id);
                                          }
                                        }}
                                        placeholder="Nhập từ khóa, Enter để thêm"
                                      />
                                      <button type="button" className="admin-ghost-btn" onClick={() => addKeywordsToFaq(item.id)}>
                                        Thêm
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="action-col">
                                  <button
                                    type="button"
                                    className="admin-primary-btn"
                                    onClick={() => void handleSaveFaqKeywords(item)}
                                    disabled={!changed || isSaving}
                                  >
                                    {isSaving ? 'Đang lưu...' : 'Lưu từ khóa'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </section>

              <aside className="bot-ai-v2-preview">
                <header className="bot-ai-v2-preview-head">
                  <h3>Xem trước trực tiếp</h3>
                  <p className="admin-muted">Cập nhật tức thì theo nội dung bạn đang soạn.</p>
                </header>

                <div className="bot-ai-v2-chat-widget">
                  <div className="bot-ai-v2-chat-header">
                    <div className="bot-ai-v2-chat-brand">
                      <strong>FashMarket Support Bot</strong>
                      <span>Đang trực tuyến</span>
                    </div>
                  </div>

                  <div className="bot-ai-v2-chat-body">
                    <div className="bot-ai-v2-msg bot">
                      <div className="avatar">FM</div>
                      <div className="bubble">{draft.welcomePrompt}</div>
                    </div>

                    <div className="bot-ai-v2-suggested-actions">
                      {ensureQuickActions(draft.quickActions).map((action) => (
                        <button type="button" key={action.key}>
                          {action.label}
                        </button>
                      ))}
                    </div>

                    <div className="bot-ai-v2-msg user">
                      <div className="bubble">Cho mình hỏi thêm thông tin nhé?</div>
                    </div>

                    <div className="bot-ai-v2-msg bot">
                      <div className="avatar">FM</div>
                      <div className="bubble">{draft.unknownPrompt}</div>
                    </div>
                  </div>

                  <div className="bot-ai-v2-chat-input">
                    <MessageSquare size={14} />
                    <span>Nhập tin nhắn để xem mô phỏng...</span>
                  </div>
                </div>
              </aside>
            </div>

            <div className="bot-ai-v2-sticky-bar">
              <div className="bot-ai-v2-sticky-info">
                {hasDraftChanged ? 'Bạn có thay đổi chưa lưu trong bản Draft.' : 'Không có thay đổi mới.'}
              </div>
              <div className="bot-ai-v2-sticky-actions">
                <button
                  type="button"
                  className="bot-ai-v2-btn bot-ai-v2-btn-ghost"
                  onClick={() => void handleSaveDraft()}
                  disabled={!hasDraftChanged || savingDraft}
                >
                  <Save size={16} />
                  {savingDraft ? 'Đang lưu...' : 'Lưu nháp'}
                </button>
                <button
                  type="button"
                  className="bot-ai-v2-btn bot-ai-v2-btn-danger"
                  onClick={() => void handleResetDraft()}
                  disabled={publishing || savingDraft}
                >
                  <RefreshCcw size={16} />
                  Khôi phục
                </button>
                <button
                  type="button"
                  className="bot-ai-v2-btn bot-ai-v2-btn-primary"
                  onClick={() => void handlePublish()}
                  disabled={publishing || savingDraft}
                >
                  <UploadCloud size={16} />
                  {publishing ? 'Đang xuất bản...' : 'XUẤT BẢN'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBotAI;
