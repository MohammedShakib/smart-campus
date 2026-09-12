package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.studentOrEmpId = :studentOrEmpId")
    Optional<User> findByStudentOrEmpId(@Param("studentOrEmpId") String studentOrEmpId);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.studentOrEmpId = :studentOrEmpId")
    boolean existsByStudentOrEmpId(@Param("studentOrEmpId") String studentOrEmpId);
    
    List<User> findByRole(Role role);
    long countByRole(Role role);
    long countByActiveTrue();
}
