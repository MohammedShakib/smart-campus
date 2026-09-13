package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.LostFoundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LostFoundItemRepository extends JpaRepository<LostFoundItem, Long> {

    List<LostFoundItem> findAllByOrderByCreatedAtDesc();

    List<LostFoundItem> findByCategoryOrderByCreatedAtDesc(LostFoundItem.ItemCategory category);

    List<LostFoundItem> findByTypeOrderByCreatedAtDesc(LostFoundItem.ItemType type);

    List<LostFoundItem> findByStatusOrderByCreatedAtDesc(LostFoundItem.ItemStatus status);

    List<LostFoundItem> findByReporterIdOrderByCreatedAtDesc(String reporterId);

    @Query("SELECT i FROM LostFoundItem i WHERE " +
           "(:category IS NULL OR i.category = :category) AND " +
           "(:type IS NULL OR i.type = :type) AND " +
           "(:status IS NULL OR i.status = :status) " +
           "ORDER BY i.createdAt DESC")
    List<LostFoundItem> findByFilters(
            @Param("category") LostFoundItem.ItemCategory category,
            @Param("type") LostFoundItem.ItemType type,
            @Param("status") LostFoundItem.ItemStatus status);
}
