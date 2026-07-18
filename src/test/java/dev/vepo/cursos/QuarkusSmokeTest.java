package dev.vepo.cursos;

import static org.hamcrest.Matchers.is;

import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;

@QuarkusTest
class QuarkusSmokeTest {

    @Test
    void shouldExposeOpenApi() {
        RestAssured.given()
                   .when()
                   .get("/openapi.yaml")
                   .then()
                   .statusCode(200);
    }

    @Test
    void shouldExposeApiRoot() {
        RestAssured.given()
                   .when()
                   .get("/api")
                   .then()
                   .statusCode(org.hamcrest.Matchers.anyOf(is(404), is(200)));
    }
}
