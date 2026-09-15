package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.CafeteriaMenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CafeteriaMenuItemRepository extends JpaRepository<CafeteriaMenuItem, Long> {
    List<CafeteriaMenuItem> findByCategory(String category);
}
