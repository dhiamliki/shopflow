package com.shopflow.services;

import com.shopflow.dto.product.CategoryRequest;
import com.shopflow.dto.product.CategoryResponse;
import com.shopflow.entities.Category;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll() {
        return categoryRepository.findByParentIsNullOrderByNameAsc().stream()
                .map(this::toResponseTree)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        Category parent = resolveParent(request.parentId(), null);
        Category category = Category.builder()
                .name(request.name())
                .description(request.description())
                .parent(parent)
                .build();
        return toResponseTree(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));
        Category parent = resolveParent(request.parentId(), id);
        category.setName(request.name());
        category.setDescription(request.description());
        category.setParent(parent);
        return toResponseTree(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));
        categoryRepository.delete(category);
    }

    private Category resolveParent(Long parentId, Long currentCategoryId) {
        if (parentId == null) {
            return null;
        }
        if (currentCategoryId != null && parentId.equals(currentCategoryId)) {
            throw new BadRequestException("A category cannot be parent of itself");
        }
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> new NotFoundException("Parent category not found"));
        if (currentCategoryId != null) {
            Category cursor = parent;
            while (cursor != null) {
                if (currentCategoryId.equals(cursor.getId())) {
                    throw new BadRequestException("Category hierarchy cycle is not allowed");
                }
                cursor = cursor.getParent();
            }
        }
        return parent;
    }

    private CategoryResponse toResponseTree(Category category) {
        List<CategoryResponse> children = category.getChildren().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(this::toResponseTree)
                .toList();
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getParent() != null ? category.getParent().getId() : null,
                children
        );
    }
}
