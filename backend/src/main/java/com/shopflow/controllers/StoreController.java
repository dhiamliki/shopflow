package com.shopflow.controllers;

import com.shopflow.dto.store.PublicStoreResponse;
import com.shopflow.services.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @GetMapping("/{sellerId}")
    public ResponseEntity<PublicStoreResponse> bySellerId(@PathVariable Long sellerId) {
        return ResponseEntity.ok(storeService.getPublicStore(sellerId));
    }
}
