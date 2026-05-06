package com.shopflow.mappers;

import com.shopflow.dto.product.CategoryResponse;
import com.shopflow.entities.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(target = "parentId", expression = "java(category.getParent() != null ? category.getParent().getId() : null)")
    CategoryResponse toCategoryResponse(Category category);
}
