package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, Long> {
    Optional<TeacherProfile> findByUserId(Long userId);
    List<TeacherProfile> findByUserIdIn(List<Long> userIds);
}
