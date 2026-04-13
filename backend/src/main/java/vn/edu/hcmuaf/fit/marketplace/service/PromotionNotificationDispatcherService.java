package vn.edu.hcmuaf.fit.marketplace.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.marketplace.config.PromotionNotificationProperties;
import vn.edu.hcmuaf.fit.marketplace.dto.response.NotificationResponse;
import vn.edu.hcmuaf.fit.marketplace.entity.Notification;
import vn.edu.hcmuaf.fit.marketplace.entity.PromotionNotificationDispatch;
import vn.edu.hcmuaf.fit.marketplace.entity.PromotionNotificationEvent;
import vn.edu.hcmuaf.fit.marketplace.entity.Store;
import vn.edu.hcmuaf.fit.marketplace.entity.Voucher;
import vn.edu.hcmuaf.fit.marketplace.repository.PromotionNotificationDispatchRepository;
import vn.edu.hcmuaf.fit.marketplace.repository.PromotionNotificationEventRepository;
import vn.edu.hcmuaf.fit.marketplace.repository.StoreRepository;
import vn.edu.hcmuaf.fit.marketplace.repository.VoucherRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class PromotionNotificationDispatcherService {

    private static final String VOUCHER_WALLET_LINK = "/profile?tab=vouchers";

    private final PromotionNotificationDispatchRepository dispatchRepository;
    private final PromotionNotificationEventRepository eventRepository;
    private final NotificationDomainService notificationDomainService;
    private final StoreRepository storeRepository;
    private final VoucherRepository voucherRepository;
    private final PromotionNotificationProperties properties;

    public PromotionNotificationDispatcherService(
            PromotionNotificationDispatchRepository dispatchRepository,
            PromotionNotificationEventRepository eventRepository,
            NotificationDomainService notificationDomainService,
            StoreRepository storeRepository,
            VoucherRepository voucherRepository,
            PromotionNotificationProperties properties
    ) {
        this.dispatchRepository = dispatchRepository;
        this.eventRepository = eventRepository;
        this.notificationDomainService = notificationDomainService;
        this.storeRepository = storeRepository;
        this.voucherRepository = voucherRepository;
        this.properties = properties;
    }

    @Transactional
    public int dispatchDueNow() {
        ZoneId zoneId = resolveZone();
        return dispatchDueAt(LocalDateTime.now(zoneId));
    }

    @Transactional
    public int dispatchDueAt(LocalDateTime now) {
        int batchSize = Math.max(1, properties.getDispatcher().getBatchSize());
        List<PromotionNotificationDispatch> dueDispatches = dispatchRepository.findDueDispatchesForUpdate(
                List.of(
                        PromotionNotificationDispatch.DispatchStatus.PENDING,
                        PromotionNotificationDispatch.DispatchStatus.RETRY_READY
                ),
                now,
                PageRequest.of(0, batchSize)
        );

        if (dueDispatches.isEmpty()) {
            return 0;
        }

        Set<UUID> touchedEventIds = new LinkedHashSet<>();
        for (PromotionNotificationDispatch dispatch : dueDispatches) {
            processDispatch(dispatch, now);
            if (dispatch.getEvent() != null && dispatch.getEvent().getId() != null) {
                touchedEventIds.add(dispatch.getEvent().getId());
            }
        }

        dispatchRepository.saveAll(dueDispatches);
        refreshEventStatuses(touchedEventIds);
        return dueDispatches.size();
    }

    private void processDispatch(PromotionNotificationDispatch dispatch, LocalDateTime now) {
        if (dispatch == null || dispatch.getEvent() == null || dispatch.getUser() == null || dispatch.getUser().getId() == null) {
            markDead(dispatch, "Invalid dispatch payload");
            return;
        }

        PromotionNotificationEvent event = dispatch.getEvent();
        if (event.getStatus() == PromotionNotificationEvent.EventStatus.CANCELLED) {
            markDead(dispatch, "Event cancelled");
            return;
        }

        if (isReminderEvent(event.getEventType()) && !isEventStillPubliclyAvailable(event, now.toLocalDate())) {
            markDead(dispatch, "Voucher no longer available");
            return;
        }

        NotificationContent content = buildContent(event);
        try {
            NotificationResponse response = notificationDomainService.createAndPushStrict(
                    dispatch.getUser().getId(),
                    Notification.NotificationType.PROMOTION,
                    content.title(),
                    content.message(),
                    content.link()
            );
            if (response == null || response.getId() == null) {
                throw new IllegalStateException("Notification response is empty");
            }
            dispatch.setDispatchStatus(PromotionNotificationDispatch.DispatchStatus.SENT);
            dispatch.setNotificationId(response.getId());
            dispatch.setNextRetryAt(null);
            dispatch.setLastError(null);
        } catch (RuntimeException ex) {
            applyRetry(dispatch, now, ex);
        }
    }

    private NotificationContent buildContent(PromotionNotificationEvent event) {
        String safeCode = normalize(event.getVoucherCode(), "VOUCHER");
        String link = normalize(event.getLink(), VOUCHER_WALLET_LINK);
        return switch (event.getEventType()) {
            case STORE_NEW -> {
                String storeName = storeRepository.findById(event.getStoreId())
                        .map(Store::getName)
                        .map(name -> normalize(name, "Shop"))
                        .orElse("Shop");
                yield new NotificationContent(
                        "Shop " + storeName + " vừa có voucher mới: " + safeCode,
                        "Nhấn vào để xem và sử dụng ưu đãi mới.",
                        link
                );
            }
            case MARKETPLACE_NEW -> new NotificationContent(
                    "Sàn vừa có voucher mới: " + safeCode,
                    "Ưu đãi mới đã cập nhật trong ví voucher của bạn.",
                    link
            );
            case REMINDER_24H -> new NotificationContent(
                    "Voucher " + safeCode + " sẽ hết hạn trong 24 giờ.",
                    "Nhấn vào để sử dụng voucher trước khi hết hạn.",
                    link
            );
            case REMINDER_3H -> new NotificationContent(
                    "Voucher " + safeCode + " sắp hết hạn trong 3 giờ.",
                    "Nhấn vào để sử dụng voucher trước khi hết hạn.",
                    link
            );
        };
    }

    private void applyRetry(PromotionNotificationDispatch dispatch, LocalDateTime now, RuntimeException ex) {
        int currentAttempt = dispatch.getAttemptCount() == null ? 0 : Math.max(dispatch.getAttemptCount(), 0);
        int nextAttempt = currentAttempt + 1;
        dispatch.setAttemptCount(nextAttempt);
        dispatch.setLastError(ex.getMessage());

        int maxAttempts = Math.max(1, properties.getDispatcher().getMaxAttempts());
        if (nextAttempt >= maxAttempts) {
            markDead(dispatch, ex.getMessage());
            return;
        }

        long backoffMinutes = resolveBackoffMinutes(nextAttempt);
        dispatch.setDispatchStatus(PromotionNotificationDispatch.DispatchStatus.RETRY_READY);
        dispatch.setNextRetryAt(now.plusMinutes(backoffMinutes));
    }

    private long resolveBackoffMinutes(int attempt) {
        List<Long> minutes = properties.getDispatcher().getBackoffMinutes();
        if (minutes == null || minutes.isEmpty()) {
            return 1L;
        }
        int index = Math.min(Math.max(attempt - 1, 0), minutes.size() - 1);
        Long value = minutes.get(index);
        return value == null || value <= 0 ? 1L : value;
    }

    private boolean isReminderEvent(PromotionNotificationEvent.EventType eventType) {
        return eventType == PromotionNotificationEvent.EventType.REMINDER_24H
                || eventType == PromotionNotificationEvent.EventType.REMINDER_3H;
    }

    private boolean isEventStillPubliclyAvailable(PromotionNotificationEvent event, LocalDate today) {
        if (event == null || today == null) {
            return false;
        }
        if (event.getVoucherId() != null) {
            return voucherRepository.findById(event.getVoucherId())
                    .map(voucher -> isVoucherPubliclyAvailable(voucher, today))
                    .orElse(false);
        }
        String safeCode = normalize(event.getVoucherCode(), "");
        if (safeCode.isBlank()) {
            return false;
        }
        return voucherRepository.existsPublicAvailableByCode(safeCode, Voucher.VoucherStatus.RUNNING, today);
    }

    private boolean isVoucherPubliclyAvailable(Voucher voucher, LocalDate today) {
        if (voucher == null || voucher.getStatus() != Voucher.VoucherStatus.RUNNING) {
            return false;
        }
        if (voucher.getStartDate() != null && voucher.getStartDate().isAfter(today)) {
            return false;
        }
        if (voucher.getEndDate() != null && voucher.getEndDate().isBefore(today)) {
            return false;
        }
        int usedCount = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
        int totalIssued = voucher.getTotalIssued() == null ? 0 : Math.max(voucher.getTotalIssued(), 0);
        return usedCount < totalIssued;
    }

    private void refreshEventStatuses(Set<UUID> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return;
        }
        for (UUID eventId : eventIds) {
            PromotionNotificationEvent event = eventRepository.findById(eventId).orElse(null);
            if (event == null || event.getStatus() == PromotionNotificationEvent.EventStatus.CANCELLED) {
                continue;
            }
            long activeDispatches = dispatchRepository.countByEventIdAndDispatchStatusIn(
                    eventId,
                    List.of(
                            PromotionNotificationDispatch.DispatchStatus.PENDING,
                            PromotionNotificationDispatch.DispatchStatus.RETRY_READY
                    )
            );
            event.setStatus(activeDispatches == 0
                    ? PromotionNotificationEvent.EventStatus.COMPLETED
                    : PromotionNotificationEvent.EventStatus.READY);
            eventRepository.save(event);
        }
    }

    private void markDead(PromotionNotificationDispatch dispatch, String reason) {
        dispatch.setDispatchStatus(PromotionNotificationDispatch.DispatchStatus.DEAD);
        dispatch.setNextRetryAt(null);
        dispatch.setLastError(reason);
    }

    private ZoneId resolveZone() {
        try {
            return ZoneId.of(normalize(properties.getTimezone(), "Asia/Ho_Chi_Minh"));
        } catch (Exception ex) {
            return ZoneId.of("Asia/Ho_Chi_Minh");
        }
    }

    private String normalize(String raw, String fallback) {
        if (raw == null) {
            return fallback;
        }
        String normalized = raw.trim();
        return normalized.isEmpty() ? fallback : normalized;
    }

    private record NotificationContent(
            String title,
            String message,
            String link
    ) {}
}
