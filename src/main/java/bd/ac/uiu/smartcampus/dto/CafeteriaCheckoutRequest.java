package bd.ac.uiu.smartcampus.dto;

import java.util.ArrayList;
import java.util.List;

public class CafeteriaCheckoutRequest {

    private String paymentMethod;
    private List<CafeteriaCheckoutItemRequest> items = new ArrayList<>();

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public List<CafeteriaCheckoutItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CafeteriaCheckoutItemRequest> items) {
        this.items = items;
    }
}
