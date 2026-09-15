package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, Long> {
    @Query("SELECT p FROM TeacherProfile p WHERE p.user.id = :userId")
    Optional<TeacherProfile> findByUserId(@Param("userId") Long userId);

    @Query("SELECT p FROM TeacherProfile p WHERE p.user.id IN :userIds")
    List<TeacherProfile> findByUserIdIn(@Param("userIds") Collection<Long> userIds);
}
