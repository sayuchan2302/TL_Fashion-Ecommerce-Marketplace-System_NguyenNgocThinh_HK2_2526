package vn.edu.hcmuaf.fit.fashionstore.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderStatusConstraintRepairService {

    private static final String CONSTRAINT_NAME = "orders_status_check";

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void repairIfMissingWaitingForVendor() {
        try {
            String dbProduct = jdbcTemplate.execute((ConnectionCallback<String>) connection ->
                    connection.getMetaData().getDatabaseProductName());
            if (dbProduct == null || !dbProduct.toLowerCase(Locale.ROOT).contains("postgres")) {
                return;
            }

            String constraintDef = jdbcTemplate.query(
                    """
                            SELECT pg_get_constraintdef(c.oid)
                            FROM pg_constraint c
                            WHERE c.conname = ?
                              AND c.conrelid = 'orders'::regclass
                            """,
                    ps -> ps.setString(1, CONSTRAINT_NAME),
                    rs -> rs.next() ? rs.getString(1) : null
            );

            if (constraintDef != null && constraintDef.contains("WAITING_FOR_VENDOR")) {
                return;
            }

            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS " + CONSTRAINT_NAME);
            jdbcTemplate.execute(
                    """
                            ALTER TABLE orders
                            ADD CONSTRAINT orders_status_check
                            CHECK (
                                status IN (
                                    'PENDING',
                                    'WAITING_FOR_VENDOR',
                                    'CONFIRMED',
                                    'PROCESSING',
                                    'SHIPPED',
                                    'DELIVERED',
                                    'CANCELLED'
                                )
                            )
                            """
            );

            log.warn("Repaired constraint {} to include WAITING_FOR_VENDOR", CONSTRAINT_NAME);
        } catch (Exception ex) {
            log.error("Failed to repair {} automatically", CONSTRAINT_NAME, ex);
        }
    }
}
