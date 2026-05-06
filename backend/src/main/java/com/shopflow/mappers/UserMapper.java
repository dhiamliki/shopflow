package com.shopflow.mappers;

import com.shopflow.dto.auth.UserResponse;
import com.shopflow.entities.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User user);
}
