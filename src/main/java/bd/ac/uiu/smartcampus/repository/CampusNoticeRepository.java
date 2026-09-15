package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.CampusNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampusNoticeRepository extends JpaRepository<CampusNotice, Long> {
    List<CampusNotice> findTop10ByOrderByPostedAtDesc();
    List<CampusNotice> findByCategoryOrderByPostedAtDesc(String category);
    List<CampusNotice> findByAudienceInOrderByPostedAtDesc(List<bd.ac.uiu.smartcampus.model.NoticeAudience> audiences);
}
