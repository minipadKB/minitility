import React from 'react';
import { Outlet } from 'react-router-dom';

import './App.css';

import Header from '../components/header/Header';

export default function App() {
  return (
    <>
      {/* <Header /> */}
      <Outlet />
    </>
  );
}
