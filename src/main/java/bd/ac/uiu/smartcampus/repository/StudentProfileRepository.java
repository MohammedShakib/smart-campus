package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    @Query("SELECT p FROM StudentProfile p WHERE p.user.id = :userId")
    Optional<StudentProfile> findByUserId(@Param("userId") Long userId);

    @Query("SELECT p FROM StudentProfile p WHERE p.user.id IN :userIds")
    List<StudentProfile> findByUserIdIn(@Param("userIds") Collection<Long> userIds);
}
