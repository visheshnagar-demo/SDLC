import React from "react";
import HeaderBar from "./HeaderBar";

export default function Navbar({ user, onLogout, onGlobalSearch }) {
  return (
    <HeaderBar
      user={user}
      onLogout={onLogout}
      onGlobalSearch={onGlobalSearch}
    />
  );
}
