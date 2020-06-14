import React, { useState } from "react";
import { Link } from "react-router-dom";

import MainHeader from "./MainHeader";
import NavLinks from "./NavLinks";
import SideDrawer from "./SideDrawer";
import Backdrop from "../UIElements/Backdrop";
import "./MainNavigation.css";

const MainNavigation = (props) => {
  const [drawerIsOpen, setDrawerIsOpen] = useState(false);

  const openDriwer = () => {
    setDrawerIsOpen(true);
  };
  const closeDriwer = () => {
    setDrawerIsOpen(false);
  };
  return (
    <>
      {drawerIsOpen && <Backdrop onClick={closeDriwer} />}

      <SideDrawer show={drawerIsOpen} onClick={closeDriwer}>
        <nav className="main-navigation__drawer-nav">
          <NavLinks />
        </nav>
      </SideDrawer>

      <MainHeader>
        <button className="main-navigation__menu-btn" onClick={openDriwer}>
          <span />
          <span />
          <span />
        </button>
        <h1 className="main-navigation__title">
          <Link to="/">YourPlaces</Link>
        </h1>
        <nav className="main-navigation__header-nav">
          <NavLinks />
        </nav>
      </MainHeader>
    </>
  );
};

export default MainNavigation;
