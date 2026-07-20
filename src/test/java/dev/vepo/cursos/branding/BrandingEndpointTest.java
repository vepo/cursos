package dev.vepo.cursos.branding;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

import org.apache.http.HttpStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;

@QuarkusTest
@DisplayName("Branding endpoint")
class BrandingEndpointTest {

    @Test
    @DisplayName("shouldReturnDefaultLearnBrandingWithoutAuth")
    void shouldReturnDefaultLearnBrandingWithoutAuth() {
        given()
               .when()
               .get("/api/branding")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("name", equalTo("Learn"))
               .body("tagline", equalTo("Aprenda no seu ritmo"))
               .body("accent", equalTo("#0D9488"))
               .body("headerBg", equalTo("#0F172A"))
               .body("onChrome", equalTo("#F8FAFC"))
               .body("pageBg", equalTo("#F8FAFC"))
               .body("surface", equalTo("#FFFFFF"))
               .body("text", equalTo("#0F172A"))
               .body("textMuted", equalTo("#64748B"))
               .body("link", equalTo("#0F766E"))
               .body("border", equalTo("#E2E8F0"))
               .body("danger", equalTo("#DC2626"))
               .body("logoUrl", nullValue())
               .body("showDeveloperLinks", equalTo(false));
    }
}
