package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.CafeteriaCheckoutItemRequest;
import bd.ac.uiu.smartcampus.dto.CafeteriaCheckoutRequest;
import bd.ac.uiu.smartcampus.dto.CafeteriaCheckoutResponse;
import bd.ac.uiu.smartcampus.dto.CafeteriaPaymentHistoryDto;
import bd.ac.uiu.smartcampus.model.CafeteriaMenuItem;
import bd.ac.uiu.smartcampus.model.CafeteriaPaymentTransaction;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.CafeteriaMenuItemRepository;
import bd.ac.uiu.smartcampus.repository.CafeteriaPaymentTransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SslCommerzPaymentService {

    private static final String PAYMENT_METHOD_SSL = "SSLCOMMERZ";
    private static final String PAYMENT_METHOD_CASH = "CASH";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_PAID = "PAID";
    private static final String STATUS_COUNTER_PAYMENT = "COUNTER_PAYMENT";
    private static final String STATUS_FAILED = "FAILED";
    private static final String STATUS_CANCELLED = "CANCELLED";
    private static final String STATUS_INIT_FAILED = "INIT_FAILED";
    private static final DateTimeFormatter TRANSACTION_TIME_FORMAT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CafeteriaMenuItemRepository cafeteriaMenuItemRepository;
    private final CafeteriaPaymentTransactionRepository paymentTransactionRepository;
    private final RestClient restClient;
    private final String storeId;
    private final String storePassword;
    private final boolean liveMode;
    private final String publicBaseUrl;

    public SslCommerzPaymentService(CafeteriaMenuItemRepository cafeteriaMenuItemRepository,
                                    CafeteriaPaymentTransactionRepository paymentTransactionRepository,
                                    RestClient.Builder restClientBuilder,
                                    @Value("${sslcommerz.store-id:}") String storeId,
                                    @Value("${sslcommerz.store-password:}") String storePassword,
                                    @Value("${sslcommerz.live:false}") boolean liveMode,
                                    @Value("${smart-campus.public-base-url:}") String publicBaseUrl) {
        this.cafeteriaMenuItemRepository = cafeteriaMenuItemRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.restClient = restClientBuilder.build();
        this.storeId = storeId;
        this.storePassword = storePassword;
        this.liveMode = liveMode;
        this.publicBaseUrl = publicBaseUrl;
    }

    public CafeteriaCheckoutResponse checkout(CafeteriaCheckoutRequest request, User student, String requestBaseUrl) {
        String paymentMethod = normalizePaymentMethod(request.getPaymentMethod());
        List<CafeteriaCheckoutItemRequest> items = request.getItems() == null ? List.of() : request.getItems();
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Please add at least one cafeteria item to checkout.");
        }

        CheckoutTotals checkoutTotals = calculateTotal(items);
        BigDecimal total = checkoutTotals.total();
        String transactionId = createTransactionId(student);
        CafeteriaPaymentTransaction transaction = createTransaction(
                transactionId,
                paymentMethod,
                PAYMENT_METHOD_CASH.equals(paymentMethod) ? STATUS_COUNTER_PAYMENT : STATUS_PENDING,
                checkoutTotals,
                student
        );

        if (PAYMENT_METHOD_CASH.equals(paymentMethod)) {
            transaction.setPaidAt(LocalDateTime.now());
            transaction.setGatewayResponse("Cash payment selected at cafeteria counter.");
            paymentTransactionRepository.save(transaction);
            return new CafeteriaCheckoutResponse(
                    transactionId,
                    PAYMENT_METHOD_CASH,
                    STATUS_COUNTER_PAYMENT,
                    total,
                    null,
                    "Cash order noted. Please pay at the UIU Cafeteria counter."
            );
        }

        if (storeId == null || storeId.isBlank() || storePassword == null || storePassword.isBlank()) {
            throw new IllegalStateException("SSLCommerz store credentials are not configured.");
        }

        paymentTransactionRepository.save(transaction);

        SslCommerzSession session;
        try {
            session = createSslCommerzSession(transactionId, total, student, items, requestBaseUrl);
        } catch (RuntimeException ex) {
            transaction.setStatus(STATUS_INIT_FAILED);
            transaction.setGatewayResponse(ex.getMessage());
            transaction.setUpdatedAt(LocalDateTime.now());
            paymentTransactionRepository.save(transaction);
            throw ex;
        }

        transaction.setGatewaySessionKey(session.sessionKey());
        transaction.setGatewayResponse("SSLCommerz session created.");
        transaction.setUpdatedAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        return new CafeteriaCheckoutResponse(
                transactionId,
                PAYMENT_METHOD_SSL,
                "REDIRECT_REQUIRED",
                total,
                session.gatewayUrl(),
                "Redirecting to SSLCommerz demo gateway."
        );
    }

    public List<CafeteriaPaymentHistoryDto> getStudentPaymentHistory(User student) {
        return paymentTransactionRepository.findByStudentEmailOrderByCreatedAtDesc(student.getEmail()).stream()
                .map(CafeteriaPaymentHistoryDto::from)
                .toList();
    }

    public void markGatewayCallback(String transactionId, String callbackStatus, Map<String, String[]> parameters) {
        if (transactionId == null || transactionId.isBlank()) {
            return;
        }

        paymentTransactionRepository.findByTransactionId(transactionId).ifPresent(transaction -> {
            String normalizedStatus = switch ((callbackStatus == null ? "" : callbackStatus).toLowerCase(Locale.ROOT)) {
                case "success", "valid", "validated" -> STATUS_PAID;
                case "cancel", "cancelled" -> STATUS_CANCELLED;
                case "fail", "failed" -> STATUS_FAILED;
                default -> transaction.getStatus();
            };

            transaction.setStatus(normalizedStatus);
            transaction.setGatewayValidationId(first(parameters, "val_id"));
            transaction.setGatewayBankTransactionId(first(parameters, "bank_tran_id"));
            transaction.setGatewayCardType(first(parameters, "card_type"));
            transaction.setGatewayResponse(first(parameters, "status"));
            if (STATUS_PAID.equals(normalizedStatus)) {
                transaction.setPaidAt(LocalDateTime.now());
            }
            transaction.setUpdatedAt(LocalDateTime.now());
            paymentTransactionRepository.save(transaction);
        });
    }

    private String normalizePaymentMethod(String paymentMethod) {
        String normalized = paymentMethod == null ? PAYMENT_METHOD_SSL : paymentMethod.trim().toUpperCase(Locale.ROOT);
        if (!PAYMENT_METHOD_SSL.equals(normalized) && !PAYMENT_METHOD_CASH.equals(normalized)) {
            throw new IllegalArgumentException("Unsupported payment method.");
        }
        return normalized;
    }

    private CheckoutTotals calculateTotal(List<CafeteriaCheckoutItemRequest> requestItems) {
        Map<Long, Integer> requestedQuantities = requestItems.stream()
                .collect(Collectors.toMap(
                        CafeteriaCheckoutItemRequest::getItemId,
                        item -> {
                            if (item.getItemId() == null) {
                                throw new IllegalArgumentException("Invalid cafeteria item.");
                            }
                            if (item.getQuantity() < 1 || item.getQuantity() > 20) {
                                throw new IllegalArgumentException("Item quantity must be between 1 and 20.");
                            }
                            return item.getQuantity();
                        },
                        Integer::sum
                ));

        List<CafeteriaMenuItem> menuItems = cafeteriaMenuItemRepository.findAllById(requestedQuantities.keySet());
        if (menuItems.size() != requestedQuantities.size()) {
            throw new IllegalArgumentException("One or more cafeteria items are not available.");
        }

        BigDecimal total = BigDecimal.ZERO;
        int totalItems = 0;
        StringBuilder summary = new StringBuilder();

        for (CafeteriaMenuItem item : menuItems) {
            if (!item.isAvailable()) {
                throw new IllegalStateException(item.getName() + " is currently out of stock.");
            }
            int quantity = requestedQuantities.get(item.getId());
            BigDecimal subtotal = item.getPrice().multiply(BigDecimal.valueOf(quantity));
            total = total.add(subtotal);
            totalItems += quantity;
            if (!summary.isEmpty()) {
                summary.append("; ");
            }
            summary.append(item.getName())
                    .append(" x ")
                    .append(quantity)
                    .append(" = BDT ")
                    .append(subtotal.setScale(2, RoundingMode.HALF_UP).toPlainString());
        }

        return new CheckoutTotals(total.setScale(2, RoundingMode.HALF_UP), totalItems, summary.toString());
    }

    private CafeteriaPaymentTransaction createTransaction(String transactionId, String paymentMethod, String status,
                                                          CheckoutTotals checkoutTotals, User student) {
        CafeteriaPaymentTransaction transaction = new CafeteriaPaymentTransaction();
        transaction.setTransactionId(transactionId);
        transaction.setPaymentMethod(paymentMethod);
        transaction.setStatus(status);
        transaction.setTotalAmount(checkoutTotals.total());
        transaction.setTotalItems(checkoutTotals.totalItems());
        transaction.setItemsSummary(checkoutTotals.itemsSummary());
        transaction.setStudentEmail(safe(student.getEmail(), "student@uiu.ac.bd"));
        transaction.setStudentId(safe(student.getStudentOrEmpId(), "student"));
        transaction.setStudentName(safe(student.getFullName(), "UIU Student"));
        return transaction;
    }

    private SslCommerzSession createSslCommerzSession(String transactionId, BigDecimal total, User student,
                                                      List<CafeteriaCheckoutItemRequest> items, String requestBaseUrl) {
        String baseUrl = resolveBaseUrl(requestBaseUrl);
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("store_id", storeId);
        form.add("store_passwd", storePassword);
        form.add("total_amount", total.toPlainString());
        form.add("currency", "BDT");
        form.add("tran_id", transactionId);
        form.add("success_url", callbackUrl(baseUrl, "success"));
        form.add("fail_url", callbackUrl(baseUrl, "fail"));
        form.add("cancel_url", callbackUrl(baseUrl, "cancel"));
        form.add("ipn_url", callbackUrl(baseUrl, "ipn"));

        form.add("cus_name", safe(student.getFullName(), "UIU Student"));
        form.add("cus_email", safe(student.getEmail(), "student@uiu.ac.bd"));
        form.add("cus_add1", "UIU Campus");
        form.add("cus_city", "Dhaka");
        form.add("cus_postcode", "1212");
        form.add("cus_country", "Bangladesh");
        form.add("cus_phone", "01700000000");

        form.add("shipping_method", "NO");
        form.add("product_name", "UIU Cafeteria Meal Tray");
        form.add("product_category", "Food");
        form.add("product_profile", "general");
        form.add("num_of_item", String.valueOf(items.stream().mapToInt(CafeteriaCheckoutItemRequest::getQuantity).sum()));
        form.add("value_a", safe(student.getStudentOrEmpId(), "student"));
        form.add("value_b", "cafeteria");

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri(sessionUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        if (response == null || response.get("GatewayPageURL") == null || String.valueOf(response.get("GatewayPageURL")).isBlank()) {
            String reason = response == null ? "No response from SSLCommerz." : String.valueOf(response.getOrDefault("failedreason", "Unable to create SSLCommerz session."));
            throw new IllegalStateException(reason);
        }

        return new SslCommerzSession(
                String.valueOf(response.get("GatewayPageURL")),
                response.get("sessionkey") == null ? null : String.valueOf(response.get("sessionkey"))
        );
    }

    private String createTransactionId(User student) {
        String idPart = safe(student.getStudentOrEmpId(), "STUDENT").replaceAll("[^A-Za-z0-9]", "");
        if (idPart.length() > 8) {
            idPart = idPart.substring(idPart.length() - 8);
        }
        return "CAF" + idPart + LocalDateTime.now().format(TRANSACTION_TIME_FORMAT);
    }

    private String resolveBaseUrl(String requestBaseUrl) {
        String configured = publicBaseUrl == null ? "" : publicBaseUrl.trim();
        String baseUrl = configured.isBlank() ? requestBaseUrl : configured;
        return baseUrl.replaceAll("/+$", "");
    }

    private String callbackUrl(String baseUrl, String status) {
        return UriComponentsBuilder.fromHttpUrl(baseUrl)
                .path("/api/payments/sslcommerz/")
                .path(status)
                .toUriString();
    }

    private String sessionUrl() {
        return liveMode
                ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
                : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String first(Map<String, String[]> parameters, String key) {
        if (parameters == null || key == null || !parameters.containsKey(key)) {
            return null;
        }
        String[] values = parameters.get(key);
        return values == null || values.length == 0 ? null : values[0];
    }

    private record CheckoutTotals(BigDecimal total, int totalItems, String itemsSummary) {
    }

    private record SslCommerzSession(String gatewayUrl, String sessionKey) {
    }
}
