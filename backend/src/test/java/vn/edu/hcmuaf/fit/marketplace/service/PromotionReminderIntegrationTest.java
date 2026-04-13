package vn.edu.hcmuaf.fit.marketplace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import vn.edu.hcmuaf.fit.marketplace.repository.PromotionNotificationEventRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PromotionReminderIntegrationTest {

    private static final String TEST_PASSWORD = "Test@123";
    private static final String ADMIN_EMAIL = "admin@fashion.local";
    private static final String CUSTOMER_EMAIL = "minh.customer@fashion.local";

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PromotionNotificationService promotionNotificationService;

    @Autowired
    private PromotionNotificationDispatcherService dispatcherService;

    @Autowired
    private PromotionNotificationEventRepository eventRepository;

    @Test
    void reminder24hAnd3hAreCreatedOnceAndDelivered() throws Exception {
        String adminToken = loginAndExtractToken(ADMIN_EMAIL, TEST_PASSWORD);
        String customerToken = loginAndExtractToken(CUSTOMER_EMAIL, TEST_PASSWORD);

        LocalDate startDate = LocalDate.now().minusDays(1);
        LocalDate endDate = LocalDate.now();
        String code = "RMD" + System.currentTimeMillis();

        Map<String, Object> campaignPayload = Map.of(
                "name", "Reminder Campaign Integration",
                "code", code,
                "description", "Reminder integration test",
                "discountType", "PERCENT",
                "discountValue", 10,
                "minOrderValue", 100000,
                "totalIssued", 200,
                "startDate", startDate.toString(),
                "endDate", endDate.toString(),
                "status", "RUNNING"
        );

        ResponseEntity<String> createResponse = restTemplate.exchange(
                "/api/vouchers/admin/marketplace-campaign",
                HttpMethod.POST,
                authorizedJsonEntity(adminToken, campaignPayload),
                String.class
        );
        assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());

        String rootEventKey = "MARKETPLACE_NEW:" + code + ":" + startDate + ":" + endDate;
        var rootEvent = eventRepository.findByEventKey(rootEventKey).orElse(null);
        assertNotNull(rootEvent, "Expected marketplace root event");

        int initialDispatched = dispatcherService.dispatchDueAt(LocalDateTime.now());
        assertTrue(initialDispatched > 0, "Expected initial promotion dispatch to run");

        LocalDateTime reminderNow = LocalDateTime.of(endDate, java.time.LocalTime.of(22, 30));
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");
        int createdFirstRun = promotionNotificationService.createDueReminderEvents(reminderNow, zoneId);
        assertEquals(2, createdFirstRun);

        int createdSecondRun = promotionNotificationService.createDueReminderEvents(reminderNow, zoneId);
        assertEquals(0, createdSecondRun, "Reminder events must be idempotent");

        assertTrue(eventRepository.existsByEventKey("REMINDER_24H:" + rootEvent.getId()));
        assertTrue(eventRepository.existsByEventKey("REMINDER_3H:" + rootEvent.getId()));

        int reminderDispatches = dispatcherService.dispatchDueAt(reminderNow);
        assertTrue(reminderDispatches > 0, "Expected reminder dispatch rows to be delivered");

        ResponseEntity<String> notificationsResponse = restTemplate.exchange(
                "/api/notifications/me?type=promotion&page=0&size=100",
                HttpMethod.GET,
                authorizedEntity(customerToken),
                String.class
        );
        assertEquals(HttpStatus.OK, notificationsResponse.getStatusCode());

        JsonNode body = objectMapper.readTree(notificationsResponse.getBody());
        JsonNode content = body.path("content");
        boolean found24h = false;
        boolean found3h = false;
        for (JsonNode item : content) {
            String title = item.path("title").asText();
            if (title.contains(code) && title.contains("24 giờ")) {
                found24h = true;
            }
            if (title.contains(code) && title.contains("3 giờ")) {
                found3h = true;
            }
        }
        assertTrue(found24h, "Expected 24h reminder notification");
        assertTrue(found3h, "Expected 3h reminder notification");
    }

    @SuppressWarnings("unchecked")
    private String loginAndExtractToken(String email, String password) {
        Map<String, String> payload = Map.of(
                "email", email,
                "password", password
        );
        ResponseEntity<Map> loginResponse = restTemplate.postForEntity("/api/auth/login", payload, Map.class);
        assertEquals(HttpStatus.OK, loginResponse.getStatusCode());
        Map<String, Object> body = loginResponse.getBody();
        assertNotNull(body);
        Object token = body.get("token");
        assertNotNull(token);
        return String.valueOf(token);
    }

    private HttpEntity<Void> authorizedEntity(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    private HttpEntity<Map<String, Object>> authorizedJsonEntity(String token, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
