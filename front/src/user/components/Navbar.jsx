import { NavLink } from "react-router-dom";

const menus = [
  { to: "/home", label: "메인 홈" },
  { to: "/draw-status", label: "드로우 현황" },
  { to: "/my-wallet", label: "내 지갑" },
  { to: "/puzzle-exchange", label: "퍼즐 교환소" },
  { to: "/marketplace", label: "거래소" },
  { to: "/transparency-center", label: "투명성 센터" },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      {menus.map((menu) => (
        <NavLink
          key={menu.to}
          to={menu.to}
          className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
        >
          {menu.label}
        </NavLink>
      ))}
    </nav>
  );
}
