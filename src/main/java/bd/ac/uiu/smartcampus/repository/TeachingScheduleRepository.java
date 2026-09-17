package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.TeachingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeachingScheduleRepository extends JpaRepository<TeachingSchedule, Long> {
    List<TeachingSchedule> findByTeacherEmailOrderByDayOfWeekAscStartTimeAsc(String teacherEmail);
    Optional<TeachingSchedule> findByTeacherEmailAndCourseCodeAndSectionNameAndDayOfWeek(String teacherEmail, String courseCode, String sectionName, String dayOfWeek);
    boolean existsByTeacherEmailAndCourseCodeAndSectionNameAndDayOfWeek(String teacherEmail, String courseCode, String sectionName, String dayOfWeek);
    List<TeachingSchedule> findByDayOfWeek(String dayOfWeek);
    List<TeachingSchedule> findByCourseCode(String courseCode);
    List<TeachingSchedule> findByCourseCodeAndSectionName(String courseCode, String sectionName);

    boolean existsByTeacherEmail(String teacherEmail);

    @org.springframework.data.jpa.repository.Query("SELECT s.teacherEmail, COUNT(DISTINCT CONCAT(s.courseCode, '-', s.sectionName)) FROM TeachingSchedule s " +
           "WHERE s.teacherEmail IN :teacherEmails " +
           "GROUP BY s.teacherEmail")
    List<Object[]> countDistinctClassesByTeacherEmails(@org.springframework.data.repository.query.Param("teacherEmails") java.util.Collection<String> teacherEmails);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT s.teacherEmail) FROM TeachingSchedule s " +
           "WHERE s.teacherEmail IN :teacherEmails")
    long countTeachersWithClassesByTeacherEmails(@org.springframework.data.repository.query.Param("teacherEmails") java.util.Collection<String> teacherEmails);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) > 0 FROM TeachingSchedule s " +
            "WHERE s.classroomRef.id = :classroomId AND s.dayOfWeek = :dayOfWeek " +
            "AND s.startTime < :endTime AND s.endTime > :startTime " +
            "AND (s.id <> :excludeId)")
    boolean hasRoomConflict(@org.springframework.data.repository.query.Param("classroomId") Long classroomId, 
                            @org.springframework.data.repository.query.Param("dayOfWeek") String dayOfWeek, 
                            @org.springframework.data.repository.query.Param("startTime") java.time.LocalTime startTime, 
                            @org.springframework.data.repository.query.Param("endTime") java.time.LocalTime endTime, 
                            @org.springframework.data.repository.query.Param("excludeId") Long excludeId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) > 0 FROM TeachingSchedule s " +
            "WHERE s.teacherEmail = :teacherEmail AND s.dayOfWeek = :dayOfWeek " +
            "AND s.startTime < :endTime AND s.endTime > :startTime " +
            "AND (s.id <> :excludeId)")
    boolean hasTeacherConflict(@org.springframework.data.repository.query.Param("teacherEmail") String teacherEmail, 
                               @org.springframework.data.repository.query.Param("dayOfWeek") String dayOfWeek, 
                               @org.springframework.data.repository.query.Param("startTime") java.time.LocalTime startTime, 
                               @org.springframework.data.repository.query.Param("endTime") java.time.LocalTime endTime, 
                               @org.springframework.data.repository.query.Param("excludeId") Long excludeId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) > 0 FROM TeachingSchedule s " +
            "WHERE s.courseRef.id = :courseId AND s.sectionName = :sectionName AND s.dayOfWeek = :dayOfWeek " +
            "AND s.startTime = :startTime AND s.endTime = :endTime " +
            "AND (s.id <> :excludeId)")
    boolean isDuplicateSchedule(@org.springframework.data.repository.query.Param("courseId") Long courseId, 
                                @org.springframework.data.repository.query.Param("sectionName") String sectionName, 
                                @org.springframework.data.repository.query.Param("dayOfWeek") String dayOfWeek, 
                                @org.springframework.data.repository.query.Param("startTime") java.time.LocalTime startTime, 
                                @org.springframework.data.repository.query.Param("endTime") java.time.LocalTime endTime, 
                                @org.springframework.data.repository.query.Param("excludeId") Long excludeId);
}
