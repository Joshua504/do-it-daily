import React from "react";
import { FaGamepad, FaTerminal, FaMicrochip } from "react-icons/fa";

const Layout = ({ children }) => {
  return (
    <div className="layout">
      {/* Header removed from here to allow custom placement in Dashboard */}
      {children}
      <footer
        className="container flex flex-col items-center justify-center text-dim"
        style={{
          padding: "var(--spacing-xl) 0",
          marginTop: "var(--spacing-xl)",
          borderTop: "1px solid #111",
        }}
      >
        <div
          className="footer-icons flex gap-lg mb-md"
          style={{ opacity: 0.5 }}
        >
          <FaGamepad size={16} />
          <FaTerminal size={16} />
          <FaMicrochip size={16} />
        </div>
        <p
          style={{ fontSize: "0.95rem", letterSpacing: "2px" }}
          className="uppercase"
        >
          0X_BISHOP ARCHIVE * {new Date().getFullYear()} * END OF LINE
        </p>
      </footer>
    </div>
  );
};

export default Layout;
