package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.CafeteriaPaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CafeteriaPaymentTransactionRepository extends JpaRepository<CafeteriaPaymentTransaction, Long> {
    Optional<CafeteriaPaymentTransaction> findByTransactionId(String transactionId);

    List<CafeteriaPaymentTransaction> findByStudentEmailOrderByCreatedAtDesc(String studentEmail);
}
