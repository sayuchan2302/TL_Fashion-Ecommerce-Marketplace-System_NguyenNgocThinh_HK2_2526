package vn.edu.hcmuaf.fit.fashionstore.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.hcmuaf.fit.fashionstore.entity.Order;
import vn.edu.hcmuaf.fit.fashionstore.repository.AddressRepository;
import vn.edu.hcmuaf.fit.fashionstore.repository.OrderRepository;
import vn.edu.hcmuaf.fit.fashionstore.repository.ProductRepository;
import vn.edu.hcmuaf.fit.fashionstore.repository.ProductVariantRepository;
import vn.edu.hcmuaf.fit.fashionstore.repository.UserRepository;

import java.util.Optional;
import java.util.UUID;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @InjectMocks
    private OrderService orderService;

    private UUID orderId;
    private UUID storeId;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        storeId = UUID.randomUUID();
    }

    @Test
    void vendorCannotShipWithoutTrackingAndCarrier() {
        Order order = buildStoreOrder(Order.OrderStatus.PROCESSING);
        when(orderRepository.findByIdAndStoreId(orderId, storeId)).thenReturn(Optional.of(order));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> orderService.updateStatusForStore(orderId, storeId, Order.OrderStatus.SHIPPED, null, null, null)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Tracking number is required"));
    }

    @Test
    void vendorCanShipUsingExistingTrackingAndCarrier() {
        Order order = buildStoreOrder(Order.OrderStatus.PROCESSING);
        order.setTrackingNumber("GHN123456");
        order.setShippingCarrier("GHN");
        when(orderRepository.findByIdAndStoreId(orderId, storeId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order updated = orderService.updateStatusForStore(
                orderId,
                storeId,
                Order.OrderStatus.SHIPPED,
                null,
                null,
                null
        );

        assertEquals(Order.OrderStatus.SHIPPED, updated.getStatus());
        assertEquals("GHN123456", updated.getTrackingNumber());
        assertEquals("GHN", updated.getShippingCarrier());
    }

    @Test
    void vendorCancelRequiresReason() {
        Order order = buildStoreOrder(Order.OrderStatus.CONFIRMED);
        when(orderRepository.findByIdAndStoreId(orderId, storeId)).thenReturn(Optional.of(order));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> orderService.updateStatusForStore(
                        orderId,
                        storeId,
                        Order.OrderStatus.CANCELLED,
                        null,
                        null,
                        "   "
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Cancellation reason is required", ex.getReason());
    }

    @Test
    void deliveredRequiresTrackingData() {
        Order order = buildStoreOrder(Order.OrderStatus.SHIPPED);
        when(orderRepository.findByIdAndStoreId(orderId, storeId)).thenReturn(Optional.of(order));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> orderService.updateStatusForStore(orderId, storeId, Order.OrderStatus.DELIVERED, null, null, null)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Tracking number is required"));
    }

    @Test
    void trackingCanOnlyBeUpdatedFromProcessingOrShipped() {
        Order order = buildStoreOrder(Order.OrderStatus.PENDING);
        when(orderRepository.findByIdAndStoreId(orderId, storeId)).thenReturn(Optional.of(order));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> orderService.updateTrackingForStore(orderId, storeId, "GHN-999")
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Tracking can only be updated when order is PROCESSING or SHIPPED", ex.getReason());
    }

    private Order buildStoreOrder(Order.OrderStatus status) {
        return Order.builder()
                .id(orderId)
                .storeId(storeId)
                .status(status)
                .subtotal(new BigDecimal("100000"))
                .shippingFee(new BigDecimal("20000"))
                .discount(new BigDecimal("0"))
                .total(new BigDecimal("120000"))
                .paymentMethod(Order.PaymentMethod.COD)
                .paymentStatus(Order.PaymentStatus.UNPAID)
                .build();
    }
}
