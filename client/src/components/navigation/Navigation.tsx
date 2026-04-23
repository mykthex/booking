import { useState, useEffect, useRef } from "react";
import { signOut } from "../../lib/auth-client";
import styles from "./navigation.module.css";

import { CalendarSearch, CircleUserRound, LogIn, LogOut } from 'lucide-react';

interface MenuItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface NavigationProps {
  user?: User | null;
  isAuthenticated?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  user,
  isAuthenticated = false
}) => {
  const navBarButtonRef = useRef<HTMLButtonElement>(null);
  const navBarRef = useRef<HTMLUListElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  
  const lastScrollTopRef = useRef(0);
  const lastScrollTopBeforeHideRef = useRef(0);
  const headerHidePosition = 900;
  const gapBeforeHide = 300;
  
  // Build menu items based on authentication
  const menuItems: MenuItem[] = [
    {
      title: "Book a court",
      icon: <CalendarSearch />,
      url: "/booking",
    },
  ];

  if (isAuthenticated) {
    menuItems.push({
      title: "Account",
      icon: <CircleUserRound />,
      url: "/account",
    });
  } else {
    menuItems.push(
      {
        title: "Login",
        icon: <LogIn />,
        url: "/login",
      },
      {
        title: "Register",
        icon: <CircleUserRound />,
        url: "/register",
      }
    );
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle menu link clicks (close menu on mobile)
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  // Handle smooth scroll for anchor links
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = (e.currentTarget as HTMLAnchorElement).getAttribute("href");
    
    if (href?.startsWith("#")) {
      e.preventDefault();
      const targetElement = document.querySelector(href);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
      
      setIsMenuOpen(false);
    } else {
      handleLinkClick();
    }
  };

  // Handle scroll behavior for header hide/show
  useEffect(() => {
    const handleScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      const scrollDirection = st > lastScrollTopRef.current ? "down" : "up";
      const gapIsGreat = st > lastScrollTopBeforeHideRef.current + gapBeforeHide;

      lastScrollTopRef.current = st <= 0 ? 0 : st;

      if (scrollDirection === "up") {
        lastScrollTopBeforeHideRef.current = st;
      }

      const shouldHideHeader = 
        scrollDirection === "down" &&
        window.scrollY > headerHidePosition &&
        gapIsGreat &&
        !isMenuOpen;

      if (shouldHideHeader) {
        setIsHeaderHidden(true);
      } else if (isHeaderHidden) {
        setIsHeaderHidden(false);
        lastScrollTopBeforeHideRef.current = st;
      }
    };

    document.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen, isHeaderHidden]);

  // Close menu when clicking outside (if needed)
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      const menuElement = navBarRef.current;
      const menuButton = navBarButtonRef.current;
      
      if (
        isMenuOpen && 
        menuElement && 
        !menuElement.contains(target) && 
        !menuButton?.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.navbarToggle}
        onClick={() => { setIsMenuOpen(!isMenuOpen); }}
        aria-label="Ouvrir le menu"
        ref={navBarButtonRef}
      >
        <span className={styles.iconBar}></span>
        <span className={styles.iconBar}></span>
        <span className={styles.iconBar}></span>
      </button>
      <ul ref={navBarRef} className={`${styles.headerMenu} ${isMenuOpen ? styles.isOpened : ""}`}>
        {menuItems.map((menuItem, index) => (
          <li key={index}>
            <a
              className={styles.headerMenuLink}
              href={menuItem.url}
              onClick={handleAnchorClick}
            >
              {menuItem.icon}
              {menuItem.title}
            </a>
          </li>
        ))}
        {isAuthenticated && (
          <li>
            <button
              className={styles.headerMenuLink}
              onClick={handleLogout}
              type="button"
            >
              <LogOut />
              Logout
            </button>
          </li>
        )}
      </ul>
    </>
  );
};
