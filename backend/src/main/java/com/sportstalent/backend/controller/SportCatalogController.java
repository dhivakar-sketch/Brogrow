package com.sportstalent.backend.controller;

import com.sportstalent.backend.service.SportCatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SportCatalogController {

    private final SportCatalogService sportCatalogService;

    public SportCatalogController(SportCatalogService sportCatalogService) {
        this.sportCatalogService = sportCatalogService;
    }

    @GetMapping("/sports")
    public ResponseEntity<List<Map<String, Object>>> getSports() {
        return ResponseEntity.ok(sportCatalogService.listSportCatalog());
    }

    @GetMapping("/sports/{sport}")
    public ResponseEntity<Map<String, Object>> getSport(@PathVariable String sport) {
        return ResponseEntity.ok(sportCatalogService.getSportDefinitionMap(sport));
    }
}
