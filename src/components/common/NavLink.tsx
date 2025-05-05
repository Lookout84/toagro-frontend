import React from "react";
import { Link, useMatch, useResolvedPath } from "react-router-dom";
import type { LinkProps } from "react-router-dom";

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  inactiveClassName?: string;
  exact?: boolean;
  children: React.ReactNode;
}

/**
 * Компонент для навігаційних посилань з автоматичним стилізуванням активного стану
 */
const NavLink: React.FC<NavLinkProps> = ({
  to,
  activeClassName = "active",
  inactiveClassName = "",
  className = "",
  exact = false,
  children,
  ...props
}) => {
  // Отримуємо повний шлях з поточного to (може бути відносним)
  const resolved = useResolvedPath(to);

  // Перевіряємо, чи поточний шлях співпадає з to
  const match = useMatch({
    path: resolved.pathname,
    end: exact,
  });

  // Визначаємо клас в залежності від активності посилання
  const linkClassName = match
    ? `${className} ${activeClassName}`.trim()
    : `${className} ${inactiveClassName}`.trim();

  return (
    <Link to={to} className={linkClassName} {...props}>
      {children}
    </Link>
  );
};

export default NavLink;
