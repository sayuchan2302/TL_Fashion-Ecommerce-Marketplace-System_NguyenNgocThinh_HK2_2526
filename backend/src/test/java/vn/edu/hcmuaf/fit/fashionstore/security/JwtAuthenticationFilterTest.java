package vn.edu.hcmuaf.fit.fashionstore.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class JwtAuthenticationFilterTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void setsAuthenticationForEnabledUser() throws Exception {
        UserDetails enabledUser = User.withUsername("enabled@test.local")
                .password("hashed")
                .authorities("ROLE_CUSTOMER")
                .disabled(false)
                .build();

        JwtService jwtService = new StubJwtService("enabled@test.local", true);
        UserDetailsService userDetailsService = username -> enabledUser;
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, userDetailsService);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doesNotSetAuthenticationForDisabledUser() throws Exception {
        UserDetails disabledUser = User.withUsername("disabled@test.local")
                .password("hashed")
                .authorities("ROLE_CUSTOMER")
                .disabled(true)
                .build();

        JwtService jwtService = new StubJwtService("disabled@test.local", true);
        UserDetailsService userDetailsService = username -> disabledUser;
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, userDetailsService);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer disabled-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    private static final class StubJwtService extends JwtService {
        private final String username;
        private final boolean valid;

        private StubJwtService(String username, boolean valid) {
            this.username = username;
            this.valid = valid;
        }

        @Override
        public String extractUsername(String token) {
            return username;
        }

        @Override
        public boolean isTokenValid(String token, UserDetails userDetails) {
            return valid;
        }
    }
}
