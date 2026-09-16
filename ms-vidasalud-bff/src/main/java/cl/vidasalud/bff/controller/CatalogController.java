package cl.vidasalud.bff.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalog")
@CrossOrigin(origins = "*")
public class CatalogController {

    @GetMapping("/services")
    public ResponseEntity<List<Map<String, Object>>> getServices() {
        return ResponseEntity.ok(List.of(
                Map.of("id", 101L, "name", "Medicina General", "price", 25000),
                Map.of("id", 102L, "name", "Cardiología", "price", 45000),
                Map.of("id", 103L, "name", "Pediatría", "price", 35000),
                Map.of("id", 104L, "name", "Kinesiología", "price", 30000)
        ));
    }

    @GetMapping("/boxes")
    public ResponseEntity<List<Map<String, Object>>> getBoxes() {
        return ResponseEntity.ok(List.of(
                Map.of("id", 1L, "code", "BOX-101", "floor", 1),
                Map.of("id", 2L, "code", "BOX-102", "floor", 1),
                Map.of("id", 3L, "code", "BOX-201", "floor", 2)
        ));
    }
}
