package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.CampusNotice;
import bd.ac.uiu.smartcampus.model.NoticeAudience;
import bd.ac.uiu.smartcampus.model.NoticeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CampusNoticeRepository extends JpaRepository<CampusNotice, Long> {
    // Admin: unfiltered (shows all statuses for management)
    List<CampusNotice> findTop10ByOrderByPostedAtDesc();
    List<CampusNotice> findByCategoryOrderByPostedAtDesc(String category);

    // Unfiltered audience query (kept for backward compatibility where needed)
    List<CampusNotice> findByAudienceInOrderByPostedAtDesc(List<NoticeAudience> audiences);

    /**
     * Role-facing filtered query: returns only PUBLISHED notices for the given audiences
     * that have not yet expired (expiresAt is null or expiresAt > now).
     * Used by Teacher, Student, Security role dashboards and CampusAI context.
     */
    @Query("SELECT n FROM CampusNotice n WHERE n.audience IN :audiences " +
           "AND n.status = :status " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > :now) " +
           "ORDER BY n.postedAt DESC")
    List<CampusNotice> findPublishedByAudienceIn(
            @Param("audiences") List<NoticeAudience> audiences,
            @Param("status") NoticeStatus status,
            @Param("now") LocalDateTime now);

    /**
     * Student-facing notice query. Campus-wide/student admin notices have no
     * targetCourseCode/targetSectionName; teacher announcements are visible only
     * when the authenticated student has an active matching enrollment.
     */
    @Query("SELECT n FROM CampusNotice n WHERE n.audience IN :audiences " +
           "AND n.status = :status " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > :now) " +
           "AND ((n.targetCourseCode IS NULL AND n.targetSectionName IS NULL) OR EXISTS (" +
           "    SELECT e.id FROM ClassEnrollment e " +
           "    WHERE e.student.email = :studentEmail " +
           "    AND e.courseCode = n.targetCourseCode " +
           "    AND e.sectionName = n.targetSectionName " +
           "    AND e.active = true" +
           ")) " +
           "ORDER BY n.postedAt DESC")
    List<CampusNotice> findPublishedForStudent(
            @Param("audiences") List<NoticeAudience> audiences,
            @Param("status") NoticeStatus status,
            @Param("now") LocalDateTime now,
            @Param("studentEmail") String studentEmail);
}
