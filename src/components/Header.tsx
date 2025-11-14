import { AppBar, Toolbar, Button, Box, Container } from "@mui/material";
import { Dashboard as DashboardIcon, Search } from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import "./header.scss";

export function Header() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isDashboardPage = location.pathname === "/dashboard";

  return (
    <AppBar
      position="static"
      className="app-header"
      elevation={0}
      component="header"
      role="banner"
    >
      <Container maxWidth="xl">
        <Toolbar className="toolbar" disableGutters>
          <Box
            className="logo"
            component="div"
            role="img"
            aria-label="IncubXperts Logo"
          >
            <img
              src="/IX-black-logo.svg"
              alt="IncubXperts Company Logo"
              className="logo-image"
            />

            <Box className="tagline" component="p">
              AI-Powered Task Assignment & Skill Matching
            </Box>
          </Box>

          <Box
            className="nav-buttons"
            component="nav"
            role="navigation"
            aria-label="Main navigation"
          >
            <Button
              component={Link}
              to="/"
              className={`nav-btn ${isHomePage ? "active" : ""}`}
              startIcon={<Search aria-hidden="true" />}
              variant={isHomePage ? "contained" : "text"}
              aria-label="Find Resources Page"
              aria-current={isHomePage ? "page" : undefined}
              tabIndex={0}
            >
              <span>Find Resources</span>
            </Button>
            <Button
              component={Link}
              to="/dashboard"
              className={`nav-btn ${isDashboardPage ? "active" : ""}`}
              startIcon={<DashboardIcon aria-hidden="true" />}
              variant={isDashboardPage ? "contained" : "text"}
              aria-label="Dashboard Page"
              aria-current={isDashboardPage ? "page" : undefined}
              tabIndex={0}
            >
              <span>Dashboard</span>
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
