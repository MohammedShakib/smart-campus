package bd.ac.uiu.smartcampus.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.util.UriComponentsBuilder;

@Controller
@RequestMapping("/api/payments/sslcommerz")
public class PaymentCallbackController {

    @RequestMapping(value = "/success", method = {RequestMethod.GET, RequestMethod.POST})
    public RedirectView success(HttpServletRequest request) {
        return redirectToCafeteria("success", request.getParameter("tran_id"));
    }

    @RequestMapping(value = "/fail", method = {RequestMethod.GET, RequestMethod.POST})
    public RedirectView fail(HttpServletRequest request) {
        return redirectToCafeteria("failed", request.getParameter("tran_id"));
    }

    @RequestMapping(value = "/cancel", method = {RequestMethod.GET, RequestMethod.POST})
    public RedirectView cancel(HttpServletRequest request) {
        return redirectToCafeteria("cancelled", request.getParameter("tran_id"));
    }

    @RequestMapping(value = "/ipn", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Void> ipn() {
        return ResponseEntity.ok().build();
    }

    private RedirectView redirectToCafeteria(String status, String transactionId) {
        String redirectUrl = UriComponentsBuilder
                .fromPath("/dashboard/student")
                .queryParam("section", "cafeteria")
                .queryParam("payment", status)
                .queryParamIfPresent("tran_id", java.util.Optional.ofNullable(transactionId))
                .toUriString();
        return new RedirectView(redirectUrl);
    }
}
