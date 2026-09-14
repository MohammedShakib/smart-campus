package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.model.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    
    List<UserNotification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    List<UserNotification> findByRecipientAndReadFalseOrderByCreatedAtDesc(User recipient);
    
    long countByRecipientAndReadFalse(User recipient);
    
    boolean existsByRecipientAndEventKey(User recipient, String eventKey);
    
    @Modifying
    @Query("UPDATE UserNotification n SET n.read = true WHERE n.recipient = :recipient AND n.read = false")
    void markAllAsReadByRecipient(@Param("recipient") User recipient);
}
