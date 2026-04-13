package vn.edu.hcmuaf.fit.marketplace.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.edu.hcmuaf.fit.marketplace.config.PromotionNotificationProperties;
import vn.edu.hcmuaf.fit.marketplace.dto.response.NotificationResponse;
import vn.edu.hcmuaf.fit.marketplace.entity.Notification;
import vn.edu.hcmuaf.fit.marketplace.entity.PromotionNotificationDispatch;
import vn.edu.hcmuaf.fit.marketplace.entity.PromotionNotificationEvent;
import vn.edu.hcmuaf.fit.marketplace.entity.User;
import vn.edu.hcmuaf.fit.marketplace.repository.PromotionNotificationDispatchRepository;
import vn.edu.hcmuaf.fit.marketplace.repository.PromotionNotificationEventRepository;
import vn.edu.hcmuaf.fit.marketplace.repository.StoreRepository;
import vn.edu.hcmuaf.fit.marketplace.repository.VoucherRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromotionNotificationDispatcherServiceTest {

    @Mock
    private PromotionNotificationDispatchRepository dispatchRepository;

    @Mock
    private PromotionNotificationEventRepository eventRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private VoucherRepository voucherRepository;

    private StubNotificationDomainService notificationDomainService;
    private PromotionNotificationDispatcherService dispatcherService;

    @BeforeEach
    void setUp() {
        PromotionNotificationProperties properties = new PromotionNotificationProperties();
        properties.getDispatcher().setBatchSize(50);
        properties.getDispatcher().setMaxAttempts(8);
        properties.getDispatcher().setBackoffMinutes(List.of(1L, 5L, 15L, 60L));
        properties.setTimezone("Asia/Ho_Chi_Minh");

        notificationDomainService = new StubNotificationDomainService();
        dispatcherService = new PromotionNotificationDispatcherService(
                dispatchRepository,
                eventRepository,
                notificationDomainService,
                storeRepository,
                voucherRepository,
                properties
        );
    }

    @Test
    void dispatchSuccessMarksRowAsSentAndStoresNotificationId() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        PromotionNotificationEvent event = PromotionNotificationEvent.builder()
                .id(eventId)
                .eventType(PromotionNotificationEvent.EventType.MARKETPLACE_NEW)
                .status(PromotionNotificationEvent.EventStatus.READY)
                .voucherCode("MEGA99")
                .link("/profile?tab=vouchers")
                .endDate(LocalDate.now().plusDays(2))
                .build();
        PromotionNotificationDispatch dispatch = PromotionNotificationDispatch.builder()
                .id(UUID.randomUUID())
                .event(event)
                .user(User.builder().id(userId).build())
                .dispatchStatus(PromotionNotificationDispatch.DispatchStatus.PENDING)
                .attemptCount(0)
                .build();

        NotificationResponse response = NotificationResponse.builder()
                .id(UUID.randomUUID())
                .type(Notification.NotificationType.PROMOTION.name().toLowerCase())
                .title("Sàn vừa có voucher mới")
                .build();
        notificationDomainService.nextResponse = response;

        when(dispatchRepository.findDueDispatchesForUpdate(any(), any(), any())).thenReturn(List.of(dispatch));
        when(dispatchRepository.countByEventIdAndDispatchStatusIn(eq(eventId), any())).thenReturn(0L);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        int processed = dispatcherService.dispatchDueAt(LocalDateTime.now());

        assertEquals(1, processed);
        assertEquals(PromotionNotificationDispatch.DispatchStatus.SENT, dispatch.getDispatchStatus());
        assertEquals(response.getId(), dispatch.getNotificationId());
    }

    @Test
    void dispatchFailureSchedulesRetryWithBackoff() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        PromotionNotificationEvent event = PromotionNotificationEvent.builder()
                .id(eventId)
                .eventType(PromotionNotificationEvent.EventType.MARKETPLACE_NEW)
                .status(PromotionNotificationEvent.EventStatus.READY)
                .voucherCode("MEGA99")
                .link("/profile?tab=vouchers")
                .endDate(LocalDate.now().plusDays(2))
                .build();
        PromotionNotificationDispatch dispatch = PromotionNotificationDispatch.builder()
                .id(UUID.randomUUID())
                .event(event)
                .user(User.builder().id(userId).build())
                .dispatchStatus(PromotionNotificationDispatch.DispatchStatus.PENDING)
                .attemptCount(0)
                .build();

        notificationDomainService.nextException = new IllegalStateException("temporary failure");
        when(dispatchRepository.findDueDispatchesForUpdate(any(), any(), any())).thenReturn(List.of(dispatch));
        when(dispatchRepository.countByEventIdAndDispatchStatusIn(eq(eventId), any())).thenReturn(1L);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        LocalDateTime now = LocalDateTime.of(2026, 4, 13, 12, 0);
        int processed = dispatcherService.dispatchDueAt(now);

        assertEquals(1, processed);
        assertEquals(PromotionNotificationDispatch.DispatchStatus.RETRY_READY, dispatch.getDispatchStatus());
        assertEquals(1, dispatch.getAttemptCount());
        assertEquals(now.plusMinutes(1), dispatch.getNextRetryAt());
        assertNotNull(dispatch.getLastError());
    }

    @Test
    void dispatchFailureAtMaxAttemptsMarksDead() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        PromotionNotificationEvent event = PromotionNotificationEvent.builder()
                .id(eventId)
                .eventType(PromotionNotificationEvent.EventType.MARKETPLACE_NEW)
                .status(PromotionNotificationEvent.EventStatus.READY)
                .voucherCode("MEGA99")
                .link("/profile?tab=vouchers")
                .endDate(LocalDate.now().plusDays(2))
                .build();
        PromotionNotificationDispatch dispatch = PromotionNotificationDispatch.builder()
                .id(UUID.randomUUID())
                .event(event)
                .user(User.builder().id(userId).build())
                .dispatchStatus(PromotionNotificationDispatch.DispatchStatus.RETRY_READY)
                .attemptCount(7)
                .build();

        notificationDomainService.nextException = new IllegalStateException("permanent failure");
        when(dispatchRepository.findDueDispatchesForUpdate(any(), any(), any())).thenReturn(List.of(dispatch));
        when(dispatchRepository.countByEventIdAndDispatchStatusIn(eq(eventId), any())).thenReturn(0L);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        int processed = dispatcherService.dispatchDueAt(LocalDateTime.now());

        assertEquals(1, processed);
        assertEquals(PromotionNotificationDispatch.DispatchStatus.DEAD, dispatch.getDispatchStatus());
        assertEquals(8, dispatch.getAttemptCount());
    }

    private static final class StubNotificationDomainService extends NotificationDomainService {
        private NotificationResponse nextResponse;
        private RuntimeException nextException;

        private StubNotificationDomainService() {
            super(null, null, null);
        }

        @Override
        public NotificationResponse createAndPushStrict(
                UUID userId,
                Notification.NotificationType type,
                String title,
                String message,
                String link
        ) {
            if (nextException != null) {
                RuntimeException ex = nextException;
                nextException = null;
                throw ex;
            }
            return nextResponse;
        }
    }
}
